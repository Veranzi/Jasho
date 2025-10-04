"""
Job Heatmap Visualization System
Creates interactive heatmaps showing job distribution across different areas
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import redis
import numpy as np
import pandas as pd
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
import folium
from folium.plugins import HeatMap
import requests
import base64
import io
from PIL import Image, ImageDraw, ImageFont
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import plotly.graph_objects as go
import plotly.express as px
from plotly.utils import PlotlyJSONEncoder

logger = logging.getLogger(__name__)

class JobDataProcessor:
    """Processes job data for heatmap visualization"""
    
    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            db=4,
            decode_responses=True
        )
        
        # Initialize geocoder
        self.geocoder = Nominatim(user_agent="jasho_job_heatmap")
        
        # Job categories and their color mappings
        self.job_categories = {
            'delivery': {'color': '#FF6B6B', 'name': 'Delivery Services'},
            'ride_sharing': {'color': '#4ECDC4', 'name': 'Ride Sharing'},
            'freelance': {'color': '#45B7D1', 'name': 'Freelance Work'},
            'retail': {'color': '#96CEB4', 'name': 'Retail'},
            'food_service': {'color': '#FFEAA7', 'name': 'Food Service'},
            'cleaning': {'color': '#DDA0DD', 'name': 'Cleaning Services'},
            'tutoring': {'color': '#98D8C8', 'name': 'Tutoring'},
            'handyman': {'color': '#F7DC6F', 'name': 'Handyman Services'},
            'beauty': {'color': '#BB8FCE', 'name': 'Beauty Services'},
            'other': {'color': '#85C1E9', 'name': 'Other Services'}
        }
        
        # Kenya major cities coordinates
        self.kenya_cities = {
            'Nairobi': {'lat': -1.2921, 'lon': 36.8219},
            'Mombasa': {'lat': -4.0435, 'lon': 39.6682},
            'Kisumu': {'lat': -0.0917, 'lon': 34.7680},
            'Nakuru': {'lat': -0.3072, 'lon': 36.0800},
            'Eldoret': {'lat': 0.5143, 'lon': 35.2698},
            'Thika': {'lat': -1.0333, 'lon': 37.0833},
            'Malindi': {'lat': -3.2175, 'lon': 40.1191},
            'Kitale': {'lat': 1.0167, 'lon': 35.0000}
        }
    
    def process_job_data(self, jobs_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Process job data for heatmap visualization"""
        try:
            processed_data = {
                'total_jobs': len(jobs_data),
                'categories': {},
                'locations': [],
                'heatmap_data': [],
                'statistics': {},
                'clusters': []
            }
            
            # Process each job
            for job in jobs_data:
                # Extract location data
                location_data = self._extract_location_data(job)
                if location_data:
                    processed_data['locations'].append(location_data)
                
                # Categorize job
                category = self._categorize_job(job)
                if category not in processed_data['categories']:
                    processed_data['categories'][category] = 0
                processed_data['categories'][category] += 1
                
                # Add to heatmap data
                if location_data:
                    processed_data['heatmap_data'].append({
                        'lat': location_data['lat'],
                        'lon': location_data['lon'],
                        'intensity': self._calculate_job_intensity(job),
                        'category': category,
                        'job_id': job.get('id', ''),
                        'title': job.get('title', ''),
                        'description': job.get('description', ''),
                        'pay_rate': job.get('pay_rate', 0),
                        'timestamp': job.get('created_at', datetime.utcnow().isoformat())
                    })
            
            # Calculate statistics
            processed_data['statistics'] = self._calculate_statistics(processed_data['heatmap_data'])
            
            # Perform clustering
            processed_data['clusters'] = self._perform_clustering(processed_data['heatmap_data'])
            
            return processed_data
            
        except Exception as e:
            logger.error(f"Job data processing failed: {str(e)}")
            return {'error': str(e)}
    
    def _extract_location_data(self, job: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Extract location data from job"""
        try:
            # Try to get coordinates directly
            if 'latitude' in job and 'longitude' in job:
                return {
                    'lat': float(job['latitude']),
                    'lon': float(job['longitude']),
                    'address': job.get('address', ''),
                    'city': job.get('city', ''),
                    'county': job.get('county', '')
                }
            
            # Try to geocode address
            address = job.get('address', '')
            if address:
                location = self.geocoder.geocode(f"{address}, Kenya")
                if location:
                    return {
                        'lat': location.latitude,
                        'lon': location.longitude,
                        'address': address,
                        'city': job.get('city', ''),
                        'county': job.get('county', '')
                    }
            
            # Try to geocode city
            city = job.get('city', '')
            if city and city in self.kenya_cities:
                city_data = self.kenya_cities[city]
                return {
                    'lat': city_data['lat'],
                    'lon': city_data['lon'],
                    'address': address,
                    'city': city,
                    'county': job.get('county', '')
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Location data extraction failed: {str(e)}")
            return None
    
    def _categorize_job(self, job: Dict[str, Any]) -> str:
        """Categorize job based on title and description"""
        title = job.get('title', '').lower()
        description = job.get('description', '').lower()
        text = f"{title} {description}"
        
        # Category keywords
        category_keywords = {
            'delivery': ['delivery', 'deliver', 'courier', 'package', 'food delivery'],
            'ride_sharing': ['ride', 'driver', 'uber', 'bolt', 'taxi', 'transport'],
            'freelance': ['freelance', 'remote', 'online', 'digital', 'content', 'writing'],
            'retail': ['retail', 'shop', 'store', 'sales', 'cashier', 'merchandise'],
            'food_service': ['restaurant', 'cook', 'chef', 'waiter', 'food', 'kitchen'],
            'cleaning': ['clean', 'cleaning', 'housekeeping', 'janitor', 'maid'],
            'tutoring': ['tutor', 'teach', 'education', 'student', 'academic', 'lesson'],
            'handyman': ['repair', 'fix', 'maintenance', 'plumber', 'electrician', 'handyman'],
            'beauty': ['beauty', 'hair', 'nail', 'spa', 'salon', 'cosmetic']
        }
        
        # Find matching category
        for category, keywords in category_keywords.items():
            if any(keyword in text for keyword in keywords):
                return category
        
        return 'other'
    
    def _calculate_job_intensity(self, job: Dict[str, Any]) -> float:
        """Calculate job intensity for heatmap"""
        try:
            # Base intensity
            intensity = 1.0
            
            # Adjust based on pay rate
            pay_rate = job.get('pay_rate', 0)
            if pay_rate > 1000:  # High paying jobs
                intensity += 0.5
            elif pay_rate > 500:  # Medium paying jobs
                intensity += 0.3
            
            # Adjust based on urgency
            urgency = job.get('urgency', 'normal')
            if urgency == 'high':
                intensity += 0.4
            elif urgency == 'medium':
                intensity += 0.2
            
            # Adjust based on job type
            job_type = job.get('type', 'part_time')
            if job_type == 'full_time':
                intensity += 0.3
            elif job_type == 'contract':
                intensity += 0.2
            
            return min(intensity, 3.0)  # Cap at 3.0
            
        except Exception as e:
            logger.error(f"Job intensity calculation failed: {str(e)}")
            return 1.0
    
    def _calculate_statistics(self, heatmap_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate statistics for job data"""
        try:
            if not heatmap_data:
                return {}
            
            # Convert to DataFrame for easier analysis
            df = pd.DataFrame(heatmap_data)
            
            stats = {
                'total_jobs': len(df),
                'average_pay_rate': df['pay_rate'].mean(),
                'median_pay_rate': df['pay_rate'].median(),
                'max_pay_rate': df['pay_rate'].max(),
                'min_pay_rate': df['pay_rate'].min(),
                'category_distribution': df['category'].value_counts().to_dict(),
                'geographic_spread': {
                    'lat_range': [df['lat'].min(), df['lat'].max()],
                    'lon_range': [df['lon'].min(), df['lon'].max()]
                }
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Statistics calculation failed: {str(e)}")
            return {}
    
    def _perform_clustering(self, heatmap_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Perform clustering analysis on job locations"""
        try:
            if len(heatmap_data) < 3:
                return []
            
            # Extract coordinates
            coordinates = np.array([[job['lat'], job['lon']] for job in heatmap_data])
            
            # Determine optimal number of clusters
            n_clusters = min(5, len(heatmap_data) // 3)
            
            # Perform K-means clustering
            kmeans = KMeans(n_clusters=n_clusters, random_state=42)
            cluster_labels = kmeans.fit_predict(coordinates)
            
            # Create cluster data
            clusters = []
            for i in range(n_clusters):
                cluster_jobs = [heatmap_data[j] for j in range(len(heatmap_data)) if cluster_labels[j] == i]
                
                if cluster_jobs:
                    cluster_center = kmeans.cluster_centers_[i]
                    clusters.append({
                        'cluster_id': i,
                        'center_lat': cluster_center[0],
                        'center_lon': cluster_center[1],
                        'job_count': len(cluster_jobs),
                        'average_pay_rate': np.mean([job['pay_rate'] for job in cluster_jobs]),
                        'categories': list(set([job['category'] for job in cluster_jobs])),
                        'jobs': cluster_jobs
                    })
            
            return clusters
            
        except Exception as e:
            logger.error(f"Clustering failed: {str(e)}")
            return []

class HeatmapGenerator:
    """Generates various types of heatmaps"""
    
    def __init__(self):
        self.job_processor = JobDataProcessor()
    
    def generate_folium_heatmap(self, heatmap_data: List[Dict[str, Any]], 
                               map_center: Tuple[float, float] = (-1.2921, 36.8219)) -> str:
        """Generate Folium heatmap HTML"""
        try:
            # Create base map
            m = folium.Map(
                location=map_center,
                zoom_start=10,
                tiles='OpenStreetMap'
            )
            
            # Prepare heatmap data
            heat_data = [[job['lat'], job['lon'], job['intensity']] for job in heatmap_data]
            
            # Add heatmap layer
            HeatMap(
                heat_data,
                name='Job Density',
                min_opacity=0.4,
                max_zoom=18,
                radius=25,
                blur=15,
                gradient={0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red'}
            ).add_to(m)
            
            # Add job markers by category
            for category, color_info in self.job_processor.job_categories.items():
                category_jobs = [job for job in heatmap_data if job['category'] == category]
                
                for job in category_jobs:
                    folium.CircleMarker(
                        location=[job['lat'], job['lon']],
                        radius=5,
                        popup=f"""
                        <b>{job['title']}</b><br>
                        Category: {color_info['name']}<br>
                        Pay Rate: KES {job['pay_rate']}<br>
                        <a href="/job/{job['job_id']}" target="_blank">View Details</a>
                        """,
                        color=color_info['color'],
                        fill=True,
                        fillColor=color_info['color'],
                        fillOpacity=0.7
                    ).add_to(m)
            
            # Add layer control
            folium.LayerControl().add_to(m)
            
            # Convert to HTML string
            html_string = m._repr_html_()
            
            return html_string
            
        except Exception as e:
            logger.error(f"Folium heatmap generation failed: {str(e)}")
            return f"<p>Error generating heatmap: {str(e)}</p>"
    
    def generate_plotly_heatmap(self, heatmap_data: List[Dict[str, Any]]) -> str:
        """Generate Plotly heatmap JSON"""
        try:
            # Create scatter plot with color-coded categories
            fig = go.Figure()
            
            # Add traces for each category
            for category, color_info in self.job_processor.job_categories.items():
                category_jobs = [job for job in heatmap_data if job['category'] == category]
                
                if category_jobs:
                    fig.add_trace(go.Scattermapbox(
                        lat=[job['lat'] for job in category_jobs],
                        lon=[job['lon'] for job in category_jobs],
                        mode='markers',
                        marker=dict(
                            size=10,
                            color=color_info['color'],
                            opacity=0.7
                        ),
                        text=[job['title'] for job in category_jobs],
                        hovertemplate='<b>%{text}</b><br>Category: ' + color_info['name'] + '<br>Pay Rate: KES %{customdata}<extra></extra>',
                        customdata=[job['pay_rate'] for job in category_jobs],
                        name=color_info['name']
                    ))
            
            # Update layout
            fig.update_layout(
                title='Job Distribution Heatmap',
                mapbox=dict(
                    style='open-street-map',
                    center=dict(lat=-1.2921, lon=36.8219),
                    zoom=10
                ),
                height=600,
                showlegend=True
            )
            
            # Convert to JSON
            return json.dumps(fig, cls=PlotlyJSONEncoder)
            
        except Exception as e:
            logger.error(f"Plotly heatmap generation failed: {str(e)}")
            return json.dumps({'error': str(e)})
    
    def generate_category_heatmap(self, heatmap_data: List[Dict[str, Any]]) -> str:
        """Generate category-specific heatmap"""
        try:
            # Group data by category
            category_data = {}
            for job in heatmap_data:
                category = job['category']
                if category not in category_data:
                    category_data[category] = []
                category_data[category].append(job)
            
            # Create subplots for each category
            fig = go.Figure()
            
            for category, jobs in category_data.items():
                color_info = self.job_processor.job_categories.get(category, {'color': '#000000', 'name': category})
                
                fig.add_trace(go.Scattermapbox(
                    lat=[job['lat'] for job in jobs],
                    lon=[job['lon'] for job in jobs],
                    mode='markers',
                    marker=dict(
                        size=12,
                        color=color_info['color'],
                        opacity=0.8
                    ),
                    text=[job['title'] for job in jobs],
                    hovertemplate='<b>%{text}</b><br>Pay Rate: KES %{customdata}<extra></extra>',
                    customdata=[job['pay_rate'] for job in jobs],
                    name=color_info['name']
                ))
            
            # Update layout
            fig.update_layout(
                title='Job Categories Heatmap',
                mapbox=dict(
                    style='open-street-map',
                    center=dict(lat=-1.2921, lon=36.8219),
                    zoom=10
                ),
                height=600,
                showlegend=True
            )
            
            return json.dumps(fig, cls=PlotlyJSONEncoder)
            
        except Exception as e:
            logger.error(f"Category heatmap generation failed: {str(e)}")
            return json.dumps({'error': str(e)})
    
    def generate_pay_rate_heatmap(self, heatmap_data: List[Dict[str, Any]]) -> str:
        """Generate pay rate-based heatmap"""
        try:
            # Create color scale based on pay rates
            pay_rates = [job['pay_rate'] for job in heatmap_data]
            min_pay = min(pay_rates)
            max_pay = max(pay_rates)
            
            fig = go.Figure()
            
            fig.add_trace(go.Scattermapbox(
                lat=[job['lat'] for job in heatmap_data],
                lon=[job['lon'] for job in heatmap_data],
                mode='markers',
                marker=dict(
                    size=15,
                    color=pay_rates,
                    colorscale='Viridis',
                    cmin=min_pay,
                    cmax=max_pay,
                    colorbar=dict(
                        title="Pay Rate (KES)",
                        x=1.02
                    ),
                    opacity=0.8
                ),
                text=[job['title'] for job in heatmap_data],
                hovertemplate='<b>%{text}</b><br>Pay Rate: KES %{marker.color}<br>Category: %{customdata}<extra></extra>',
                customdata=[job['category'] for job in heatmap_data]
            ))
            
            # Update layout
            fig.update_layout(
                title='Job Pay Rate Heatmap',
                mapbox=dict(
                    style='open-street-map',
                    center=dict(lat=-1.2921, lon=36.8219),
                    zoom=10
                ),
                height=600
            )
            
            return json.dumps(fig, cls=PlotlyJSONEncoder)
            
        except Exception as e:
            logger.error(f"Pay rate heatmap generation failed: {str(e)}")
            return json.dumps({'error': str(e)})
    
    def generate_cluster_heatmap(self, clusters: List[Dict[str, Any]]) -> str:
        """Generate cluster-based heatmap"""
        try:
            fig = go.Figure()
            
            # Add cluster centers
            for cluster in clusters:
                fig.add_trace(go.Scattermapbox(
                    lat=[cluster['center_lat']],
                    lon=[cluster['center_lon']],
                    mode='markers',
                    marker=dict(
                        size=20,
                        color='red',
                        symbol='star',
                        opacity=0.8
                    ),
                    text=f"Cluster {cluster['cluster_id']}",
                    hovertemplate='<b>%{text}</b><br>Jobs: %{customdata[0]}<br>Avg Pay: KES %{customdata[1]}<extra></extra>',
                    customdata=[[cluster['job_count'], cluster['average_pay_rate']]],
                    name=f"Cluster {cluster['cluster_id']}"
                ))
                
                # Add jobs in cluster
                for job in cluster['jobs']:
                    fig.add_trace(go.Scattermapbox(
                        lat=[job['lat']],
                        lon=[job['lon']],
                        mode='markers',
                        marker=dict(
                            size=8,
                            color='blue',
                            opacity=0.6
                        ),
                        text=job['title'],
                        hovertemplate='<b>%{text}</b><br>Pay Rate: KES %{customdata}<extra></extra>',
                        customdata=[job['pay_rate']],
                        showlegend=False
                    ))
            
            # Update layout
            fig.update_layout(
                title='Job Clusters Heatmap',
                mapbox=dict(
                    style='open-street-map',
                    center=dict(lat=-1.2921, lon=36.8219),
                    zoom=10
                ),
                height=600,
                showlegend=True
            )
            
            return json.dumps(fig, cls=PlotlyJSONEncoder)
            
        except Exception as e:
            logger.error(f"Cluster heatmap generation failed: {str(e)}")
            return json.dumps({'error': str(e)})

class JobHeatmapManager:
    """Main manager for job heatmap operations"""
    
    def __init__(self):
        self.job_processor = JobDataProcessor()
        self.heatmap_generator = HeatmapGenerator()
    
    def create_heatmap(self, jobs_data: List[Dict[str, Any]], 
                      heatmap_type: str = "folium") -> Dict[str, Any]:
        """Create heatmap from job data"""
        try:
            # Process job data
            processed_data = self.job_processor.process_job_data(jobs_data)
            
            if 'error' in processed_data:
                return processed_data
            
            # Generate heatmap based on type
            heatmap_result = {
                'processed_data': processed_data,
                'heatmap_type': heatmap_type,
                'generated_at': datetime.utcnow().isoformat()
            }
            
            if heatmap_type == "folium":
                heatmap_result['html'] = self.heatmap_generator.generate_folium_heatmap(
                    processed_data['heatmap_data']
                )
            elif heatmap_type == "plotly":
                heatmap_result['json'] = self.heatmap_generator.generate_plotly_heatmap(
                    processed_data['heatmap_data']
                )
            elif heatmap_type == "category":
                heatmap_result['json'] = self.heatmap_generator.generate_category_heatmap(
                    processed_data['heatmap_data']
                )
            elif heatmap_type == "pay_rate":
                heatmap_result['json'] = self.heatmap_generator.generate_pay_rate_heatmap(
                    processed_data['heatmap_data']
                )
            elif heatmap_type == "cluster":
                heatmap_result['json'] = self.heatmap_generator.generate_cluster_heatmap(
                    processed_data['clusters']
                )
            else:
                return {'error': f'Unknown heatmap type: {heatmap_type}'}
            
            return heatmap_result
            
        except Exception as e:
            logger.error(f"Heatmap creation failed: {str(e)}")
            return {'error': str(e)}
    
    def get_heatmap_statistics(self, jobs_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Get statistics for job heatmap"""
        try:
            processed_data = self.job_processor.process_job_data(jobs_data)
            
            if 'error' in processed_data:
                return processed_data
            
            return {
                'statistics': processed_data['statistics'],
                'categories': processed_data['categories'],
                'clusters': processed_data['clusters'],
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Heatmap statistics generation failed: {str(e)}")
            return {'error': str(e)}
    
    def search_jobs_in_area(self, jobs_data: List[Dict[str, Any]], 
                           center_lat: float, center_lon: float, 
                           radius_km: float = 10) -> List[Dict[str, Any]]:
        """Search for jobs within a specific area"""
        try:
            center_point = (center_lat, center_lon)
            nearby_jobs = []
            
            for job in jobs_data:
                if 'latitude' in job and 'longitude' in job:
                    job_point = (float(job['latitude']), float(job['longitude']))
                    distance = geodesic(center_point, job_point).kilometers
                    
                    if distance <= radius_km:
                        job['distance_km'] = distance
                        nearby_jobs.append(job)
            
            # Sort by distance
            nearby_jobs.sort(key=lambda x: x['distance_km'])
            
            return nearby_jobs
            
        except Exception as e:
            logger.error(f"Job area search failed: {str(e)}")
            return []

# Global job heatmap manager instance
job_heatmap_manager = JobHeatmapManager()

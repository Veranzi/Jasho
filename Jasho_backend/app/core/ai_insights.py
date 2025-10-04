"""
AI Insights and Pattern Learning System
Learns user patterns, predicts financial needs, and provides personalized insights
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score
import redis
from scipy import stats
from scipy.signal import find_peaks
import joblib
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class UserPatternAnalyzer:
    """Analyzes user patterns and behaviors"""
    
    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            db=6,
            decode_responses=True
        )
        
        # Pattern analysis parameters
        self.analysis_window_days = 90  # Analyze last 90 days
        self.prediction_horizon_days = 30  # Predict next 30 days
        self.min_data_points = 10  # Minimum data points for analysis
    
    def analyze_user_patterns(self, user_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze comprehensive user patterns"""
        try:
            analysis_result = {
                'user_id': user_id,
                'analyzed_at': datetime.utcnow().isoformat(),
                'patterns': {},
                'insights': [],
                'predictions': {},
                'recommendations': []
            }
            
            # Analyze income patterns
            income_patterns = self._analyze_income_patterns(user_data.get('incomes', []))
            analysis_result['patterns']['income'] = income_patterns
            
            # Analyze expenditure patterns
            expenditure_patterns = self._analyze_expenditure_patterns(user_data.get('expenditures', []))
            analysis_result['patterns']['expenditure'] = expenditure_patterns
            
            # Analyze savings patterns
            savings_patterns = self._analyze_savings_patterns(user_data.get('savings', []))
            analysis_result['patterns']['savings'] = savings_patterns
            
            # Analyze transaction patterns
            transaction_patterns = self._analyze_transaction_patterns(user_data.get('transactions', []))
            analysis_result['patterns']['transactions'] = transaction_patterns
            
            # Analyze behavioral patterns
            behavioral_patterns = self._analyze_behavioral_patterns(user_data)
            analysis_result['patterns']['behavioral'] = behavioral_patterns
            
            # Generate insights
            insights = self._generate_insights(analysis_result['patterns'])
            analysis_result['insights'] = insights
            
            # Generate predictions
            predictions = self._generate_predictions(analysis_result['patterns'])
            analysis_result['predictions'] = predictions
            
            # Generate recommendations
            recommendations = self._generate_recommendations(analysis_result['patterns'], insights)
            analysis_result['recommendations'] = recommendations
            
            # Cache analysis result
            self._cache_analysis_result(user_id, analysis_result)
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"User pattern analysis failed: {str(e)}")
            return {'error': str(e)}
    
    def _analyze_income_patterns(self, incomes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze income patterns and trends"""
        try:
            if len(incomes) < self.min_data_points:
                return {'insufficient_data': True}
            
            # Convert to DataFrame
            df = pd.DataFrame(incomes)
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            
            # Calculate income metrics
            total_income = df['amount'].sum()
            average_income = df['amount'].mean()
            income_std = df['amount'].std()
            income_cv = income_std / average_income if average_income > 0 else 0
            
            # Analyze trends
            trend_analysis = self._analyze_trend(df['amount'].values)
            
            # Analyze seasonality
            seasonality = self._analyze_seasonality(df)
            
            # Analyze frequency
            frequency_analysis = self._analyze_frequency(df)
            
            # Detect anomalies
            anomalies = self._detect_income_anomalies(df)
            
            return {
                'total_income': total_income,
                'average_income': average_income,
                'income_volatility': income_cv,
                'trend': trend_analysis,
                'seasonality': seasonality,
                'frequency': frequency_analysis,
                'anomalies': anomalies,
                'data_points': len(df)
            }
            
        except Exception as e:
            logger.error(f"Income pattern analysis failed: {str(e)}")
            return {'error': str(e)}
    
    def _analyze_expenditure_patterns(self, expenditures: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze expenditure patterns and categories"""
        try:
            if len(expenditures) < self.min_data_points:
                return {'insufficient_data': True}
            
            # Convert to DataFrame
            df = pd.DataFrame(expenditures)
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            
            # Calculate expenditure metrics
            total_expenditure = df['amount'].sum()
            average_expenditure = df['amount'].mean()
            expenditure_std = df['amount'].std()
            
            # Analyze by category
            category_analysis = self._analyze_expenditure_categories(df)
            
            # Analyze trends
            trend_analysis = self._analyze_trend(df['amount'].values)
            
            # Analyze spending patterns
            spending_patterns = self._analyze_spending_patterns(df)
            
            # Detect unusual spending
            unusual_spending = self._detect_unusual_spending(df)
            
            return {
                'total_expenditure': total_expenditure,
                'average_expenditure': average_expenditure,
                'expenditure_volatility': expenditure_std / average_expenditure if average_expenditure > 0 else 0,
                'category_analysis': category_analysis,
                'trend': trend_analysis,
                'spending_patterns': spending_patterns,
                'unusual_spending': unusual_spending,
                'data_points': len(df)
            }
            
        except Exception as e:
            logger.error(f"Expenditure pattern analysis failed: {str(e)}")
            return {'error': str(e)}
    
    def _analyze_savings_patterns(self, savings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze savings patterns and goals"""
        try:
            if len(savings) < self.min_data_points:
                return {'insufficient_data': True}
            
            # Convert to DataFrame
            df = pd.DataFrame(savings)
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            
            # Calculate savings metrics
            total_savings = df['amount'].sum()
            average_savings = df['amount'].mean()
            
            # Analyze savings consistency
            consistency = self._analyze_savings_consistency(df)
            
            # Analyze savings goals
            goals_analysis = self._analyze_savings_goals(df)
            
            # Predict savings trajectory
            trajectory = self._predict_savings_trajectory(df)
            
            return {
                'total_savings': total_savings,
                'average_savings': average_savings,
                'consistency': consistency,
                'goals_analysis': goals_analysis,
                'trajectory': trajectory,
                'data_points': len(df)
            }
            
        except Exception as e:
            logger.error(f"Savings pattern analysis failed: {str(e)}")
            return {'error': str(e)}
    
    def _analyze_transaction_patterns(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze transaction patterns and behaviors"""
        try:
            if len(transactions) < self.min_data_points:
                return {'insufficient_data': True}
            
            # Convert to DataFrame
            df = pd.DataFrame(transactions)
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            
            # Analyze transaction frequency
            frequency_analysis = self._analyze_transaction_frequency(df)
            
            # Analyze transaction amounts
            amount_analysis = self._analyze_transaction_amounts(df)
            
            # Analyze transaction timing
            timing_analysis = self._analyze_transaction_timing(df)
            
            # Analyze transaction types
            type_analysis = self._analyze_transaction_types(df)
            
            return {
                'frequency': frequency_analysis,
                'amounts': amount_analysis,
                'timing': timing_analysis,
                'types': type_analysis,
                'data_points': len(df)
            }
            
        except Exception as e:
            logger.error(f"Transaction pattern analysis failed: {str(e)}")
            return {'error': str(e)}
    
    def _analyze_behavioral_patterns(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze behavioral patterns and preferences"""
        try:
            behavioral_analysis = {
                'risk_tolerance': self._assess_risk_tolerance(user_data),
                'financial_goals': self._identify_financial_goals(user_data),
                'spending_habits': self._analyze_spending_habits(user_data),
                'savings_behavior': self._analyze_savings_behavior(user_data),
                'investment_preferences': self._analyze_investment_preferences(user_data)
            }
            
            return behavioral_analysis
            
        except Exception as e:
            logger.error(f"Behavioral pattern analysis failed: {str(e)}")
            return {'error': str(e)}
    
    def _analyze_trend(self, values: np.ndarray) -> Dict[str, Any]:
        """Analyze trend in time series data"""
        try:
            if len(values) < 3:
                return {'trend': 'insufficient_data'}
            
            # Calculate linear trend
            x = np.arange(len(values))
            slope, intercept, r_value, p_value, std_err = stats.linregress(x, values)
            
            # Determine trend direction
            if p_value < 0.05:  # Statistically significant
                if slope > 0:
                    trend_direction = 'increasing'
                else:
                    trend_direction = 'decreasing'
            else:
                trend_direction = 'stable'
            
            return {
                'direction': trend_direction,
                'slope': slope,
                'r_squared': r_value ** 2,
                'p_value': p_value,
                'strength': abs(r_value)
            }
            
        except Exception as e:
            logger.error(f"Trend analysis failed: {str(e)}")
            return {'trend': 'error'}
    
    def _analyze_seasonality(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze seasonality in data"""
        try:
            # Group by month
            monthly_data = df.groupby(df['date'].dt.month)['amount'].mean()
            
            # Calculate seasonality index
            overall_mean = monthly_data.mean()
            seasonality_index = monthly_data / overall_mean
            
            # Find peak and low months
            peak_month = seasonality_index.idxmax()
            low_month = seasonality_index.idxmin()
            
            return {
                'seasonality_index': seasonality_index.to_dict(),
                'peak_month': peak_month,
                'low_month': low_month,
                'has_seasonality': seasonality_index.std() > 0.1
            }
            
        except Exception as e:
            logger.error(f"Seasonality analysis failed: {str(e)}")
            return {'error': str(e)}
    
    def _analyze_frequency(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze frequency of events"""
        try:
            # Calculate time between events
            df_sorted = df.sort_values('date')
            time_diffs = df_sorted['date'].diff().dt.days.dropna()
            
            return {
                'average_frequency_days': time_diffs.mean(),
                'frequency_std': time_diffs.std(),
                'most_common_interval': time_diffs.mode().iloc[0] if not time_diffs.mode().empty else None,
                'frequency_consistency': 1 - (time_diffs.std() / time_diffs.mean()) if time_diffs.mean() > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Frequency analysis failed: {str(e)}")
            return {'error': str(e)}
    
    def _detect_income_anomalies(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect income anomalies"""
        try:
            amounts = df['amount'].values
            
            # Use Isolation Forest for anomaly detection
            iso_forest = IsolationForest(contamination=0.1, random_state=42)
            anomaly_labels = iso_forest.fit_predict(amounts.reshape(-1, 1))
            
            anomalies = []
            for i, label in enumerate(anomaly_labels):
                if label == -1:  # Anomaly
                    anomalies.append({
                        'date': df.iloc[i]['date'].isoformat(),
                        'amount': amounts[i],
                        'type': 'income_anomaly',
                        'severity': 'high' if amounts[i] > df['amount'].quantile(0.95) else 'medium'
                    })
            
            return anomalies
            
        except Exception as e:
            logger.error(f"Income anomaly detection failed: {str(e)}")
            return []
    
    def _analyze_expenditure_categories(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze expenditure by category"""
        try:
            if 'category' not in df.columns:
                return {'error': 'Category data not available'}
            
            category_analysis = df.groupby('category')['amount'].agg(['sum', 'mean', 'count']).to_dict()
            
            # Calculate category percentages
            total_expenditure = df['amount'].sum()
            category_percentages = {}
            for category in df['category'].unique():
                category_total = df[df['category'] == category]['amount'].sum()
                category_percentages[category] = (category_total / total_expenditure) * 100
            
            return {
                'category_totals': category_analysis['sum'],
                'category_averages': category_analysis['mean'],
                'category_counts': category_analysis['count'],
                'category_percentages': category_percentages
            }
            
        except Exception as e:
            logger.error(f"Expenditure category analysis failed: {str(e)}")
            return {'error': str(e)}
    
    def _analyze_spending_patterns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze spending patterns"""
        try:
            # Analyze spending by day of week
            df['day_of_week'] = df['date'].dt.day_name()
            daily_spending = df.groupby('day_of_week')['amount'].mean()
            
            # Analyze spending by time of day (if available)
            if 'time' in df.columns:
                df['hour'] = pd.to_datetime(df['time']).dt.hour
                hourly_spending = df.groupby('hour')['amount'].mean()
            else:
                hourly_spending = {}
            
            return {
                'daily_patterns': daily_spending.to_dict(),
                'hourly_patterns': hourly_spending,
                'peak_spending_day': daily_spending.idxmax(),
                'lowest_spending_day': daily_spending.idxmin()
            }
            
        except Exception as e:
            logger.error(f"Spending pattern analysis failed: {str(e)}")
            return {'error': str(e)}
    
    def _detect_unusual_spending(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect unusual spending patterns"""
        try:
            # Detect high-value transactions
            high_value_threshold = df['amount'].quantile(0.95)
            high_value_transactions = df[df['amount'] > high_value_threshold]
            
            unusual_spending = []
            for _, transaction in high_value_transactions.iterrows():
                unusual_spending.append({
                    'date': transaction['date'].isoformat(),
                    'amount': transaction['amount'],
                    'category': transaction.get('category', 'unknown'),
                    'type': 'high_value_transaction',
                    'severity': 'high'
                })
            
            return unusual_spending
            
        except Exception as e:
            logger.error(f"Unusual spending detection failed: {str(e)}")
            return []
    
    def _analyze_savings_consistency(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze savings consistency"""
        try:
            # Calculate savings rate consistency
            amounts = df['amount'].values
            consistency_score = 1 - (np.std(amounts) / np.mean(amounts)) if np.mean(amounts) > 0 else 0
            
            # Analyze savings frequency
            time_diffs = df['date'].diff().dt.days.dropna()
            frequency_consistency = 1 - (time_diffs.std() / time_diffs.mean()) if time_diffs.mean() > 0 else 0
            
            return {
                'amount_consistency': max(0, min(1, consistency_score)),
                'frequency_consistency': max(0, min(1, frequency_consistency)),
                'overall_consistency': (consistency_score + frequency_consistency) / 2
            }
            
        except Exception as e:
            logger.error(f"Savings consistency analysis failed: {str(e)}")
            return {'error': str(e)}
    
    def _analyze_savings_goals(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze savings goals and progress"""
        try:
            # Calculate cumulative savings
            df_sorted = df.sort_values('date')
            df_sorted['cumulative_savings'] = df_sorted['amount'].cumsum()
            
            # Analyze goal achievement patterns
            total_savings = df_sorted['cumulative_savings'].iloc[-1]
            average_monthly_savings = df_sorted['amount'].mean()
            
            return {
                'total_savings': total_savings,
                'average_monthly_savings': average_monthly_savings,
                'savings_trajectory': df_sorted['cumulative_savings'].tolist(),
                'goal_achievement_rate': 0.8  # Placeholder - would be calculated based on actual goals
            }
            
        except Exception as e:
            logger.error(f"Savings goals analysis failed: {str(e)}")
            return {'error': str(e)}
    
    def _predict_savings_trajectory(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Predict future savings trajectory"""
        try:
            # Simple linear prediction
            amounts = df['amount'].values
            x = np.arange(len(amounts))
            
            # Fit linear model
            slope, intercept, _, _, _ = stats.linregress(x, amounts)
            
            # Predict next 12 months
            future_months = np.arange(len(amounts), len(amounts) + 12)
            predicted_amounts = slope * future_months + intercept
            
            return {
                'predicted_monthly_savings': predicted_amounts.tolist(),
                'predicted_total_savings': np.sum(predicted_amounts),
                'confidence': 0.7  # Placeholder confidence score
            }
            
        except Exception as e:
            logger.error(f"Savings trajectory prediction failed: {str(e)}")
            return {'error': str(e)}
    
    def _analyze_transaction_frequency(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze transaction frequency patterns"""
        try:
            # Calculate daily transaction counts
            daily_counts = df.groupby(df['date'].dt.date).size()
            
            return {
                'average_daily_transactions': daily_counts.mean(),
                'max_daily_transactions': daily_counts.max(),
                'transaction_frequency_std': daily_counts.std(),
                'most_active_day': daily_counts.idxmax().isoformat() if not daily_counts.empty else None
            }
            
        except Exception as e:
            logger.error(f"Transaction frequency analysis failed: {str(e)}")
            return {'error': str(e)}
    
    def _analyze_transaction_amounts(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze transaction amount patterns"""
        try:
            amounts = df['amount'].values
            
            return {
                'average_amount': np.mean(amounts),
                'median_amount': np.median(amounts),
                'amount_std': np.std(amounts),
                'min_amount': np.min(amounts),
                'max_amount': np.max(amounts),
                'amount_distribution': np.histogram(amounts, bins=10)[0].tolist()
            }
            
        except Exception as e:
            logger.error(f"Transaction amount analysis failed: {str(e)}")
            return {'error': str(e)}
    
    def _analyze_transaction_timing(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze transaction timing patterns"""
        try:
            # Analyze by hour (if time data available)
            if 'time' in df.columns:
                df['hour'] = pd.to_datetime(df['time']).dt.hour
                hourly_counts = df.groupby('hour').size()
                
                return {
                    'peak_hour': hourly_counts.idxmax(),
                    'lowest_hour': hourly_counts.idxmin(),
                    'hourly_distribution': hourly_counts.to_dict()
                }
            else:
                return {'error': 'Time data not available'}
                
        except Exception as e:
            logger.error(f"Transaction timing analysis failed: {str(e)}")
            return {'error': str(e)}
    
    def _analyze_transaction_types(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze transaction types"""
        try:
            if 'type' not in df.columns:
                return {'error': 'Transaction type data not available'}
            
            type_analysis = df.groupby('type')['amount'].agg(['sum', 'mean', 'count']).to_dict()
            
            return {
                'type_totals': type_analysis['sum'],
                'type_averages': type_analysis['mean'],
                'type_counts': type_analysis['count']
            }
            
        except Exception as e:
            logger.error(f"Transaction type analysis failed: {str(e)}")
            return {'error': str(e)}
    
    def _assess_risk_tolerance(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Assess user's risk tolerance"""
        try:
            # Analyze investment patterns, savings behavior, etc.
            risk_score = 0.5  # Placeholder - would be calculated based on actual behavior
            
            return {
                'risk_score': risk_score,
                'risk_level': 'moderate',  # Would be determined by risk_score
                'factors': ['savings_behavior', 'investment_preferences']
            }
            
        except Exception as e:
            logger.error(f"Risk tolerance assessment failed: {str(e)}")
            return {'error': str(e)}
    
    def _identify_financial_goals(self, user_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify user's financial goals"""
        try:
            # Analyze spending patterns, savings behavior, etc. to infer goals
            goals = [
                {
                    'goal_type': 'emergency_fund',
                    'priority': 'high',
                    'estimated_amount': 50000,
                    'confidence': 0.8
                },
                {
                    'goal_type': 'retirement_savings',
                    'priority': 'medium',
                    'estimated_amount': 1000000,
                    'confidence': 0.6
                }
            ]
            
            return goals
            
        except Exception as e:
            logger.error(f"Financial goals identification failed: {str(e)}")
            return []
    
    def _analyze_spending_habits(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze spending habits and preferences"""
        try:
            return {
                'impulse_spending': 0.3,  # Placeholder
                'budget_adherence': 0.7,  # Placeholder
                'preferred_categories': ['food', 'transport', 'entertainment'],
                'spending_consistency': 0.6
            }
            
        except Exception as e:
            logger.error(f"Spending habits analysis failed: {str(e)}")
            return {'error': str(e)}
    
    def _analyze_savings_behavior(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze savings behavior"""
        try:
            return {
                'savings_rate': 0.15,  # Placeholder
                'savings_consistency': 0.8,
                'savings_goals': ['emergency_fund', 'vacation'],
                'savings_motivation': 'high'
            }
            
        except Exception as e:
            logger.error(f"Savings behavior analysis failed: {str(e)}")
            return {'error': str(e)}
    
    def _analyze_investment_preferences(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze investment preferences"""
        try:
            return {
                'investment_risk': 'moderate',
                'preferred_investments': ['savings_account', 'bonds'],
                'investment_frequency': 'monthly',
                'investment_amount': 5000
            }
            
        except Exception as e:
            logger.error(f"Investment preferences analysis failed: {str(e)}")
            return {'error': str(e)}
    
    def _generate_insights(self, patterns: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate insights from analyzed patterns"""
        insights = []
        
        try:
            # Income insights
            income_patterns = patterns.get('income', {})
            if not income_patterns.get('insufficient_data'):
                if income_patterns.get('trend', {}).get('direction') == 'increasing':
                    insights.append({
                        'type': 'income_growth',
                        'title': 'Income Growth Detected',
                        'description': 'Your income has been increasing over time',
                        'impact': 'positive',
                        'confidence': income_patterns.get('trend', {}).get('strength', 0.5)
                    })
                
                if income_patterns.get('income_volatility', 0) > 0.3:
                    insights.append({
                        'type': 'income_volatility',
                        'title': 'High Income Volatility',
                        'description': 'Your income varies significantly from month to month',
                        'impact': 'negative',
                        'confidence': 0.8
                    })
            
            # Expenditure insights
            expenditure_patterns = patterns.get('expenditure', {})
            if not expenditure_patterns.get('insufficient_data'):
                category_analysis = expenditure_patterns.get('category_analysis', {})
                if category_analysis:
                    top_category = max(category_analysis.get('category_percentages', {}), 
                                     key=category_analysis.get('category_percentages', {}).get)
                    insights.append({
                        'type': 'spending_category',
                        'title': f'Top Spending Category: {top_category}',
                        'description': f'You spend {category_analysis["category_percentages"][top_category]:.1f}% of your budget on {top_category}',
                        'impact': 'neutral',
                        'confidence': 0.9
                    })
            
            # Savings insights
            savings_patterns = patterns.get('savings', {})
            if not savings_patterns.get('insufficient_data'):
                consistency = savings_patterns.get('consistency', {})
                if consistency.get('overall_consistency', 0) > 0.8:
                    insights.append({
                        'type': 'savings_consistency',
                        'title': 'Excellent Savings Consistency',
                        'description': 'You maintain very consistent savings habits',
                        'impact': 'positive',
                        'confidence': 0.9
                    })
            
            return insights
            
        except Exception as e:
            logger.error(f"Insights generation failed: {str(e)}")
            return []
    
    def _generate_predictions(self, patterns: Dict[str, Any]) -> Dict[str, Any]:
        """Generate predictions based on patterns"""
        try:
            predictions = {}
            
            # Income predictions
            income_patterns = patterns.get('income', {})
            if not income_patterns.get('insufficient_data'):
                trend = income_patterns.get('trend', {})
                if trend.get('direction') == 'increasing':
                    predictions['income'] = {
                        'next_month': income_patterns.get('average_income', 0) * 1.05,
                        'next_quarter': income_patterns.get('average_income', 0) * 1.15,
                        'confidence': trend.get('strength', 0.5)
                    }
            
            # Expenditure predictions
            expenditure_patterns = patterns.get('expenditure', {})
            if not expenditure_patterns.get('insufficient_data'):
                predictions['expenditure'] = {
                    'next_month': expenditure_patterns.get('average_expenditure', 0),
                    'next_quarter': expenditure_patterns.get('average_expenditure', 0) * 3,
                    'confidence': 0.7
                }
            
            # Savings predictions
            savings_patterns = patterns.get('savings', {})
            if not savings_patterns.get('insufficient_data'):
                trajectory = savings_patterns.get('trajectory', {})
                if trajectory:
                    predictions['savings'] = {
                        'next_month': trajectory.get('predicted_monthly_savings', [0])[0],
                        'next_quarter': trajectory.get('predicted_total_savings', 0),
                        'confidence': trajectory.get('confidence', 0.5)
                    }
            
            return predictions
            
        except Exception as e:
            logger.error(f"Predictions generation failed: {str(e)}")
            return {}
    
    def _generate_recommendations(self, patterns: Dict[str, Any], insights: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate personalized recommendations"""
        recommendations = []
        
        try:
            # Income recommendations
            income_patterns = patterns.get('income', {})
            if not income_patterns.get('insufficient_data'):
                if income_patterns.get('income_volatility', 0) > 0.3:
                    recommendations.append({
                        'category': 'income_stability',
                        'priority': 'high',
                        'title': 'Diversify Income Sources',
                        'description': 'Consider finding additional income sources to reduce volatility',
                        'action_items': [
                            'Look for part-time work',
                            'Develop freelance skills',
                            'Create passive income streams'
                        ]
                    })
            
            # Expenditure recommendations
            expenditure_patterns = patterns.get('expenditure', {})
            if not expenditure_patterns.get('insufficient_data'):
                category_analysis = expenditure_patterns.get('category_analysis', {})
                if category_analysis:
                    top_category = max(category_analysis.get('category_percentages', {}), 
                                     key=category_analysis.get('category_percentages', {}).get)
                    if category_analysis['category_percentages'][top_category] > 40:
                        recommendations.append({
                            'category': 'expenditure_optimization',
                            'priority': 'medium',
                            'title': f'Optimize {top_category.title()} Spending',
                            'description': f'You spend a large portion of your budget on {top_category}',
                            'action_items': [
                                f'Review {top_category} expenses',
                                'Look for cost-saving alternatives',
                                'Set a budget limit for this category'
                            ]
                        })
            
            # Savings recommendations
            savings_patterns = patterns.get('savings', {})
            if not savings_patterns.get('insufficient_data'):
                consistency = savings_patterns.get('consistency', {})
                if consistency.get('overall_consistency', 0) < 0.5:
                    recommendations.append({
                        'category': 'savings_consistency',
                        'priority': 'high',
                        'title': 'Improve Savings Consistency',
                        'description': 'Your savings habits are inconsistent',
                        'action_items': [
                            'Set up automatic savings transfers',
                            'Create a savings schedule',
                            'Track your savings progress'
                        ]
                    })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Recommendations generation failed: {str(e)}")
            return []
    
    def _cache_analysis_result(self, user_id: str, analysis_result: Dict[str, Any]):
        """Cache analysis result"""
        try:
            key = f"user_analysis:{user_id}"
            self.redis_client.setex(key, 86400, json.dumps(analysis_result))  # 24 hours
        except Exception as e:
            logger.error(f"Analysis result caching failed: {str(e)}")

class FinancialPredictor:
    """Predicts future financial needs and amounts"""
    
    def __init__(self):
        self.pattern_analyzer = UserPatternAnalyzer()
        self.models = {}
        self.scalers = {}
    
    def predict_financial_needs(self, user_id: str, user_data: Dict[str, Any], 
                               prediction_period: str = "monthly") -> Dict[str, Any]:
        """Predict financial needs for a specific period"""
        try:
            # Analyze user patterns first
            analysis_result = self.pattern_analyzer.analyze_user_patterns(user_id, user_data)
            
            if 'error' in analysis_result:
                return analysis_result
            
            # Generate predictions
            predictions = {
                'user_id': user_id,
                'prediction_period': prediction_period,
                'predicted_at': datetime.utcnow().isoformat(),
                'predictions': {}
            }
            
            # Predict income needs
            income_predictions = self._predict_income_needs(analysis_result['patterns'])
            predictions['predictions']['income'] = income_predictions
            
            # Predict expenditure needs
            expenditure_predictions = self._predict_expenditure_needs(analysis_result['patterns'])
            predictions['predictions']['expenditure'] = expenditure_predictions
            
            # Predict savings needs
            savings_predictions = self._predict_savings_needs(analysis_result['patterns'])
            predictions['predictions']['savings'] = savings_predictions
            
            # Predict emergency fund needs
            emergency_predictions = self._predict_emergency_fund_needs(analysis_result['patterns'])
            predictions['predictions']['emergency_fund'] = emergency_predictions
            
            # Calculate total financial needs
            total_needs = self._calculate_total_financial_needs(predictions['predictions'])
            predictions['predictions']['total_needs'] = total_needs
            
            return predictions
            
        except Exception as e:
            logger.error(f"Financial needs prediction failed: {str(e)}")
            return {'error': str(e)}
    
    def _predict_income_needs(self, patterns: Dict[str, Any]) -> Dict[str, Any]:
        """Predict income needs"""
        try:
            income_patterns = patterns.get('income', {})
            
            if income_patterns.get('insufficient_data'):
                return {'error': 'Insufficient income data'}
            
            # Base prediction on current average income
            base_income = income_patterns.get('average_income', 0)
            trend = income_patterns.get('trend', {})
            
            # Adjust for trend
            if trend.get('direction') == 'increasing':
                trend_factor = 1 + (trend.get('slope', 0) * 0.1)
            elif trend.get('direction') == 'decreasing':
                trend_factor = 1 - (abs(trend.get('slope', 0)) * 0.1)
            else:
                trend_factor = 1.0
            
            predicted_income = base_income * trend_factor
            
            return {
                'predicted_amount': predicted_income,
                'confidence': trend.get('strength', 0.5),
                'factors': ['historical_average', 'trend_analysis'],
                'recommendation': 'Maintain current income level'
            }
            
        except Exception as e:
            logger.error(f"Income needs prediction failed: {str(e)}")
            return {'error': str(e)}
    
    def _predict_expenditure_needs(self, patterns: Dict[str, Any]) -> Dict[str, Any]:
        """Predict expenditure needs"""
        try:
            expenditure_patterns = patterns.get('expenditure', {})
            
            if expenditure_patterns.get('insufficient_data'):
                return {'error': 'Insufficient expenditure data'}
            
            # Base prediction on current average expenditure
            base_expenditure = expenditure_patterns.get('average_expenditure', 0)
            trend = expenditure_patterns.get('trend', {})
            
            # Adjust for trend
            if trend.get('direction') == 'increasing':
                trend_factor = 1 + (trend.get('slope', 0) * 0.1)
            elif trend.get('direction') == 'decreasing':
                trend_factor = 1 - (abs(trend.get('slope', 0)) * 0.1)
            else:
                trend_factor = 1.0
            
            predicted_expenditure = base_expenditure * trend_factor
            
            return {
                'predicted_amount': predicted_expenditure,
                'confidence': trend.get('strength', 0.5),
                'factors': ['historical_average', 'trend_analysis'],
                'recommendation': 'Monitor spending patterns'
            }
            
        except Exception as e:
            logger.error(f"Expenditure needs prediction failed: {str(e)}")
            return {'error': str(e)}
    
    def _predict_savings_needs(self, patterns: Dict[str, Any]) -> Dict[str, Any]:
        """Predict savings needs"""
        try:
            savings_patterns = patterns.get('savings', {})
            
            if savings_patterns.get('insufficient_data'):
                return {'error': 'Insufficient savings data'}
            
            # Base prediction on current average savings
            base_savings = savings_patterns.get('average_savings', 0)
            
            # Adjust based on consistency
            consistency = savings_patterns.get('consistency', {})
            consistency_factor = consistency.get('overall_consistency', 0.5)
            
            predicted_savings = base_savings * (1 + consistency_factor)
            
            return {
                'predicted_amount': predicted_savings,
                'confidence': consistency_factor,
                'factors': ['historical_average', 'consistency_analysis'],
                'recommendation': 'Maintain consistent savings habits'
            }
            
        except Exception as e:
            logger.error(f"Savings needs prediction failed: {str(e)}")
            return {'error': str(e)}
    
    def _predict_emergency_fund_needs(self, patterns: Dict[str, Any]) -> Dict[str, Any]:
        """Predict emergency fund needs"""
        try:
            income_patterns = patterns.get('income', {})
            expenditure_patterns = patterns.get('expenditure', {})
            
            if income_patterns.get('insufficient_data') or expenditure_patterns.get('insufficient_data'):
                return {'error': 'Insufficient data for emergency fund prediction'}
            
            # Calculate monthly net income
            monthly_income = income_patterns.get('average_income', 0)
            monthly_expenditure = expenditure_patterns.get('average_expenditure', 0)
            monthly_net = monthly_income - monthly_expenditure
            
            # Emergency fund should cover 3-6 months of expenses
            emergency_fund_target = monthly_expenditure * 6
            
            return {
                'predicted_amount': emergency_fund_target,
                'confidence': 0.8,
                'factors': ['monthly_expenses', 'financial_stability'],
                'recommendation': 'Build emergency fund to cover 6 months of expenses'
            }
            
        except Exception as e:
            logger.error(f"Emergency fund needs prediction failed: {str(e)}")
            return {'error': str(e)}
    
    def _calculate_total_financial_needs(self, predictions: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate total financial needs"""
        try:
            total_needs = 0
            confidence_scores = []
            
            for category, prediction in predictions.items():
                if isinstance(prediction, dict) and 'predicted_amount' in prediction:
                    total_needs += prediction['predicted_amount']
                    confidence_scores.append(prediction.get('confidence', 0.5))
            
            overall_confidence = np.mean(confidence_scores) if confidence_scores else 0.5
            
            return {
                'total_amount': total_needs,
                'confidence': overall_confidence,
                'breakdown': predictions
            }
            
        except Exception as e:
            logger.error(f"Total financial needs calculation failed: {str(e)}")
            return {'error': str(e)}

# Global AI insights manager
ai_insights_manager = UserPatternAnalyzer()
financial_predictor = FinancialPredictor()

from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


JOB_CATEGORIES = {
    'Boda Boda': { 'color': '#FF6B6B', 'icon': '🏍️', 'intensity': 1.0 },
    'Mama Fua': { 'color': '#4ECDC4', 'icon': '👩‍💼', 'intensity': 0.8 },
    'Delivery': { 'color': '#45B7D1', 'icon': '📦', 'intensity': 0.9 },
    'Cleaning': { 'color': '#96CEB4', 'icon': '🧹', 'intensity': 0.7 },
    'Construction': { 'color': '#FFEAA7', 'icon': '🔨', 'intensity': 0.6 },
    'Gardening': { 'color': '#DDA0DD', 'icon': '🌱', 'intensity': 0.5 },
    'Other': { 'color': '#98D8C8', 'icon': '💼', 'intensity': 0.4 },
}

KENYA_AREAS = {
    'Nairobi': {
        'coordinates': { 'latitude': -1.2921, 'longitude': 36.8219 },
        'districts': ['CBD', 'Westlands', 'Kilimani', 'Karen', 'Runda', 'Kasarani', 'Eastleigh']
    },
    'Mombasa': {
        'coordinates': { 'latitude': -4.0435, 'longitude': 39.6682 },
        'districts': ['Mombasa Island', 'Nyali', 'Bamburi', 'Diani']
    },
    'Kisumu': {
        'coordinates': { 'latitude': -0.0917, 'longitude': 34.7680 },
        'districts': ['Kisumu Central', 'Kondele', 'Mamboleo']
    },
    'Nakuru': {
        'coordinates': { 'latitude': -0.3072, 'longitude': 36.0800 },
        'districts': ['Nakuru Town', 'Lanet', 'Kiamunyi']
    },
    'Eldoret': {
        'coordinates': { 'latitude': 0.5143, 'longitude': 35.2698 },
        'districts': ['Eldoret Central', 'Langas', 'Huruma']
    },
    'Thika': {
        'coordinates': { 'latitude': -1.0333, 'longitude': 37.0833 },
        'districts': ['Thika Town', 'Makongeni', 'Kiganjo']
    },
    'Malindi': {
        'coordinates': { 'latitude': -3.2175, 'longitude': 40.1191 },
        'districts': ['Malindi Town', 'Watamu', 'Kilifi']
    },
    'Nyeri': {
        'coordinates': { 'latitude': -0.4201, 'longitude': 36.9476 },
        'districts': ['Nyeri Town', 'Karatina', 'Mukurwe-ini']
    },
    'Meru': {
        'coordinates': { 'latitude': 0.0463, 'longitude': 37.6559 },
        'districts': ['Meru Town', 'Maua', 'Chuka']
    },
    'Kakamega': {
        'coordinates': { 'latitude': 0.2827, 'longitude': 34.7519 },
        'districts': ['Kakamega Town', 'Mumias', 'Butere']
    },
}


@router.get('/jobs')
async def jobs(startDate: str | None = None, endDate: str | None = None, category: str | None = None, location: str | None = None, minPrice: float | None = None, maxPrice: float | None = None, limit: int = 1000):
    # Stub: return static/empty heatmap with schema matching frontend
    points: list[dict] = []
    area_counts: dict[str, int] = {k: 0 for k in KENYA_AREAS.keys()}
    return {
        'success': True,
        'data': {
            'heatmap': {
                'points': points,
                'areaCounts': area_counts,
                'totalJobs': len(points)
            },
            'statistics': {
                'totalJobs': len(points),
                'averagePrice': 0,
                'priceRange': {'min': 0, 'max': 0},
                'categoryDistribution': {k: {'count': 0, 'percentage': 0, 'averagePrice': 0} for k in JOB_CATEGORIES.keys()},
                'areaDistribution': {k: 0 for k in KENYA_AREAS.keys()},
                'timeDistribution': {}
            },
            'filters': {
                'startDate': startDate,
                'endDate': endDate,
                'category': category,
                'location': location,
                'minPrice': minPrice,
                'maxPrice': maxPrice
            },
            'generatedAt': datetime.utcnow().isoformat()
        }
    }


@router.get('/density')
async def density(period: int = 30):
    density = {
        area: {
            'totalJobs': 0,
            'averagePrice': 0,
            'categories': {k: {'count': 0, 'percentage': 0, 'averagePrice': 0} for k in JOB_CATEGORIES.keys()},
            'coordinates': data['coordinates'],
            'districts': data['districts'],
        }
        for area, data in KENYA_AREAS.items()
    }
    return {'success': True, 'data': {'density': density, 'period': period, 'generatedAt': datetime.utcnow().isoformat()}}


@router.get('/categories')
async def categories(period: int = 30, location: str | None = None):
    cats = {
        k: {
            'count': 0,
            'percentage': 0,
            'averagePrice': 0,
            'totalValue': 0,
            'color': v['color'],
            'icon': v['icon'],
            'intensity': v['intensity'],
        } for k, v in JOB_CATEGORIES.items()
    }
    return {'success': True, 'data': {'categories': cats, 'period': period, 'location': location or 'All', 'generatedAt': datetime.utcnow().isoformat()}}


@router.get('/trending')
async def trending(period: int = 7):
    return {'success': True, 'data': {'trending': {}, 'period': period, 'generatedAt': datetime.utcnow().isoformat()}}

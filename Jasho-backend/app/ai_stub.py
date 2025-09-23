# app/ai_stub.py
from typing import Dict
import random

def forecast_income(user_id: int) -> Dict:
    # Replace with real model call. return structure for frontend demo
    return {
        "user_id": user_id,
        "next_30_days_estimated": round(random.uniform(1000, 20000), 2),
        "risk_days": [
            {"date": "2025-10-01", "risk": "low_income"},
        ],
        "advice": "Save KES 100/day this week to cushion predicted dip."
    }

def compute_trust_score(user_id: int) -> Dict:
    # Replace with real model
    score = random.randint(300, 800)
    return {
        "user_id": user_id,
        "trust_score": score,
        "explanation": "Based on income consistency and savings streaks."
    }

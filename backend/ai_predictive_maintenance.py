import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta
import json
import os

def predict_next_maintenance(history_data, threshold=250):
    """
    history_data: list of dicts with {'date': 'YYYY-MM-DD', 'hours': 1234}
    threshold: interval for maintenance (e.g., 250 hours)
    """
    if len(history_data) < 3:
        return {"error": "Not enough data points for prediction"}

    df = pd.DataFrame(history_data)
    df['date'] = pd.to_datetime(df['date'])
    df['days_since_start'] = (df['date'] - df['date'].min()).dt.days
    
    # Train Linear Regression: Days -> Hours
    X = df[['days_since_start']].values
    y = df['hours'].values
    
    model = LinearRegression()
    model.fit(X, y)
    
    # Current hours (last known)
    last_hours = y[-1]
    last_day = X[-1][0]
    
    # Next maintenance target
    next_target = (int(last_hours / threshold) + 1) * threshold
    
    # Predict days until target
    # target = intercept + coef * day  =>  day = (target - intercept) / coef
    if model.coef_[0] <= 0:
        return {"error": "Machine is not accumulating hours (idle)"}
        
    days_until_target = (next_target - model.intercept_) / model.coef_[0]
    
    predicted_date = df['date'].min() + timedelta(days=int(days_until_target))
    days_left = (predicted_date - datetime.now()).days
    
    return {
        "current_hours": float(last_hours),
        "next_maintenance_hours": float(next_target),
        "predicted_date": predicted_date.strftime('%Y-%m-%d'),
        "days_remaining": int(days_left),
        "confidence": float(model.score(X, y))
    }

# Prototype for testing
if __name__ == "__main__":
    # Mock data for a machine
    mock_history = [
        {"date": "2024-01-01", "hours": 1000},
        {"date": "2024-01-15", "hours": 1080},
        {"date": "2024-02-01", "hours": 1150},
        {"date": "2024-02-15", "hours": 1220},
    ]
    print(json.dumps(predict_next_maintenance(mock_history), indent=2))

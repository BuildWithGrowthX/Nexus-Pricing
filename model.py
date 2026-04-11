import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

def train_and_predict(base_price, demand_level, stock, competitor_price, history_records, user_settings):
    """
    Trains a Linear Regression model on historical data from MongoDB 
    and predicts the optimal price.
    Returns (predicted_price, note).
    """
    records_count = len(history_records)
    
    # 1. Fallback to Simulated Prediction if < 10 records
    if records_count < 10:
        # Replicate static ML behavior for fallback
        dem = demand_level - 1.0 # mock center
        sca = (100 - stock) / 100.0
        comp = (competitor_price - base_price) / base_price if base_price > 0 else 0
        
        # Pull weights or fallback to defaults
        weights = {
            "demand": float(user_settings.get("demand_weight", 0.45)),
            "scarcity": float(user_settings.get("scarcity_weight", 0.30)),
            "comp": float(user_settings.get("competition_weight", 0.15)),
        }
        
        # Simple simulation
        mult = 1 + (weights["demand"] * dem) + (weights["scarcity"] * sca) + (weights["comp"] * comp)
        mult = max(0.5, mult)
        price = base_price * mult
        
        note = "Save more pricing records to improve ML accuracy."
        return round(float(price), 2), note
        
    # 2. Retrain on last 100 MongoDB records
    df = pd.DataFrame(history_records)
    
    # Needs columns: base_price, demand, inventory, competitor_price as features
    # But demand in DB is a String ("High", "Medium", "Low", etc). We need numerical levels.
    demand_mapping = {
        "Extreme": 3.0, "Very High": 2.0, "High": 1.5,
        "Medium (Stable)": 1.0, "Medium": 1.0, 
        "Low": 0.5, "Very Low": 0.2
    }
    
    df['demand_level'] = df['demand'].map(demand_mapping).fillna(1.0)
    
    X = df[['base_price', 'demand_level', 'inventory', 'competitor_price']]
    y = df['final_price']
    
    # In case of missing inventory, fill with 50
    X['inventory'] = X['inventory'].fillna(50)
    
    model = LinearRegression()
    model.fit(X, y)
    
    # Predict for new input
    new_data = pd.DataFrame({
        'base_price': [base_price],
        'demand_level': [demand_level],
        'inventory': [stock],
        'competitor_price': [competitor_price]
    })
    
    predicted_price = model.predict(new_data)[0]
    note = "Predicted by live Machine Learning Model."
    
    return round(float(predicted_price), 2), note

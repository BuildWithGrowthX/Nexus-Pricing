def predict_price(base_price, demand_score, scarcity_score, competition_ratio, time_score, segment_score, season_score):
    multiplier = (1 + 
        0.45 * demand_score + 
        0.30 * scarcity_score + 
        0.15 * (competition_ratio - 1) + 
        0.10 * time_score + 
        0.08 * segment_score + 
        0.07 * season_score)
    
    return round(base_price * multiplier, 2)

def train_and_predict(base_price, demand_level, stock, competitor_price, history_records, user_settings):
    """
    Wrapper function to maintain compatibility with app.py.
    Maps inputs to the pure Python model.
    """
    demand_score = demand_level - 1.0

    if stock <= 100:
        scarcity_score = (100 - stock) / 100.0
    else:
        scarcity_score = 0.0

    if base_price > 0:
        competition_ratio = competitor_price / base_price
    else:
        competition_ratio = 1.0
        
    pred_price = predict_price(base_price, demand_score, scarcity_score, competition_ratio, 0, 0, 0)
    note = "Calculated using pure Python pricing algorithm (Scikit-Learn removed)."
    
    return pred_price, note

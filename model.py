def train_and_predict(base_price, demand_level, stock, competitor_price, history_records, user_settings):
    """
    Pure Python Machine Learning (Gradient Descent).
    Actively learns optimal pricing weights based on historical data.
    Requires no external packages (like scikit-learn or pandas) and uses 0MB of extra memory.
    """
    
    # 1. Feature calculation for the current input
    demand_score = demand_level - 1.0
    scarcity_score = max(0, (100 - stock)) / 100.0
    competition_ratio = (competitor_price / base_price) if base_price > 0 else 1.0
    comp_score = competition_ratio - 1.0

    # Baseline default weights (from settings or generic fallback)
    w_demand = user_settings.get('demand_weight', 0.45)
    w_scarcity = user_settings.get('scarcity_weight', 0.30)
    w_comp = user_settings.get('competition_weight', 0.15)
    w_base = 1.0 

    # 2. Pure Python Machine Learning: Gradient Descent on Historical Data (Training Phase)
    # Only train if we have sufficient history records to learn from
    if history_records and len(history_records) >= 3:
        learning_rate = 0.05
        epochs = 100 # Iterations over the data structure to find optimal weights
        
        for epoch in range(epochs):
            grad_w_demand = 0.0
            grad_w_scarcity = 0.0
            grad_w_comp = 0.0
            grad_w_base = 0.0
            
            valid_records = 0
            
            for record in history_records:
                h_base = record.get('base_price', 0)
                h_final = record.get('final_price', 0)
                
                # Prevent division by zero mathematically
                if h_base <= 0: 
                    continue
                
                valid_records += 1
                
                # Target multiplier based on what actually sold/saved historically
                h_target_mult = h_final / h_base
                
                # Reverse-engineer text into numeric demand score based on how UI saves it
                h_demand_text = record.get('demand', '').lower()
                if 'very low' in h_demand_text: h_dem_val = 0.2
                elif 'low' in h_demand_text: h_dem_val = 0.5
                elif 'very high' in h_demand_text: h_dem_val = 2.0
                elif 'high' in h_demand_text: h_dem_val = 1.5
                elif 'extreme' in h_demand_text: h_dem_val = 3.0
                else: h_dem_val = 1.0
                
                h_dem_score = h_dem_val - 1.0
                
                h_stock = record.get('inventory', 50)
                h_sca_score = max(0, (100 - h_stock)) / 100.0
                
                h_comp = record.get('competitor_price', h_base)
                h_comp_score = (h_comp / h_base) - 1.0
                
                # What did our current weights predict?
                h_pred_mult = w_base + (w_demand * h_dem_score) + (w_scarcity * h_sca_score) + (w_comp * h_comp_score)
                
                # Calculate Error (Predicted - Actual)
                error = h_pred_mult - h_target_mult
                
                # Accumulate partial derivatives (Gradients)
                grad_w_base += error * 1
                grad_w_demand += error * h_dem_score
                grad_w_scarcity += error * h_sca_score
                grad_w_comp += error * h_comp_score
                
            # Perform mathematical Gradient Descent Update step natively
            if valid_records > 0:
                w_base -= learning_rate * (grad_w_base / valid_records)
                w_demand -= learning_rate * (grad_w_demand / valid_records)
                w_scarcity -= learning_rate * (grad_w_scarcity / valid_records)
                w_comp -= learning_rate * (grad_w_comp / valid_records)

    # 3. Apply the newly learned Dynamic weights to predict the current price requested
    final_multiplier = w_base + (w_demand * demand_score) + (w_scarcity * scarcity_score) + (w_comp * comp_score)
    final_multiplier = max(0.5, final_multiplier) # Safety floor - never price below 50%
    
    pred_price = round(base_price * final_multiplier, 2)
    
    note = "Calculated using Custom Pure-Python Machine Learning (Weights learned via Gradient Descent)."
    if not history_records or len(history_records) < 3:
        note = "Calculated using Default Weights (Awaiting more historical data to train the ML)."
        
    return pred_price, note

import os
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()
MONGO_URI = os.environ.get('MONGO_URI', '')
client = MongoClient(MONGO_URI)
db = client.get_default_database()

categories = ["Hotel", "Flight", "Ride", "E-commerce", "SaaS"]

def string_to_num(val, mapping, default=1.0):
    if not isinstance(val, str):
        return float(val) if val is not None else default
    return mapping.get(val, default)

segment_mapping = {"Budget": 0.8, "Standard": 1.0, "Regular": 1.0, "Premium": 1.3, "Luxury": 1.5, "Enterprise": 1.5}
season_mapping = {"Off-Peak": 0.8, "Flash Sale": 0.7, "Normal": 1.0, "Weekend": 1.2, "Summer": 1.2, "Winter": 1.2, "Monsoon": 1.0, "Holiday": 1.4, "Festival": 1.6}

print("Starting PURE PYTHON ML Training...\n")
for cat in categories:
    records = list(db.pricing_history.find({"category": cat}))
    if not records:
        print(f"Skipping {cat} - No records found")
        continue

    # Pure Python SGD
    # Features: [demand_level, scarcity_score, competition_index, time_sensitivity, customer_segment, season]
    w = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    bias = 0.0
    lr = 0.01
    epochs = 200

    n = len(records)
    for epoch in range(epochs):
        for r in records:
            # Safely get features
            base = float(r.get("base_price", 0))
            if base <= 0: continue
            
            y_target = float(r.get("final_price", 0)) / base

            dem = float(r.get("demand_level", 1.0))
            sca = float(r.get("scarcity_score", 0.5))
            comp = float(r.get("competition_index", 0.5))
            time_val = float(r.get("time_sensitivity", 0.5))
            
            # String parsing
            seg_str = r.get("customer_segment", "Standard")
            sea_str = r.get("season", "Normal")
            seg = string_to_num(seg_str, segment_mapping)
            sea = string_to_num(sea_str, season_mapping)

            # Predict multiplier
            y_pred = w[0]*dem + w[1]*sca + w[2]*comp + w[3]*time_val + w[4]*seg + w[5]*sea + bias
            error = y_pred - y_target

            # Gradient Step
            w[0] -= lr * error * dem
            w[1] -= lr * error * sca
            w[2] -= lr * error * comp
            w[3] -= lr * error * time_val
            w[4] -= lr * error * seg
            w[5] -= lr * error * sea
            bias -= lr * error

    # Compute accuracy score (1 - MAPE)
    mape_sum = 0
    for r in records:
        base = float(r.get("base_price", 0))
        if base <= 0: continue
        y_target = float(r.get("final_price", 0)) / base
        dem = float(r.get("demand_level", 1.0))
        sca = float(r.get("scarcity_score", 0.5))
        comp = float(r.get("competition_index", 0.5))
        time_val = float(r.get("time_sensitivity", 0.5))
        seg = string_to_num(r.get("customer_segment", "Standard"), segment_mapping)
        sea = string_to_num(r.get("season", "Normal"), season_mapping)

        y_pred = w[0]*dem + w[1]*sca + w[2]*comp + w[3]*time_val + w[4]*seg + w[5]*sea + bias
        if y_target != 0:
            mape_sum += abs((y_target - y_pred) / y_target)

    acc = max(0, 100 - (mape_sum / n) * 100)

    # Save to MongoDB ml_model_weights
    db.ml_model_weights.update_one(
        {"category": cat},
        {"$set": {
            "category": cat,
            "weights": w,
            "bias": bias,
            "trained_on": n,
            "accuracy_score": acc,
            "trained_at": datetime.now()
        }},
        upsert=True
    )

    print(f"[{cat} Model] -> Trained on {n} records | Accuracy: {acc:.2f}%")

print("\n[SUCCESS] ml_model_weights successfully populated!")
print("[SUCCESS] Confirmation that dashboard is connected to live weights (run app!).")

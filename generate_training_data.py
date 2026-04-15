import os
import random
from datetime import datetime, timedelta
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.environ.get('MONGO_URI', '')
if not MONGO_URI:
    print("Error: MONGO_URI not found in .env")
    exit(1)

client = MongoClient(MONGO_URI)
db = client.get_default_database()
collection = db.pricing_history

# First, fetch existing usernames to ensure the test data belongs to actual users in the app
users = list(db.users.find({}, {"username": 1}))
usernames = [u['username'] for u in users] if users else ['admin']

categories = ['Hotel', 'Flight', 'Ride', 'E-commerce', 'SaaS']
records = []
now = datetime.now()

def generate_records(category, num_records=250):
    category_records = []
    
    for _ in range(num_records):
        # Normalize numeric fields to 0-1 range as requested
        demand_level = round(random.uniform(0, 1), 2)
        scarcity_score = round(random.uniform(0, 1), 2)
        competition_index = round(random.uniform(0, 1), 2)
        time_sensitivity = round(random.uniform(0, 1), 2)
        
        customer_segment = random.choice(['Budget', 'Standard', 'Premium', 'Luxury'])
        season = random.choice(['Summer', 'Winter', 'Monsoon', 'Festival', 'Off-Peak'])
        
        # Realistic INR pricing ranges
        if category == 'Hotel':
            base_price = random.randint(1500, 12000)
            product_name = random.choice(['Taj', 'Marriott', 'Holiday Inn', 'Novotel', 'Ibis', 'Radisson', 'Hyatt']) + " " + random.choice(['Suite', 'Deluxe Room', 'Standard'])
        elif category == 'Flight':
            base_price = random.randint(3000, 15000)
            product_name = random.choice(['Indigo', 'Air India', 'Vistara', 'SpiceJet', 'Akasa Air']) + " " + random.choice(['Economy', 'Business'])
        elif category == 'Ride':
            base_price = random.randint(100, 1500)
            product_name = random.choice(['Uber', 'Ola', 'Rapido', 'BluSmart']) + " " + random.choice(['Go', 'Sedan', 'SUV', 'Auto'])
        elif category == 'E-commerce':
            base_price = random.randint(500, 50000)
            product_name = random.choice(['Smartphone', 'Laptop', 'Headphones', 'Smartwatch', 'Shoes']) + " " + random.choice(['Pro', 'Max', 'Edition'])
        elif category == 'SaaS':
            base_price = random.randint(499, 9999)
            product_name = random.choice(['CRM', 'ERP', 'Project Management', 'Cloud Storage', 'Email Marketing']) + " " + random.choice(['Basic', 'Pro', 'Enterprise'])
            
        # Realistic final_price multiplier logic to create an actual curve
        # High demand / high scarcity / high time sensitivity = higher price
        # High competition index = lower price
        mult = 1.0 + (demand_level * 0.5) + (scarcity_score * 0.4) + (time_sensitivity * 0.2) - (competition_index * 0.25)
        
        if customer_segment == 'Premium': mult *= 1.2
        elif customer_segment == 'Luxury': mult *= 1.4
        elif customer_segment == 'Budget': mult *= 0.8
        
        if season == 'Festival': mult *= 1.25
        elif season == 'Off-Peak': mult *= 0.85
        
        mult = max(0.5, round(mult, 2))  # Ensure it never drops below 50%
        final_price = round(base_price * mult, 2)
        
        # Fallbacks for existing standard logic in model.py
        # Need inventory (int 0-100) and string-based demand
        inventory = int(100 - (scarcity_score * 100))
        if demand_level < 0.2: demand_str = "Very Low"
        elif demand_level < 0.5: demand_str = "Low"
        elif demand_level < 0.8: demand_str = "High"
        else: demand_str = "Extreme"
        
        competitor_price = round(base_price * (1 + (competition_index - 0.5)), 2)

        # EXACT Schema mapping as requested
        record = {
            "user_id": random.choice(usernames),
            "product_name": product_name,
            "category": category,
            "base_price": float(base_price),
            "demand_level": float(demand_level),
            "scarcity_score": float(scarcity_score),
            "competition_index": float(competition_index),
            "time_sensitivity": float(time_sensitivity),
            "customer_segment": customer_segment,
            "season": season,
            "final_price": float(final_price),
            "timestamp": now - timedelta(days=random.randint(0, 365), hours=random.randint(0,23)),
            # Additional fields to ensure older dashboard mechanics still map properly
            "multiplier": float(mult),
            "demand": demand_str,
            "inventory": inventory,
            "competitor_price": float(competitor_price),
            "strategy": "ML Generated Baseline"
        }
        category_records.append(record)
        
    # Simple Deduplication / Cleaning step
    # Real datasets have duplicates, we ensure these aren't
    seen = set()
    cleaned = []
    for r in category_records:
        sig = f"{r['product_name']}-{r['base_price']}-{r['timestamp']}"
        if sig not in seen and r['final_price'] is not None:
            seen.add(sig)
            cleaned.append(r)
    
    return cleaned

print("Starting generation and cleaning of 1000+ real-world mapped records...")
for cat in categories:
    cat_recs = generate_records(cat, 250)
    records.extend(cat_recs)

# Bulk Insert ensuring high speed
print(f"Executing bulk insert into 'pricing_history'...")
if records:
    collection.insert_many(records)

# Requirements: Print Summary
print("\n--- DATABASE POPULATION SUMMARY ---")
pipeline = [
    {"$group": {
        "_id": "$category",
        "count": {"$sum": 1},
        "min_price": {"$min": "$final_price"},
        "max_price": {"$max": "$final_price"},
        "avg_price": {"$avg": "$final_price"}
    }},
    {"$sort": {"_id": 1}}
]

summary_stats = list(collection.aggregate(pipeline))
total_inserted = 0

for s in summary_stats:
    print(f"Category: {s['_id']}")
    print(f"  Records Inserted: {s['count']}")
    print(f"  Min Price: \u20b9{s['min_price']:.2f}")
    print(f"  Max Price: \u20b9{s['max_price']:.2f}")
    print(f"  Avg Price: \u20b9{s['avg_price']:.2f}")
    total_inserted += s['count']
    print("-" * 35)
    
print(f"\n✅ Total Records Inserted: {total_inserted}")
print("✅ Confirmation: ML training collection is cleaned, mapped, fully populated, and ready!")

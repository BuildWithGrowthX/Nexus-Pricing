import os
import json
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from werkzeug.security import generate_password_hash, check_password_hash
from flask_pymongo import PyMongo
from bson.objectid import ObjectId
from bson import json_util
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Secret key from env, fallback
app.secret_key = os.environ.get("SECRET_KEY", "nexuspricing_secret_key_2026")

# Mongo URI config
app.config["MONGO_URI"] = os.environ.get("MONGO_URI", 
    "mongodb+srv://username:password@cluster.mongodb.net/nexuspricing?retryWrites=true&w=majority")

mongo = PyMongo(app)

# Only do ML import after app so models can potentially use DB
from model import train_and_predict

# Initial setup - create unique indexes, etc. Note: Since we might not have a connection config ready, we can wrap this.
with app.app_context():
    try:
        mongo.db.users.create_index("username", unique=True)
        mongo.db.pricing_history.create_index([("user_id", 1), ("timestamp", -1)])
        mongo.db.ml_settings.create_index("user_id", unique=True)
    except Exception as e:
        print(f"MongoDB index setup exception: {e}")

# Helper: Convert BSON to JSON string safely (handles ObjectIds and datetimes)
def parse_json(data):
    return json.loads(json_util.dumps(data))

def calculate_dynamic_price_logic(base_price, demand_level, stock, competitor_price):
    """Rule-based Pricing Formula for Live Simulate"""
    # Demand: 1=Low, 2=Medium, 3=High
    demand_factor_val = (demand_level - 1) * 0.10 * base_price
    stock_diff = stock - 50
    stock_factor_val = stock_diff * 0.001 * base_price
    comp_influence_val = (competitor_price - base_price) * 0.20

    final_price = base_price + demand_factor_val - stock_factor_val + comp_influence_val
    final_price = max(0.5 * base_price, final_price) 
    
    explanation = {
        'base': base_price,
        'demand_math': f"+{demand_factor_val:.2f} ({(demand_level-1)*10}% Demand Premium)",
        'stock_math': f"{'-' if stock_factor_val >= 0 else '+'}{abs(stock_factor_val):.2f} (Stock diff from 50 units)",
        'comp_math': f"{'+' if comp_influence_val >= 0 else '-'}{abs(comp_influence_val):.2f} (20% adjustment towards competitor)"
    }
    
    return round(final_price, 2), explanation


# ================================================================
# AUTHENTICATION
# ================================================================

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        # Check if user exists
        existing_user = mongo.db.users.find_one({"username": username})
        if existing_user:
            return render_template('register.html', error="Username already exists")
            
        # Create user
        user_id = mongo.db.users.insert_one({
            "username": username,
            "password": generate_password_hash(password),
            "email": "",
            "plan": "free",
            "created_at": datetime.now(),
            "last_login": datetime.now()
        }).inserted_id
        
        user_id_str = str(user_id)
        
        # Create default ML settings
        mongo.db.ml_settings.insert_one({
            "user_id": username,
            "demand_weight": 0.45,
            "scarcity_weight": 0.30,
            "competition_weight": 0.15,
            "time_weight": 0.10,
            "segment_weight": 0.08,
            "season_weight": 0.07,
            "ml_mode_enabled": True,
            "currency": "USD",
            "theme": "dark",
            "updated_at": datetime.now()
        })
        
        # Create default Analytics
        mongo.db.user_analytics.insert_one({
            "user_id": username,
            "total_calculations": 0,
            "total_revenue_optimized": 0.0,
            "most_used_strategy": "",
            "most_used_category": "",
            "last_updated": datetime.now()
        })
        
        return redirect(url_for('login'))
        
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        user = mongo.db.users.find_one({"username": username})
        
        if user and check_password_hash(user['password'], password):
            mongo.db.users.update_one(
                {"_id": user['_id']},
                {"$set": {"last_login": datetime.now()}}
            )
            session['username'] = user['username']
            return redirect(url_for('dashboard'))
        else:
            return render_template('login.html', error="Invalid credentials")
            
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

# ================================================================
# VIEWS
# ================================================================

@app.route('/')
def dashboard():
    if 'username' not in session: return redirect(url_for('login'))
    return render_template('dashboard.html', username=session['username'])

@app.route('/simulator')
def simulator():
    if 'username' not in session: return redirect(url_for('login'))
    return render_template('simulator.html', username=session['username'])

@app.route('/analytics')
def analytics():
    if 'username' not in session: return redirect(url_for('login'))
    return render_template('analytics.html', username=session['username'])

@app.route('/history')
def history():
    if 'username' not in session: return redirect(url_for('login'))
    return render_template('history.html', username=session['username'])

@app.route('/settings')
def settings_page():
    if 'username' not in session: return redirect(url_for('login'))
    return render_template('settings.html', username=session['username'])

# ================================================================
# PRICING HISTORY ENDPOINTS
# ================================================================

@app.route('/api/save-pricing', methods=['POST'])
def save_pricing():
    if 'username' not in session: return jsonify({'error': 'Unauthorized'}), 401
    username = session['username']
    data = request.json
    
    multiplier = round(float(data.get('multiplier', 1.0)), 2)
    
    record = {
        "user_id": username,
        "product_name": data.get("product_name", "Unknown"),
        "category": data.get("category", "General"),
        "base_price": round(float(data.get("base_price", 0.0)), 2),
        "competitor_price": round(float(data.get("competitor_price", 0.0)), 2),
        "final_price": round(float(data.get("final_price", 0.0)), 2),
        "ml_predicted_price": round(float(data.get("ml_predicted_price", 0.0)), 2),
        "multiplier": multiplier,
        "strategy": data.get("strategy", "Unknown"),
        "confidence": round(float(data.get("confidence", 0.0)), 2),
        "demand": data.get("demand", "Medium"),
        "inventory": int(data.get("inventory", 0)),
        "time_sensitivity": data.get("time_sensitivity", "Medium"),
        "customer_segment": data.get("customer_segment", "Regular"),
        "season": data.get("season", "Normal"),
        "factors": data.get("factors", {}),
        "timestamp": datetime.now()
    }
    
    result = mongo.db.pricing_history.insert_one(record)
    
    # Update analytics counter
    revenue_opt = record["final_price"] - record["base_price"]
    mongo.db.user_analytics.update_one(
        {"user_id": username},
        {"$inc": {"total_calculations": 1, "total_revenue_optimized": revenue_opt},
         "$set": {"last_updated": datetime.now()}},
        upsert=True
    )
    
    return jsonify({"status": "success", "id": str(result.inserted_id)})

@app.route('/api/history', methods=['GET'])
def get_history():
    if 'username' not in session: return jsonify({'error': 'Unauthorized'}), 401
    username = session['username']
    limit = request.args.get('limit', type=int)
    
    query = mongo.db.pricing_history.find({"user_id": username}).sort("timestamp", -1)
    if limit:
        query = query.limit(limit)
        
    records = list(query)
    # Using json_util.dumps inside parse_json to handle ObjectIds / Dates elegantly
    return jsonify(parse_json(records))

@app.route('/api/history/<record_id>', methods=['DELETE'])
def delete_record(record_id):
    if 'username' not in session: return jsonify({'error': 'Unauthorized'}), 401
    result = mongo.db.pricing_history.delete_one({"_id": ObjectId(record_id), "user_id": session['username']})
    if result.deleted_count:
        return jsonify({"status": "deleted"})
    return jsonify({"error": "Not found"}), 404

@app.route('/api/history/all', methods=['DELETE'])
def delete_all_history():
    if 'username' not in session: return jsonify({'error': 'Unauthorized'}), 401
    result = mongo.db.pricing_history.delete_many({"user_id": session['username']})
    return jsonify({"status": "cleared", "count": result.deleted_count})

# ================================================================
# ANALYTICS ENDPOINTS
# ================================================================

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    if 'username' not in session: return jsonify({'error': 'Unauthorized'}), 401
    username = session['username']
    
    pipeline = [
        {"$match": {"user_id": username}},
        {"$group": {
            "_id": None,
            "total_records": {"$sum": 1},
            "avg_multiplier": {"$avg": "$multiplier"},
            "highest_price": {"$max": "$final_price"},
            "lowest_price": {"$min": "$final_price"},
            "avg_confidence": {"$avg": "$confidence"},
            "total_revenue_optimized": {"$sum": {"$subtract": ["$final_price", "$base_price"]}}
        }}
    ]
    summary_results = list(mongo.db.pricing_history.aggregate(pipeline))
    
    summary = summary_results[0] if summary_results else {
        "total_records": 0, "avg_multiplier": 1.0, 
        "highest_price": 0.0, "lowest_price": 0.0, 
        "avg_confidence": 0.0, "total_revenue_optimized": 0.0
    }
    
    # Format
    if summary["avg_multiplier"] is not None:
        summary["avg_multiplier"] = round(summary["avg_multiplier"], 2)
    
    # Strategy Distribution
    strat_pipe = [{"$match": {"user_id": username}}, {"$group": {"_id": "$strategy", "count": {"$sum": 1}}}]
    strategy_counts = {item["_id"]: item["count"] for item in mongo.db.pricing_history.aggregate(strat_pipe)}
    
    # Category Distribution
    cat_pipe = [{"$match": {"user_id": username}}, {"$group": {"_id": "$category", "count": {"$sum": 1}}}]
    category_counts = {item["_id"]: item["count"] for item in mongo.db.pricing_history.aggregate(cat_pipe)}
    
    # Monthly Average Price (Last 6 months approximation in MongoDB via aggregation)
    date_pipe = [
        {"$match": {"user_id": username}},
        {"$group": {
            "_id": {
                "month": {"$month": "$timestamp"},
                "year": {"$year": "$timestamp"}
            },
            "avg_price": {"$avg": "$final_price"}
        }},
        {"$sort": {"_id.year": -1, "_id.month": -1}},
        {"$limit": 6}
    ]
    monthly_data = []
    import calendar
    for d in reversed(list(mongo.db.pricing_history.aggregate(date_pipe))):
        m_name = calendar.month_abbr[d["_id"]["month"]]
        y_val = d["_id"]["year"]
        monthly_data.append({"month": f"{m_name} {y_val}", "avg_price": round(d["avg_price"], 2)})
    
    # Ensure all defaults for frontend
    base_strategies = ["Surge Pricing", "Peak Pricing", "Value-Based Pricing", "Competitive Pricing", "Penetration Pricing"]
    base_categories = ["Hotel", "Flight", "Ride", "SaaS", "E-commerce"]
    
    stat_response = {
        "total_records": summary["total_records"],
        "avg_multiplier": summary["avg_multiplier"],
        "highest_price": summary["highest_price"],
        "lowest_price": summary["lowest_price"],
        "avg_confidence": summary["avg_confidence"],
        "strategy_distribution": {s: strategy_counts.get(s, 0) for s in base_strategies},
        "category_distribution": {c: category_counts.get(c, 0) for c in base_categories},
        "monthly_avg_price": monthly_data,
        "total_revenue_optimized": round(summary["total_revenue_optimized"], 2)
    }
    
    return jsonify(stat_response)

@app.route('/api/dashboard-stats', methods=['GET'])
def get_dashboard_stats():
    if 'username' not in session: return jsonify({'error': 'Unauthorized'}), 401
    username = session['username']
    
    an = mongo.db.user_analytics.find_one({"user_id": username}) or {}
    total_calc = an.get("total_calculations", 0)
    rev_opt = an.get("total_revenue_optimized", 0.0)
    
    # Calculate best strategy and average multiplier efficiently
    pipe = [
        {"$match": {"user_id": username}},
        {"$facet": {
            "avg_mult": [{"$group": {"_id": None, "v": {"$avg": "$multiplier"}}}],
            "popular_strat": [{"$group": {"_id": "$strategy", "v": {"$sum": 1}}}, {"$sort": {"v": -1}}, {"$limit": 1}],
            "recent": [{"$sort": {"timestamp": -1}}, {"$limit": 7}],
        }}
    ]
    r = list(mongo.db.pricing_history.aggregate(pipe))[0]
    
    avg_mult = round(r["avg_mult"][0]["v"], 2) if r["avg_mult"] else 1.0
    best_strat = r["popular_strat"][0]["_id"] if r["popular_strat"] else "N/A"
    recent_recs = r["recent"]
    
    recent_strategies = [rec["strategy"] for rec in recent_recs[:5]]
    
    return jsonify(parse_json({
        "total_calculations": total_calc,
        "avg_multiplier": avg_mult,
        "best_strategy": best_strat,
        "revenue_optimized": rev_opt,
        "last_7_days_records": recent_recs,
        "recent_strategies": recent_strategies,
        "currency": "₹" # Assuming ₹ from the prompt snippet
    }))

@app.route('/api/predict', methods=['POST'])
def api_predict():
    if 'username' not in session: return jsonify({'error': 'Unauthorized'}), 401
    username = session['username']
    data = request.json
    
    base_price = float(data.get("base_price", 0))
    demand_level = float(data.get("demand_level", 1.0))
    stock = int(data.get("stock", 50))
    competitor_price = float(data.get("competitor_price", 0))
    
    # Fetch last 100 records
    history_records = list(mongo.db.pricing_history.find({"user_id": username}).sort("timestamp", -1).limit(100))
    
    # Fetch user ML settings 
    s = mongo.db.ml_settings.find_one({"user_id": username}) or {}
    
    # predict
    pred_price, note = train_and_predict(base_price, demand_level, stock, competitor_price, history_records, s)
    
    return jsonify({"predicted_price": pred_price, "note": note})

# ================================================================
# SETTINGS ENDPOINTS
# ================================================================

@app.route('/api/settings', methods=['GET'])
def get_settings():
    if 'username' not in session: return jsonify({'error': 'Unauthorized'}), 401
    s = mongo.db.ml_settings.find_one({"user_id": session['username']})
    if not s:
        s = {
            "demand_weight": 0.45, "scarcity_weight": 0.30, "competition_weight": 0.15,
            "time_weight": 0.10, "segment_weight": 0.08, "season_weight": 0.07,
            "ml_mode_enabled": True, "currency": "$", "theme": "dark"
        }
    return jsonify(parse_json(s))

@app.route('/api/settings', methods=['POST'])
def save_settings():
    if 'username' not in session: return jsonify({'error': 'Unauthorized'}), 401
    data = request.json
    
    update_data = {
        "demand_weight": float(data.get("demand_weight", 0.45)),
        "scarcity_weight": float(data.get("scarcity_weight", 0.30)),
        "competition_weight": float(data.get("competition_weight", 0.15)),
        "time_weight": float(data.get("time_weight", 0.10)),
        "segment_weight": float(data.get("segment_weight", 0.08)),
        "season_weight": float(data.get("season_weight", 0.07)),
        "ml_mode_enabled": bool(data.get("ml_mode_enabled", True)),
        "currency": data.get("currency", "$"),
        "theme": data.get("theme", "dark"),
        "updated_at": datetime.now()
    }
    
    mongo.db.ml_settings.update_one(
        {"user_id": session['username']},
        {"$set": update_data},
        upsert=True
    )
    
    return jsonify({"status": "saved"})


if __name__ == '__main__':
    app.run(debug=True, use_reloader=False, port=5000)

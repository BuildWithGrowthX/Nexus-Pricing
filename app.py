import os
import json
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import MongoClient
from bson.objectid import ObjectId
from bson import json_util
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, template_folder='templates', static_folder='static')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'fallback_secret_key_2026')
app.config['MONGO_URI'] = os.environ.get('MONGO_URI', '')

class MongoWrapper:
    def __init__(self):
        self.db = None
        self.cx = None

mongo = MongoWrapper()
try:
    if app.config['MONGO_URI']:
        client = MongoClient(app.config['MONGO_URI'])
        mongo.db = client.get_default_database()
        mongo.cx = client
        print("MongoDB initialized successfully")
    else:
        mongo = None
        print("MONGO_URI not set, starting app without MongoDB")
except Exception as e:
    mongo = None
    print(f"MongoDB connection warning: {e}")

# Try to import model, fallback if it fails
try:
    from model import train_and_predict
    ML_AVAILABLE = True
except Exception as e:
    print(f"ML model import warning: {e}")
    ML_AVAILABLE = False

# Safe wrapper for mongo commands on startup
with app.app_context():
    try:
        if mongo is not None and mongo.db is not None:
            # ping db to verify
            mongo.cx.server_info()
            mongo.db.users.create_index("username", unique=True)
            mongo.db.pricing_history.create_index([("user_id", 1), ("timestamp", -1)])
            mongo.db.user_pricing_history.create_index([("user_id", 1), ("timestamp", -1)])
            mongo.db.ml_settings.create_index("user_id", unique=True)
            print("MongoDB indexes verified.")
    except Exception as e:
        print(f"MongoDB startup exception (indexes): {e}")

def parse_json(data):
    return json.loads(json_util.dumps(data))

def calculate_dynamic_price_logic(base_price, demand_level, stock, competitor_price):
    demand_factor_val = (demand_level - 1) * 0.10 * base_price
    stock_diff = stock - 50
    stock_factor_val = stock_diff * 0.001 * base_price
    comp_influence_val = (competitor_price - base_price) * 0.20
    final_price = base_price + demand_factor_val - stock_factor_val + comp_influence_val
    final_price = max(0.5 * base_price, final_price) 
    explanation = {
        'base': base_price,
        'demand_math': f"+{demand_factor_val:.2f}",
        'stock_math': f"{'-' if stock_factor_val >= 0 else '+'}{abs(stock_factor_val):.2f}",
        'comp_math': f"{'+' if comp_influence_val >= 0 else '-'}{abs(comp_influence_val):.2f}"
    }
    return round(final_price, 2), explanation


# ================================================================
# AUTHENTICATION
# ================================================================

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        if mongo is None or mongo.db is None:
            return jsonify({"error": "Database unavailable"}), 503
            
        try:
            username = request.form['username']
            password = request.form['password']
            
            existing_user = mongo.db.users.find_one({"username": username})
            if existing_user:
                return render_template('register.html', error="Username already exists")
                
            mongo.db.users.insert_one({
                "username": username,
                "password": generate_password_hash(password),
                "email": "",
                "plan": "free",
                "is_new_user": True,
                "created_at": datetime.now(),
                "last_login": datetime.now()
            })
            
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
            
            mongo.db.user_analytics.insert_one({
                "user_id": username,
                "total_calculations": 0,
                "total_revenue_optimized": 0.0,
                "most_used_strategy": "",
                "most_used_category": "",
                "last_updated": datetime.now()
            })
            return redirect(url_for('login'))
        except Exception as e:
            print(f"Error in /register: {e}")
            return render_template('register.html', error="Registration failed due to a database error.")
            
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        if mongo is None or mongo.db is None:
            return jsonify({"error": "Database unavailable"}), 503
            
        try:
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
        except Exception as e:
            print(f"Error in /login: {e}")
            return render_template('login.html', error="Login failed due to a database error.")
            
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/api/complete-onboarding', methods=['POST'])
def complete_onboarding():
    if mongo is None or mongo.db is None:
        return jsonify({"error": "Database unavailable"}), 503
    if 'username' not in session: 
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        mongo.db.users.update_one(
            {"username": session['username']},
            {"$set": {"is_new_user": False}}
        )
        return jsonify({"success": True})
    except Exception as e:
        print(f"Error completing onboarding: {e}")
        return jsonify({"error": "Failed to update onboarding state"}), 500

# ================================================================
# VIEWS
# ================================================================

@app.route('/')
def index():
    if 'username' in session:
        return redirect(url_for('dashboard'))
    return render_template('landing.html')

@app.route('/dashboard')
def dashboard():
    if 'username' not in session: return redirect(url_for('login'))
    
    is_new_user = False
    if mongo and mongo.db is not None:
        user_doc = mongo.db.users.find_one({"username": session['username']})
        if user_doc:
            is_new_user = user_doc.get("is_new_user", False)
            
    return render_template('dashboard.html', username=session['username'], is_new_user=is_new_user)

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

@app.route('/sitemap.xml')
def sitemap():
    from flask import Response
    xml = '''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://nexus-pricing.onrender.com/</loc></url>
  <url><loc>https://nexus-pricing.onrender.com/dashboard</loc></url>
  <url><loc>https://nexus-pricing.onrender.com/simulator</loc></url>
  <url><loc>https://nexus-pricing.onrender.com/analytics</loc></url>
  <url><loc>https://nexus-pricing.onrender.com/history</loc></url>
</urlset>'''
    return Response(xml, mimetype='application/xml')

@app.route('/robots.txt')
def robots():
    from flask import Response
    txt = '''User-agent: *
Allow: /
Sitemap: https://nexus-pricing.onrender.com/sitemap.xml'''
    return Response(txt, mimetype='text/plain')

# ================================================================
# PRICING HISTORY ENDPOINTS
# ================================================================

@app.route('/api/save-pricing', methods=['POST'])
def save_pricing():
    if mongo is None or mongo.db is None:
        return jsonify({"error": "Database unavailable"}), 503
    if 'username' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    try:
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
        
        # Insert to global ML tracking
        mongo.db.pricing_history.insert_one(record.copy())
        # Insert to user history
        result = mongo.db.user_pricing_history.insert_one(record)
        
        revenue_opt = record["final_price"] - record["base_price"]
        mongo.db.user_analytics.update_one(
            {"user_id": username},
            {"$inc": {"total_calculations": 1, "total_revenue_optimized": revenue_opt},
             "$set": {"last_updated": datetime.now()}},
            upsert=True
        )
        return jsonify({"status": "success", "id": str(result.inserted_id)})
    except Exception as e:
        print(f"Error saving pricing: {e}")
        return jsonify({"error": "Failed to save data."}), 500

@app.route('/api/user-history')
def user_history():
    if 'username' not in session:
        return jsonify([])
    # Use actual mongo structure (user_pricing_history instead of DB calculations)
    records = list(mongo.db.user_pricing_history.find(
        {'user_id': session['username']},
        {'_id': 0, 'base_price': 1, 'final_price': 1, 'category': 1}
    ).sort('timestamp', -1).limit(50))
    records.reverse()
    return jsonify(records)

@app.route('/api/history', methods=['GET'])
def get_history():
    if mongo is None or mongo.db is None:
        return jsonify({"error": "Database unavailable"}), 503
    if 'username' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        username = session['username']
        limit = request.args.get('limit', type=int)
        
        query = mongo.db.user_pricing_history.find({"user_id": username}).sort("timestamp", -1)
        if limit:
            query = query.limit(limit)
            
        records = list(query)
        return jsonify(parse_json(records))
    except Exception as e:
        print(f"Error fetching history: {e}")
        return jsonify({"error": "Failed to fetch data."}), 500

@app.route('/api/history/<record_id>', methods=['DELETE'])
def delete_record(record_id):
    if mongo is None or mongo.db is None:
        return jsonify({"error": "Database unavailable"}), 503
    if 'username' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        result = mongo.db.user_pricing_history.delete_one({"_id": ObjectId(record_id), "user_id": session['username']})
        if result.deleted_count:
            return jsonify({"status": "deleted"})
        return jsonify({"error": "Not found"}), 404
    except Exception as e:
        print(f"Error deleting record: {e}")
        return jsonify({"error": "Failed to delete logic."}), 500

@app.route('/api/history/all', methods=['DELETE'])
def delete_all_history():
    if mongo is None or mongo.db is None:
        return jsonify({"error": "Database unavailable"}), 503
    if 'username' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        result = mongo.db.user_pricing_history.delete_many({"user_id": session['username']})
        return jsonify({"status": "cleared", "count": result.deleted_count})
    except Exception as e:
        print(f"Error deleting all history: {e}")
        return jsonify({"error": "Failed to delete all data."}), 500

# ================================================================
# ANALYTICS ENDPOINTS
# ================================================================

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    if mongo is None or mongo.db is None:
        return jsonify({"error": "Database unavailable"}), 503
    if 'username' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    try:
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
        summary_results = list(mongo.db.user_pricing_history.aggregate(pipeline))
        summary = summary_results[0] if summary_results else {
            "total_records": 0, "avg_multiplier": 1.0, 
            "highest_price": 0.0, "lowest_price": 0.0, 
            "avg_confidence": 0.0, "total_revenue_optimized": 0.0
        }
        
        if summary["avg_multiplier"] is not None:
            summary["avg_multiplier"] = round(summary["avg_multiplier"], 2)
        
        strat_pipe = [{"$match": {"user_id": username}}, {"$group": {"_id": "$strategy", "count": {"$sum": 1}}}]
        strategy_counts = {item["_id"]: item["count"] for item in mongo.db.user_pricing_history.aggregate(strat_pipe)}
        
        cat_pipe = [{"$match": {"user_id": username}}, {"$group": {"_id": "$category", "count": {"$sum": 1}}}]
        category_counts = {item["_id"]: item["count"] for item in mongo.db.user_pricing_history.aggregate(cat_pipe)}
        
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
        for d in reversed(list(mongo.db.user_pricing_history.aggregate(date_pipe))):
            m_name = calendar.month_abbr[d["_id"]["month"]]
            y_val = d["_id"]["year"]
            monthly_data.append({"month": f"{m_name} {y_val}", "avg_price": round(d["avg_price"], 2)})
        
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
    except Exception as e:
        print(f"Error generating analytics: {e}")
        return jsonify({"error": "Failed to generate analytics."}), 500

@app.route('/api/dashboard-stats', methods=['GET'])
def get_dashboard_stats():
    if mongo is None or mongo.db is None:
        return jsonify({"error": "Database unavailable"}), 503
    if 'username' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        username = session['username']
        an = mongo.db.user_analytics.find_one({"user_id": username}) or {}
        total_calc = an.get("total_calculations", 0)
        rev_opt = an.get("total_revenue_optimized", 0.0)
        
        pipe = [
            {"$match": {"user_id": username}},
            {"$facet": {
                "avg_mult": [{"$group": {"_id": None, "v": {"$avg": "$multiplier"}}}],
                "popular_strat": [{"$group": {"_id": "$strategy", "v": {"$sum": 1}}}, {"$sort": {"v": -1}}, {"$limit": 1}],
                "recent": [{"$sort": {"timestamp": -1}}, {"$limit": 7}],
            }}
        ]
        agg_result = list(mongo.db.user_pricing_history.aggregate(pipe))
        if agg_result:
            r = agg_result[0]
            avg_mult = round(r["avg_mult"][0]["v"], 2) if r["avg_mult"] else 1.0
            best_strat = r["popular_strat"][0]["_id"] if r["popular_strat"] else "N/A"
            recent_recs = r["recent"]
        else:
            avg_mult, best_strat, recent_recs = 1.0, "N/A", []
            
        recent_strategies = [rec["strategy"] for rec in recent_recs[:5]]
        
        return jsonify(parse_json({
            "total_calculations": total_calc,
            "avg_multiplier": avg_mult,
            "best_strategy": best_strat,
            "revenue_optimized": rev_opt,
            "last_7_days_records": recent_recs,
            "recent_strategies": recent_strategies,
            "currency": "₹"
        }))
    except Exception as e:
        print(f"Error fetching dashboard stats: {e}")
        return jsonify({"error": "Failed to load dashboard data."}), 500

@app.route('/api/predict', methods=['POST'])
def api_predict():
    if mongo is None or mongo.db is None:
        return jsonify({"error": "Database unavailable"}), 503
    if 'username' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        username = session['username']
        data = request.json
        base_price = float(data.get("base_price", 0))
        demand_level = float(data.get("demand_level", 1.0))
        stock = int(data.get("stock", 50))
        competitor_price = float(data.get("competitor_price", 0))
        
        cat_raw = data.get("category", "hotel").lower()
        if cat_raw == "hotel": cat = "Hotel"
        elif cat_raw == "flight": cat = "Flight"
        elif cat_raw == "ride": cat = "Ride"
        elif cat_raw == "ecommerce": cat = "E-commerce"
        elif cat_raw == "saas": cat = "SaaS"
        else: cat = "Hotel"
        
        time_val = float(data.get("time", 1.0))
        seg_val = float(data.get("segment", 1.0))
        season_val = float(data.get("season", 1.0))

        # Check weights for this category
        w_doc = mongo.db.ml_model_weights.find_one({"category": cat})

        if w_doc:
            w = w_doc['weights']
            bias = w_doc['bias']
            sca = max(0, (100 - stock)) / 100.0
            comp = (competitor_price / base_price) if base_price > 0 else 1.0
            
            # Predict the final price multiplier directly
            predicted_mult = w[0]*demand_level + w[1]*sca + w[2]*comp + w[3]*time_val + w[4]*seg_val + w[5]*season_val + bias
            # Safeguard against too low pricing
            pred_price = round(max(base_price * 0.5, base_price * predicted_mult), 2)
            acc = w_doc.get("accuracy_score", 0)
            note = f"Calculated using Live Pure-Python {cat} ML Model (Trained on {w_doc['trained_on']} records, Accuracy: {acc:.2f}%)."
        else:
            history_records = list(mongo.db.user_pricing_history.find({"user_id": username}).sort("timestamp", -1).limit(100))
            s = mongo.db.ml_settings.find_one({"user_id": username}) or {}
            
            if ML_AVAILABLE:
                pred_price, note = train_and_predict(base_price, demand_level, stock, competitor_price, history_records, s)
            else:
                # Fallback if ML failed to load
                pred_price, note = calculate_dynamic_price_logic(base_price, demand_level, stock, competitor_price)
                note = str(note)
        
        return jsonify({"predicted_price": pred_price, "note": note})
    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({"error": "Prediction engine encountered an error."}), 500

# ================================================================
# SETTINGS ENDPOINTS
# ================================================================

@app.route('/api/settings', methods=['GET'])
def get_settings():
    if mongo is None or mongo.db is None:
        return jsonify({"error": "Database unavailable"}), 503
    if 'username' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        s = mongo.db.ml_settings.find_one({"user_id": session['username']})
        if not s:
            s = {
                "demand_weight": 0.45, "scarcity_weight": 0.30, "competition_weight": 0.15,
                "time_weight": 0.10, "segment_weight": 0.08, "season_weight": 0.07,
                "ml_mode_enabled": True, "currency": "$", "theme": "dark"
            }
        return jsonify(parse_json(s))
    except Exception as e:
        print(f"Settings error: {e}")
        return jsonify({"error": "Failed to load settings."}), 500

@app.route('/api/settings', methods=['POST'])
def save_settings():
    if mongo is None or mongo.db is None:
        return jsonify({"error": "Database unavailable"}), 503
    if 'username' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    try:
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
    except Exception as e:
        print(f"Error saving settings: {e}")
        return jsonify({"error": "Failed to save settings."}), 500


from werkzeug.exceptions import HTTPException

@app.errorhandler(Exception)
def handle_exception(e):
    if isinstance(e, HTTPException):
        return e
    import traceback
    return f"APP ERROR:\n{str(e)}\n\n{traceback.format_exc()}", 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

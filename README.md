# Dynamic Pricing System
A cloud-native machine learning driven dynamic pricing dashboard.

## Cloud Deployment (MongoDB Atlas & PythonAnywhere)

1. **MongoDB Atlas setup:**
   - Ensure you whitelist IP `0.0.0.0/0` in MongoDB Atlas under **Network Access** to allow PythonAnywhere to connect.

2. **PythonAnywhere Deployment:**
   - Go to PythonAnywhere dashboard.
   - Under your Web tab, search for the **Environment variables** section (or the WSGI config).
   - Set the `MONGO_URI` directly there so the application can connect to the Atlas cluster in production.
   - Set `SECRET_KEY` there as well.

## Run Locally
1. `pip install -r requirements.txt`
2. Configure `.env` with a real `MONGO_URI`.
3. `python app.py`

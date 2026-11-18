from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from sklearn.linear_model import LinearRegression, LogisticRegression

app = FastAPI(title="Financial Tracking Dashboard API")

# Allow your live Vercel frontend to pull data from this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. Linear Regression: End-of-Month Balance Forecast ---
days = np.array([0, 1, 2, 3, 5, 6, 7, 8, 10, 12, 14, 15, 16, 18, 20, 22, 23, 25]).reshape(-1, 1)
balances = np.array([
    5000, 8200, 6800, 6680, 6580, 6550, 6510, 6500, 6160,
    6120, 5910, 6420, 6350, 6230, 5770, 5680, 5630, 5600
])

lin_model = LinearRegression()
lin_model.fit(days, balances)
eom_forecast = round(float(lin_model.predict(np.array([[30]]))[0]), 2)

# --- 2. Logistic Regression: Overspending Anomaly Detection ---
# Training data: [transaction_amount] -> 1 (overspending risk), 0 (normal)
X_train = np.array([[15], [45], [80], [120], [250], [450], [600], [1200]])
y_train = np.array([0, 0, 0, 0, 0, 1, 1, 1])

log_model = LogisticRegression()
log_model.fit(X_train, y_train)

# Recent transactions to evaluate
recent_transactions = np.array([[42], [110], [480], [65], [450], [1400], [35]])
predictions = log_model.predict(recent_transactions)
anomalies_detected = int(np.sum(predictions))


@app.get("/")
def root():
    return {"status": "Financial Dashboard API is live"}


@app.get("/api/dashboard-summary")
def get_dashboard_summary():
    return {
        "current_balance": float(balances[-1]),
        "eom_forecast": eom_forecast,
        "anomalies_detected": anomalies_detected,
    }
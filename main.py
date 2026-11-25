from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import pandas as pd
import io
from sklearn.linear_model import LinearRegression, LogisticRegression

app = FastAPI(title="Financial Tracking Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- State ---
starting_balance = 8700.00

transactions = [
    {"id": 1, "date": "2026-10-01", "description": "Monthly Rent", "category": "Housing", "amount": 1400.00, "type": "Expense"},
    {"id": 2, "date": "2026-10-03", "description": "Grocery Run", "category": "Food", "amount": 185.50, "type": "Expense"},
    {"id": 3, "date": "2026-10-07", "description": "Electric & Wi-Fi", "category": "Utilities", "amount": 180.00, "type": "Expense"},
    {"id": 4, "date": "2026-10-12", "description": "Concert Tickets", "category": "Entertainment", "amount": 450.00, "type": "Expense"},
    {"id": 5, "date": "2026-10-15", "description": "Bi-Weekly Paycheck", "category": "Income", "amount": 2100.00, "type": "Deposit"},
    {"id": 6, "date": "2026-10-16", "description": "Gas & Transit", "category": "Transportation", "amount": 120.00, "type": "Expense"},
    {"id": 7, "date": "2026-10-20", "description": "Electronics Store", "category": "Shopping", "amount": 466.60, "type": "Expense"},
    {"id": 8, "date": "2026-10-24", "description": "Dining Out", "category": "Food", "amount": 294.50, "type": "Expense"},
]

income_assets = [
    {"id": 1, "name": "Monthly Paycheck", "type": "Income", "amount": 4200.00},
    {"id": 2, "name": "Freelance Analytics", "type": "Income", "amount": 850.00},
    {"id": 3, "name": "High-Yield Savings", "type": "Asset", "amount": 5600.00},
    {"id": 4, "name": "Roth IRA / Index Funds", "type": "Asset", "amount": 3400.00},
]

# --- Train Logistic Regression Model for Overspending Risk ---
X_train = np.array([[15], [45], [80], [120], [250], [400], [600], [1200]])
y_train = np.array([0, 0, 0, 0, 0, 1, 1, 1])
log_model = LogisticRegression()
log_model.fit(X_train, y_train)


class TransactionCreate(BaseModel):
    date: str
    description: str
    category: str
    amount: float
    type: str = "Expense"  # "Expense" or "Deposit"


class IncomeAssetCreate(BaseModel):
    name: str
    type: str  # "Income" or "Asset"
    amount: float


class BalanceUpdate(BaseModel):
    balance: float


def auto_categorize(description: str) -> str:
    desc = description.lower()
    if any(k in desc for k in ["uber eats", "doordash", "grubhub", "pizza", "caesars", "shawarma", "mcdonald", "starbucks", "chipotle", "grocery", "walmart", "jewel", "aldi", "vend", "restaurant", "cafe", "burger"]):
        return "Food"
    if any(k in desc for k in ["comcast", "xfinity", "electric", "water", "gas", "internet", "att", "verizon", "t-mobile"]):
        return "Utilities"
    if any(k in desc for k in ["rent", "mortgage", "apartment", "lease"]):
        return "Housing"
    if any(k in desc for k in ["uber ", "lyft", "shell", "bp ", "exxon", "chevron", "wally", "transit", "parking", "toll"]):
        return "Transportation"
    if any(k in desc for k in ["spotify", "netflix", "hulu", "riot games", "steam", "playstation", "xbox", "amc", "ticket"]):
        return "Entertainment"
    if any(k in desc for k in ["venmo", "zelle", "paypal", "cash app"]):
        return "Transfers"
    return "Shopping"


def parse_sort_date(date_str: str):
    try:
        return pd.to_datetime(date_str)
    except Exception:
        return pd.Timestamp.min


def build_dashboard_state():
    enriched_tx = []
    anomalies = 0
    running_balance = starting_balance
    balance_labels = ["Start"]
    balance_values = [round(starting_balance, 2)]

    sorted_tx = sorted(transactions, key=lambda x: parse_sort_date(x["date"]))

    for tx in sorted_tx:
        tx_type = tx.get("type", "Expense")
        if tx_type == "Deposit":
            is_risk = False
            running_balance += tx["amount"]
        else:
            is_risk = int(log_model.predict(np.array([[tx["amount"]]]))[0]) == 1
            if is_risk:
                anomalies += 1
            running_balance -= tx["amount"]

        balance_labels.append(tx["date"])
        balance_values.append(round(running_balance, 2))
        enriched_tx.append({**tx, "type": tx_type, "risk_flag": is_risk})

    # Linear Regression Forecast (accounts for both deposits & expenses)
    if len(balance_values) >= 2:
        days = np.arange(len(balance_values)).reshape(-1, 1)
        y_vals = np.array(balance_values)
        lin_model = LinearRegression()
        lin_model.fit(days, y_vals)
        trend_line = [round(float(v), 2) for v in lin_model.predict(days)]
        eom_forecast = round(float(lin_model.predict(np.array([[len(balance_values) + 3]]))[0]), 2)
    else:
        trend_line = balance_values
        eom_forecast = round(running_balance, 2)

    # Category Breakdown (Expenses only)
    category_totals = {}
    total_spent = 0.0
    total_deposits = 0.0
    for tx in transactions:
        if tx.get("type", "Expense") == "Deposit":
            total_deposits += tx["amount"]
        else:
            cat = tx["category"]
            category_totals[cat] = round(category_totals.get(cat, 0) + tx["amount"], 2)
            total_spent += tx["amount"]

    total_spent = round(total_spent, 2)
    total_deposits = round(total_deposits, 2)
    highest_cat = max(category_totals.items(), key=lambda x: x[1]) if category_totals else ("None", 0)

    return {
        "starting_balance": round(starting_balance, 2),
        "current_balance": round(running_balance, 2),
        "eom_forecast": eom_forecast,
        "anomalies_detected": anomalies,
        "total_spent": total_spent,
        "total_deposits": total_deposits,
        "highest_category": {"name": highest_cat[0], "amount": highest_cat[1]},
        "balance_history": {
            "labels": balance_labels,
            "values": balance_values,
            "trend": trend_line,
        },
        "category_breakdown": category_totals,
        "transactions": list(reversed(enriched_tx)),
        "income_assets": income_assets,
    }


@app.get("/")
def root():
    return {"status": "Financial Dashboard API is live"}


@app.get("/api/dashboard-summary")
def get_dashboard_summary():
    return build_dashboard_state()


@app.post("/api/balance")
def update_balance(payload: BalanceUpdate):
    global starting_balance
    net_change = sum(
        tx["amount"] if tx.get("type", "Expense") == "Deposit" else -tx["amount"]
        for tx in transactions
    )
    starting_balance = float(payload.balance) - net_change
    return build_dashboard_state()


@app.post("/api/transactions")
def add_transaction(tx: TransactionCreate):
    new_id = max((t["id"] for t in transactions), default=0) + 1
    transactions.append({
        "id": new_id,
        "date": tx.date,
        "description": tx.description,
        "category": "Income" if tx.type == "Deposit" else tx.category,
        "amount": abs(float(tx.amount)),
        "type": tx.type,
    })
    return build_dashboard_state()


@app.delete("/api/transactions/{tx_id}")
def delete_transaction(tx_id: int):
    global transactions
    transactions = [t for t in transactions if t["id"] != tx_id]
    return build_dashboard_state()


@app.post("/api/income")
def add_income_asset(item: IncomeAssetCreate):
    new_id = max((i["id"] for i in income_assets), default=0) + 1
    income_assets.append({
        "id": new_id,
        "name": item.name,
        "type": item.type,
        "amount": abs(float(item.amount)),
    })
    return build_dashboard_state()


@app.delete("/api/income/{item_id}")
def delete_income_asset(item_id: int):
    global income_assets
    income_assets = [i for i in income_assets if i["id"] != item_id]
    return build_dashboard_state()


@app.post("/api/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file.")

    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents), index_col=False)
        df.columns = [c.strip().lower() for c in df.columns]

        # Format 1: Chase Bank CSV (imports BOTH deposits & expenses)
        if {"posting date", "description", "amount"}.issubset(set(df.columns)):
            transactions.clear()
            tx_id = 1
            for _, row in df.iterrows():
                amt = float(row["amount"])
                desc = str(row["description"]).strip()
                is_deposit = amt > 0
                transactions.append({
                    "id": tx_id,
                    "date": str(row["posting date"]).strip(),
                    "description": desc,
                    "category": "Income" if is_deposit else auto_categorize(desc),
                    "amount": round(abs(amt), 2),
                    "type": "Deposit" if is_deposit else "Expense",
                })
                tx_id += 1
            return build_dashboard_state()

        # Format 2: Standard CSV (date, description, category, amount, optional type)
        required = {"date", "description", "category", "amount"}
        if required.issubset(set(df.columns)):
            transactions.clear()
            for idx, row in df.iterrows():
                raw_amt = float(row["amount"])
                tx_type = str(row["type"]).strip() if "type" in df.columns else ("Deposit" if raw_amt > 0 and str(row["category"]).lower() == "income" else "Expense")
                transactions.append({
                    "id": int(idx) + 1,
                    "date": str(row["date"]),
                    "description": str(row["description"]),
                    "category": str(row["category"]),
                    "amount": round(abs(raw_amt), 2),
                    "type": tx_type,
                })
            return build_dashboard_state()

        raise HTTPException(
            status_code=400,
            detail="CSV must be a Chase export or contain: date, description, category, amount",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing CSV: {str(e)}")
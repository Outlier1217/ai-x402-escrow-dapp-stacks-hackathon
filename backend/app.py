from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import requests
import re

app = Flask(__name__)
CORS(app)

# =========================
# CONFIG
# =========================
STACKS_API = "https://api.testnet.hiro.so"
ESCROW_CONTRACT_ADDRESS = "STXWF905DFSCWN77QNNWFHSFXPF73ZP02H05X5Q.escrow-v3"

# =========================
# LOAD AI MODEL
# =========================
with open("ai_risk_agent.pkl", "rb") as f:
    model = pickle.load(f)


# =========================
# UTIL
# =========================
def is_valid_tx_id(tx_id):
    pattern = r"^(0x)?[a-fA-F0-9]{64}$"
    return re.match(pattern, tx_id) is not None


# =========================
# BUY ENDPOINT
# =========================
@app.route("/buy", methods=["POST"])
def buy():
    try:
        data = request.json

        required_fields = [
            "user_is_new",
            "order_amount",
            "total_past_orders",
            "refunds_last_30_days",
            "account_age_days",
            "days_since_delivery",
            "dispute_opened"
        ]

        # Validate input
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        cart_count = data.get("cart_count", 1)

        features = np.array([[
            data["user_is_new"],
            data["order_amount"],
            data["total_past_orders"],
            data["refunds_last_30_days"],
            data["account_age_days"],
            data["days_since_delivery"],
            data["dispute_opened"]
        ]])

        decision = int(model.predict(features)[0])

        print("AI Decision:", decision)
        print("Cart count:", cart_count)

        # 🔴 HIGH RISK → REJECT
        if decision == 2:
            return jsonify({
                "status": "rejected",
                "reason": "High refund risk detected"
            }), 200

        # 🟡 MULTI ITEM → HOLD
        if cart_count > 1:
            return jsonify({
                "status": "payment_required",
                "hold": True,
                "amount": data["order_amount"],
                "contract": ESCROW_CONTRACT_ADDRESS
            }), 402

        # 🟢 SINGLE ITEM → AUTO APPROVE
        return jsonify({
            "status": "payment_required",
            "hold": False,
            "amount": data["order_amount"],
            "contract": ESCROW_CONTRACT_ADDRESS
        }), 402

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({"error": "Internal server error"}), 500


# =========================
# VERIFY PAYMENT
# =========================
@app.route("/verify-payment", methods=["POST"])
def verify_payment():
    try:
        tx_id = request.json.get("tx_id")

        if not tx_id or not is_valid_tx_id(tx_id):
            return jsonify({"error": "Invalid transaction ID"}), 400

        url = f"{STACKS_API}/extended/v1/tx/{tx_id}"
        response = requests.get(url)

        if response.status_code != 200:
            return jsonify({"status": "transaction_not_found"}), 400

        tx_data = response.json()

        if tx_data.get("tx_status") != "success":
            return jsonify({"status": "pending_or_failed"}), 400

        # Optional: verify contract
        if tx_data.get("contract_call"):
            contract_id = tx_data["contract_call"].get("contract_id")
            if ESCROW_CONTRACT_ADDRESS not in contract_id:
                return jsonify({
                    "error": "Transaction not sent to escrow contract"
                }), 400

        return jsonify({
            "status": "verified",
            "tx_id": tx_id
        })

    except Exception as e:
        print("VERIFY ERROR:", str(e))
        return jsonify({"error": "Verification failed"}), 500


# =========================
# HEALTH CHECK
# =========================
@app.route("/")
def health():
    return jsonify({
        "service": "AI + x402 Escrow API",
        "status": "running"
    })


# =========================
# RUN
# =========================
if __name__ == "__main__":
    app.run(port=5000)
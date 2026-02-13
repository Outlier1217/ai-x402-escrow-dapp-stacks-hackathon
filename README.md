🛡️ AI-Powered x402 Escrow DApp

Privacy-First E-Commerce with Smart Escrow & AI Risk Assessment

https://img.shields.io/badge/Stacks-Blockchain-5546FF
https://img.shields.io/badge/HTTP-402%2520Payment%2520Required-orange
https://img.shields.io/badge/AI-Risk%2520Engine-blue
https://img.shields.io/badge/x402-Stacks%2520Standard-purple
https://img.shields.io/badge/License-MIT-green

📋 Table of Contents
What is x402?

Problem Statement

Solution Overview

Core Innovation

x402 Integration Deep Dive

How It Works

AI Risk Engine

Smart Contract Architecture

Deployed Contracts

Tech Stack

Installation & Setup

Running the Application

Features

Why This Is Different

Future Roadmap

Hackathon Submission

Team Feedback

🔥 What is x402?
x402-stacks is an open payment standard that leverages HTTP 402 Payment Required status code with Stacks blockchain integration.

Core x402 Principles:
Principle	Implementation
HTTP 402 Standard	Uses 402 Payment Required status code for payment requests
Wallet-Based	Crypto wallet as payment method
Programmable Money	Smart contract-controlled payments
Open Protocol	No vendor lock-in
Blockchain Settled	Final settlement on Stacks
Why HTTP 402?
The HTTP 402 status code was originally designed for "Payment Required" but never widely adopted. x402 brings it to life by combining it with blockchain technology, creating a standardized way to request and process web3 payments.

In This Project:
We use x402 to:

Request Payment - Backend returns 402 status when payment needed

Wallet Integration - Leather wallet processes payment

Smart Contract Settlement - Funds locked in escrow

Verification - Payment verified via blockchain

🚨 Problem Statement
Modern e-commerce platforms require users to share excessive personal information:

Data Collected	Privacy Risk
Full name	Identity exposure
Email address	Spam & targeted ads
Phone number	Unsolicited calls
Bank / card details	Financial data breach
Delivery address	Physical privacy violation
This centralized data is often:

📦 Stored indefinitely

💸 Shared or sold to third-party companies

📢 Used for targeted ads, spam, and unsolicited calls

As a result, users lose:
❌ Privacy
❌ Data ownership
❌ Control over refunds and disputes

Trust is forced, not earned.

💡 Solution Overview
This project introduces a privacy-first, wallet-based e-commerce system where:

🔑 Your crypto wallet address is your identity.
No signup. No personal details. No centralized user database.

The Three Pillars:
Component	Role	x402 Connection
x402 Protocol	HTTP 402 Payment Required standard	Core payment layer
AI Risk Engine	Real-time transaction risk assessment	Pre-payment decision
Escrow Smart Contract	Trustless fund management	Post-payment settlement
🧠 Core Innovation
1️⃣ x402 Payment Standard
HTTP 402 Integration - Backend returns 402 Payment Required when payment needed

Standardized Flow - Consistent payment experience across applications

Wallet Detection - Automatic wallet popup for payment

Payment Verification - Transaction status checking via Hiro API

javascript
// x402 Implementation in Backend
@app.route("/buy", methods=["POST"])
def buy():
    # AI decision logic...
    
    if cart_count > 1:
        return jsonify({
            "status": "payment_required",
            "hold": True,
            "amount": data["order_amount"],
            "contract": ESCROW_CONTRACT_ADDRESS
        }), 402  # HTTP 402 Payment Required
        
    return jsonify({
        "status": "payment_required",
        "hold": False,
        "amount": data["order_amount"],
        "contract": ESCROW_CONTRACT_ADDRESS
    }), 402
2️⃣ Wallet-Only Identity
Users connect a crypto wallet (Leather Wallet)

The wallet address acts as the sole identity

No email, phone number, name, or KYC required



3️⃣ AI-Driven Transaction Risk Assessment
An AI model evaluates every transaction and decides whether to:

✅ Auto-approve payment

⏸️ Hold funds for verification

🔄 Allow refund

❌ Reject suspicious transactions

This protects both buyers and sellers without exposing identity data.

4️⃣ Smart Contract Escrow
Funds are locked in an escrow smart contract

Payment release depends on AI decision + transaction conditions

Eliminates blind trust between buyer and seller

Admin can intervene only when necessary

🔄 x402 Integration Deep Dive
Complete x402 Payment Flow:
x402 Components in Our Code:
1. Backend - 402 Response
python
# When payment is needed, return 402 status
return jsonify({
    "status": "payment_required",
    "hold": decision == "hold",
    "amount": order_amount,
    "contract": escrow_contract_address
}), 402
2. Frontend - Handle 402
javascript
const res = await fetch("http://127.0.0.1:5000/buy", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(orderData),
});

if (res.status === 402) {
  // x402 payment required
  const data = await res.json();
  // Trigger wallet payment
  const tx = await window.LeatherProvider.request("stx_callContract", {
    contract: data.contract,
    functionName: "deposit",
    functionArgs: [...],
  });
}
3. Payment Verification
python
@app.route("/verify-payment", methods=["POST"])
def verify_payment():
    tx_id = request.json.get("tx_id")
    # Check on Stacks blockchain
    url = f"{STACKS_API}/extended/v1/tx/{tx_id}"
    response = requests.get(url)
    # Verify contract call
    if tx_data.get("tx_status") == "success":
        return jsonify({"status": "verified"})
🤖 AI Risk Engine
The AI model analyzes transaction patterns using:

Input Features:
Feature	Description
user_is_new	First-time buyer flag
order_amount	Total transaction value
total_past_orders	User's order history
refunds_last_30_days	Recent refund activity
account_age_days	Wallet age
days_since_delivery	Delivery performance
dispute_opened	Previous disputes
Output Classes:
0 - Low Risk → Auto Release

1 - Medium Risk → Hold

2 - High Risk → Reject

Model Training:
Trained on synthetic e-commerce transaction data

Pattern recognition for fraud detection

Continuous learning capability

📜 Smart Contract Architecture
Escrow Contract (escrow-v3.clar)
clarity
;; STATUS Mapping
;; 0 = Hold | 1 = Released | 2 = Refunded | 3 = Rejected

(define-map orders
  { order-id: uint }
  {
    buyer: principal,
    product-id: uint,
    amount: uint,
    item-count: uint,
    status: uint
  }
)
Key Functions:
Function	Description	Access
deposit	Lock funds in escrow	Public
admin-release	Release held funds	Admin only
admin-reject	Reject & refund	Admin only
get-order	Query order status	Read-only
Token Contract (usdcx-token-v2.clar)
Fungible token implementation

Mint & transfer capabilities

Balance tracking

📍 Deployed Contracts
Testnet Deployment
Contract	Address	Explorer Link
USDCx Token	STXWF905DFSCWN77QNNWFHSFXPF73ZP02H05X5Q.usdcx-token-v2	View on Hiro Explorer
Escrow v3	STXWF905DFSCWN77QNNWFHSFXPF73ZP02H05X5Q.escrow-v3	View on Hiro Explorer
Admin Address
text
STXWF905DFSCWN77QNNWFHSFXPF73ZP02H05X5Q
🛠️ Tech Stack
Frontend
React.js - UI framework

Leather Wallet - Stacks wallet integration

@stacks/transactions - Transaction building

CSS - Custom styling

Backend
Flask - Python web framework

CORS - Cross-origin resource sharing

Requests - HTTP client

AI/ML
Scikit-learn - ML model training

Pickle - Model serialization

NumPy - Numerical operations

Blockchain
Clarity - Smart contract language

Stacks Blockchain - Layer 1 blockchain

Hiro API - Blockchain interaction

x402 Integration
HTTP 402 Status Code - Payment required signaling

Wallet RPC Calls - Contract interactions

Transaction Verification - On-chain confirmation

💻 Installation & Setup
Prerequisites
Node.js (v16+)

Python (3.8+)

Leather Wallet browser extension

Frontend Setup
bash
# Install dependencies
npm install

# Install Stacks libraries
npm install @stacks/transactions @stacks/network
Backend Setup
bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install Python dependencies
pip install flask flask-cors numpy requests scikit-learn pickle5
AI Model Setup
bash
# Train or place your model
# Ensure ai_risk_agent.pkl is in backend directory
python train_model.py  # If training from scratch
🚀 Running the Application
1. Start Backend Server
bash
cd backend
python app.py
Backend runs on http://127.0.0.1:5000

2. Start Frontend Development Server
bash
# In new terminal, from root directory
npm run dev
Frontend runs on http://localhost:5173 (or similar)

3. Install Leather Wallet
Chrome Web Store: Leather Wallet

Create or import wallet

Switch to Testnet network

4. Get Testnet Tokens
bash
# Mint test tokens (via backend or directly)
curl -X POST http://127.0.0.1:5000/mint \
  -H "Content-Type: application/json" \
  -d '{"address": "YOUR_WALLET_ADDRESS", "amount": 1000}'
5. Start Using the DApp
Open browser at http://localhost:5173

Connect wallet

Browse products

Add to cart

Complete purchase

Test refunds (user)

Test approve/reject (admin)

✨ Features
✅ Completed Features
Feature	Status	x402 Integration
Wallet Connect	✅	Leather wallet for x402 payments
Product Catalog	✅	-
AI Risk Check	✅	Pre-402 decision making
HTTP 402 Response	✅	Core x402 standard
Single Payment	✅	Auto-release after 402 flow
Multi-item Hold	✅	Escrow after 402 payment
User Refund	✅	Contract call via wallet
Admin Approve	✅	Release held funds
Admin Reject	✅	Reject & refund
Payment Verification	✅	On-chain tx verification
Order History	✅	Persistent storage
Admin Dashboard	✅	View all orders
🚧 Coming Soon
Real contract order ID fetching

Transaction explorer links

Enhanced UI with Tailwind

Mobile responsive design

Multi-language support

🔐 Why This Is Different
Traditional E-commerce	This dApp
Email + phone required	🔑 Wallet only
Bank/card details	💰 Crypto escrow
Centralized user data	📦 No user database
Manual dispute handling	🤖 AI-assisted decisions
Platform trust required	🔒 Trustless smart contracts
Data sold to third parties	🛡️ Complete privacy
Identity exposed	🎭 Anonymous transactions
Custom payment flows	📋 Standardized x402
Key Differentiators:
Zero Personal Data - No emails, no phone numbers, no names

x402 Standard - HTTP 402 Payment Required implementation

AI-Powered Trust - Algorithm decides, not humans

Programmable Escrow - Funds release based on conditions

User Controlled - Refunds through smart contract

Transparent - All rules on-chain

🗺️ Future Roadmap
Phase 1 (Current)
✅ Basic escrow functionality

✅ AI risk assessment

✅ x402 HTTP 402 integration

✅ Multi-item support

✅ Admin controls

Phase 2 (Next)
🔄 Real contract order ID integration

🔄 Block explorer links

🔄 Email notifications (optional)

🔄 Enhanced analytics dashboard

Phase 3
📱 Mobile app

🔗 Multi-chain support

🤝 Seller registration

📊 Advanced fraud detection

Phase 4
🌐 Decentralized governance

🎯 AI model marketplace

💱 Multi-token support

🏪 Seller storefronts


Deployed Contracts: Testnet addresses above


Challenges Overcome:
Leather Wallet Integration - Fixed RPC parameter issues for x402 payments

HTTP 402 Implementation - Proper status code handling

Multi-item Order Handling - Sequential transaction processing

Admin Order Visibility - Global order dashboard

Persistent State - Local storage for order history

Why x402 Matters:
Standardizes web3 payments

Works with existing HTTP infrastructure

Wallet-agnostic

Future-proof design


<div align="center"> <h3>Built with ❤️ for the x402 Stacks Hackathon</h3> <p>February 2026</p> <p>📍 x402 Standard | AI Risk Engine | Smart Contract Escrow</p> </div>

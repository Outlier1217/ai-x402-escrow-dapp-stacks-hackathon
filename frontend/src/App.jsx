import { useState, useEffect } from "react";
import { uintCV, cvToHex } from "@stacks/transactions";
import "./App.css";

const CONTRACT_ADDRESS = "STXWF905DFSCWN77QNNWFHSFXPF73ZP02H05X5Q";
const CONTRACT_NAME = "escrow-v3";
const FULL_CONTRACT = "STXWF905DFSCWN77QNNWFHSFXPF73ZP02H05X5Q.escrow-v3";
const TOKEN_CONTRACT = "STXWF905DFSCWN77QNNWFHSFXPF73ZP02H05X5Q.usdcx-token-v2";
const ADMIN = "STXWF905DFSCWN77QNNWFHSFXPF73ZP02H05X5Q";

const products = [
  { id: 1, name: "Eminem Music", price: 0.5, icon: "🎵", category: "Digital" },
  { id: 2, name: "Quantum Book", price: 0.2, icon: "📚", category: "Book" },
  { id: 3, name: "Web3 Note", price: 0.3, icon: "📝", category: "Digital" },
  { id: 4, name: "Blockchain Note", price: 0.4, icon: "🔗", category: "Digital" },
  { id: 5, name: "Algebra Book", price: 0.6, icon: "📐", category: "Book" },
];

// Local storage key
const STORAGE_KEY = "escrow_orders";

function App() {
  const [address, setAddress] = useState(null);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [showCart, setShowCart] = useState(false);

  // =========================
  // LOAD ORDERS FROM STORAGE
  // =========================
  useEffect(() => {
    const savedOrders = localStorage.getItem(STORAGE_KEY);
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
  }, []);

  // =========================
  // SAVE ORDERS TO STORAGE
  // =========================
  const saveOrders = (newOrders) => {
    setOrders(newOrders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrders));
  };

  // =========================
  // CONNECT WALLET
  // =========================
  const connectWallet = async () => {
    if (!window.LeatherProvider) {
      alert("Leather wallet not found");
      return;
    }

    try {
      const response = await window.LeatherProvider.request("getAddresses");
      const stacksAddress = response.result.addresses.find(
        (a) => a.symbol === "STX"
      );
      setAddress(stacksAddress.address);
      
      // Fetch real orders from contract for this address
      await fetchUserOrders(stacksAddress.address);
      
    } catch (err) {
      console.error(err);
      setStatus("Wallet connection failed");
    }
  };

  // =========================
  // FETCH ORDERS FROM CONTRACT
  // =========================
  const fetchUserOrders = async (userAddress) => {
    try {
      setLoading(true);
      setStatus("Fetching your orders...");
      
      // Yeh Stacks blockchain se real orders fetch karega
      // Abhi ke liye local storage se dikha rahe hain
      const savedOrders = localStorage.getItem(STORAGE_KEY);
      if (savedOrders) {
        const allOrders = JSON.parse(savedOrders);
        setOrders(allOrders); // ✅ Sab orders store karo, filter mat karo
      }
      
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // =========================
  // ADD TO CART
  // =========================
  const addToCart = (product) => {
    setCart([...cart, product]);
    setShowCart(true);
  };

  // =========================
  // REMOVE FROM CART
  // =========================
  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  // =========================
  // BUY FUNCTION
  // =========================
  const buy = async () => {
    try {
      if (cart.length === 0) {
        setStatus("Cart is empty");
        return;
      }

      const total = cart.reduce((sum, p) => sum + p.price, 0);
      setStatus("AI checking...");

      const res = await fetch("http://127.0.0.1:5000/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_is_new: 0,
          order_amount: total,
          total_past_orders: 5,
          refunds_last_30_days: 0,
          account_age_days: 200,
          days_since_delivery: 0,
          dispute_opened: 0,
          cart_count: cart.length,
        }),
      });

      const data = await res.json();

      if (res.status !== 402) {
        setStatus("AI Decision: " + (data.status || data.reason || "Unknown"));
        return;
      }

      setStatus("Opening wallet...");

      if (cart.length > 1) {
        // Multiple items
        const orderIds = [];
        
        for (let i = 0; i < cart.length; i++) {
          const product = cart[i];
          const productAmount = Math.floor(product.price * 1_000_000);
          
          setStatus(`Processing item ${i+1}: ${product.name}`);
          
          const tx = await window.LeatherProvider.request("stx_callContract", {
            contract: FULL_CONTRACT,
            functionName: "deposit",
            functionArgs: [
              cvToHex(uintCV(product.id)),
              cvToHex(uintCV(productAmount)),
              cvToHex(uintCV(1)),
            ],
          });
          
          console.log(`TX for ${product.name}:`, tx);
          
          if (tx.error) {
            throw new Error(tx.error.message || "Transaction failed");
          }
          
          // Transaction se order ID nikal lo
          // Note: Actual contract se order ID lena hoga
          orderIds.push(Date.now() + i);
        }
        
        // Save order with all items
        const newOrder = {
          id: Date.now(),
          orderIds: orderIds,
          items: [...cart],
          status: "Hold",
          buyer: address,
          timestamp: new Date().toISOString(),
          txIds: orderIds.map((_, i) => `tx_${Date.now()}_${i}`)
        };
        
        const updatedOrders = [...orders, newOrder];
        saveOrders(updatedOrders);
        
      } else {
        // Single item
        const amountInMicro = Math.floor(total * 1_000_000);
        
        const tx = await window.LeatherProvider.request("stx_callContract", {
          contract: FULL_CONTRACT,
          functionName: "deposit",
          functionArgs: [
            cvToHex(uintCV(cart[0].id)),
            cvToHex(uintCV(amountInMicro)),
            cvToHex(uintCV(1)),
          ],
        });
        
        console.log("Transaction response:", tx);
        
        if (tx.error) {
          throw new Error(tx.error.message || "Transaction failed");
        }
        
        // Save order
        const newOrder = {
          id: Date.now(),
          orderId: Date.now(),
          items: [...cart],
          status: "Released",
          buyer: address,
          timestamp: new Date().toISOString(),
          txId: tx.result?.txid || `tx_${Date.now()}`
        };
        
        const updatedOrders = [...orders, newOrder];
        saveOrders(updatedOrders);
      }

      setCart([]);
      setShowCart(false);
      setStatus("Payment successful! 🎉");

    } catch (err) {
      console.error("Buy function error:", err);
      
      let errorMsg = "Transaction failed";
      if (err.message) {
        errorMsg = err.message;
      }
      if (err.error) {
        errorMsg += ": " + (err.error.message || JSON.stringify(err.error));
      }
      
      setStatus(errorMsg);
    }
  };

  // =========================
  // REFUND - ACTUAL CONTRACT CALL
  // =========================
  const refund = async (order) => {
    try {
      setStatus("Processing refund...");
      
      const tx = await window.LeatherProvider.request("stx_callContract", {
        contract: FULL_CONTRACT,
        functionName: "admin-reject",
        functionArgs: [
          cvToHex(uintCV(order.orderId || order.id)),
        ],
      });
      
      console.log("Refund TX:", tx);
      
      if (tx.error) {
        throw new Error(tx.error.message || "Refund failed");
      }
      
      // Update order status
      const updatedOrders = orders.map(o => 
        o.id === order.id ? { ...o, status: "Refunded" } : o
      );
      saveOrders(updatedOrders);
      
      setStatus("Refund successful! ✅");
      
    } catch (err) {
      console.error("Refund error:", err);
      setStatus("Refund failed: " + (err.message || "Unknown error"));
    }
  };

  // =========================
  // ADMIN APPROVE
  // =========================
  const adminApprove = async (order) => {
    try {
      setStatus("Approving order...");
      
      const tx = await window.LeatherProvider.request("stx_callContract", {
        contract: FULL_CONTRACT,
        functionName: "admin-release",
        functionArgs: [
          cvToHex(uintCV(order.orderId || order.id)),
        ],
      });
      
      console.log("Approve TX:", tx);
      
      if (tx.error) {
        throw new Error(tx.error.message || "Approval failed");
      }
      
      const updatedOrders = orders.map(o => 
        o.id === order.id ? { ...o, status: "Released" } : o
      );
      saveOrders(updatedOrders);
      
      setStatus("Order approved! ✅");
      
    } catch (err) {
      console.error("Approve error:", err);
      setStatus("Approval failed: " + (err.message || "Unknown error"));
    }
  };

  // =========================
  // ADMIN REJECT
  // =========================
  const adminReject = async (order) => {
    try {
      setStatus("Rejecting order...");
      
      const tx = await window.LeatherProvider.request("stx_callContract", {
        contract: FULL_CONTRACT,
        functionName: "admin-reject",
        functionArgs: [
          cvToHex(uintCV(order.orderId || order.id)),
        ],
      });
      
      console.log("Reject TX:", tx);
      
      if (tx.error) {
        throw new Error(tx.error.message || "Rejection failed");
      }
      
      const updatedOrders = orders.map(o => 
        o.id === order.id ? { ...o, status: "Rejected" } : o
      );
      saveOrders(updatedOrders);
      
      setStatus("Order rejected! ✅");
      
    } catch (err) {
      console.error("Reject error:", err);
      setStatus("Rejection failed: " + (err.message || "Unknown error"));
    }
  };

  // =========================
  // DISPLAY ORDERS BASED ON USER TYPE
  // =========================
  const isAdmin = address === ADMIN;
  
  // 🔥 FIX: Admin ke liye saare orders, user ke liye sirf apne
  const displayOrders = isAdmin 
    ? orders  // Admin ko saare orders dikho
    : orders.filter(o => o.buyer === address);  // User ko sirf apne

  // Group orders by status for admin view
  const holdOrders = displayOrders.filter(o => o.status === "Hold");
  const releasedOrders = displayOrders.filter(o => o.status === "Released");
  const refundedOrders = displayOrders.filter(o => o.status === "Refunded");
  const rejectedOrders = displayOrders.filter(o => o.status === "Rejected");

  const cartTotal = cart.reduce((sum, p) => sum + p.price, 0);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="logo">AI x402 Escrow</h1>
            <span className="badge">Beta</span>
          </div>
          
          <div className="header-actions">
            {address ? (
              <div className="wallet-info">
                <span className="wallet-address">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
                {isAdmin && (
                  <span className="admin-badge">Admin</span>
                )}
                <button 
                  className="cart-icon-button"
                  onClick={() => setShowCart(!showCart)}
                >
                  🛒
                  {cart.length > 0 && (
                    <span className="cart-badge">{cart.length}</span>
                  )}
                </button>
              </div>
            ) : (
              <button onClick={connectWallet} className="connect-wallet-btn">
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Products Section - Always Visible */}
        <section className="products-section">
          <div className="section-header">
            <h2>Digital Products</h2>
            <p className="section-subtitle">Discover our curated collection</p>
          </div>

          <div className="products-grid">
            {products.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-icon">{product.icon}</div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <span className="product-category">{product.category}</span>
                  <div className="product-price">{product.price} USDCx</div>
                </div>
                <button 
                  className="add-to-cart-btn"
                  onClick={() => address ? addToCart(product) : connectWallet()}
                >
                  {address ? 'Add to Cart' : 'Connect to Buy'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Cart Sidebar */}
        {showCart && address && (
          <div className="cart-sidebar">
            <div className="cart-header">
              <h3>Shopping Cart</h3>
              <button className="close-btn" onClick={() => setShowCart(false)}>×</button>
            </div>
            
            {cart.length === 0 ? (
              <div className="empty-cart">
                <span className="empty-cart-icon">🛒</span>
                <p>Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item, index) => (
                    <div key={index} className="cart-item">
                      <div className="cart-item-info">
                        <span className="cart-item-name">{item.name}</span>
                        <span className="cart-item-price">{item.price} USDCx</span>
                      </div>
                      <button 
                        className="remove-item"
                        onClick={() => removeFromCart(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="cart-footer">
                  <div className="cart-total">
                    <span>Total</span>
                    <span>{cartTotal} USDCx</span>
                  </div>
                  <div className="cart-actions">
                    <button onClick={buy} className="checkout-btn">
                      Checkout
                    </button>
                    <button onClick={() => setCart([])} className="clear-btn">
                      Clear
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Orders Section - Only when wallet connected */}
        {address && (
          <section className="orders-section">
            <div className="section-header">
              <h2>{isAdmin ? 'Admin Dashboard' : 'My Orders'}</h2>
            </div>

            {/* Admin View */}
            {isAdmin && (
              <div className="admin-dashboard">
                {/* Hold Orders - Priority */}
                {holdOrders.length > 0 && (
                  <div className="order-group">
                    <h3 className="order-group-title pending">
                      <span>⏳ Pending Approval</span>
                      <span className="order-count">{holdOrders.length}</span>
                    </h3>
                    <div className="orders-list">
                      {holdOrders.map((o) => (
                        <OrderCard 
                          key={o.id}
                          order={o}
                          isAdmin={true}
                          onApprove={adminApprove}
                          onReject={adminReject}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Orders Accordion */}
                <div className="order-accordion">
                  <details className="accordion-item">
                    <summary className="accordion-summary released">
                      ✅ Released Orders
                      <span className="order-count">{releasedOrders.length}</span>
                    </summary>
                    <div className="accordion-content">
                      {releasedOrders.map(o => (
                        <OrderCard key={o.id} order={o} isAdmin={true} />
                      ))}
                    </div>
                  </details>

                  <details className="accordion-item">
                    <summary className="accordion-summary refunded">
                      ↩️ Refunded Orders
                      <span className="order-count">{refundedOrders.length}</span>
                    </summary>
                    <div className="accordion-content">
                      {refundedOrders.map(o => (
                        <OrderCard key={o.id} order={o} isAdmin={true} />
                      ))}
                    </div>
                  </details>

                  <details className="accordion-item">
                    <summary className="accordion-summary rejected">
                      ❌ Rejected Orders
                      <span className="order-count">{rejectedOrders.length}</span>
                    </summary>
                    <div className="accordion-content">
                      {rejectedOrders.map(o => (
                        <OrderCard key={o.id} order={o} isAdmin={true} />
                      ))}
                    </div>
                  </details>
                </div>
              </div>
            )}

            {/* User View */}
            {!isAdmin && (
              <div className="user-orders">
                {loading && <div className="loading-spinner">Loading...</div>}
                
                {!loading && displayOrders.length === 0 && (
                  <div className="no-orders">
                    <span className="no-orders-icon">📦</span>
                    <p>No orders yet</p>
                  </div>
                )}
                
                <div className="orders-list">
                  {displayOrders.map((o) => (
                    <OrderCard 
                      key={o.id}
                      order={o}
                      isAdmin={false}
                      onRefund={refund}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Status Toast */}
        {status && (
          <div className={`status-toast ${status.includes('failed') ? 'error' : 'success'}`}>
            {status}
          </div>
        )}
      </main>
    </div>
  );
}

// =========================
// ORDER CARD COMPONENT
// =========================
function OrderCard({ order, isAdmin, onApprove, onReject, onRefund }) {
  const getStatusColor = (status) => {
    switch(status) {
      case 'Released': return '#10b981';
      case 'Hold': return '#f59e0b';
      case 'Refunded': return '#8b5cf6';
      case 'Rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="order-card">
      <div className="order-card-header">
        <div className="order-info">
          <span className="order-id">Order #{order.id}</span>
          {isAdmin && (
            <span className="buyer-address">
              Buyer: {order.buyer?.slice(0, 6)}...{order.buyer?.slice(-4)}
            </span>
          )}
        </div>
        <span 
          className="order-status"
          style={{ backgroundColor: getStatusColor(order.status) }}
        >
          {order.status}
        </span>
      </div>
      
      <div className="order-items">
        {order.items.map((item, i) => (
          <div key={i} className="order-item">
            <span>{item.name}</span>
            <span>{item.price} USDCx</span>
          </div>
        ))}
      </div>
      
      <div className="order-footer">
        <span className="order-date">
          {order.timestamp && new Date(order.timestamp).toLocaleDateString()}
        </span>
        
        <div className="order-actions">
          {/* User actions */}
          {!isAdmin && order.status === "Released" && (
            <button 
              onClick={() => onRefund(order)}
              className="action-btn refund"
            >
              Request Refund
            </button>
          )}

          {/* Admin actions */}
          {isAdmin && order.status === "Hold" && (
            <>
              <button 
                onClick={() => onApprove(order)}
                className="action-btn approve"
              >
                Approve
              </button>
              <button 
                onClick={() => onReject(order)}
                className="action-btn reject"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
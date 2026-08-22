// E-commerce Panel — 4.5 E-commerce (UI Shell)
import React, { useState } from "react";
import { useEcommerceStore, type PaymentProvider } from "../../store/ecommerceStore";
import "../panels/PanelStyles.css";

const EcommercePanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const products = useEcommerceStore((s) => s.products);
  const cart = useEcommerceStore((s) => s.cart);
  const paymentProvider = useEcommerceStore((s) => s.paymentProvider);
  const currency = useEcommerceStore((s) => s.currency);
  const addProduct = useEcommerceStore((s) => s.addProduct);
  const deleteProduct = useEcommerceStore((s) => s.deleteProduct);
  const setPaymentProvider = useEcommerceStore((s) => s.setPaymentProvider);
  const stripePublicKey = useEcommerceStore((s) => s.stripePublicKey);
  const setStripePublicKey = useEcommerceStore((s) => s.setStripePublicKey);
  const setCurrency = useEcommerceStore((s) => s.setCurrency);
  const getCartTotal = useEcommerceStore((s) => s.getCartTotal);
  const addToCart = useEcommerceStore((s) => s.addToCart);
  const clearCart = useEcommerceStore((s) => s.clearCart);

  const [activeTab, setActiveTab] = useState<"products" | "settings" | "orders">("products");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", description: "", price: 0, category: "" });

  const handleAddProduct = () => {
    if (!newProduct.name.trim()) return;
    addProduct({
      name: newProduct.name,
      description: newProduct.description,
      price: newProduct.price,
      currency,
      images: [],
      category: newProduct.category || "General",
      inStock: true,
    });
    setNewProduct({ name: "", description: "", price: 0, category: "" });
    setShowAddProduct(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price);
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel-modal panel-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-header__title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            E-commerce
            {cart.length > 0 && <span className="panel-badge">{cart.length} items</span>}
          </div>
          <button className="panel-close-btn" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding: "8px 20px 0" }}>
          <div className="panel-tabs">
            {(["products", "settings", "orders"] as const).map((tab) => (
              <button key={tab} className={`panel-tab ${activeTab === tab ? "panel-tab--active" : ""}`} onClick={() => setActiveTab(tab)}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-body">
          {activeTab === "products" && (
            <>
              <div className="panel-row panel-row--between" style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: "#8888a8" }}>{products.length} products</span>
                <button className="panel-btn panel-btn--primary panel-btn--small" onClick={() => setShowAddProduct(!showAddProduct)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Product
                </button>
              </div>

              {showAddProduct && (
                <div className="panel-card" style={{ marginBottom: 16 }}>
                  <div className="panel-grid panel-grid--2col">
                    <div className="panel-form-group">
                      <label className="panel-label">Product Name</label>
                      <input className="panel-input" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Product name"/>
                    </div>
                    <div className="panel-form-group">
                      <label className="panel-label">Price</label>
                      <input className="panel-input" type="number" step="0.01" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}/>
                    </div>
                  </div>
                  <div className="panel-form-group">
                    <label className="panel-label">Description</label>
                    <textarea className="panel-input panel-textarea" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} rows={2}/>
                  </div>
                  <div className="panel-row" style={{ gap: 8 }}>
                    <button className="panel-btn panel-btn--primary panel-btn--small" onClick={handleAddProduct}>Add</button>
                    <button className="panel-btn panel-btn--small" onClick={() => setShowAddProduct(false)}>Cancel</button>
                  </div>
                </div>
              )}

              <div className="panel-grid panel-grid--3col">
                {products.map((product) => (
                  <div key={product.id} className="product-card">
                    <div className="product-card__image">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                    </div>
                    <div className="product-card__body">
                      <div className="product-card__name">{product.name}</div>
                      <div className="product-card__price">{formatPrice(product.price)}</div>
                      <div className={`product-card__stock ${product.inStock ? "" : ""}`}>
                        <span className={`panel-badge ${product.inStock ? "panel-badge--success" : "panel-badge--danger"}`}>
                          {product.inStock ? "In Stock" : "Out of Stock"}
                        </span>
                      </div>
                      <div className="panel-row" style={{ gap: 4, marginTop: 8 }}>
                        <button className="panel-btn panel-btn--small" onClick={() => addToCart(product.id)}>Add to Cart</button>
                        <button className="panel-btn panel-btn--small panel-btn--icon panel-btn--danger" onClick={() => deleteProduct(product.id)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === "settings" && (
            <div className="panel-section">
              <div className="panel-form-group">
                <label className="panel-label">Payment Provider</label>
                <select className="panel-select" value={paymentProvider} onChange={(e) => setPaymentProvider(e.target.value as PaymentProvider)}>
                  <option value="none">Select Provider</option>
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
              {paymentProvider === "stripe" && (
                <div className="panel-form-group">
                  <label className="panel-label">Stripe Publishable Key</label>
                  <input className="panel-input" value={stripePublicKey} onChange={(e) => setStripePublicKey(e.target.value)} placeholder="pk_test_..." type="password"/>
                </div>
              )}
              <div className="panel-form-group">
                <label className="panel-label">Currency</label>
                <select className="panel-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="panel-section">
              <div className="panel-section__title">Shopping Cart</div>
              {cart.length === 0 ? (
                <div className="panel-empty">
                  <div className="panel-empty__title">Cart Empty</div>
                  <div className="panel-empty__desc">Add products to the cart from the Products tab.</div>
                </div>
              ) : (
                <>
                  {cart.map((item) => {
                    const product = products.find((p) => p.id === item.productId);
                    if (!product) return null;
                    return (
                      <div key={`${item.productId}-${item.variantId}`} className="panel-list-item">
                        <span style={{ fontSize: 13, color: "#e4e4f0", flex: 1 }}>{product.name}</span>
                        <span style={{ fontSize: 12, color: "#8888a8" }}>×{item.quantity}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#10b981" }}>{formatPrice(product.price * item.quantity)}</span>
                      </div>
                    );
                  })}
                  <div className="panel-divider" />
                  <div className="panel-row panel-row--between">
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#e4e4f0" }}>Total</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#10b981" }}>{formatPrice(getCartTotal())}</span>
                  </div>
                  <div className="panel-row" style={{ gap: 8, marginTop: 12 }}>
                    <button className="panel-btn panel-btn--primary" style={{ flex: 1, justifyContent: "center" }}>Checkout</button>
                    <button className="panel-btn panel-btn--danger" onClick={clearCart}>Clear</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EcommercePanel;

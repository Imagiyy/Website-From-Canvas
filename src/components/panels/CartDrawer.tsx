import React, { useState } from "react";
import { useEcommerceStore } from "../../store/ecommerceStore";
import "./PanelStyles.css";

export const CartDrawer: React.FC = () => {
  const {
    cart,
    products,
    isCartOpen,
    closeCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemCount,
    currency,
  } = useEcommerceStore();

  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  if (!isCartOpen) return null;

  const total = getCartTotal();
  const count = getCartItemCount();

  const handleCheckout = () => {
    setCheckoutSuccess(true);
    setTimeout(() => {
      clearCart();
      setCheckoutSuccess(false);
      closeCart();
    }, 2000);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
        zIndex: 2000,
        display: "flex",
        justifyContent: "flex-end",
        animation: "panelFadeIn 0.2s ease",
      }}
      onClick={closeCart}
    >
      <div
        style={{
          width: "400px",
          maxWidth: "90vw",
          height: "100%",
          background: "#16162a",
          borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-12px 0 40px rgba(0,0,0,0.5)",
          color: "#e4e4f0",
          animation: "panelSlideLeft 0.25s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18, fontWeight: 700 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            Shopping Cart ({count})
          </div>
          <button
            onClick={closeCart}
            style={{
              background: "transparent",
              border: "none",
              color: "#8888a8",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {checkoutSuccess ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#10b981" }}>Order Placed!</div>
              <div style={{ fontSize: 13, color: "#a0a0c0" }}>Thank you for testing the e-commerce checkout workflow.</div>
            </div>
          ) : cart.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center", color: "#8888a8" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: 12, opacity: 0.5 }}>
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: "#c0c0d8" }}>Your cart is empty</div>
              <div style={{ fontSize: 12 }}>Add product elements from the canvas or E-commerce panel.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {cart.map((item) => {
                const prod = products.find((p) => p.id === item.productId);
                if (!prod) return null;
                const variant = prod.variants?.find((v) => v.id === item.variantId);
                const price = variant?.price ?? prod.price;

                return (
                  <div
                    key={`${item.productId}-${item.variantId || ""}`}
                    style={{
                      background: "#1e1e36",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      borderRadius: 12,
                      padding: 12,
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        background: "#2a2a4a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#8b5cf6",
                        fontWeight: 700,
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    >
                      {prod.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {prod.name}
                      </div>
                      {variant && <div style={{ fontSize: 11, color: "#8888a8" }}>{variant.name}</div>}
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981", marginTop: 2 }}>
                        ${price.toFixed(2)}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#141424", borderRadius: 6, padding: "2px 6px" }}>
                      <button
                        onClick={() => updateCartQuantity(item.productId, item.quantity - 1, item.variantId)}
                        style={{ background: "none", border: "none", color: "#c0c0d8", cursor: "pointer", fontSize: 14, width: 20 }}
                      >
                        -
                      </button>
                      <span style={{ fontSize: 12, fontWeight: 600, minWidth: 16, textAlign: "center" }}>{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.productId, item.quantity + 1, item.variantId)}
                        style={{ background: "none", border: "none", color: "#c0c0d8", cursor: "pointer", fontSize: 14, width: 20 }}
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId, item.variantId)}
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && !checkoutSuccess && (
          <div style={{ padding: 20, borderTop: "1px solid rgba(255, 255, 255, 0.08)", background: "#1a1a2e" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 15 }}>
              <span style={{ color: "#a0a0c0" }}>Subtotal</span>
              <span style={{ fontWeight: 700, color: "#10b981", fontSize: 18 }}>${total.toFixed(2)} {currency}</span>
            </div>
            <button
              onClick={handleCheckout}
              style={{
                width: "100%",
                padding: "12px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#ffffff",
                border: "none",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
              }}
            >
              Proceed to Checkout (${total.toFixed(2)})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

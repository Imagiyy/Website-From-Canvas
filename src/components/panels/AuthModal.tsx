// Auth Modal — 3.6 Backend & Auth (UI Shell)
import React, { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import "../panels/PanelStyles.css";

const AuthModal: React.FC = () => {
  const isOpen = useAuthStore((s) => s.isAuthModalOpen);
  const authMode = useAuthStore((s) => s.authMode);
  const isLoading = useAuthStore((s) => s.isLoading);
  const closeAuthModal = useAuthStore((s) => s.closeAuthModal);
  const setAuthMode = useAuthStore((s) => s.setAuthMode);
  const loginWithEmail = useAuthStore((s) => s.loginWithEmail);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const signup = useAuthStore((s) => s.signup);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === "login") {
      await loginWithEmail(email, password);
    } else {
      await signup(name, email, password);
    }
  };

  return (
    <div className="panel-overlay" onClick={closeAuthModal}>
      <div className="panel-modal panel-modal--narrow" onClick={(e) => e.stopPropagation()}>
        <div className="auth-form">
          <div className="auth-form__logo">
            <div className="auth-form__logo-text">CanvasSite</div>
            <p style={{ fontSize: 13, color: "#8888a8", marginTop: 4 }}>
              {authMode === "login" ? "Welcome back! Sign in to continue." : "Create your account to get started."}
            </p>
          </div>

          <button className="auth-google-btn" onClick={loginWithGoogle} disabled={isLoading}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <div className="auth-form__divider">or</div>

          <form onSubmit={handleSubmit}>
            {authMode === "signup" && (
              <div className="panel-form-group">
                <label className="panel-label">Name</label>
                <input className="panel-input" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div className="panel-form-group">
              <label className="panel-label">Email</label>
              <input className="panel-input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="panel-form-group">
              <label className="panel-label">Password</label>
              <input className="panel-input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="panel-btn panel-btn--primary" type="submit" disabled={isLoading} style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
              {isLoading ? <div className="panel-spinner" /> : authMode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="auth-switch">
            {authMode === "login" ? (
              <>Don't have an account? <a onClick={() => setAuthMode("signup")}>Sign up</a></>
            ) : (
              <>Already have an account? <a onClick={() => setAuthMode("login")}>Sign in</a></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;

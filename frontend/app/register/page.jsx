"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import axios from "../../utils/axios";
import { useAuth } from "@/context/AuthContext";
import "../../styles/global.css";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Prevent logged-in users from seeing the register page
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    
    try {
      await axios.post("/register/", { username, email, password });
      setMessage({ type: "success", text: "Registration successful! Redirecting to login..." });
      
      setUsername("");
      setEmail("");
      setPassword("");
      
      setTimeout(() => {
        router.push("/login?message=Registration successful! Please log in.");
      }, 2000);
      
    } catch (err) {
      console.error(err);
      const data = err.response?.data;
      
      let apiMessage =
        data?.message ||
        data?.detail ||
        (Array.isArray(data?.non_field_errors) ? data.non_field_errors[0] : null);
        
      if (!apiMessage && data && typeof data === "object") {
        const firstKey = Object.keys(data)[0];
        if (firstKey && Array.isArray(data[firstKey])) {
          apiMessage = `${firstKey.charAt(0).toUpperCase() + firstKey.slice(1)}: ${data[firstKey][0]}`;
        } else if (firstKey && typeof data[firstKey] === "string") {
          apiMessage = data[firstKey];
        }
      }
      
      setMessage({ 
        type: "error", 
        text: apiMessage || "Registration failed. Please try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Checking authentication status..." />;
  }

  return (
    <div className="auth-container">
      
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join us today and start your journey</p>
        </div>

        {message && (
          <div className={`auth-message ${message.type}`}>
            <div className="auth-message-icon">
              {message.type === "success" ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : message.type === "error" ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              )}
            </div>
            <div className="auth-message-text">{message.text}</div>
          </div>
        )}

        <form onSubmit={handleRegister} className="auth-form">
          <div className="auth-input-group">
            <label htmlFor="username" className="auth-label">Username</label>
            <div className="auth-input-wrapper">
              <input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="auth-input"
                required
                minLength={3}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label htmlFor="email" className="auth-label">Email</label>
            <div className="auth-input-wrapper">
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label htmlFor="password" className="auth-label">Password</label>
            <div className="auth-input-wrapper">
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>
            <p className="auth-hint">Must be at least 6 characters</p>
          </div>

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? (
              <span className="auth-spinner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="2" x2="12" y2="6"></line>
                  <line x1="12" y1="18" x2="12" y2="22"></line>
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                  <line x1="2" y1="12" x2="6" y2="12"></line>
                  <line x1="18" y1="12" x2="22" y2="12"></line>
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                </svg>
              </span>
            ) : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-footer-text">
            Already have an account? <Link href="/login" className="auth-link">Log in here</Link>
          </p>
        </div>
      </div>

      {/* Styled JSX (same design as login page) */}
      <style jsx>{`
        .auth-container {
          min-height: calc(100vh - 70px);
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #0a0a0a;
          position: relative;
          overflow: hidden;
          padding: 24px;
          font-family: 'DM Sans', sans-serif;
        }

        .auth-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 440px;
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 24px;
          padding: 40px 32px;
          box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
          animation: cardSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes cardSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .auth-title {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #f0f0f3;
          margin: 0 0 8px;
          letter-spacing: -0.5px;
        }

        .auth-subtitle {
          font-size: 14px;
          color: #888896;
          margin: 0;
        }

        .auth-message {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 13px;
          line-height: 1.5;
          animation: messageFadeIn 0.3s ease forwards;
        }

        @keyframes messageFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .auth-message-icon {
          flex-shrink: 0;
          width: 18px;
          height: 18px;
          margin-top: 1px;
        }

        .auth-message.success {
          background: rgba(110, 231, 183, 0.1);
          border: 1px solid rgba(110, 231, 183, 0.2);
          color: #6EE7B7;
        }

        .auth-message.error {
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.2);
          color: #f87171;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .auth-input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .auth-label {
          font-size: 12px;
          font-weight: 600;
          color: #a0a0ab;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .auth-hint {
          font-size: 11px;
          color: #5c5c6e;
          margin: 0;
          margin-top: 2px;
        }

        .auth-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .auth-input {
          width: 100%;
          background: rgba(10, 10, 12, 0.5);
          border: 1px solid #1e1e24;
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 14px;
          color: #f0f0f3;
          font-family: inherit;
          transition: all 0.2s;
          outline: none;
        }

        .auth-input::placeholder {
          color: #5c5c6e;
        }

        .auth-input:hover {
          background: rgba(20, 20, 24, 0.8);
          border-color: #2a2a32;
        }

        .auth-input:focus {
          background: rgba(15, 15, 18, 0.9);
          border-color: #6EE7B7;
          box-shadow: 0 0 0 4px rgba(110, 231, 183, 0.1);
        }

        .auth-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-button {
          margin-top: 8px;
          width: 100%;
          padding: 16px;
          border-radius: 100px;
          background: #6EE7B7;
          border: 1px solid #4fb88b;
          color: #0c0c0f;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .auth-button:hover:not(:disabled) {
          transform: translateY(-2px);
          background: #86efac;
          border-color: #3a9e75;
          box-shadow: 0 8px 20px rgba(110, 231, 183, 0.3);
        }

        .auth-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .auth-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          box-shadow: none;
        }

        .auth-spinner {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .auth-spinner svg {
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        .auth-footer {
          margin-top: 32px;
          text-align: center;
        }

        .auth-footer-text {
          font-size: 14px;
          color: #888896;
        }

        .auth-link {
          color: #6EE7B7;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }

        .auth-link:hover {
          color: #a7f3d0;
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        @media (max-width: 480px) {
          .auth-card {
            padding: 32px 24px;
            border-radius: 20px;
          }
          .auth-nav {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}

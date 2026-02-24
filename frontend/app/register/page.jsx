"use client";

import { useState } from "react";
import api from "../../utils/axios";
import "../../styles/global.css";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    
    try {
      await api.post("/register/", { username, email, password });
      setMessage({ type: "success", text: "Registration successful! You can now login." });
      setUsername("");
      setEmail("");
      setPassword("");
    } catch (err) {
      console.error(err);
      setMessage({ 
        type: "error", 
        text: err.response?.data?.message || "Registration failed. Please try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      {/* Animated background blobs */}
      <div className="blob blob1"></div>
      <div className="blob blob2"></div>
      <div className="blob blob3"></div>
      
      <div className="register-card">
        <div className="register-header">
          <h1 className="register-title">Create Account</h1>
          <p className="register-subtitle">Join us today and start your journey</p>
        </div>

        <form onSubmit={handleRegister} className="register-form">
          <div className="register-input-group">
            <label htmlFor="username" className="register-label">
              Username
            </label>
            <div className="register-input-wrapper">
              <svg className="register-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input
                id="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="register-input"
                required
                minLength={3}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="register-input-group">
            <label htmlFor="email" className="register-label">
              Email
            </label>
            <div className="register-input-wrapper">
              <svg className="register-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="register-input"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="register-input-group">
            <label htmlFor="password" className="register-label">
              Password
            </label>
            <div className="register-input-wrapper">
              <svg className="register-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="register-input"
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>
            <p className="register-hint">Password must be at least 6 characters long</p>
          </div>

          <button 
            type="submit" 
            className="register-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="register-loader"></span>
            ) : (
              "Sign Up"
            )}
          </button>

          {message && (
            <div className={`register-message ${message.type}`}>
              <svg className="register-message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {message.type === "success" ? (
                  <path d="M20 6L9 17l-5-5" />
                ) : (
                  <circle cx="12" cy="12" r="10" />
                )}
              </svg>
              {message.text}
            </div>
          )}
        </form>

        <p className="register-login-link">
          Already have an account? <a href="/login">Log in</a>
        </p>
      </div>


    </div>
  );
}
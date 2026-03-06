"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "../../utils/axios";
import { useAuth } from "@/context/AuthContext"; // Add this import
import "../../styles/global.css";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth(); // Add this line
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Get redirect URL and message from query parameters
  const redirectUrl = searchParams.get('redirect') || '/'; // Changed from /posts to /
  const messageText = searchParams.get('message');

  // Show message from URL if present
  useEffect(() => {
    if (messageText) {
      setMessage({ type: "info", text: messageText });
    }
  }, [messageText]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(""); 

    try {
      const res = await axios.post("/token/", { username, password });
      
      // Use auth context to login (this will update navbar immediately)
      await login(res.data);
      
      setMessage({ type: "success", text: "Login successful!" });

      // Clear form
      setUsername("");
      setPassword("");

      // Redirect to dashboard or stored URL
      console.log("Redirecting to:", redirectUrl);
      router.push(redirectUrl);
      
    } catch (err) {
      console.error(err);
      setMessage({ 
        type: "error", 
        text: err.response?.data?.message || "Login failed. Please try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="blob blob1"></div>
      <div className="blob blob2"></div>
      <div className="blob blob3"></div>

      <div className="register-card">
        <div className="register-header">
          <h1 className="register-title">Welcome Back</h1>
          <p className="register-subtitle">Login to your account</p>
        </div>

        <form onSubmit={handleLogin} className="register-form">
          <div className="register-input-group">
            <label htmlFor="username" className="register-label">Username</label>
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
            <label htmlFor="password" className="register-label">Password</label>
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
          </div>

          <button type="submit" className="register-button" disabled={isLoading}>
            {isLoading ? <span className="register-loader"></span> : "Login"}
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
          Don't have an account? <Link href="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
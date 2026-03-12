"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "@/utils/axios";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'profile';
  
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (passwordData.new_password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await axios.post("/users/change-password/", {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      
      setMessage({ type: "success", text: "Password changed successfully!" });
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      setMessage({ 
        type: "error", 
        text: err.response?.data?.detail || "Failed to change password" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }
    
    setLoading(true);
    try {
      await axios.delete("/users/me/");
      logout();
      router.push("/");
    } catch (err) {
      setMessage({ type: "error", text: "Failed to delete account" });
    } finally {
      setLoading(false);
    }
  };

  const isActive = (path, tab = null) => {
    if (tab) {
      return pathname === path && currentTab === tab;
    }
    return pathname === path;
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        {/* Header */}
        <div className="settings-header">
          <div>
            <div className="settings-eyebrow">
              <span className="settings-eyebrow-dot" />
              <span className="settings-eyebrow-label">Account</span>
            </div>
            <h1 className="settings-title">Settings</h1>
            <p className="settings-subtitle">Manage your account settings and preferences</p>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`settings-message ${message.type}`}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              {message.type === "success" ? (
                <polyline points="20 6 9 17 4 12" />
              ) : (
                <circle cx="12" cy="12" r="10" />
              )}
            </svg>
            {message.text}
          </div>
        )}

        {/* Main Content */}
        <div className="settings-content">
          {/* Sidebar */}
          <div className="settings-sidebar">
            <div className="profile-avatar-section">
              <div className="profile-avatar-large">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </div>
              <h2 className="profile-username">{user?.username}</h2>
              <p className="profile-email">{user?.email}</p>
            </div>

            {/* Navigation */}
            <nav className="profile-nav">
              <Link 
                href="/profile?tab=profile" 
                className={`profile-nav-item ${isActive('/profile', 'profile') ? "active" : ""}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Profile</span>
              </Link>
              
              <Link 
                href="/profile?tab=activity" 
                className={`profile-nav-item ${isActive('/profile', 'activity') ? "active" : ""}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Activity</span>
              </Link>
              
              <Link 
                href="/settings" 
                className={`profile-nav-item ${isActive('/settings') ? "active" : ""}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H5.78a1.65 1.65 0 0 0-1.51 1 1.65 1.65 0 0 0 .33 1.82l.09.1A10 10 0 0 0 12 17.66a10 10 0 0 0 6.22-2.46l.09-.1z" />
                </svg>
                <span>Settings</span>
              </Link>
            </nav>

            <div className="profile-nav-footer">
              <button onClick={logout} className="profile-logout-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="settings-main">
            {/* Password Change Section */}
            <div className="settings-card">
              <h3 className="settings-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Change Password
              </h3>
              <p className="settings-description">
                Update your password to keep your account secure
              </p>

              <form onSubmit={handleChangePassword} className="settings-form">
                <div className="settings-form-group">
                  <label htmlFor="current_password">Current Password</label>
                  <input
                    type="password"
                    id="current_password"
                    name="current_password"
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    placeholder="Enter your current password"
                    className="settings-input"
                    required
                  />
                </div>

                <div className="settings-form-row">
                  <div className="settings-form-group">
                    <label htmlFor="new_password">New Password</label>
                    <input
                      type="password"
                      id="new_password"
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      className="settings-input"
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="settings-form-group">
                    <label htmlFor="confirm_password">Confirm Password</label>
                    <input
                      type="password"
                      id="confirm_password"
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      className="settings-input"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="settings-form-actions">
                  <button 
                    type="submit" 
                    className="settings-save-btn" 
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>

            {/* Danger Zone */}
            <div className="settings-card settings-card-danger">
              <h3 className="settings-card-title settings-title-danger">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Danger Zone
              </h3>
              <p className="settings-description settings-description-danger">
                Irreversible actions that will affect your account
              </p>

              <div className="settings-danger-item">
                <div className="settings-danger-info">
                  <h4>Delete Account</h4>
                  <p>Permanently delete your account and all associated data</p>
                </div>
                <button 
                  onClick={handleDeleteAccount}
                  className="settings-delete-btn"
                  disabled={loading}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .settings-page {
          min-height: 100vh;
          background: #0a0a0a;
          font-family: 'DM Sans', sans-serif;
          padding: 2rem;
        }

        .settings-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        /* Header */
        .settings-header {
          margin-bottom: 2rem;
        }

        .settings-eyebrow {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .settings-eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6EE7B7;
        }

        .settings-eyebrow-label {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #6EE7B7;
        }

        .settings-title {
          font-family: 'Syne', sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.25rem 0;
          letter-spacing: -0.02em;
        }

        .settings-subtitle {
          color: #888;
          margin: 0;
          font-size: 1rem;
        }

        /* Message */
        .settings-message {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          animation: slideIn 0.3s ease;
        }

        .settings-message.success {
          background: rgba(34,197,94,0.1);
          border: 1px solid rgba(34,197,94,0.2);
          color: #4ade80;
        }

        .settings-message.error {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.2);
          color: #f87171;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Main Content Layout */
        .settings-content {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 2rem;
        }

        /* Sidebar */
        .settings-sidebar {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 1.5rem;
          height: fit-content;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .profile-avatar-section {
          text-align: center;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .profile-avatar-large {
          width: 100px;
          height: 100px;
          margin: 0 auto 1rem;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
          border: 3px solid rgba(255,255,255,0.1);
        }

        .profile-username {
          font-size: 1.2rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 0.25rem 0;
        }

        .profile-email {
          font-size: 0.85rem;
          color: #888;
          margin: 0;
        }

        /* Navigation - Same as Profile Page */
        .profile-nav {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .profile-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: #888;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          width: 100%;
          text-decoration: none;
        }

        .profile-nav-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }

        .profile-nav-item.active {
          background: rgba(110, 231, 183, 0.1);
          color: #6EE7B7;
          border-left: 2px solid #6EE7B7;
        }

        .profile-nav-item.active svg {
          stroke: #6EE7B7;
        }

        .profile-nav-item svg {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
          stroke: currentColor;
          transition: stroke 0.2s ease;
        }

        .profile-nav-footer {
          margin-top: auto;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        .profile-logout-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.2);
          border-radius: 8px;
          color: #f87171;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          text-decoration: none;
        }

        .profile-logout-btn:hover {
          background: rgba(248, 113, 113, 0.15);
          border-color: rgba(248, 113, 113, 0.3);
        }

        .profile-logout-btn svg {
          stroke: #f87171;
        }

        /* Main Content */
        .settings-main {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .settings-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 1.5rem;
        }

        .settings-card-danger {
          border-color: rgba(248,113,113,0.2);
        }

        .settings-card-title {
          display: flex;
          align-items: center;
          font-family: 'Syne', sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 0.5rem 0;
        }

        .settings-title-danger {
          color: #f87171;
        }

        .settings-description {
          color: #888;
          font-size: 0.85rem;
          margin: 0 0 1.5rem 0;
        }

        .settings-description-danger {
          color: rgba(248,113,113,0.8);
        }

        /* Form Styles */
        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .settings-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .settings-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .settings-form-group label {
          font-size: 0.85rem;
          font-weight: 500;
          color: rgba(255,255,255,0.8);
        }

        .settings-input {
          width: 100%;
          padding: 0.6rem 1rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #fff;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.2s ease;
        }

        .settings-input:focus {
          border-color: #6EE7B7;
          background: rgba(255,255,255,0.08);
        }

        .settings-form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 1rem;
        }

        .settings-save-btn {
          padding: 0.6rem 1.5rem;
          background: #6EE7B7;
          border: none;
          border-radius: 8px;
          color: #0c0c0f;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .settings-save-btn:hover {
          background: #86efac;
          transform: translateY(-2px);
        }

        .settings-save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        /* Danger Zone */
        .settings-danger-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem;
          background: rgba(248,113,113,0.02);
          border: 1px solid rgba(248,113,113,0.1);
          border-radius: 8px;
        }

        .settings-danger-info h4 {
          font-size: 0.95rem;
          font-weight: 600;
          color: #f87171;
          margin: 0 0 0.25rem 0;
        }

        .settings-danger-info p {
          font-size: 0.8rem;
          color: #888;
          margin: 0;
        }

        .settings-delete-btn {
          padding: 0.5rem 1rem;
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.3);
          border-radius: 8px;
          color: #f87171;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .settings-delete-btn:hover {
          background: rgba(248,113,113,0.15);
          border-color: #f87171;
        }

        .settings-delete-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .settings-page {
            padding: 1rem;
          }

          .settings-content {
            grid-template-columns: 1fr;
          }

          .settings-form-row {
            grid-template-columns: 1fr;
          }

          .settings-danger-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .settings-delete-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
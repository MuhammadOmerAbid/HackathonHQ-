"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "@/utils/axios";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isJudge, isOrganizer, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "profile");
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    organization_name: "",
  });
  const [stats, setStats] = useState({
    teams: 0,
    submissions: 0,
    feedback_given: 0,
    member_since: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/profile");
      return;
    }
    fetchProfileData();
  }, [user]);

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || "profile");
  }, [searchParams]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      const userRes = await axios.get("/users/me/");
      const userData = userRes.data;
      
      setProfileData({
        username: userData.username || "",
        email: userData.email || "",
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        organization_name: userData.profile?.organization_name || "",
      });

      try {
        const teamsRes = await axios.get("/teams/");
        const userTeams = teamsRes.data.results?.filter(
          team => team.members?.some(m => m.id === userData.id)
        ) || [];
        
        const submissionsRes = await axios.get("/submissions/");
        const userSubmissions = submissionsRes.data.results?.filter(
          sub => sub.team?.members?.some(m => m.id === userData.id)
        ) || [];

        const feedbackRes = await axios.get("/feedback/");
        const userFeedback = feedbackRes.data.results?.filter(
          fb => fb.judge === userData.id
        ) || [];

        setStats({
          teams: userTeams.length,
          submissions: userSubmissions.length,
          feedback_given: userFeedback.length,
          member_since: userData.date_joined 
            ? new Date(userData.date_joined).toLocaleDateString("en-US", { 
                month: "long", year: "numeric" 
              })
            : "Recently",
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      }

    } catch (err) {
      console.error("Error fetching profile:", err);
      setMessage({ type: "error", text: "Failed to load profile" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      await axios.patch("/users/me/", {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
      });

      setMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setMessage({ 
        type: "error", 
        text: err.response?.data?.detail || "Failed to update profile" 
      });
    } finally {
      setSaving(false);
    }
  };

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

    setSaving(true);
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
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }
    
    setSaving(true);
    try {
      await axios.delete("/users/me/");
      logout();
      router.push("/");
    } catch (err) {
      setMessage({ type: "error", text: "Failed to delete account" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="profile-spinner" />
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <div>
            <div className="profile-eyebrow">
              <span className="profile-eyebrow-dot" />
              <span className="profile-eyebrow-label">Account</span>
            </div>
            <h1 className="profile-title">My Profile</h1>
            <p className="profile-subtitle">Manage your account, activity, and settings</p>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`profile-message ${message.type}`}>
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
        <div className="profile-content">
          {/* Sidebar */}
          <div className="profile-sidebar">
            <div className="profile-avatar-section">
              <div className="profile-avatar-large">
                {profileData.username?.charAt(0).toUpperCase() || "U"}
              </div>
              <h2 className="profile-username">{profileData.username}</h2>
              <div className="profile-badges">
                {isJudge && <span className="profile-badge judge">Judge</span>}
                {isOrganizer && <span className="profile-badge organizer">Organizer</span>}
                {!isJudge && !isOrganizer && <span className="profile-badge participant">Participant</span>}
              </div>
              <p className="profile-member-since">Member since {stats.member_since}</p>
            </div>

            <div className="profile-stats-grid">
              <div className="profile-stat-item">
                <span className="profile-stat-value">{stats.teams}</span>
                <span className="profile-stat-label">Teams</span>
              </div>
              <div className="profile-stat-item">
                <span className="profile-stat-value">{stats.submissions}</span>
                <span className="profile-stat-label">Submissions</span>
              </div>
              {isJudge && (
                <div className="profile-stat-item">
                  <span className="profile-stat-value">{stats.feedback_given}</span>
                  <span className="profile-stat-label">Feedbacks</span>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="profile-nav">
              <button
                onClick={() => {
                  setActiveTab("profile");
                  router.push("/profile?tab=profile");
                }}
                className={`profile-nav-item ${activeTab === "profile" ? "active" : ""}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Profile</span>
              </button>
              
              <button
                onClick={() => {
                  setActiveTab("activity");
                  router.push("/profile?tab=activity");
                }}
                className={`profile-nav-item ${activeTab === "activity" ? "active" : ""}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Activity</span>
              </button>
              
              <button
                onClick={() => {
                  setActiveTab("settings");
                  router.push("/profile?tab=settings");
                }}
                className={`profile-nav-item ${activeTab === "settings" ? "active" : ""}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H5.78a1.65 1.65 0 0 0-1.51 1 1.65 1.65 0 0 0 .33 1.82l.09.1A10 10 0 0 0 12 17.66a10 10 0 0 0 6.22-2.46l.09-.1z" />
                </svg>
                <span>Settings</span>
              </button>
            </nav>

            <div className="profile-nav-footer">
              <button onClick={handleLogout} className="profile-logout-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>

          {/* Main Content Area - Reusing same card structure for all tabs */}
          <div className="profile-main">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="profile-card">
                <h3 className="profile-card-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Personal Information
                </h3>
                <form onSubmit={handleSaveProfile} className="profile-form">
                  <div className="profile-form-row">
                    <div className="profile-form-group">
                      <label htmlFor="first_name">First Name</label>
                      <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={profileData.first_name}
                        onChange={handleInputChange}
                        placeholder="Enter your first name"
                        className="profile-input"
                      />
                    </div>
                    <div className="profile-form-group">
                      <label htmlFor="last_name">Last Name</label>
                      <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={profileData.last_name}
                        onChange={handleInputChange}
                        placeholder="Enter your last name"
                        className="profile-input"
                      />
                    </div>
                  </div>

                  <div className="profile-form-group">
                    <label htmlFor="username">Username</label>
                    <input
                      type="text"
                      id="username"
                      value={profileData.username}
                      disabled
                      className="profile-input profile-input-disabled"
                    />
                    <p className="profile-input-hint">Username cannot be changed</p>
                  </div>

                  <div className="profile-form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className="profile-input"
                      required
                    />
                  </div>

                  {(isOrganizer || profileData.organization_name) && (
                    <div className="profile-form-group">
                      <label htmlFor="organization_name">Organization</label>
                      <input
                        type="text"
                        id="organization_name"
                        name="organization_name"
                        value={profileData.organization_name}
                        onChange={handleInputChange}
                        placeholder="Enter your organization name"
                        className="profile-input"
                      />
                    </div>
                  )}

                  <div className="profile-form-actions">
                    <button type="submit" className="profile-save-btn" disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === "activity" && (
              <div className="profile-card">
                <h3 className="profile-card-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Recent Activity
                </h3>
                <div className="profile-activity-list">
                  <div className="profile-activity-item">
                    <div className="profile-activity-icon">📅</div>
                    <div className="profile-activity-content">
                      <p className="profile-activity-text">
                        <strong>Member since</strong> {stats.member_since}
                      </p>
                      <span className="profile-activity-time">Account created</span>
                    </div>
                  </div>
                  <div className="profile-activity-item">
                    <div className="profile-activity-icon">👥</div>
                    <div className="profile-activity-content">
                      <p className="profile-activity-text">
                        <strong>{stats.teams}</strong> team{stats.teams !== 1 ? 's' : ''}
                      </p>
                      <span className="profile-activity-time">
                        {stats.teams > 0 ? 'Active in teams' : 'No teams yet'}
                      </span>
                    </div>
                  </div>
                  <div className="profile-activity-item">
                    <div className="profile-activity-icon">🚀</div>
                    <div className="profile-activity-content">
                      <p className="profile-activity-text">
                        <strong>{stats.submissions}</strong> submission{stats.submissions !== 1 ? 's' : ''}
                      </p>
                      <span className="profile-activity-time">
                        {stats.submissions > 0 ? 'Projects submitted' : 'No submissions yet'}
                      </span>
                    </div>
                  </div>
                  {isJudge && (
                    <div className="profile-activity-item">
                      <div className="profile-activity-icon">⭐</div>
                      <div className="profile-activity-content">
                        <p className="profile-activity-text">
                          <strong>{stats.feedback_given}</strong> feedback{stats.feedback_given !== 1 ? 's' : ''} given
                        </p>
                        <span className="profile-activity-time">As a judge</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <>
                {/* Password Change Section */}
                <div className="profile-card">
                  <h3 className="profile-card-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Change Password
                  </h3>
                  <p className="settings-description">
                    Update your password to keep your account secure
                  </p>

                  <form onSubmit={handleChangePassword} className="profile-form">
                    <div className="profile-form-group">
                      <label htmlFor="current_password">Current Password</label>
                      <input
                        type="password"
                        id="current_password"
                        name="current_password"
                        value={passwordData.current_password}
                        onChange={handlePasswordChange}
                        placeholder="Enter your current password"
                        className="profile-input"
                        required
                      />
                    </div>

                    <div className="profile-form-row">
                      <div className="profile-form-group">
                        <label htmlFor="new_password">New Password</label>
                        <input
                          type="password"
                          id="new_password"
                          name="new_password"
                          value={passwordData.new_password}
                          onChange={handlePasswordChange}
                          placeholder="Enter new password"
                          className="profile-input"
                          required
                          minLength={6}
                        />
                      </div>

                      <div className="profile-form-group">
                        <label htmlFor="confirm_password">Confirm Password</label>
                        <input
                          type="password"
                          id="confirm_password"
                          name="confirm_password"
                          value={passwordData.confirm_password}
                          onChange={handlePasswordChange}
                          placeholder="Confirm new password"
                          className="profile-input"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <div className="profile-form-actions">
                      <button 
                        type="submit" 
                        className="profile-save-btn" 
                        disabled={saving}
                      >
                        {saving ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Danger Zone */}
                <div className="profile-card settings-card-danger">
                  <h3 className="profile-card-title settings-title-danger">
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
                      disabled={saving}
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .profile-page {
          min-height: 100vh;
          background: #0a0a0a;
          font-family: 'DM Sans', sans-serif;
          padding: 2rem;
        }

        .profile-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .profile-loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #0a0a0a;
          color: #888;
          gap: 1rem;
        }

        .profile-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: #6EE7B7;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Header */
        .profile-header {
          margin-bottom: 2rem;
        }

        .profile-eyebrow {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .profile-eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6EE7B7;
        }

        .profile-eyebrow-label {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #6EE7B7;
        }

        .profile-title {
          font-family: 'Syne', sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.25rem 0;
          letter-spacing: -0.02em;
        }

        .profile-subtitle {
          color: #888;
          margin: 0;
          font-size: 1rem;
        }

        /* Message */
        .profile-message {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          animation: slideIn 0.3s ease;
        }

        .profile-message.success {
          background: rgba(34,197,94,0.1);
          border: 1px solid rgba(34,197,94,0.2);
          color: #4ade80;
        }

        .profile-message.error {
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
        .profile-content {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 2rem;
        }

        /* Sidebar */
        .profile-sidebar {
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

        .profile-badges {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          margin: 0.5rem 0;
        }

        .profile-badge {
          padding: 0.2rem 0.6rem;
          border-radius: 100px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .profile-badge.judge {
          background: rgba(251,191,36,0.15);
          color: #fbbf24;
          border: 1px solid rgba(251,191,36,0.3);
        }

        .profile-badge.organizer {
          background: rgba(110,231,183,0.15);
          color: #6EE7B7;
          border: 1px solid rgba(110,231,183,0.3);
        }

        .profile-badge.participant {
          background: rgba(156,163,175,0.15);
          color: #9ca3af;
          border: 1px solid rgba(156,163,175,0.3);
        }

        .profile-member-since {
          font-size: 0.8rem;
          color: #888;
          margin: 0.5rem 0 0;
        }

        .profile-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .profile-stat-item {
          text-align: center;
        }

        .profile-stat-value {
          display: block;
          font-family: 'Syne', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .profile-stat-label {
          font-size: 0.7rem;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Navigation */
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
        .profile-main {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .profile-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 1.5rem;
        }

        .settings-card-danger {
          border-color: rgba(248,113,113,0.2);
        }

        .profile-card-title {
          display: flex;
          align-items: center;
          font-family: 'Syne', sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 1.5rem 0;
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
        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .profile-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .profile-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .profile-form-group label {
          font-size: 0.85rem;
          font-weight: 500;
          color: rgba(255,255,255,0.8);
        }

        .profile-input {
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

        .profile-input:focus {
          border-color: #6EE7B7;
          background: rgba(255,255,255,0.08);
        }

        .profile-input-disabled {
          background: rgba(255,255,255,0.02);
          color: #888;
          cursor: not-allowed;
        }

        .profile-input-hint {
          font-size: 0.7rem;
          color: #888;
          margin: 0.25rem 0 0 0;
        }

        .profile-form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 1rem;
        }

        .profile-save-btn {
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

        .profile-save-btn:hover {
          background: #86efac;
          transform: translateY(-2px);
        }

        .profile-save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        /* Activity List */
        .profile-activity-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .profile-activity-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: rgba(255,255,255,0.02);
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .profile-activity-item:hover {
          background: rgba(255,255,255,0.05);
        }

        .profile-activity-icon {
          width: 40px;
          height: 40px;
          background: rgba(110,231,183,0.1);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          color: #6EE7B7;
        }

        .profile-activity-content {
          flex: 1;
        }

        .profile-activity-text {
          font-size: 0.95rem;
          color: #fff;
          margin: 0 0 0.25rem 0;
        }

        .profile-activity-time {
          font-size: 0.75rem;
          color: #888;
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
          .profile-page {
            padding: 1rem;
          }

          .profile-content {
            grid-template-columns: 1fr;
          }

          .profile-form-row {
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
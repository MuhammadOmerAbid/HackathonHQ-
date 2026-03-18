"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "@/utils/axios";
import { useAuth } from "@/context/AuthContext";
import ProfileSidebar from "@/components/profile/ProfileSidebar";
import ProfileInfoCard from "@/components/profile/ProfileInfoCard";
import SettingsCard from "@/components/profile/SettingsCard";

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isJudge, isOrganizer, logout, checkAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(initialTab === "activity" ? "profile" : (initialTab || "profile"));
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    organization_name: "",
    bio: "",
    location: "",
    github_url: "",
    linkedin_url: "",
    twitter_url: "",
    website_url: "",
    avatar: "",
    cover_image: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [stats, setStats] = useState({
    teams: 0,
    submissions: 0,
    feedback_given: 0,
    member_since: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [lockInfo, setLockInfo] = useState({ isLocked: false, type: "", until: null, reason: "" });
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
    const nextTab = searchParams.get('tab') || "profile";
    setActiveTab(nextTab === "activity" ? "profile" : nextTab);
  }, [searchParams]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      const userRes = await axios.get("/users/me/");
      const userData = userRes.data;

      const suspendedUntil = userData.suspended_until || userData.profile?.suspended_until;
      const bannedUntil = userData.banned_until || userData.profile?.banned_until;
      const banReason = userData.ban_reason || userData.profile?.ban_reason;
      if (userData.is_active === false && (suspendedUntil || bannedUntil)) {
        setLockInfo({
          isLocked: true,
          type: bannedUntil ? "banned" : "suspended",
          until: bannedUntil || suspendedUntil,
          reason: banReason || ""
        });
      } else {
        setLockInfo({ isLocked: false, type: "", until: null, reason: "" });
      }
      
      setProfileData({
        username: userData.username || "",
        email: userData.email || "",
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        organization_name: userData.organization_name || userData.profile?.organization_name || "",
        bio: userData.bio || userData.profile?.bio || "",
        location: userData.location || userData.profile?.location || "",
        github_url: userData.github_url || userData.profile?.github_url || "",
        linkedin_url: userData.linkedin_url || userData.profile?.linkedin_url || "",
        twitter_url: userData.twitter_url || userData.profile?.twitter_url || "",
        website_url: userData.website_url || userData.profile?.website_url || "",
        avatar: userData.avatar || userData.profile?.avatar || "",
        cover_image: userData.cover_image || userData.profile?.cover_image || "",
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

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0] || null;
    setAvatarFile(file);
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0] || null;
    setCoverFile(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const formData = new FormData();
      formData.append("first_name", profileData.first_name || "");
      formData.append("last_name", profileData.last_name || "");
      formData.append("email", profileData.email || "");
      formData.append("organization_name", profileData.organization_name || "");
      formData.append("bio", profileData.bio || "");
      formData.append("location", profileData.location || "");
      formData.append("github_url", profileData.github_url || "");
      formData.append("linkedin_url", profileData.linkedin_url || "");
      formData.append("twitter_url", profileData.twitter_url || "");
      formData.append("website_url", profileData.website_url || "");

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }
      if (coverFile) {
        formData.append("cover_image", coverFile);
      }

      await axios.patch("/users/me/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage({ type: "success", text: "Profile updated successfully!" });
      setAvatarFile(null);
      setCoverFile(null);
      await checkAuth();
      fetchProfileData();
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
    console.log("Changing password...");
    
    const response = await axios.post("/users/change_password/", {
      current_password: passwordData.current_password,
      new_password: passwordData.new_password,
    });
    
    console.log("Password change response:", response.data);
    
    setMessage({ type: "success", text: "Password changed successfully!" });
    setPasswordData({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });
  } catch (err) {
    console.error("Error changing password:", err);
    console.error("Error response:", err.response?.data);
    
    if (err.response?.data?.error) {
      setMessage({ type: "error", text: err.response.data.error });
    } else if (err.response?.data?.detail) {
      setMessage({ type: "error", text: err.response.data.detail });
    } else {
      setMessage({ type: "error", text: "Failed to change password" });
    }
  } finally {
    setSaving(false);
  }
};

  const handleDeleteAccount = async (password, reason, setDeleteError) => {
  if (!password) {
    setDeleteError("Password is required");
    return false;
  }

  setSaving(true);
  setMessage({ type: "", text: "" });

  try {
    console.log("Verifying password...");
    // First verify password
    await axios.post("/users/verify_password/", { password });
    
    console.log("Password verified, deleting account...");
    // Then delete account using the new endpoint
    await axios.post("/users/delete_account/", { reason: reason || "" });
    
    console.log("Account deleted, logging out...");
    // Show success message before logout
    setMessage({ type: "success", text: "Account deleted successfully. Goodbye!" });
    
    // Small delay to show success message
    setTimeout(() => {
      logout();
      router.push("/");
    }, 1500);
    
    return true;
  } catch (err) {
    console.error("Error deleting account:", err);
    
    if (err.response?.status === 403) {
      setDeleteError("Incorrect password. Please try again.");
    } else if (err.response?.status === 400) {
      setMessage({ 
        type: "error", 
        text: err.response?.data?.error || "Cannot delete account. Please resolve team leadership or pending submissions." 
      });
    } else if (err.response?.status === 401) {
      setMessage({ type: "error", text: "Your session has expired. Please login again." });
    } else {
      setMessage({ 
        type: "error", 
        text: err.response?.data?.error || "Failed to delete account" 
      });
    }
    return false;
  } finally {
    setSaving(false);
  }
};

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    router.push(`/profile?tab=${tab}`);
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

        {lockInfo.isLocked && (
          <div className="profile-lock-banner">
            <strong>Account {lockInfo.type}</strong>
            {lockInfo.until && (
              <span>
                Until {new Date(lockInfo.until).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
            {lockInfo.reason && <span className="profile-lock-reason">{lockInfo.reason}</span>}
          </div>
        )}

        {/* Main Content */}
        <div className="profile-content">
          {/* Sidebar Component */}
          <ProfileSidebar
            user={user}
            stats={stats}
            isJudge={isJudge}
            isOrganizer={isOrganizer}
            onLogout={handleLogout}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {/* Main Content Area */}
          <div className="profile-main">
            {activeTab === "profile" && (
              <ProfileInfoCard
                profileData={profileData}
                onInputChange={handleInputChange}
                onAvatarChange={handleAvatarChange}
                onCoverChange={handleCoverChange}
                onSubmit={handleSaveProfile}
                saving={saving}
              />
            )}

            {activeTab === "settings" && (
              <SettingsCard
                passwordData={passwordData}
                onPasswordChange={handlePasswordChange}
                onSubmitPassword={handleChangePassword}
                onDeleteAccount={handleDeleteAccount}
                saving={saving}
              />
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

        .profile-lock-banner {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          background: rgba(248,113,113,0.08);
          border: 1px solid rgba(248,113,113,0.25);
          color: #f87171;
          font-size: 0.9rem;
        }

        .profile-lock-reason {
          color: rgba(248,113,113,0.9);
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

        .profile-content {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 2rem;
        }

        .profile-main {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .profile-page {
            padding: 1rem;
          }

          .profile-content {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

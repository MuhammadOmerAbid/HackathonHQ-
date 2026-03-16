"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export default function ProfileSidebar({ 
  user, 
  stats, 
  isJudge, 
  isOrganizer, 
  onLogout,
  activeTab,
  onTabChange 
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab =
    pathname === "/profile"
      ? searchParams.get("tab") || activeTab || "profile"
      : activeTab || "profile";

  const handleTabClick = (tab) => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const isActive = (tab) => currentTab === tab;

  return (
    <div className="profile-sidebar">
      {/* Avatar Section */}
      <div className="profile-avatar-section">
        <div className="profile-avatar-large">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="profile-avatar-img" />
          ) : (
            user?.username?.charAt(0).toUpperCase() || "U"
          )}
        </div>
        <h2 className="profile-username">{user?.username}</h2>
        <div className="profile-badges">
          {user?.is_superuser && <span className="profile-badge admin">Admin</span>}
          {isJudge && <span className="profile-badge judge">Judge</span>}
          {isOrganizer && <span className="profile-badge organizer">Organizer</span>}
          {!user?.is_superuser && !isJudge && !isOrganizer && <span className="profile-badge participant">Member</span>}
        </div>
        <p className="profile-member-since">Member since {stats.member_since}</p>
        {user?.last_active && (
          <p className="profile-last-active">
            Last active {new Date(user.last_active).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        )}
      </div>

      {/* Stats Grid */}
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

      {/* Navigation Buttons */}
      <nav className="profile-nav">
        <button
          onClick={() => handleTabClick("profile")}
          className={`profile-nav-item ${isActive("profile") ? "active" : ""}`}
          aria-label="Profile"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Profile</span>
        </button>

        <button
          onClick={() => handleTabClick("activity")}
          className={`profile-nav-item ${isActive("activity") ? "active" : ""}`}
          aria-label="Activity"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Activity</span>
        </button>

        <button
          onClick={() => handleTabClick("settings")}
          className={`profile-nav-item ${isActive("settings") ? "active" : ""}`}
          aria-label="Settings"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>Settings</span>
        </button>
      </nav>

      {/* Logout Button */}
      <div className="profile-nav-footer">
        <button onClick={onLogout} className="profile-logout-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </div>

      <style jsx>{`
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
        .profile-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
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

        .profile-badge.admin {
          background: rgba(251,191,36,0.12);
          color: #fbbf24;
          border: 1px solid rgba(251,191,36,0.25);
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

        .profile-last-active {
          font-size: 0.75rem;
          color: #5c5c6e;
          margin: 0.25rem 0 0;
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
          font-family: inherit;
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
          font-family: inherit;
        }

        .profile-logout-btn:hover {
          background: rgba(248, 113, 113, 0.15);
          border-color: rgba(248, 113, 113, 0.3);
        }

        .profile-logout-btn svg {
          stroke: #f87171;
        }

        /* Remove default button styles */
        button {
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

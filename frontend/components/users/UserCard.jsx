"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "../../utils/axios";

export default function UserCard({ user, currentUser, onFollow, onMessage }) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(user.is_following || false);
  const [followLoading, setFollowLoading] = useState(false);

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await axios.post(`/users/${user.id}/unfollow/`);
      } else {
        await axios.post(`/users/${user.id}/follow/`);
      }
      setIsFollowing(!isFollowing);
      onFollow?.(user.id, !isFollowing);
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = (e) => {
    e.stopPropagation();
    onMessage?.(user);
  };

  const getRoleBadge = () => {
    if (user.is_staff) return { text: "Admin", color: "#fbbf24" };
    if (user.is_organizer) return { text: "Organizer", color: "#a78bfa" };
    if (user.is_judge) return { text: "Judge", color: "#60a5fa" };
    return null;
  };

  const role = getRoleBadge();

  return (
    <div className="user-card" onClick={() => router.push(`/users/${user.id}`)}>
      {/* Gradient overlay - exactly like your reference */}
      <div className="card-gradient" />
      
      <div className="card-content">
        {/* Header with avatar and actions */}
        <div className="user-header">
          <div className="user-avatar-wrapper">
            <div className="user-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt="" />
              ) : (
                user.username?.[0]?.toUpperCase()
              )}
            </div>
            {user.is_active && <span className="online-indicator" />}
          </div>

          <div className="user-actions">
            {currentUser && currentUser.id !== user.id && (
              <>
                <button
                  className={`action-follow ${isFollowing ? 'following' : ''}`}
                  onClick={handleFollow}
                  disabled={followLoading}
                  title={isFollowing ? 'Unfollow' : 'Follow'}
                >
                  {followLoading ? (
                    <span className="spinner" />
                  ) : isFollowing ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" />
                      <line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                  )}
                </button>
                <button
                  className="action-message"
                  onClick={handleMessage}
                  title="Send message"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* User info section */}
        <div className="user-info">
          <div className="user-name-row">
            <h3 className="user-name">{user.username}</h3>
            {role && (
              <span 
                className="role-badge"
                style={{ 
                  background: `${role.color}12`,
                  color: role.color,
                  borderColor: `${role.color}25`
                }}
              >
                {role.text}
              </span>
            )}
          </div>
          
          <p className="user-email">{user.email}</p>
          
          {user.organization_name && (
            <p className="user-org">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {user.organization_name}
            </p>
          )}
        </div>

        {/* Stats section */}
        <div className="user-stats">
          <div className="stat-item">
            <span className="stat-value">{user.posts_count || 0}</span>
            <span className="stat-label">posts</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">{user.followers_count || 0}</span>
            <span className="stat-label">followers</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">{user.following_count || 0}</span>
            <span className="stat-label">following</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .user-card {
          position: relative;
          background: #111114;  /* Solid dark background */
          border: 1px solid #1e1e24;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .user-card:hover {
          transform: translateY(-2px);
          border-color: rgba(110,231,183,0.3);
          box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        }

        /* Gradient overlay - exactly like your reference */
        .card-gradient {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at top right,
            rgba(110,231,183,0.12),
            transparent 70%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .user-card:hover .card-gradient {
          opacity: 1;
        }

        .card-content {
          position: relative;
          z-index: 1;
          padding: 20px;
        }

        .user-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .user-avatar-wrapper {
          position: relative;
        }

        .user-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(110,231,183,0.1);
          border: 2px solid rgba(110,231,183,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #6EE7B7;
          overflow: hidden;
        }

        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .online-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #4ade80;
          border: 2px solid #111114;
          box-shadow: 0 0 8px rgba(74,222,128,0.6);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .user-actions {
          display: flex;
          gap: 6px;
        }

        .action-follow, .action-message {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid #1e1e24;
          border-radius: 8px;
          color: #888;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-follow {
          width: auto;
          padding: 0 14px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
          gap: 4px;
        }

        .action-follow:hover, .action-message:hover {
          border-color: rgba(110,231,183,0.4);
          color: #6EE7B7;
          background: rgba(110,231,183,0.05);
        }

        .action-follow.following {
          background: rgba(110,231,183,0.1);
          border-color: rgba(110,231,183,0.3);
          color: #6EE7B7;
        }

        .action-follow:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spinner {
          width: 12px;
          height: 12px;
          border: 2px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        .user-info {
          margin-bottom: 16px;
        }

        .user-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
          flex-wrap: wrap;
        }

        .user-name {
          font-size: 16px;
          font-weight: 600;
          color: #f0f0f3;
          margin: 0;
        }

        .role-badge {
          padding: 2px 8px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 600;
          border: 1px solid;
          white-space: nowrap;
        }

        .user-email {
          font-size: 12px;
          color: #888;
          margin: 0 0 4px;
        }

        .user-org {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #6EE7B7;
          margin: 0;
        }

        .user-stats {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0 0;
          border-top: 1px solid #1e1e24;
        }

        .stat-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .stat-value {
          font-size: 15px;
          font-weight: 600;
          color: #f0f0f3;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 9px;
          color: #5c5c6e;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-divider {
          width: 1px;
          height: 20px;
          background: #1e1e24;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
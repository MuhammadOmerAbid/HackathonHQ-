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
      <div className="user-card-avatar">
        {user.avatar ? <img src={user.avatar} alt="" /> : user.username?.[0]?.toUpperCase()}
        {user.is_active && <span className="user-card-active" />}
      </div>
      
      <div className="user-card-info">
        <div className="user-card-header">
          <h3 className="user-card-name">{user.username}</h3>
          {role && (
            <span 
              className="user-card-badge"
              style={{ 
                background: `${role.color}15`, 
                color: role.color,
                borderColor: `${role.color}30`
              }}
            >
              {role.text}
            </span>
          )}
        </div>
        
        <p className="user-card-email">{user.email}</p>
        
        {user.organization_name && (
          <p className="user-card-org">{user.organization_name}</p>
        )}

        <div className="user-card-stats">
          <div className="user-card-stat">
            <span className="stat-value">{user.posts_count || 0}</span>
            <span className="stat-label">posts</span>
          </div>
          <div className="user-card-stat">
            <span className="stat-value">{user.followers_count || 0}</span>
            <span className="stat-label">followers</span>
          </div>
          <div className="user-card-stat">
            <span className="stat-value">{user.following_count || 0}</span>
            <span className="stat-label">following</span>
          </div>
        </div>
      </div>

      <div className="user-card-actions" onClick={(e) => e.stopPropagation()}>
        {currentUser && currentUser.id !== user.id && (
          <>
            <button
              className={`user-card-follow-btn ${isFollowing ? 'following' : ''}`}
              onClick={handleFollow}
              disabled={followLoading}
            >
              {followLoading ? (
                <span className="user-card-spinner" />
              ) : isFollowing ? (
                'Following'
              ) : (
                'Follow'
              )}
            </button>
            
            <button
              className="user-card-message-btn"
              onClick={handleMessage}
              title={`Message ${user.username}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        .user-card {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          gap: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        .user-card:hover {
          border-color: rgba(110,231,183,0.3);
          background: #17171b;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        }

        .user-card-avatar {
          position: relative;
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
          flex-shrink: 0;
          overflow: hidden;
        }
        .user-card-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .user-card-active {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #4ade80;
          border: 2px solid #111114;
          box-shadow: 0 0 8px rgba(74,222,128,0.4);
        }

        .user-card-info {
          flex: 1;
          min-width: 0;
        }

        .user-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
          flex-wrap: wrap;
        }
        .user-card-name {
          font-size: 16px;
          font-weight: 700;
          color: #f0f0f3;
          margin: 0;
        }
        .user-card-badge {
          padding: 2px 10px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 600;
          border: 1px solid transparent;
        }

        .user-card-email {
          font-size: 12px;
          color: #888;
          margin: 0 0 4px;
        }

        .user-card-org {
          font-size: 11px;
          color: #6EE7B7;
          margin: 0 0 12px;
        }

        .user-card-stats {
          display: flex;
          gap: 16px;
        }
        .user-card-stat {
          display: flex;
          flex-direction: column;
        }
        .stat-value {
          font-size: 14px;
          font-weight: 700;
          color: #f0f0f3;
        }
        .stat-label {
          font-size: 10px;
          color: #5c5c6e;
          text-transform: uppercase;
        }

        .user-card-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          justify-content: center;
        }

        .user-card-follow-btn {
          padding: 8px 16px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid;
          min-width: 90px;
          text-align: center;
        }
        .user-card-follow-btn:not(.following) {
          background: #6EE7B7;
          border-color: #4fb88b;
          color: #0c0c0f;
        }
        .user-card-follow-btn:not(.following):hover {
          background: #86efac;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(110,231,183,0.3);
        }
        .user-card-follow-btn.following {
          background: transparent;
          border-color: #1e1e24;
          color: #888;
        }
        .user-card-follow-btn.following:hover {
          border-color: #f87171;
          color: #f87171;
        }
        .user-card-follow-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .user-card-message-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid #1e1e24;
          border-radius: 50%;
          color: #888;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .user-card-message-btn:hover {
          border-color: #6EE7B7;
          color: #6EE7B7;
          transform: scale(1.05);
        }

        .user-card-spinner {
          display: inline-block;
          width: 12px;
          height: 12px;
          border: 2px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

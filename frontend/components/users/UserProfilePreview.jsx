"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "../../utils/axios";

export default function UserProfilePreview({ user, currentUser, onFollow, onMessage }) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(user.is_following || false);
  const [followLoading, setFollowLoading] = useState(false);

  // Debug: Log the user object to see what data we're getting
  console.log("UserProfilePreview user:", user);

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

  // Determine if user has any role
  const hasRole = user.is_staff || user.is_organizer || user.is_judge;

  return (
    <div className="profile-preview" onClick={() => router.push(`/users/${user.id}`)}>
      {/* Cover Photo */}
      <div className="profile-cover">
        {user.cover_image && (
          <img src={user.cover_image} alt="" className="profile-cover-img" />
        )}
      </div>

      {/* Avatar */}
      <div className="profile-avatar-wrapper">
        <div className="profile-avatar">
          {user.avatar ? <img src={user.avatar} alt="" /> : user.username?.[0]?.toUpperCase()}
        </div>
        {user.is_active && <span className="profile-active" />}
      </div>

      {/* Info */}
      <div className="profile-info">
        <h3 className="profile-name">{user.username}</h3>
        
        {/* Role Badges - Fixed display logic */}
        <div className="profile-badges">
          {user.is_staff && (
            <span className="profile-badge admin" title="Platform Administrator">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
              </svg>
              Admin
            </span>
          )}
          
          {user.is_organizer && (
            <span className="profile-badge organizer" title="Event Organizer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Organizer
            </span>
          )}
          
          {user.is_judge && (
            <span className="profile-badge judge" title="Hackathon Judge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Judge
            </span>
          )}

          {/* If no role, show member badge */}
          {!hasRole && (
            <span className="profile-badge member" title="Community Member">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Member
            </span>
          )}
        </div>

        <p className="profile-bio">{user.bio || "No bio yet"}</p>
        
        {user.organization_name && (
          <div className="profile-org">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {user.organization_name}
          </div>
        )}

        {/* Stats */}
        <div className="profile-stats">
          <div className="profile-stat">
            <span className="stat-value">{user.posts_count || 0}</span>
            <span className="stat-label">Posts</span>
          </div>
          <div className="profile-stat">
            <span className="stat-value">{user.followers_count || 0}</span>
            <span className="stat-label">Followers</span>
          </div>
          <div className="profile-stat">
            <span className="stat-value">{user.following_count || 0}</span>
            <span className="stat-label">Following</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {currentUser && currentUser.id !== user.id && (
        <div className="profile-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className={`profile-follow-btn ${isFollowing ? 'following' : ''}`}
            onClick={handleFollow}
            disabled={followLoading}
          >
            {followLoading ? (
              <span className="profile-spinner" />
            ) : isFollowing ? (
              'Following'
            ) : (
              'Follow'
            )}
          </button>
          
          <button
            className="profile-message-btn"
            onClick={handleMessage}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      )}

      <style jsx>{`
        .profile-preview {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        .profile-preview:hover {
          transform: translateY(-4px);
          border-color: rgba(110,231,183,0.3);
          box-shadow: 0 12px 30px rgba(0,0,0,0.5);
        }

        .profile-cover {
          height: 80px;
          background: linear-gradient(45deg, #1a1a1f, #2a2a30);
          position: relative;
        }
        .profile-cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-avatar-wrapper {
          position: relative;
          width: fit-content;
          margin: -32px auto 0;
        }
        .profile-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(110,231,183,0.15);
          border: 3px solid #6EE7B7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #6EE7B7;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          overflow: hidden;
        }
        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .profile-active {
          position: absolute;
          bottom: 5px;
          right: 5px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #4ade80;
          border: 2px solid #111114;
          box-shadow: 0 0 8px rgba(74,222,128,0.6);
        }

        .profile-info {
          padding: 16px;
          text-align: center;
        }
        .profile-name {
          font-size: 18px;
          font-weight: 700;
          color: #f0f0f3;
          margin: 0 0 8px;
        }

        /* Role Badges Styles */
        .profile-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
          margin-bottom: 8px;
        }
        .profile-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          border: 1px solid transparent;
        }
        .profile-badge.admin {
          background: rgba(251,191,36,0.12);
          color: #fbbf24;
          border-color: rgba(251,191,36,0.25);
        }
        .profile-badge.organizer {
          background: rgba(167,139,250,0.12);
          color: #a78bfa;
          border-color: rgba(167,139,250,0.25);
        }
        .profile-badge.judge {
          background: rgba(96,165,250,0.12);
          color: #60a5fa;
          border-color: rgba(96,165,250,0.25);
        }
        .profile-badge.member {
          background: rgba(92,92,110,0.12);
          color: #5c5c6e;
          border-color: rgba(92,92,110,0.25);
        }

        .profile-bio {
          font-size: 13px;
          color: #888;
          margin: 0 0 12px;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .profile-org {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 12px;
          color: #6EE7B7;
          margin-bottom: 12px;
        }

        .profile-stats {
          display: flex;
          justify-content: center;
          gap: 20px;
          padding: 12px 0;
          border-top: 1px solid #1e1e24;
          border-bottom: 1px solid #1e1e24;
          margin-bottom: 12px;
        }
        .profile-stat {
          display: flex;
          flex-direction: column;
        }
        .stat-value {
          font-size: 16px;
          font-weight: 700;
          color: #f0f0f3;
        }
        .stat-label {
          font-size: 10px;
          color: #888;
          text-transform: uppercase;
        }

        .profile-actions {
          display: flex;
          gap: 8px;
          padding: 0 16px 16px;
        }
        .profile-follow-btn {
          flex: 1;
          padding: 10px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid;
        }
        .profile-follow-btn:not(.following) {
          background: #6EE7B7;
          border-color: #4fb88b;
          color: #0c0c0f;
        }
        .profile-follow-btn:not(.following):hover {
          background: #86efac;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(110,231,183,0.3);
        }
        .profile-follow-btn.following {
          background: transparent;
          border-color: #1e1e24;
          color: #888;
        }
        .profile-follow-btn.following:hover {
          border-color: #f87171;
          color: #f87171;
        }
        .profile-message-btn {
          width: 40px;
          height: 40px;
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
        .profile-message-btn:hover {
          border-color: #6EE7B7;
          color: #6EE7B7;
          transform: scale(1.05);
        }

        .profile-spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
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

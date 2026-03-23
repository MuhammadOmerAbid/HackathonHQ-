"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "../../utils/axios";

export default function PostCard({ post, currentUser, onLike, onRepost, onDelete }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(post.author?.is_following || false);
  const [followLoading, setFollowLoading] = useState(false);
  const menuRef = useRef(null);

  const isOwner = post.author?.id === currentUser?.id;
  const isLiked = post.liked_by?.includes(currentUser?.id);
  const isReposted = post.reposted_by?.includes(currentUser?.id);
  const isPinned = post.is_pinned;
  const isAnnouncement = post.post_type === "announcement";
  const isResult = post.post_type === "result";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsFollowing(post.author?.is_following || false);
  }, [post.author?.is_following, post.author?.id]);

  const formatTimeAgo = (date) => {
    if (!date) return "";
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    if (diffMins < 10080) return `${Math.floor(diffMins / 1440)}d ago`;
    
    return postDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handlePostClick = () => {
    router.push(`/community/${post.id}`);
  };

  const handleAuthorClick = (e) => {
    e.stopPropagation();
    if (post.author?.id) router.push(`/users/${post.author.id}`);
  };

  const handleRepostContextClick = (e) => {
    e.stopPropagation();
    if (post.repost_context?.id) router.push(`/users/${post.repost_context.id}`);
  };

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (!post.author?.id || post.author?.id === currentUser.id) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await axios.post(`/users/${post.author.id}/unfollow/`);
      } else {
        await axios.post(`/users/${post.author.id}/follow/`);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <article 
      className={`post-card ${isPinned ? 'pinned' : ''} ${isAnnouncement ? 'announcement' : ''} ${isResult ? 'result' : ''}`}
      onClick={handlePostClick}
    >
      {/* Special banners */}
      {isPinned && (
        <div className="post-banner pinned">
          <span>Pinned post</span>
        </div>
      )}
      {isAnnouncement && (
        <div className="post-banner announcement">
          <span>Official announcement</span>
        </div>
      )}
      {isResult && (
        <div className="post-banner result">
          <span>Hackathon results</span>
        </div>
      )}

      <div className="post-main">
        {/* Avatar column */}
        <div className="post-avatar-col">
          <div 
            className="post-avatar"
            onClick={handleAuthorClick}
          >
            {post.author?.avatar ? (
              <img src={post.author.avatar} alt="" />
            ) : (
              post.author?.username?.[0]?.toUpperCase() || '?'
            )}
          </div>
        </div>

        {/* Content column */}
        <div className="post-content-col">
          {post.repost_context && (
            <div className="post-repost-context" onClick={handleRepostContextClick}>
              {post.repost_context.avatar ? (
                <img src={post.repost_context.avatar} alt="" />
              ) : (
                <span className="repost-avatar-fallback">
                  {post.repost_context.username?.[0]?.toUpperCase() || "U"}
                </span>
              )}
              <span>
                Reposted by <strong>{post.repost_context.username}</strong>
              </span>
            </div>
          )}
          {/* Header */}
          <div className="post-header">
            <div className="post-author-info">
              <span 
                className="post-author-name"
                onClick={handleAuthorClick}
              >
                {post.author?.username || 'Unknown'}
              </span>
              {post.author?.is_staff && (
                <span className="post-badge admin">Admin</span>
              )}
              {post.author?.is_organizer && (
                <span className="post-badge organizer">Organizer</span>
              )}
              {post.author?.is_judge && (
                <span className="post-badge judge">Judge</span>
              )}
              <span className="post-time">{formatTimeAgo(post.created_at)}</span>
            </div>

            {/* Event tag if exists */}
            {post.event && (
              <div 
                className="post-event-tag"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/events/${post.event.id}`);
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {post.event.name}
              </div>
            )}

            <div className="post-header-actions">
              {currentUser && post.author?.id !== currentUser.id && (
                <button
                  className={`post-follow-btn ${isFollowing ? 'following' : ''}`}
                  onClick={handleFollow}
                  disabled={followLoading}
                >
                  {followLoading ? (
                    <span className="post-follow-spinner" />
                  ) : isFollowing ? (
                    'Following'
                  ) : (
                    'Follow'
                  )}
                </button>
              )}
              {isOwner && (
                <div className="post-menu" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                  <button className="post-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="12" cy="19" r="2" />
                    </svg>
                  </button>
                  {menuOpen && (
                    <div className="post-dropdown">
                      <button className="dropdown-item" onClick={() => router.push(`/community/${post.id}/edit`)}>
                        Edit
                      </button>
                      <button className="dropdown-item danger" onClick={() => onDelete(post.id)}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          {post.title && (
            <h3 className="post-title">{post.title}</h3>
          )}

          {/* Content */}
          <p className="post-content">{post.content}</p>

          {/* Winners podium for result posts */}
          {isResult && post.winners?.length > 0 && (
            <div className="post-winners">
              {post.winners.slice(0, 3).map((winner, idx) => (
                <div key={winner.id || idx} className="winner-row">
                  <span className="winner-medal">{['1st', '2nd', '3rd'][idx]}</span>
                  <div className="winner-info">
                    <span className="winner-title">{winner.title}</span>
                    <span className="winner-team">{winner.team_name || winner.team?.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="post-tags">
              {post.tags.slice(0, 5).map(tag => (
                <span key={tag} className="post-tag">#{tag}</span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="post-actions" onClick={(e) => e.stopPropagation()}>
            <button 
              className={`action-btn comment`}
              onClick={handlePostClick}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>{post.comments_count || 0}</span>
            </button>

            <button 
              className={`action-btn repost ${isReposted ? 'active' : ''}`}
              onClick={() => onRepost(post.id)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              <span>{post.reposts_count || 0}</span>
            </button>

            <button 
              className={`action-btn like ${isLiked ? 'active' : ''}`}
              onClick={() => onLike(post.id)}
            >
              <svg
                viewBox="0 0 24 24"
                fill={isLiked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                width="18"
                height="18"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>{post.likes_count || post.liked_by?.length || 0}</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .post-card {
          border-bottom: 1px solid #1e1e24;
          cursor: pointer;
          transition: background 0.2s ease;
          background: #111114;
        }
        .post-card:hover {
          background: #151519;
        }
        .post-card.pinned {
          border-left: 3px solid #6EE7B7;
        }
        .post-card.announcement {
          border-left: 3px solid #60a5fa;
        }
        .post-card.result {
          border-left: 3px solid #8b5cf6;
          background: linear-gradient(to right, rgba(139,92,246,0.04), transparent);
        }

        .post-banner {
          padding: 8px 20px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.3px;
          border-bottom: 1px solid rgba(30,30,36,0.5);
        }
        .post-banner.pinned {
          background: rgba(110,231,183,0.06);
          color: #6EE7B7;
        }
        .post-banner.announcement {
          background: rgba(96,165,250,0.08);
          color: #60a5fa;
        }
        .post-banner.result {
          background: rgba(139,92,246,0.1);
          color: #8b5cf6;
        }

        .post-main {
          display: flex;
          gap: 16px;
          padding: 20px;
        }

        .post-avatar-col {
          flex-shrink: 0;
        }
        .post-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(110,231,183,0.12);
          border: 2px solid rgba(110,231,183,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #6EE7B7;
          cursor: pointer;
          transition: all 0.2s ease;
          overflow: hidden;
        }
        .post-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .post-avatar:hover {
          transform: scale(1.05);
          background: rgba(110,231,183,0.2);
        }

        .post-content-col {
          flex: 1;
          min-width: 0;
        }

        .post-header {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
        }
        .post-author-info {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .post-author-name {
          font-size: 15px;
          font-weight: 700;
          color: #f0f0f3;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        .post-author-name:hover {
          color: #6EE7B7;
        }
        .post-badge {
          padding: 2px 8px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 600;
        }
        .post-badge.admin {
          background: rgba(96,165,250,0.12);
          color: #60a5fa;
          border: 1px solid rgba(96,165,250,0.25);
        }
        .post-badge.organizer {
          background: rgba(167,139,250,0.12);
          color: #a78bfa;
          border: 1px solid rgba(167,139,250,0.25);
        }
        .post-badge.judge {
          background: rgba(96,165,250,0.12);
          color: #60a5fa;
          border: 1px solid rgba(96,165,250,0.25);
        }
        .post-time {
          font-size: 13px;
          color: #5c5c6e;
        }

        .post-repost-context {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(96,165,250,0.08);
          border: 1px solid rgba(96,165,250,0.2);
          color: #93c5fd;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 8px;
          cursor: pointer;
          width: fit-content;
        }
        .post-repost-context img,
        .repost-avatar-fallback {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(96,165,250,0.15);
          color: #93c5fd;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
        }
        .post-repost-context img {
          object-fit: cover;
          display: block;
        }
        .post-repost-context strong {
          color: #f0f0f3;
        }

        .post-event-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: rgba(110,231,183,0.06);
          border: 1px solid rgba(110,231,183,0.15);
          border-radius: 100px;
          color: #6EE7B7;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .post-event-tag:hover {
          background: rgba(110,231,183,0.12);
        }

        .post-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
        }
        .post-follow-btn {
          padding: 6px 14px;
          background: transparent;
          border: 1px solid #26262e;
          border-radius: 999px;
          color: #cbd5f5;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .post-follow-btn:hover {
          border-color: rgba(110,231,183,0.4);
          color: #6EE7B7;
        }
        .post-follow-btn.following {
          background: rgba(110,231,183,0.12);
          border-color: rgba(110,231,183,0.3);
          color: #6EE7B7;
        }
        .post-follow-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .post-follow-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(203,213,245,0.2);
          border-top-color: #cbd5f5;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          display: inline-block;
        }
        .post-menu {
          position: relative;
        }
        .post-menu-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid #1e1e24;
          border-radius: 8px;
          color: #5c5c6e;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .post-menu-btn:hover {
          background: #1e1e24;
          color: #f0f0f3;
        }
        .post-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          min-width: 140px;
          background: #1a1a1f;
          border: 1px solid #1e1e24;
          border-radius: 10px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
          z-index: 100;
          overflow: hidden;
          animation: menuFadeIn 0.2s ease;
        }
        .dropdown-item {
          width: 100%;
          padding: 12px 16px;
          background: transparent;
          border: none;
          color: #f0f0f3;
          font-size: 14px;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .dropdown-item:last-child {
          border-bottom: none;
        }
        .dropdown-item:hover {
          background: rgba(110,231,183,0.1);
          color: #6EE7B7;
          padding-left: 20px;
        }
        .dropdown-item.danger {
          color: #f87171;
        }
        .dropdown-item.danger:hover {
          background: rgba(248,113,113,0.12);
          color: #f87171;
          padding-left: 20px;
        }

        .post-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #f0f0f3;
          margin: 0 0 8px 0;
          line-height: 1.4;
        }

        .post-content {
          font-size: 15px;
          color: #b0b0ba;
          line-height: 1.7;
          margin: 0 0 12px 0;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .post-winners {
          background: rgba(139,92,246,0.06);
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 12px;
          margin-bottom: 12px;
          overflow: hidden;
        }
        .winner-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(139,92,246,0.12);
        }
        .winner-row:last-child {
          border-bottom: none;
        }
        .winner-medal {
          font-size: 11px;
          font-weight: 700;
          color: #c4b5fd;
          background: rgba(139,92,246,0.18);
          border: 1px solid rgba(139,92,246,0.3);
          padding: 4px 8px;
          border-radius: 999px;
        }
        .winner-info {
          flex: 1;
          min-width: 0;
        }
        .winner-title {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #f0f0f3;
          margin-bottom: 2px;
        }
        .winner-team {
          font-size: 12px;
          color: #c4b5fd;
        }

        .post-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
        }
        .post-tag {
          padding: 4px 12px;
          background: rgba(110,231,183,0.04);
          border: 1px solid rgba(110,231,183,0.15);
          border-radius: 100px;
          color: #6EE7B7;
          font-size: 11px;
          font-weight: 500;
        }

        .post-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 4px;
        }
        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: none;
          background: transparent;
          color: #5c5c6e;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 100px;
          transition: all 0.2s ease;
        }
        .action-btn:hover {
          background: rgba(255,255,255,0.04);
          color: #f0f0f3;
        }
        .action-btn.repost.active {
          color: #4ade80;
        }
        .action-btn.like.active {
          color: #f87171;
        }
        .action-btn.comment:hover {
          color: #60a5fa;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes menuFadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 600px) {
          .post-main {
            padding: 16px;
            gap: 12px;
          }
          .post-avatar {
            width: 40px;
            height: 40px;
            font-size: 16px;
          }
          .action-btn {
            padding: 6px 12px;
          }
        }
      `}</style>
    </article>
  );
}

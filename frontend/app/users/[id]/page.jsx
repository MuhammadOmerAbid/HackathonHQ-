"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "../../../utils/axios";
import PostCard from "../../../components/community/PostCard";
import ModerationModal from "@/components/users/ModerationModal";

export default function UserProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [profileUser, setProfileUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [moderationOpen, setModerationOpen] = useState(false);
  const [moderationAction, setModerationAction] = useState("warn");
  const [moderationError, setModerationError] = useState("");
  const [moderationSaving, setModerationSaving] = useState(false);
  const [moderationMessage, setModerationMessage] = useState({ type: "", text: "" });

  const loadProfile = async () => {
    setLoading(true);
    setPostsLoading(true);
    setError("");
    try {
      const [meRes, userRes, postsRes] = await Promise.all([
        axios.get("/users/me/").catch(() => null),
        axios.get(`/users/${id}/`),
        axios.get(`/posts/?author=${id}&ordering=-created_at&page_size=10`)
      ]);
      setCurrentUser(meRes?.data || null);
      setProfileUser(userRes.data);
      setIsFollowing(!!userRes.data?.is_following);
      const list = postsRes.data?.results || postsRes.data || [];
      setPosts(list);
    } catch (err) {
      console.error("Error loading user profile:", err);
      setError("User not found.");
    } finally {
      setLoading(false);
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadProfile();
  }, [id]);

  const handleFollow = async () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }
    if (!profileUser?.id || profileUser.id === currentUser.id) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await axios.post(`/users/${profileUser.id}/unfollow/`);
      } else {
        await axios.post(`/users/${profileUser.id}/follow/`);
      }
      setIsFollowing(!isFollowing);
      setProfileUser((prev) => {
        if (!prev) return prev;
        const delta = isFollowing ? -1 : 1;
        return {
          ...prev,
          followers_count: Math.max(0, (prev.followers_count || 0) + delta),
          is_following: !isFollowing
        };
      });
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLike = async (postId) => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    try {
      await axios.post(`/posts/${postId}/like/`);
      setPosts(prev => prev.map(post => {
        if (post.id !== postId) return post;
        const liked = post.liked_by?.includes(currentUser.id);
        return {
          ...post,
          likes_count: liked ? (post.likes_count || 1) - 1 : (post.likes_count || 0) + 1,
          liked_by: liked
            ? (post.liked_by || []).filter(id => id !== currentUser.id)
            : [...(post.liked_by || []), currentUser.id]
        };
      }));
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleRepost = async (postId) => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    try {
      await axios.post(`/posts/${postId}/repost/`);
      setPosts(prev => prev.map(post => {
        if (post.id !== postId) return post;
        const reposted = post.reposted_by?.includes(currentUser.id);
        return {
          ...post,
          reposts_count: reposted ? (post.reposts_count || 1) - 1 : (post.reposts_count || 0) + 1,
          reposted_by: reposted
            ? (post.reposted_by || []).filter(id => id !== currentUser.id)
            : [...(post.reposted_by || []), currentUser.id]
        };
      }));
    } catch (error) {
      console.error("Error reposting:", error);
    }
  };

  const isCurrentAdmin = currentUser?.is_superuser || currentUser?.is_staff;
  const isCurrentOrganizer = currentUser?.is_organizer || currentUser?.profile?.is_organizer;
  const targetIsAdmin = profileUser?.is_superuser || profileUser?.is_staff;
  const targetIsOrganizer = profileUser?.is_organizer || profileUser?.profile?.is_organizer;
  const canModerateTarget = !!(
    currentUser &&
    profileUser &&
    currentUser.id !== profileUser.id &&
    (isCurrentAdmin || (isCurrentOrganizer && !(targetIsAdmin || targetIsOrganizer)))
  );
  const allowedModerationActions = isCurrentAdmin ? ["warn", "suspend", "ban"] : ["warn", "suspend"];

  const openModeration = (actionType = "warn") => {
    setModerationAction(actionType);
    setModerationError("");
    setModerationOpen(true);
  };

  const closeModeration = () => {
    if (moderationSaving) return;
    setModerationOpen(false);
    setModerationError("");
  };

  const handleModerationSubmit = async ({ action, reason, message: note, durationDays, notifyUser }) => {
    if (!profileUser) return;
    setModerationSaving(true);
    setModerationError("");
    setModerationMessage({ type: "", text: "" });
    try {
      const payload = {
        reason,
        message: note || "",
        notify_user: !!notifyUser,
      };
      if (action === "suspend") {
        payload.duration_days = durationDays;
      }
      if (action === "ban" && durationDays) {
        payload.duration_days = durationDays;
      }
      const res = await axios.post(`/users/${profileUser.id}/${action}/`, payload);
      setModerationMessage({ type: "success", text: res.data?.success || `User ${action}ed successfully.` });
      setModerationOpen(false);
      await loadProfile();
    } catch (err) {
      setModerationError(err.response?.data?.error || "Failed to moderate user.");
      setModerationMessage({ type: "error", text: err.response?.data?.error || "Failed to moderate user." });
    } finally {
      setModerationSaving(false);
    }
  };

  if (error) {
    return (
      <div className="profile-page">
        <div className="hero-section error-hero">
          <button className="back-btn" onClick={() => router.push("/users")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Users
          </button>
        </div>
        <div className="error-card">{error}</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div
        className="profile-hero"
        style={profileUser?.cover_image ? { backgroundImage: `url(${profileUser.cover_image})` } : undefined}
      >
        <div className="hero-overlay" />
        
        {/* Back button inside hero */}
        <div className="hero-back">
          <button className="back-btn" onClick={() => router.push("/users")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Users
          </button>
        </div>

        <div className="profile-header">
          <div className="profile-avatar">
            {profileUser?.avatar ? (
              <img src={profileUser.avatar} alt="" />
            ) : (
              profileUser?.username?.[0]?.toUpperCase() || "U"
            )}
          </div>
          <div className="profile-main">
            <h1>{profileUser?.username || "User"}</h1>
            <div className="profile-badges">
              {profileUser?.is_staff && <span className="badge admin">Admin</span>}
              {profileUser?.is_organizer && <span className="badge organizer">Organizer</span>}
              {profileUser?.is_judge && <span className="badge judge">Judge</span>}
            </div>
            <p className="profile-bio">
              {profileUser?.bio || "No bio yet."}
            </p>
            <div className="profile-meta">
              {profileUser?.location && <span>{profileUser.location}</span>}
              {profileUser?.organization_name && <span>{profileUser.organization_name}</span>}
            </div>
          </div>
          <div className="profile-actions">
            {currentUser && profileUser?.id !== currentUser.id && (
              <button
                className={`follow-btn ${isFollowing ? 'following' : ''}`}
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? <span className="btn-spinner" /> : isFollowing ? "Following" : "Follow"}
              </button>
            )}
            {canModerateTarget && (
              <button
                className="moderate-btn"
                onClick={() => openModeration("warn")}
                disabled={moderationSaving}
              >
                Moderate User
              </button>
            )}
          </div>
        </div>
      </div>

      {moderationMessage.text && (
        <div className={`moderation-banner ${moderationMessage.type}`}>
          {moderationMessage.text}
        </div>
      )}

      <div className="profile-stats">
        <div className="stat">
          <span className="stat-value">{profileUser?.posts_count || 0}</span>
          <span className="stat-label">Posts</span>
        </div>
        <div className="stat">
          <span className="stat-value">{profileUser?.followers_count || 0}</span>
          <span className="stat-label">Followers</span>
        </div>
        <div className="stat">
          <span className="stat-value">{profileUser?.following_count || 0}</span>
          <span className="stat-label">Following</span>
        </div>
      </div>

      <ModerationModal
        isOpen={moderationOpen}
        onClose={closeModeration}
        onSubmit={handleModerationSubmit}
        targetUser={profileUser}
        allowedActions={allowedModerationActions}
        initialAction={moderationAction}
        loading={moderationSaving}
        error={moderationError}
      />

      <div className="profile-posts">
        {postsLoading || loading ? (
          <div className="posts-skeleton">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={`profile-post-skel-${idx}`} className="post-skeleton">
                <div className="skeleton-avatar" />
                <div className="skeleton-lines">
                  <div className="skeleton-line short" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-posts">No posts yet.</div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onLike={handleLike}
              onRepost={handleRepost}
              onDelete={() => {}}
            />
          ))
        )}
      </div>

      <style jsx>{`
        .profile-page {
          min-height: calc(100vh - 70px);
          background: #0a0a0a;
          color: #f0f0f3;
          padding-bottom: 40px;
        }

        .profile-hero {
          position: relative;
          background: linear-gradient(120deg, #111114, #0c0c0f);
          background-size: cover;
          background-position: center;
          border-bottom: 1px solid #1e1e24;
          padding: 24px 32px 32px;
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.4), rgba(0,0,0,0.8));
        }

        /* Back button positioned inside hero */
        .hero-back {
          position: relative;
          z-index: 3;
          margin-bottom: 16px;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(4px);
          color: #f0f0f3;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .back-btn:hover {
          border-color: #6EE7B7;
          color: #6EE7B7;
          transform: translateX(-4px);
          background: rgba(0,0,0,0.5);
        }

        .back-btn svg {
          stroke: currentColor;
        }

        .profile-header {
          position: relative;
          display: grid;
          grid-template-columns: 96px 1fr auto;
          gap: 20px;
          align-items: center;
          z-index: 2;
          max-width: 1200px;
          margin: 0 auto;
        }

        .profile-avatar {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background: rgba(110,231,183,0.12);
          border: 2px solid rgba(110,231,183,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          font-weight: 700;
          color: #6EE7B7;
          overflow: hidden;
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-main h1 {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          margin: 0 0 6px 0;
        }

        .profile-badges {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }

        .badge {
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 600;
          border: 1px solid transparent;
        }

        .badge.admin {
          background: rgba(96,165,250,0.12);
          color: #60a5fa;
          border-color: rgba(96,165,250,0.25);
        }

        .badge.organizer {
          background: rgba(167,139,250,0.12);
          color: #a78bfa;
          border-color: rgba(167,139,250,0.25);
        }

        .badge.judge {
          background: rgba(96,165,250,0.12);
          color: #60a5fa;
          border-color: rgba(96,165,250,0.25);
        }

        .profile-bio {
          color: #cbd5f5;
          font-size: 14px;
          margin: 0 0 8px 0;
        }

        .profile-meta {
          display: flex;
          gap: 12px;
          color: #8b8b9e;
          font-size: 12px;
        }

        .profile-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .follow-btn {
          padding: 10px 22px;
          border-radius: 999px;
          border: 1px solid #26262e;
          background: transparent;
          color: #cbd5f5;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .follow-btn:hover {
          border-color: rgba(110,231,183,0.4);
          color: #6EE7B7;
        }

        .follow-btn.following {
          background: rgba(110,231,183,0.12);
          border-color: rgba(110,231,183,0.3);
          color: #6EE7B7;
        }

        .follow-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .moderate-btn {
          padding: 10px 18px;
          border-radius: 999px;
          border: 1px solid rgba(251,191,36,0.35);
          background: rgba(251,191,36,0.12);
          color: #fbbf24;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .moderate-btn:hover {
          background: rgba(251,191,36,0.2);
          border-color: rgba(251,191,36,0.5);
        }
        .moderate-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .moderation-banner {
          max-width: 900px;
          margin: 16px auto 0;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13px;
          border: 1px solid transparent;
          background: #111114;
        }
        .moderation-banner.success {
          color: #6EE7B7;
          border-color: rgba(110,231,183,0.3);
          background: rgba(110,231,183,0.08);
        }
        .moderation-banner.error {
          color: #f87171;
          border-color: rgba(248,113,113,0.3);
          background: rgba(248,113,113,0.08);
        }

        .btn-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(203,213,245,0.2);
          border-top-color: #cbd5f5;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          display: inline-block;
        }

        .profile-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 20px 32px;
          border-bottom: 1px solid #1e1e24;
          background: #0f0f12;
        }

        .stat {
          text-align: center;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 700;
          display: block;
        }

        .stat-label {
          font-size: 11px;
          color: #5c5c6e;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .profile-posts {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px 16px;
        }

        .empty-posts {
          padding: 40px;
          text-align: center;
          color: #5c5c6e;
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 16px;
        }

        .posts-skeleton {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .post-skeleton {
          display: flex;
          gap: 16px;
          padding: 16px;
          border: 1px solid #1e1e24;
          border-radius: 14px;
          background: #111114;
        }

        .skeleton-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(90deg, #17171b 25%, #1f1f26 37%, #17171b 63%);
          background-size: 400% 100%;
          animation: shimmer 1.6s infinite;
          flex-shrink: 0;
        }

        .skeleton-lines {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .skeleton-line {
          height: 10px;
          border-radius: 6px;
          background: linear-gradient(90deg, #17171b 25%, #1f1f26 37%, #17171b 63%);
          background-size: 400% 100%;
          animation: shimmer 1.6s infinite;
        }

        .skeleton-line.short {
          width: 40%;
        }

        .hero-section.error-hero {
          padding: 20px 32px;
          margin-bottom: 24px;
        }

        .error-card {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          border-radius: 16px;
          background: #111114;
          border: 1px solid #1e1e24;
        }

        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 800px) {
          .profile-hero {
            padding: 16px 20px 24px;
          }

          .profile-header {
            grid-template-columns: 72px 1fr;
            grid-template-rows: auto auto;
          }

          .profile-actions {
            grid-column: 1 / -1;
            justify-content: flex-start;
            margin-top: 8px;
          }

          .profile-avatar {
            width: 72px;
            height: 72px;
            font-size: 24px;
          }

          .profile-main h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}

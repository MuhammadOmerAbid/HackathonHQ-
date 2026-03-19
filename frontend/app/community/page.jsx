"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "../../utils/axios";
import PostCard from "../../components/community/PostCard";
import ComposeBox from "../../components/community/ComposeBox";
import ActiveUsers from "../../components/community/ActiveUsers";
import { useMessaging } from "@/context/MessagingContext";

export default function CommunityPage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [feedType, setFeedType] = useState("for-you");
  const [showCompose, setShowCompose] = useState(false);
  const [trendingTags, setTrendingTags] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [activeUsersLoading, setActiveUsersLoading] = useState(false);
  
  
  const { openInbox, openChat } = useMessaging();
  const feedRef = useRef(null);
  const loadMoreRef = useRef(null);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!user) {
      setPosts([]);
      setHasMore(false);
      setPostsLoading(false);
      return;
    }
    setPage(1);
    setHasMore(true);
    fetchPosts({ mode: feedType, pageParam: 1, append: false });
  }, [feedType, user?.id]);

  const buildPostsUrl = (mode, pageParam = 1, pageSize = PAGE_SIZE) => {
    const params = new URLSearchParams();
    params.set("ordering", "-created_at");
    params.set("page", String(pageParam));
    params.set("page_size", String(pageSize));
    if (mode === "announcements") params.set("post_type", "announcement");
    if (mode === "results") params.set("post_type", "result");
    if (mode === "following") params.set("following", "1");
    return `/posts/?${params.toString()}`;
  };

  const fetchPosts = async ({ mode = feedType, pageParam = 1, append = false } = {}) => {
    if (!user) {
      setPosts([]);
      setHasMore(false);
      setPostsLoading(false);
      return;
    }
    if (pageParam === 1) {
      setPostsLoading(true);
    } else {
      setIsFetchingMore(true);
    }
    try {
      const res = await axios.get(buildPostsUrl(mode, pageParam, PAGE_SIZE));
      const list = res.data?.results || res.data || [];
      if (append) {
        setPosts(prev => [...prev, ...list]);
      } else {
        setPosts(list);
      }
      const hasNext = typeof res.data?.next !== "undefined"
        ? !!res.data.next
        : list.length === PAGE_SIZE;
      setHasMore(hasNext);
      setPage(pageParam);
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      if (pageParam === 1) {
        setPostsLoading(false);
      } else {
        setIsFetchingMore(false);
      }
    }
  };

  const fetchInitialData = async () => {
    setActiveUsersLoading(true);
    setActivityLoading(true);
    try {
      const [userRes, tagsRes, usersRes, eventsRes, notifRes, activityRes] = await Promise.all([
        axios.get("/users/me/").catch(() => null),
        axios.get("/posts/trending-tags/").catch(() => null),
        axios.get("/users/active/?limit=8&scope=following").catch(() => null),
        axios.get("/events/live/").catch(() => null),
        axios.get("/notifications/unread/count/").catch(() => null),
        axios.get("/users/activities/?scope=inbound").catch(() => null),
      ]);

      setUser(userRes?.data || null);
      
      if (tagsRes?.data) {
        setTrendingTags(Array.isArray(tagsRes.data) ? tagsRes.data.slice(0, 10) : []);
      }
      
      if (usersRes?.data) {
        setActiveUsers(usersRes.data.results || usersRes.data || []);
      }

      if (eventsRes?.data) {
        setLiveEvents(eventsRes.data.results || eventsRes.data || []);
      }

      if (activityRes?.data) {
        setRecentActivity(activityRes.data || []);
      }

      if (notifRes?.data?.count) {
        setUnreadNotifications(notifRes.data.count);
      }

      setOnlineCount((usersRes?.data?.results || usersRes?.data || []).length || 0);
    } catch (err) {
      console.error("Error fetching community data:", err);
    } finally {
      setActiveUsersLoading(false);
      setActivityLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchActivity();
      fetchActiveUsers();
    }, 20000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const fetchActivity = async () => {
    setActivityLoading(true);
    try {
      const res = await axios.get("/users/activities/?scope=inbound");
      setRecentActivity(res.data || []);
    } catch (err) {
      console.error("Error fetching activity:", err);
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchActiveUsers = async () => {
    setActiveUsersLoading(true);
    try {
      const res = await axios.get("/users/active/?limit=8&scope=following");
      const list = res.data.results || res.data || [];
      setActiveUsers(list);
      setOnlineCount(list.length || 0);
    } catch (err) {
      console.error("Error fetching active users:", err);
    } finally {
      setActiveUsersLoading(false);
    }
  };

  useEffect(() => {
    if (!loadMoreRef.current || !feedRef.current) return;
    if (!hasMore || postsLoading || isFetchingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchPosts({ mode: feedType, pageParam: page + 1, append: true });
        }
      },
      { root: feedRef.current, rootMargin: "200px" }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [feedType, page, hasMore, postsLoading, isFetchingMore, user?.id]);

  const timeAgo = (dateString) => {
    if (!dateString) return "";
    const diff = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleCreatePost = async (postData) => {
    try {
      const response = await axios.post("/posts/", postData);
      const fullPost = await axios.get(`/posts/${response.data.id}/?expand=author,event`);
      setPosts(prev => [fullPost.data, ...prev]);
      setShowCompose(false);
      feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  };

  const handleLike = async (postId) => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      await axios.post(`/posts/${postId}/like/`);
      setPosts(prev => prev.map(post => {
        if (post.id !== postId) return post;
        const liked = post.liked_by?.includes(user.id);
        return {
          ...post,
          likes_count: liked ? (post.likes_count || 1) - 1 : (post.likes_count || 0) + 1,
          liked_by: liked
            ? (post.liked_by || []).filter(id => id !== user.id)
            : [...(post.liked_by || []), user.id]
        };
      }));
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleRepost = async (postId) => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      await axios.post(`/posts/${postId}/repost/`);
      setPosts(prev => prev.map(post => {
        if (post.id !== postId) return post;
        const reposted = post.reposted_by?.includes(user.id);
        return {
          ...post,
          reposts_count: reposted ? (post.reposts_count || 1) - 1 : (post.reposts_count || 0) + 1,
          reposted_by: reposted
            ? (post.reposted_by || []).filter(id => id !== user.id)
            : [...(post.reposted_by || []), user.id]
        };
      }));
    } catch (error) {
      console.error("Error reposting:", error);
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm("Delete this post?")) return;
    try {
      await axios.delete(`/posts/${postId}/`);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const filteredPosts = posts.filter(post => {
    if (feedType === "for-you") return true;
    if (feedType === "following") return !!user;
    if (feedType === "announcements") return post.post_type === "announcement";
    if (feedType === "results") return post.post_type === "result";
    return true;
  });

  return (
    <div className="community-container">
      {/* Left Sidebar - Brand Hero & Navigation */}
<div className="community-left">
  <div className="community-logo">
    <div className="logo-eyebrow">
      <span className="logo-eyebrow-dot" />
      <span className="logo-eyebrow-label">community</span>
    </div>
    <span className="logo-text">HackathonHQ</span>
  </div>

        <nav className="community-nav">
          <button
            className={`nav-item ${feedType === "for-you" ? "active" : ""}`}
            onClick={() => setFeedType("for-you")}
          >
            <span className="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <span className="nav-label">For You</span>
          </button>
          
          <button
            className={`nav-item ${feedType === "following" ? "active" : ""}`}
            onClick={() => setFeedType("following")}
          >
            <span className="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span className="nav-label">Following</span>
          </button>
          
          <button
            className={`nav-item ${feedType === "announcements" ? "active" : ""}`}
            onClick={() => setFeedType("announcements")}
          >
            <span className="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </span>
            <span className="nav-label">Announcements</span>
          </button>
          
          <button
            className={`nav-item ${feedType === "results" ? "active" : ""}`}
            onClick={() => setFeedType("results")}
          >
            <span className="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
              </svg>
            </span>
            <span className="nav-label">Results</span>
          </button>
        </nav>

        {user ? (
          <div className="user-profile-card">
            <div className="user-profile-header">
              <div className="user-avatar-large">
                {user.avatar ? <img src={user.avatar} alt="" /> : user.username?.[0]?.toUpperCase()}
              </div>
              <div className="user-info">
                <div className="user-name">{user.username}</div>
                <div className="user-role">
                  {user.is_staff ? 'Admin' : user.is_organizer ? 'Organizer' : user.is_judge ? 'Judge' : 'Hacker'}
                </div>
              </div>
            </div>
            <div className="user-stats">
              <div className="user-stat">
                <span className="stat-value">{posts.filter(p => p.author?.id === user.id).length}</span>
                <span className="stat-label">Posts</span>
              </div>
              <div className="user-stat">
                <span className="stat-value">{posts.reduce((acc, p) => acc + (p.liked_by?.includes(user.id) ? 1 : 0), 0)}</span>
                <span className="stat-label">Likes</span>
              </div>
              <div className="user-stat">
                <span className="stat-value">{unreadNotifications}</span>
                <span className="stat-label">Notifications</span>
              </div>
            </div>
            <button className="create-post-btn" onClick={() => setShowCompose(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Post
            </button>
          </div>
        ) : (
          <div className="login-prompt">
            <p>Join the conversation</p>
            <button className="login-btn" onClick={() => router.push('/login')}>
              Sign In
            </button>
            <button className="signup-btn" onClick={() => router.push('/register')}>
              Create Account
            </button>
          </div>
        )}

        <div className="online-indicator">
          <span className="online-dot"></span>
          <span className="online-text">{onlineCount} active now</span>
        </div>
      </div>

      {/* Main Feed - Clean, just posts */}
      <div className="community-feed" ref={feedRef}>
        {/* Compose Area */}
        {user && showCompose ? (
          <div className="compose-wrapper">
            <ComposeBox
              user={user}
              onPost={handleCreatePost}
              onCancel={() => setShowCompose(false)}
            />
          </div>
        ) : user && (
          <div className="compose-trigger" onClick={() => setShowCompose(true)}>
            <div className="trigger-avatar">
              {user.avatar ? <img src={user.avatar} alt="" /> : user.username?.[0]?.toUpperCase()}
            </div>
            <div className="trigger-input">
              What's happening in the hackathon world?
            </div>
            <button className="trigger-btn">Post</button>
          </div>
        )}

        {/* Feed Tabs */}
        <div className="feed-tabs">
          <button
            className={`feed-tab ${feedType === "for-you" ? "active" : ""}`}
            onClick={() => setFeedType("for-you")}
          >
            For You
          </button>
          <button
            className={`feed-tab ${feedType === "following" ? "active" : ""}`}
            onClick={() => setFeedType("following")}
          >
            Following
          </button>
          <button
            className={`feed-tab ${feedType === "announcements" ? "active" : ""}`}
            onClick={() => setFeedType("announcements")}
          >
            Announcements
          </button>
          <button
            className={`feed-tab ${feedType === "results" ? "active" : ""}`}
            onClick={() => setFeedType("results")}
          >
            Results
          </button>
        </div>

        {/* Posts Feed */}
        <div className="posts-feed">
          {postsLoading || loading ? (
            <div className="feed-skeleton">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={`post-skel-${idx}`} className="post-skeleton">
                  <div className="skeleton-avatar" />
                  <div className="skeleton-lines">
                    <div className="skeleton-line short" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="empty-feed">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3>No posts yet</h3>
              <p>Be the first to start a conversation!</p>
              {user && (
                <button className="empty-post-btn" onClick={() => setShowCompose(true)}>
                  Create your first post
                </button>
              )}
            </div>
          ) : (
            filteredPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={user}
                onLike={handleLike}
                onRepost={handleRepost}
                onDelete={handleDelete}
              />
            ))
          )}
          {isFetchingMore && (
            <div className="feed-skeleton compact">
              {Array.from({ length: 2 }).map((_, idx) => (
                <div key={`post-more-skel-${idx}`} className="post-skeleton">
                  <div className="skeleton-avatar" />
                  <div className="skeleton-lines">
                    <div className="skeleton-line short" />
                    <div className="skeleton-line" />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={loadMoreRef} className="feed-sentinel" />
        </div>
      </div>

      {/* Right Sidebar - Discover & Activity */}
<div className="community-right">
  {/* Live Events */}
  {liveEvents.length > 0 && (
    <div className="right-card live-card">
      <div className="card-header">
        <span className="live-indicator"></span>
        <h3>Live Now</h3>
      </div>
      <div className="live-events">
        {liveEvents.map(event => (
          <div key={event.id} className="live-event-item">
            <div className="event-name">{event.name}</div>
            <div className="event-participants">
              <span className="participant-count">
                {event.participants_count ?? event.teams_count ?? 0}
              </span> participants
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

  {/* Direct Messages - Main Messaging Hub */}
  {user && (
  <div className="right-card">
      <h3>Messages</h3>
      <button
        className="dm-open-btn"
        onClick={() => openInbox()}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Open Messages
      </button>
    </div>
  )}

  {/* Active Users - Quick Message Access */}
  <ActiveUsers 
    users={activeUsers} 
    loading={activeUsersLoading || loading}
    onMessageClick={(user) => {
      openChat(user);
    }} 
  />

  {/* Recent Activity */}
  <div className="right-card">
    <h3>Recent Activity</h3>
    <div className="activity-feed">
      {activityLoading ? (
        <div className="activity-skeleton">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`activity-skel-${idx}`} className="activity-skeleton-row">
              <span className="skeleton-dot" />
              <span className="skeleton-line wide" />
              <span className="skeleton-line tiny" />
            </div>
          ))}
        </div>
      ) : recentActivity.length === 0 ? (
        <div className="activity-empty">No recent interactions yet.</div>
      ) : (
        recentActivity.slice(0, 6).map((item) => (
          <div key={item.id} className="activity-item">
            <span className="activity-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
            <span className="activity-text">
              <strong>{item.title || "Update"}</strong> {item.description || ""}
            </span>
            <span className="activity-time">{timeAgo(item.created_at)}</span>
          </div>
        ))
      )}
    </div>
  </div>

  {/* Footer Links */}
  <div className="sidebar-footer">
    <a href="#">About</a>
    <span>•</span>
    <a href="#">Guidelines</a>
    <span>•</span>
    <a href="#">Support</a>
  </div>
</div>

      <style jsx>{`

/* Right sidebar message button */
.dm-open-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  background: #17171b;
  border: 1px solid #26262e;
  border-radius: 12px;
  color: #888;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.dm-open-btn:hover {
  background: #1e1e24;
  border-color: rgba(110,231,183,0.3);
  color: #f0f0f3;
}

        :global(html) {
          height: 100%;
        }
        :global(body) {
          background: #0a0a0a;
          overflow: hidden;
        }
        
        .community-container {
          display: grid;
          grid-template-columns: 280px 1fr 320px;
          gap: 24px;
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px 32px;
          min-height: calc(100vh - 70px);
          height: calc(100vh - 70px);
          overflow: hidden;
          background: #0a0a0a;
          font-family: 'DM Sans', sans-serif;
        }

        /* Left Sidebar - Brand Hero */
        .community-left {
          height: 100%;
          max-height: 100%;
          overflow-y: auto;
          min-height: 0;
        }

        

        .community-logo {
  margin-bottom: 32px;
  padding: 0 8px;
}
.logo-eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.logo-eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6EE7B7;
}
.logo-eyebrow-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #6EE7B7;
}
.logo-text {
  font-family: 'Syne', sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: #f0f0f3;
  display: block;
  line-height: 1.2;
}
        .logo-badge {
          font-size: 11px;
          color: #5c5c6e;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .community-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 24px;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          background: transparent;
          border: none;
          border-radius: 12px;
          color: #888;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          text-align: left;
        }
        .nav-item:hover {
          background: rgba(255,255,255,0.03);
          color: #f0f0f3;
        }
        .nav-item.active {
          background: rgba(110,231,183,0.1);
          color: #6EE7B7;
          border-left: 3px solid #6EE7B7;
        }
        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }
        .nav-icon svg {
          width: 20px;
          height: 20px;
          stroke: currentColor;
        }

        .user-profile-card {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 16px;
        }
        .user-profile-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .user-avatar-large {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(110,231,183,0.12);
          border: 2px solid rgba(110,231,183,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #6EE7B7;
          overflow: hidden;
        }
        .user-avatar-large img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .user-info {
          flex: 1;
        }
        .user-name {
          font-size: 16px;
          font-weight: 700;
          color: #f0f0f3;
          margin-bottom: 4px;
        }
        .user-role {
          font-size: 12px;
          color: #6EE7B7;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .user-stats {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
          margin-bottom: 16px;
          padding: 12px 0;
          border-top: 1px solid #1e1e24;
          border-bottom: 1px solid #1e1e24;
        }
        .user-stat {
          text-align: center;
        }
        .stat-value {
          display: block;
          font-size: 18px;
          font-weight: 700;
          color: #f0f0f3;
        }
        .stat-label {
          font-size: 10px;
          color: #5c5c6e;
          text-transform: uppercase;
        }
        .create-post-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px;
          background: #6EE7B7;
          border: none;
          border-radius: 100px;
          color: #0c0c0f;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .create-post-btn:hover {
          background: #86efac;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(110,231,183,0.3);
        }

        .login-prompt {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 16px;
          padding: 24px 20px;
          text-align: center;
          margin-bottom: 16px;
        }
        .login-prompt p {
          color: #888;
          font-size: 14px;
          margin-bottom: 16px;
        }
        .login-btn {
          width: 100%;
          padding: 10px;
          background: transparent;
          border: 1px solid #6EE7B7;
          border-radius: 100px;
          color: #6EE7B7;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 8px;
          transition: all 0.2s ease;
        }
        .login-btn:hover {
          background: #6EE7B7;
          color: #0c0c0f;
        }
        .signup-btn {
          width: 100%;
          padding: 10px;
          background: #6EE7B7;
          border: none;
          border-radius: 100px;
          color: #0c0c0f;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .signup-btn:hover {
          background: #86efac;
        }

        .online-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: rgba(110,231,183,0.05);
          border-radius: 100px;
        }
        .online-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #6EE7B7;
          box-shadow: 0 0 12px rgba(110,231,183,0.8);
          animation: pulse 2s infinite;
        }
        .online-text {
          font-size: 13px;
          color: #f0f0f3;
        }

        /* Main Feed - Clean, just posts */
        .community-feed {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 20px;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: calc(100vh - 70px);
          min-height: 0;
          scrollbar-gutter: stable;
          scroll-behavior: smooth;
        }
        .community-feed::-webkit-scrollbar {
          width: 6px;
        }
        .community-feed::-webkit-scrollbar-track {
          background: #151519;
        }
        .community-feed::-webkit-scrollbar-thumb {
          background: #26262e;
          border-radius: 6px;
        }
        .community-feed::-webkit-scrollbar-thumb:hover {
          background: rgba(110,231,183,0.4);
        }
        .community-feed {
          scrollbar-width: thin;
          scrollbar-color: #26262e #151519;
        }

        .compose-trigger {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 24px;
          border-bottom: 1px solid #1e1e24;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .compose-trigger:hover {
          background: #151519;
        }
        .trigger-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(110,231,183,0.12);
          border: 2px solid rgba(110,231,183,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #6EE7B7;
          flex-shrink: 0;
          overflow: hidden;
        }
        .trigger-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .trigger-input {
          flex: 1;
          color: #888;
          font-size: 15px;
        }
        .trigger-btn {
          padding: 8px 24px;
          background: #6EE7B7;
          border: none;
          border-radius: 100px;
          color: #0c0c0f;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          opacity: 0.6;
        }

        .compose-wrapper {
          border-bottom: 1px solid #1e1e24;
        }

        .feed-tabs {
          display: flex;
          padding: 0 24px;
          border-bottom: 1px solid #1e1e24;
          background: rgba(17,17,20,0.95);
        }
        .feed-tab {
          padding: 16px 20px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: #888;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .feed-tab:hover {
          color: #f0f0f3;
        }
        .feed-tab.active {
          color: #6EE7B7;
          border-bottom-color: #6EE7B7;
        }

        .posts-feed {
          display: flex;
          flex-direction: column;
          padding-bottom: 8px;
        }
        .feed-sentinel {
          height: 1px;
        }
        .feed-skeleton {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px;
        }
        .feed-skeleton.compact {
          padding-top: 0;
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

        .empty-feed {
          padding: 80px 32px;
          text-align: center;
          color: #5c5c6e;
        }
        .empty-icon {
          display: flex;
          justify-content: center;
          margin-bottom: 16px;
          opacity: 0.5;
        }
        .empty-icon svg {
          width: 48px;
          height: 48px;
          stroke: currentColor;
        }
        .feed-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #1e1e24;
          border-top-color: #6EE7B7;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        .empty-feed h3 {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          color: #f0f0f3;
          margin-bottom: 8px;
        }
        .empty-feed p {
          font-size: 14px;
          margin-bottom: 24px;
        }
        .empty-post-btn {
          padding: 12px 28px;
          background: #6EE7B7;
          border: none;
          border-radius: 100px;
          color: #0c0c0f;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .empty-post-btn:hover {
          background: #86efac;
          transform: translateY(-2px);
        }

        .load-more {
          padding: 20px;
          text-align: center;
          border-top: 1px solid #1e1e24;
        }
        .load-more-btn {
          padding: 10px 28px;
          background: transparent;
          border: 1px solid #1e1e24;
          border-radius: 100px;
          color: #888;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .load-more-btn:hover {
          border-color: #6EE7B7;
          color: #6EE7B7;
        }

        /* Right Sidebar */
        .community-right {
          height: 100%;
          max-height: 100%;
          overflow-y: auto;
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .community-left::-webkit-scrollbar,
        .community-right::-webkit-scrollbar {
          width: 6px;
        }
        .community-left::-webkit-scrollbar-track,
        .community-right::-webkit-scrollbar-track {
          background: #151519;
        }
        .community-left::-webkit-scrollbar-thumb,
        .community-right::-webkit-scrollbar-thumb {
          background: #26262e;
          border-radius: 6px;
        }
        .community-left::-webkit-scrollbar-thumb:hover,
        .community-right::-webkit-scrollbar-thumb:hover {
          background: rgba(110,231,183,0.4);
        }
        .community-left,
        .community-right {
          scrollbar-width: thin;
          scrollbar-color: #26262e #151519;
        }

        .right-card {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 18px;
          padding: 20px;
        }
        .right-card h3 {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #f0f0f3;
          margin: 0 0 16px 0;
        }

        .live-card .card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .live-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #6EE7B7;
          box-shadow: 0 0 12px rgba(110,231,183,0.8);
          animation: pulse 2s infinite;
        }
        .live-events {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .live-event-item {
          padding: 8px 0;
          border-bottom: 1px solid rgba(30,30,36,0.5);
        }
        .live-event-item:last-child {
          border-bottom: none;
        }
        .event-name {
          font-size: 13px;
          font-weight: 600;
          color: #f0f0f3;
          margin-bottom: 4px;
        }
        .event-participants {
          font-size: 11px;
          color: #6EE7B7;
        }
        .participant-count {
          font-weight: 700;
        }

        .trending-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .trending-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 14px;
          background: #17171b;
          border: 1px solid #1e1e24;
          border-radius: 100px;
          color: #888;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .trending-tag:hover {
          border-color: #6EE7B7;
          color: #6EE7B7;
          background: rgba(110,231,183,0.04);
        }
        .tag-count {
          font-size: 10px;
          color: #5c5c6e;
        }

        .activity-feed {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 220px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .activity-feed::-webkit-scrollbar {
          width: 6px;
        }
        .activity-feed::-webkit-scrollbar-track {
          background: #151519;
        }
        .activity-feed::-webkit-scrollbar-thumb {
          background: #26262e;
          border-radius: 6px;
        }
        .activity-feed::-webkit-scrollbar-thumb:hover {
          background: rgba(110,231,183,0.4);
        }
        .activity-feed {
          scrollbar-width: thin;
          scrollbar-color: #26262e #151519;
        }
        .activity-skeleton {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .activity-skeleton-row {
          display: grid;
          grid-template-columns: 16px 1fr 40px;
          align-items: center;
          gap: 10px;
        }
        .skeleton-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: linear-gradient(90deg, #17171b 25%, #1f1f26 37%, #17171b 63%);
          background-size: 400% 100%;
          animation: shimmer 1.6s infinite;
        }
        .skeleton-line.wide {
          width: 100%;
        }
        .skeleton-line.tiny {
          width: 32px;
          height: 8px;
        }
        .activity-empty {
          font-size: 12px;
          color: #5c5c6e;
          text-align: center;
          padding: 8px 0;
        }
        .activity-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #888;
        }
        .activity-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          color: #5c5c6e;
        }
        .activity-icon svg {
          width: 14px;
          height: 14px;
          stroke: currentColor;
        }
        .activity-text {
          flex: 1;
        }
        .activity-text strong {
          color: #f0f0f3;
          font-weight: 600;
        }
        .activity-time {
          font-size: 10px;
          color: #5c5c6e;
        }

        .sidebar-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px;
          font-size: 11px;
        }
        .sidebar-footer a {
          color: #5c5c6e;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .sidebar-footer a:hover {
          color: #6EE7B7;
        }
        .sidebar-footer span {
          color: #3a3a48;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1000px) {
          .community-container {
            grid-template-columns: 1fr;
            padding: 16px;
          }
          .community-left, .community-right {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

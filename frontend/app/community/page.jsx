"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "../../utils/axios";
import LoadingSpinner from "@/components/LoadingSpinner";
import PostCard from "../../components/community/PostCard";
import ComposeBox from "../../components/community/ComposeBox";
import CommunitySidebar from "../../components/community/CommunitySidebar";

const TABS = [
  { key: "for_you",       label: "For You" },
  { key: "following",     label: "Following" },
  { key: "announcements", label: "📢 Announcements" },
  { key: "results",       label: "🏆 Results" },
];

export default function CommunityPage() {
  const [posts,      setPosts]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [user,       setUser]       = useState(null);
  const [tab,        setTab]        = useState("for_you");
  const [events,     setEvents]     = useState([]);
  const [trending,   setTrending]   = useState([]);
  const [topUsers,   setTopUsers]   = useState([]);
  const [search,     setSearch]     = useState("");
  const [tagFilter,  setTagFilter]  = useState("");
  const [page,       setPage]       = useState(1);
  const [hasMore,    setHasMore]    = useState(false);
  const [loadingMore,setLoadingMore]= useState(false);

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { fetchPosts(1); }, [tab, tagFilter]);

  const fetchAll = async () => {
    try {
      const [userRes, eventsRes] = await Promise.all([
        axios.get("/users/me/").catch(() => null),
        axios.get("/events/").catch(() => ({ data: [] }))
      ]);
      setUser(userRes?.data || null);
      const evArr = eventsRes.data.results || eventsRes.data || [];
      setEvents(evArr);

      // Fetch trending tags and top users if endpoint exists
      const [trendRes, usersRes] = await Promise.all([
        axios.get("/posts/trending-tags/").catch(() => null),
        axios.get("/users/?ordering=-posts_count&limit=5").catch(() => null),
      ]);
      if (trendRes?.data) setTrending(trendRes.data.slice(0, 8));
      if (usersRes?.data) setTopUsers(usersRes.data.results || usersRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPosts = useCallback(async (pageNum = 1) => {
    if (pageNum === 1) setLoading(true); else setLoadingMore(true);
    try {
      let url = `/posts/?expand=author,event&ordering=-is_pinned,-created_at&page=${pageNum}`;
      if (tab === "announcements") url += "&post_type=announcement";
      if (tab === "results")       url += "&post_type=result";
      if (tab === "following")     url += "&following=true";
      if (tagFilter)               url += `&tags=${tagFilter}`;

      const res = await axios.get(url);
      const data = res.data.results || res.data || [];
      if (pageNum === 1) setPosts(data);
      else setPosts(p => [...p, ...data]);
      setHasMore(!!res.data.next);
      setPage(pageNum);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [tab, tagFilter]);

  const handlePost = async (payload) => {
    const res  = await axios.post("/posts/", payload);
    const full = await axios.get(`/posts/${res.data.id}/?expand=author,event`).catch(() => res);
    setPosts(p => [full.data, ...p]);
  };

  const handleLike = async (postId) => {
    if (!user) return;
    try {
      await axios.post(`/posts/${postId}/like/`);
      setPosts(ps => ps.map(p => {
        if (p.id !== postId) return p;
        const liked = p.liked_by?.includes(user.id);
        return {
          ...p,
          likes_count:  liked ? (p.likes_count || 1) - 1  : (p.likes_count  || 0) + 1,
          liked_by: liked
            ? (p.liked_by || []).filter(id => id !== user.id)
            : [...(p.liked_by || []), user.id],
        };
      }));
    } catch (err) { console.error(err); }
  };

  const handleRepost = async (postId) => {
    if (!user) return;
    try {
      await axios.post(`/posts/${postId}/repost/`);
      setPosts(ps => ps.map(p => {
        if (p.id !== postId) return p;
        const reposted = p.reposted_by?.includes(user.id);
        return {
          ...p,
          reposts_count: reposted ? (p.reposts_count || 1) - 1 : (p.reposts_count || 0) + 1,
          reposted_by: reposted
            ? (p.reposted_by || []).filter(id => id !== user.id)
            : [...(p.reposted_by || []), user.id],
        };
      }));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (postId) => {
    if (!confirm("Delete this post?")) return;
    try {
      await axios.delete(`/posts/${postId}/`);
      setPosts(ps => ps.filter(p => p.id !== postId));
    } catch (err) { console.error(err); }
  };

  const filtered = posts.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.title?.toLowerCase().includes(q) ||
           p.content?.toLowerCase().includes(q) ||
           p.author?.username?.toLowerCase().includes(q) ||
           p.tags?.some(t => t.toLowerCase().includes(q));
  });

  return (
    <div className="cp-page">

      {/* Left: Feed */}
      <div className="cp-main">

        {/* Header */}
        <div className="cp-head">
          <div className="cp-head-top">
            <div>
              <div className="cp-eyebrow"><span className="cp-eyebrow-dot" /><span className="cp-eyebrow-label">Community</span></div>
              <h1 className="cp-title">Feed</h1>
            </div>
            {/* Search */}
            <div className="cp-search-wrap">
              <svg className="cp-search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input className="cp-search" placeholder="Search posts…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {/* Tag filter pill */}
          {tagFilter && (
            <div className="cp-tag-filter">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              #{tagFilter}
              <button className="cp-tag-clear" onClick={() => setTagFilter("")}>✕</button>
            </div>
          )}

          {/* Tabs */}
          <div className="cp-tabs">
            {TABS.map(t => (
              <button
                key={t.key}
                className={`cp-tab${tab === t.key ? " active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
                {t.key === "announcements" && posts.filter(p => p.post_type === "announcement").length > 0 && (
                  <span className="cp-tab-count">{posts.filter(p => p.post_type === "announcement").length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Compose */}
        {user && tab !== "results" && tab !== "announcements" && (
          <ComposeBox user={user} events={events} onPost={handlePost} />
        )}

        {/* Announcements-only compose for admins */}
        {user?.is_staff && tab === "announcements" && (
          <div className="cp-admin-compose-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Post a new announcement from the <strong>For You</strong> tab — select "Announcement" type.
          </div>
        )}

        {/* Feed */}
        <div className="cp-feed">
          {loading ? (
            <div className="cp-loading">
              <div className="cp-spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="cp-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <h3>{search ? "No posts match your search" : tab === "following" ? "Follow people to see their posts" : "Nothing here yet"}</h3>
              <p>{tab === "for_you" && !search ? "Be the first to post something!" : ""}</p>
            </div>
          ) : (
            <>
              {filtered.map(p => (
                <PostCard
                  key={p.id}
                  post={p}
                  currentUser={user}
                  onLike={handleLike}
                  onRepost={handleRepost}
                  onDelete={handleDelete}
                  compact
                />
              ))}
              {hasMore && (
                <button className="cp-load-more" onClick={() => fetchPosts(page + 1)} disabled={loadingMore}>
                  {loadingMore ? <span className="cp-spinner-sm" /> : "Load more"}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right: Sidebar */}
      <CommunitySidebar
        events={events}
        trending={trending}
        topUsers={topUsers}
        onTagClick={(tag) => { setTagFilter(tag); setTab("for_you"); }}
      />

      <style jsx>{`
        .cp-page {
          max-width: 1160px;
          margin: 0 auto;
          padding: 24px 32px 64px;
          font-family: 'DM Sans', sans-serif;
          min-height: calc(100vh - 70px);
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 24px;
          align-items: flex-start;
        }

        /* Main feed */
        .cp-main {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 18px;
          overflow: hidden;
        }

        /* Head */
        .cp-head {
          border-bottom: 1px solid #1e1e24;
          position: sticky;
          top: 70px;
          z-index: 20;
          background: #111114;
        }
        .cp-head-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 20px 20px 0;
        }
        .cp-eyebrow { display: flex; align-items: center; gap: 7px; margin-bottom: 4px; }
        .cp-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #6EE7B7; }
        .cp-eyebrow-label { font-size: 11px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; color: #6EE7B7; }
        .cp-title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 700; color: #f0f0f3; margin: 0; letter-spacing: -0.4px; }

        /* Search */
        .cp-search-wrap { position: relative; width: 200px; flex-shrink: 0; padding-top: 4px; }
        .cp-search-ico { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #3a3a48; pointer-events: none; }
        .cp-search {
          width: 100%; padding: 8px 12px 8px 32px; background: #17171b; border: 1px solid #1e1e24;
          border-radius: 100px; font-size: 13px; color: #f0f0f3; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color .15s;
        }
        .cp-search:focus { border-color: rgba(110,231,183,0.3); }
        .cp-search::placeholder { color: #3a3a48; }

        /* Tag filter */
        .cp-tag-filter {
          display: inline-flex; align-items: center; gap: 6px; margin: 10px 20px 0;
          padding: 4px 12px; background: rgba(110,231,183,0.08); border: 1px solid rgba(110,231,183,0.2);
          border-radius: 100px; font-size: 12.5px; color: #6EE7B7; font-weight: 500;
        }
        .cp-tag-clear { background: transparent; border: none; color: #6EE7B7; cursor: pointer; font-size: 11px; padding: 0; margin-left: 2px; }

        /* Tabs */
        .cp-tabs { display: flex; padding: 0 20px; overflow-x: auto; margin-top: 12px; }
        .cp-tabs::-webkit-scrollbar { display: none; }
        .cp-tab {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 10px 16px; border: none; background: transparent;
          font-size: 13.5px; font-weight: 500; font-family: 'DM Sans', sans-serif;
          color: #5c5c6e; cursor: pointer; transition: all .15s;
          border-bottom: 2px solid transparent; white-space: nowrap;
        }
        .cp-tab:hover { color: #f0f0f3; }
        .cp-tab.active { color: #f0f0f3; border-bottom-color: #6EE7B7; font-weight: 600; }
        .cp-tab-count { padding: 1px 6px; border-radius: 100px; font-size: 10px; background: rgba(110,231,183,0.15); color: #6EE7B7; }

        /* Admin note */
        .cp-admin-compose-note {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 20px; background: rgba(251,191,36,0.06);
          border-bottom: 1px solid rgba(251,191,36,0.12);
          font-size: 12.5px; color: #888;
        }
        .cp-admin-compose-note strong { color: #f0f0f3; }

        /* Feed */
        .cp-feed { display: flex; flex-direction: column; }
        .cp-feed > * { border-bottom: 1px solid #1e1e24; }
        .cp-feed > *:last-child { border-bottom: none; }

        /* Loading */
        .cp-loading { display: flex; justify-content: center; align-items: center; padding: 48px; }
        .cp-spinner { width: 30px; height: 30px; border: 2px solid #1e1e24; border-top-color: #6EE7B7; border-radius: 50%; animation: spin .7s linear infinite; }
        .cp-spinner-sm { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(110,231,183,.2); border-top-color: #6EE7B7; border-radius: 50%; animation: spin .7s linear infinite; }

        /* Empty */
        .cp-empty {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          padding: 56px 24px; color: #5c5c6e;
        }
        .cp-empty svg { color: #3a3a48; }
        .cp-empty h3 { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #f0f0f3; margin: 0; }
        .cp-empty p { font-size: 13px; color: #5c5c6e; margin: 0; }

        /* Load more */
        .cp-load-more {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 16px; background: transparent; border: none;
          font-size: 13.5px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          color: #6EE7B7; cursor: pointer; transition: background .15s;
        }
        .cp-load-more:hover { background: rgba(110,231,183,0.04); }
        .cp-load-more:disabled { opacity: 0.5; cursor: not-allowed; }

        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 900px) {
          .cp-page { grid-template-columns: 1fr; padding: 0 0 48px; gap: 16px; }
          .cp-main { border-radius: 0; border-left: none; border-right: none; }
          .cp-head { top: 0; }
        }
        @media (max-width: 600px) {
          .cp-head-top { flex-direction: column; gap: 12px; }
          .cp-search-wrap { width: 100%; }
        }
      `}</style>
    </div>
  );
}
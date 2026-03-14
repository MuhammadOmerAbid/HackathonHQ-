"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PostCard({ post, currentUser, onLike, onDelete, onRepost, compact = false }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isOwner = post.author?.id === currentUser?.id || post.author === currentUser?.id;
  const liked   = post.liked_by?.includes(currentUser?.id);
  const reposted = post.reposted_by?.includes(currentUser?.id);

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const timeAgo = (d) => {
    if (!d) return "";
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d`;
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const goToPost   = (e) => { e.stopPropagation(); router.push(`/community/${post.id}`); };
  const goToAuthor = (e) => { e.stopPropagation(); router.push(`/users/${post.author?.id}`); };

  const isPinned      = post.is_pinned;
  const isAnnouncement= post.post_type === "announcement";
  const isResult      = post.post_type === "result";

  return (
    <article
      className={`pcard ${isPinned ? "pinned" : ""} ${isAnnouncement ? "announcement" : ""} ${isResult ? "result" : ""} ${compact ? "compact" : ""}`}
      onClick={goToPost}
    >
      {/* Special banners */}
      {isPinned && (
        <div className="pcard-banner pin-banner">
          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z"/></svg>
          Pinned Post
        </div>
      )}
      {isAnnouncement && (
        <div className="pcard-banner ann-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          Announcement
        </div>
      )}
      {isResult && (
        <div className="pcard-banner res-banner">
          🏆 Hackathon Results
        </div>
      )}

      <div className="pcard-inner">
        {/* Avatar column */}
        <div className="pcard-left">
          <div className="pcard-avatar" onClick={goToAuthor}>
            {post.author?.username?.[0]?.toUpperCase() || "?"}
          </div>
          {!compact && <div className="pcard-thread-line" />}
        </div>

        {/* Content */}
        <div className="pcard-right">
          {/* Header */}
          <div className="pcard-head">
            <div className="pcard-author-row">
              <span className="pcard-name" onClick={goToAuthor}>{post.author?.username || "Unknown"}</span>
              {post.author?.is_staff && <span className="pcard-role staff">Admin</span>}
              {post.author?.is_judge && <span className="pcard-role judge">Judge</span>}
              <span className="pcard-dot">·</span>
              <span className="pcard-time">{timeAgo(post.created_at)}</span>
            </div>

            {/* 3-dot menu */}
            {isOwner && (
              <div className="pcard-menu" ref={menuRef} onClick={e => e.stopPropagation()}>
                <button className="pcard-menu-btn" onClick={() => setMenuOpen(o => !o)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <circle cx="12" cy="5" r="1" fill="currentColor"/>
                    <circle cx="12" cy="12" r="1" fill="currentColor"/>
                    <circle cx="12" cy="19" r="1" fill="currentColor"/>
                  </svg>
                </button>
                {menuOpen && (
                  <div className="pcard-dropdown">
                    <button className="pcard-dd-item" onClick={() => { setMenuOpen(false); router.push(`/community/${post.id}/edit`); }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit post
                    </button>
                    <button className="pcard-dd-item danger" onClick={() => { setMenuOpen(false); onDelete(post.id); }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Event link */}
          {post.event && (
            <div className="pcard-event-link" onClick={e => { e.stopPropagation(); router.push(`/events/${post.event?.id}`); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {post.event?.name}
            </div>
          )}

          {/* Title */}
          {post.title && <h3 className="pcard-title">{post.title}</h3>}

          {/* Body */}
          <p className="pcard-body">
            {compact && post.content?.length > 240
              ? post.content.slice(0, 240) + "…"
              : post.content}
          </p>

          {/* Result winners block */}
          {isResult && post.winners?.length > 0 && (
            <div className="pcard-winners">
              {post.winners.map((w, i) => (
                <div key={w.id || i} className="pcard-winner-row" onClick={e => { e.stopPropagation(); router.push(`/submissions/${w.id}`); }}>
                  <span className="pcard-winner-place">{["🥇","🥈","🥉"][i] || `#${i+1}`}</span>
                  <span className="pcard-winner-name">{w.title}</span>
                  <span className="pcard-winner-team">{w.team_name || w.team?.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="pcard-tags">
              {post.tags.slice(0, 4).map(t => (
                <span key={t} className="pcard-tag">#{t}</span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="pcard-actions" onClick={e => e.stopPropagation()}>
            {/* Comment */}
            <button className="pcard-action comment" onClick={goToPost}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span>{post.comments_count || 0}</span>
            </button>

            {/* Repost */}
            <button className={`pcard-action repost ${reposted ? "active" : ""}`} onClick={() => onRepost?.(post.id)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
                <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
              </svg>
              <span>{post.reposts_count || 0}</span>
            </button>

            {/* Like */}
            <button className={`pcard-action like ${liked ? "active" : ""}`} onClick={() => onLike(post.id)}>
              <svg viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" width="17" height="17">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span>{post.likes_count || post.liked_by?.length || 0}</span>
            </button>

            {/* Share */}
            <button className="pcard-action share" onClick={e => { e.stopPropagation(); navigator.clipboard?.writeText(window.location.origin + `/community/${post.id}`); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pcard {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 16px;
          overflow: hidden;
          transition: all .2s ease;
          cursor: pointer;
          position: relative;
        }
        .pcard:hover { background: #17171b; border-color: #26262e; }

        .pcard.pinned   { border-color: rgba(110,231,183,0.2); }
        .pcard.announcement { border-color: rgba(251,191,36,0.2); }
        .pcard.result { border-color: rgba(251,191,36,0.35); background: linear-gradient(135deg, #111114 0%, rgba(251,191,36,0.04) 100%); }

        /* Banners */
        .pcard-banner { display: flex; align-items: center; gap: 6px; padding: 6px 18px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
        .pin-banner { background: rgba(110,231,183,0.06); color: #6EE7B7; border-bottom: 1px solid rgba(110,231,183,0.12); }
        .ann-banner { background: rgba(251,191,36,0.06); color: #fbbf24; border-bottom: 1px solid rgba(251,191,36,0.12); }
        .res-banner { background: rgba(251,191,36,0.08); color: #fbbf24; border-bottom: 1px solid rgba(251,191,36,0.15); font-size: 12px; }

        .pcard-inner { display: flex; gap: 12px; padding: 16px 18px; }
        .pcard.compact .pcard-inner { padding: 13px 16px; }

        /* Left column */
        .pcard-left { display: flex; flex-direction: column; align-items: center; gap: 8px; flex-shrink: 0; }
        .pcard-avatar {
          width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
          background: rgba(110,231,183,0.1); border: 1.5px solid rgba(110,231,183,0.2);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #6EE7B7;
          cursor: pointer; transition: all .15s;
        }
        .pcard-avatar:hover { background: rgba(110,231,183,0.18); transform: scale(1.05); }
        .pcard.compact .pcard-avatar { width: 34px; height: 34px; font-size: 13px; }
        .pcard-thread-line { width: 1.5px; flex: 1; background: #1e1e24; border-radius: 2px; min-height: 8px; }

        /* Right */
        .pcard-right { flex: 1; min-width: 0; }
        .pcard-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2px; }
        .pcard-author-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .pcard-name { font-size: 14px; font-weight: 700; color: #f0f0f3; cursor: pointer; transition: color .15s; }
        .pcard-name:hover { color: #6EE7B7; }
        .pcard-role { padding: 1px 7px; border-radius: 100px; font-size: 10px; font-weight: 700; letter-spacing: 0.3px; }
        .pcard-role.staff { background: rgba(251,191,36,.1); color: #fbbf24; border: 1px solid rgba(251,191,36,.2); }
        .pcard-role.judge { background: rgba(96,165,250,.1); color: #60a5fa; border: 1px solid rgba(96,165,250,.2); }
        .pcard-dot { color: #3a3a48; font-size: 12px; }
        .pcard-time { font-size: 12.5px; color: #5c5c6e; }

        /* Menu */
        .pcard-menu { position: relative; }
        .pcard-menu-btn { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: #5c5c6e; cursor: pointer; border-radius: 6px; transition: all .15s; }
        .pcard-menu-btn:hover { color: #f0f0f3; background: #1e1e24; }
        .pcard-dropdown { position: absolute; top: calc(100% + 4px); right: 0; min-width: 150px; background: #1a1a1f; border: 1px solid #26262e; border-radius: 10px; box-shadow: 0 12px 30px rgba(0,0,0,0.6); z-index: 100; overflow: hidden; }
        .pcard-dd-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 14px; background: transparent; border: none; color: #f0f0f3; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: background .15s; text-align: left; }
        .pcard-dd-item:hover { background: #17171b; }
        .pcard-dd-item.danger { color: #f87171; }
        .pcard-dd-item.danger:hover { background: rgba(248,113,113,0.08); }

        /* Event link */
        .pcard-event-link { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: #6EE7B7; margin-bottom: 6px; cursor: pointer; transition: opacity .15s; font-weight: 500; }
        .pcard-event-link:hover { opacity: 0.8; }

        /* Title */
        .pcard-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #f0f0f3; margin: 0 0 6px; letter-spacing: -0.3px; line-height: 1.3; }
        .pcard.compact .pcard-title { font-size: 14.5px; }

        /* Body */
        .pcard-body { font-size: 14.5px; color: #b0b0ba; line-height: 1.65; margin: 0 0 10px; white-space: pre-wrap; word-break: break-word; }
        .pcard.compact .pcard-body { font-size: 13.5px; }

        /* Winners */
        .pcard-winners { background: rgba(251,191,36,0.06); border: 1px solid rgba(251,191,36,0.15); border-radius: 12px; overflow: hidden; margin-bottom: 12px; }
        .pcard-winner-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid rgba(251,191,36,0.08); cursor: pointer; transition: background .15s; }
        .pcard-winner-row:last-child { border-bottom: none; }
        .pcard-winner-row:hover { background: rgba(251,191,36,0.06); }
        .pcard-winner-place { font-size: 16px; flex-shrink: 0; }
        .pcard-winner-name { font-size: 13px; font-weight: 600; color: #f0f0f3; flex: 1; }
        .pcard-winner-team { font-size: 12px; color: #fbbf24; }

        /* Tags */
        .pcard-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
        .pcard-tag { padding: 2px 9px; border-radius: 100px; font-size: 11px; color: #6EE7B7; background: rgba(110,231,183,0.06); border: 1px solid rgba(110,231,183,0.12); cursor: pointer; }
        .pcard-tag:hover { background: rgba(110,231,183,0.12); }

        /* Actions */
        .pcard-actions { display: flex; align-items: center; gap: 0; margin-top: 2px; margin-left: -8px; }
        .pcard-action {
          display: inline-flex; align-items: center; gap: 6px; padding: 7px 8px;
          border: none; background: transparent; font-family: 'DM Sans', sans-serif;
          font-size: 13px; cursor: pointer; border-radius: 8px; transition: all .15s;
          color: #5c5c6e; min-width: 48px;
        }
        .pcard-action span { min-width: 14px; }
        .pcard-action:hover { background: rgba(255,255,255,0.04); }
        .pcard-action.comment:hover { color: #60a5fa; }
        .pcard-action.repost:hover  { color: #4ade80; }
        .pcard-action.repost.active { color: #4ade80; }
        .pcard-action.like:hover    { color: #f87171; }
        .pcard-action.like.active   { color: #f87171; }
        .pcard-action.share:hover   { color: #a78bfa; }
      `}</style>
    </article>
  );
}
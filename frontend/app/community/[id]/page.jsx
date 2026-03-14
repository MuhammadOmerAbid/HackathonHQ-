"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "../../../utils/axios";
import LoadingSpinner from "@/components/LoadingSpinner";
import PostCard from "../../../components/community/PostCard";
import ComposeBox from "../../../components/community/ComposeBox";

function CommentCard({ comment, currentUser, onLike, onDelete, depth = 0 }) {
  const router = useRouter();
  const [replying, setReplying] = useState(false);
  const [replies, setReplies] = useState(comment.replies || []);

  const liked = comment.liked_by?.includes(currentUser?.id);
  const isOwner = comment.author?.id === currentUser?.id;

  const timeAgo = (d) => {
    if (!d) return "";
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  const handleReplyPost = async (payload) => {
    const res  = await axios.post("/posts/", { ...payload, parent: comment.id });
    const full = await axios.get(`/posts/${res.data.id}/?expand=author`).catch(() => res);
    setReplies(r => [...r, full.data]);
    setReplying(false);
  };

  return (
    <div className={`cc-wrap depth-${depth}`}>
      <div className="cc-card">
        <div className="cc-left">
          <div className="cc-avatar" onClick={() => router.push(`/users/${comment.author?.id}`)}>
            {comment.author?.username?.[0]?.toUpperCase() || "?"}
          </div>
          {(comment.replies?.length > 0 || replying || replies.length > 0) && <div className="cc-line" />}
        </div>
        <div className="cc-body">
          <div className="cc-head">
            <span className="cc-author" onClick={() => router.push(`/users/${comment.author?.id}`)}>{comment.author?.username || "Unknown"}</span>
            {comment.author?.is_staff && <span className="cc-badge staff">Admin</span>}
            <span className="cc-dot">·</span>
            <span className="cc-time">{timeAgo(comment.created_at)}</span>
            {isOwner && (
              <button className="cc-del-btn" onClick={() => onDelete(comment.id)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              </button>
            )}
          </div>
          <p className="cc-text">{comment.content}</p>
          <div className="cc-actions">
            <button className={`cc-action like ${liked ? "active" : ""}`} onClick={() => onLike(comment.id)}>
              <svg viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span>{comment.likes_count || 0}</span>
            </button>
            {currentUser && depth < 2 && (
              <button className="cc-action reply" onClick={() => setReplying(r => !r)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span>{comment.comments_count || replies.length || 0}</span>
              </button>
            )}
          </div>
          {replying && currentUser && (
            <div className="cc-reply-compose">
              <ComposeBox
                user={currentUser}
                events={[]}
                onPost={handleReplyPost}
                onCancel={() => setReplying(false)}
                replyTo={comment}
              />
            </div>
          )}
        </div>
      </div>
      {/* Nested replies */}
      {replies.length > 0 && (
        <div className="cc-replies">
          {replies.map(r => (
            <CommentCard key={r.id} comment={r} currentUser={currentUser} onLike={onLike} onDelete={onDelete} depth={depth + 1} />
          ))}
        </div>
      )}

      <style jsx>{`
        .cc-wrap { }
        .cc-wrap.depth-1 { padding-left: 28px; }
        .cc-wrap.depth-2 { padding-left: 42px; }
        .cc-card { display: flex; gap: 10px; padding: 14px 20px; }
        .cc-left { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; }
        .cc-avatar {
          width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
          background: rgba(110,231,183,0.08); border: 1.5px solid rgba(110,231,183,0.15);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; color: #6EE7B7;
          cursor: pointer; transition: all .15s;
        }
        .cc-avatar:hover { background: rgba(110,231,183,0.16); }
        .cc-line { width: 1.5px; flex: 1; background: #1e1e24; border-radius: 2px; min-height: 12px; }
        .cc-body { flex: 1; min-width: 0; }
        .cc-head { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; flex-wrap: wrap; }
        .cc-author { font-size: 13.5px; font-weight: 700; color: #f0f0f3; cursor: pointer; transition: color .15s; }
        .cc-author:hover { color: #6EE7B7; }
        .cc-badge { padding: 1px 6px; border-radius: 100px; font-size: 9.5px; font-weight: 700; }
        .cc-badge.staff { background: rgba(251,191,36,.1); color: #fbbf24; border: 1px solid rgba(251,191,36,.2); }
        .cc-dot { color: #3a3a48; font-size: 11px; }
        .cc-time { font-size: 12px; color: #5c5c6e; }
        .cc-del-btn { margin-left: auto; background: transparent; border: none; color: #3a3a48; cursor: pointer; display: flex; align-items: center; transition: color .15s; }
        .cc-del-btn:hover { color: #f87171; }
        .cc-text { font-size: 14px; color: #b0b0ba; line-height: 1.65; margin: 0 0 8px; white-space: pre-wrap; word-break: break-word; }
        .cc-actions { display: flex; gap: 0; margin-left: -8px; }
        .cc-action { display: inline-flex; align-items: center; gap: 5px; padding: 5px 8px; border: none; background: transparent; font-family: 'DM Sans', sans-serif; font-size: 12px; cursor: pointer; border-radius: 6px; transition: all .15s; color: #5c5c6e; }
        .cc-action:hover { background: rgba(255,255,255,0.04); }
        .cc-action.like:hover { color: #f87171; }
        .cc-action.like.active { color: #f87171; }
        .cc-action.reply:hover { color: #60a5fa; }
        .cc-reply-compose { margin-top: 8px; background: #17171b; border-radius: 12px; overflow: hidden; border: 1px solid #1e1e24; }
        .cc-replies { }
      `}</style>
    </div>
  );
}

export default function PostDetailPage() {
  const { id }    = useParams();
  const router    = useRouter();
  const [post,    setPost]    = useState(null);
  const [comments,setComments]= useState([]);
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [events,  setEvents]  = useState([]);

  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [postRes, userRes, commentsRes, eventsRes] = await Promise.all([
        axios.get(`/posts/${id}/?expand=author,event,winners`),
        axios.get("/users/me/").catch(() => null),
        axios.get(`/posts/${id}/comments/?expand=author&ordering=created_at`).catch(() => ({ data: [] })),
        axios.get("/events/").catch(() => ({ data: [] })),
      ]);
      setPost(postRes.data);
      setUser(userRes?.data || null);
      const cData = commentsRes.data.results || commentsRes.data || [];
      setComments(cData);
      setEvents(eventsRes.data.results || eventsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (payload) => {
    const res  = await axios.post("/posts/", { ...payload, parent: parseInt(id) });
    const full = await axios.get(`/posts/${res.data.id}/?expand=author`).catch(() => res);
    setComments(c => [...c, full.data]);
    setPost(p => ({ ...p, comments_count: (p.comments_count || 0) + 1 }));
  };

  const handleLike = async (postId) => {
    if (!user) return;
    const isPost = postId === post?.id;
    try {
      await axios.post(`/posts/${postId}/like/`);
      if (isPost) {
        setPost(p => {
          const liked = p.liked_by?.includes(user.id);
          return { ...p, likes_count: liked ? (p.likes_count||1)-1 : (p.likes_count||0)+1, liked_by: liked ? (p.liked_by||[]).filter(i => i !== user.id) : [...(p.liked_by||[]), user.id] };
        });
      } else {
        setComments(cs => cs.map(c => {
          if (c.id !== postId) return c;
          const liked = c.liked_by?.includes(user.id);
          return { ...c, likes_count: liked ? (c.likes_count||1)-1 : (c.likes_count||0)+1, liked_by: liked ? (c.liked_by||[]).filter(i => i !== user.id) : [...(c.liked_by||[]), user.id] };
        }));
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Delete this reply?")) return;
    try {
      await axios.delete(`/posts/${commentId}/`);
      setComments(cs => cs.filter(c => c.id !== commentId));
    } catch (err) { console.error(err); }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm("Delete this post?")) return;
    try {
      await axios.delete(`/posts/${postId}/`);
      router.push("/community");
    } catch (err) { console.error(err); }
  };

  if (loading) return <LoadingSpinner message="Loading post…" />;
  if (!post)   return (
    <div className="pd-notfound">
      <h2>Post not found</h2>
      <button className="pd-back" onClick={() => router.push("/community")}>← Back to Community</button>
    </div>
  );

  return (
    <div className="pd-page">

      {/* Back */}
      <button className="evd-back-btn" onClick={() => router.push("/community")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        Back to Community
      </button>

      {/* Post */}
      <div className="pd-post-wrap">
        <PostCard
          post={post}
          currentUser={user}
          onLike={handleLike}
          onDelete={handleDeletePost}
          compact={false}
        />
      </div>

      {/* Reply compose */}
      {user && (
        <div className="pd-compose-wrap">
          <ComposeBox user={user} events={events} onPost={handleReply} replyTo={post} />
        </div>
      )}

      {/* Comments */}
      <div className="pd-comments">
        <div className="pd-comments-head">
          <h3 className="pd-comments-title">Replies <span>{comments.length}</span></h3>
        </div>
        {comments.length === 0 ? (
          <div className="pd-comments-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            No replies yet. Be the first!
          </div>
        ) : (
          comments.map(c => (
            <CommentCard
              key={c.id}
              comment={c}
              currentUser={user}
              onLike={handleLike}
              onDelete={handleDeleteComment}
            />
          ))
        )}
      </div>

      <style jsx>{`
        .pd-page {
          max-width: 680px;
          margin: 0 auto;
          padding: 28px 32px 64px;
          font-family: 'DM Sans', sans-serif;
          min-height: calc(100vh - 70px);
        }
        .pd-notfound { text-align: center; padding: 80px 20px; color: #5c5c6e; }
        .pd-notfound h2 { font-family: 'Syne', sans-serif; font-size: 22px; color: #f0f0f3; margin-bottom: 16px; }
        .pd-back { background: transparent; border: 1px solid #26262e; color: #5c5c6e; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; }

        .pd-post-wrap { margin-bottom: 2px; }

        .pd-compose-wrap {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .pd-comments {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 14px;
          overflow: hidden;
        }
        .pd-comments-head {
          padding: 16px 20px;
          border-bottom: 1px solid #1e1e24;
        }
        .pd-comments-title {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #f0f0f3;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pd-comments-title span {
          font-size: 13px;
          color: #5c5c6e;
          font-weight: 400;
          font-family: 'DM Sans', sans-serif;
        }
        .pd-comments-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 40px 20px;
          color: #5c5c6e;
          font-size: 13.5px;
        }
        .pd-comments-empty svg { color: #3a3a48; }

        @media (max-width: 600px) {
          .pd-page { padding: 16px 0 48px; }
          .pd-post-wrap, .pd-compose-wrap, .pd-comments { border-radius: 0; border-left: none; border-right: none; }
        }
      `}</style>
    </div>
  );
}
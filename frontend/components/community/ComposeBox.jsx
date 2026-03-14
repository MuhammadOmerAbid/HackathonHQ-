"use client";

import { useState, useRef } from "react";

export default function ComposeBox({ user, events, onPost, onCancel, replyTo = null }) {
  const [draft, setDraft]       = useState({ title: "", content: "", tags: "", event: replyTo?.event?.id?.toString() || "" });
  const [posting, setPosting]   = useState(false);
  const [error, setError]       = useState("");
  const [showExtra, setShowExtra] = useState(false);
  const textareaRef = useRef(null);

  const MAX = 1000;
  const remaining = MAX - draft.content.length;
  const overLimit = remaining < 0;
  const almostLimit = remaining < 100;

  const autoResize = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  const handleSubmit = async () => {
    if (!draft.content.trim()) { setError("Write something first."); return; }
    if (overLimit) { setError(`Too long by ${-remaining} chars.`); return; }
    setPosting(true); setError("");
    try {
      await onPost({
        content: draft.content,
        ...(draft.title && { title: draft.title }),
        ...(draft.tags  && { tags: draft.tags.split(",").map(t => t.trim()).filter(Boolean) }),
        ...(draft.event && { event: parseInt(draft.event) }),
        ...(replyTo     && { parent: replyTo.id }),
      });
      setDraft({ title: "", content: "", tags: "", event: "" });
      setShowExtra(false);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      onCancel?.();
    } catch (err) {
      setError(err?.message || "Failed to post.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="cb-wrap">
      {replyTo && (
        <div className="cb-reply-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
          Replying to <span>@{replyTo.author?.username}</span>
        </div>
      )}
      <div className="cb-inner">
        {/* Avatar */}
        <div className="cb-avatar">{user?.username?.[0]?.toUpperCase() || "?"}</div>

        {/* Editor */}
        <div className="cb-editor">
          {showExtra && (
            <input
              className="cb-title-input"
              placeholder="Title (optional)"
              value={draft.title}
              onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
              maxLength={150}
            />
          )}
          <textarea
            ref={textareaRef}
            className="cb-textarea"
            placeholder={replyTo ? `Reply to @${replyTo.author?.username}…` : "What's happening in the hackathon world?"}
            value={draft.content}
            onChange={e => { setDraft(d => ({ ...d, content: e.target.value })); autoResize(e); }}
            rows={replyTo ? 2 : 3}
          />
          {showExtra && (
            <div className="cb-extras">
              <input
                className="cb-extra-input"
                placeholder="Tags: python, ai, web3…"
                value={draft.tags}
                onChange={e => setDraft(d => ({ ...d, tags: e.target.value }))}
              />
              <select
                className="cb-extra-input"
                value={draft.event}
                onChange={e => setDraft(d => ({ ...d, event: e.target.value }))}
              >
                <option value="">Link to event…</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            </div>
          )}
          {error && <div className="cb-error">{error}</div>}
          <div className="cb-footer">
            <div className="cb-tools">
              <button className="cb-tool" title="Add title / tags / event" onClick={() => setShowExtra(s => !s)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
              </button>
              <button className="cb-tool" title="Attach event" onClick={() => setShowExtra(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </button>
            </div>
            <div className="cb-right">
              {draft.content.length > 0 && (
                <svg viewBox="0 0 36 36" className={`cb-ring ${almostLimit ? (overLimit ? "over" : "warn") : ""}`} width="28" height="28">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#1e1e24" strokeWidth="3"/>
                  <circle cx="18" cy="18" r="15" fill="none"
                    stroke={overLimit ? "#f87171" : almostLimit ? "#fbbf24" : "#6EE7B7"}
                    strokeWidth="3"
                    strokeDasharray={`${Math.min(Math.max((draft.content.length / MAX) * 94.25, 0), 94.25)} 94.25`}
                    strokeLinecap="round"
                    transform="rotate(-90 18 18)"
                  />
                  {almostLimit && <text x="18" y="23" textAnchor="middle" fontSize="10" fill={overLimit ? "#f87171" : "#fbbf24"} fontFamily="DM Sans">{remaining}</text>}
                </svg>
              )}
              {onCancel && <button className="cb-cancel-btn" onClick={onCancel}>Cancel</button>}
              <button className="cb-post-btn" onClick={handleSubmit} disabled={posting || overLimit || !draft.content.trim()}>
                {posting ? <span className="cb-spinner" /> : null}
                {replyTo ? "Reply" : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .cb-wrap { padding: 16px 18px 0; border-bottom: 1px solid #1e1e24; }
        .cb-reply-label { display: flex; align-items: center; gap: 5px; font-size: 12.5px; color: #5c5c6e; margin-bottom: 10px; padding-left: 52px; }
        .cb-reply-label span { color: #6EE7B7; }
        .cb-inner { display: flex; gap: 12px; }
        .cb-avatar {
          width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
          background: rgba(110,231,183,0.12); border: 1.5px solid rgba(110,231,183,0.25);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #6EE7B7;
        }
        .cb-editor { flex: 1; min-width: 0; }
        .cb-title-input {
          width: 100%; background: transparent; border: none; border-bottom: 1px solid #1e1e24;
          color: #f0f0f3; font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700;
          outline: none; padding: 4px 0 8px; margin-bottom: 8px; letter-spacing: -0.2px;
        }
        .cb-title-input::placeholder { color: #3a3a48; font-weight: 400; }
        .cb-textarea {
          width: 100%; background: transparent; border: none; color: #f0f0f3;
          font-family: 'DM Sans', sans-serif; font-size: 15px; outline: none;
          resize: none; line-height: 1.6; min-height: 70px;
        }
        .cb-textarea::placeholder { color: #5c5c6e; }
        .cb-extras { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #1e1e24; }
        .cb-extra-input {
          padding: 7px 12px; background: #17171b; border: 1px solid #1e1e24;
          border-radius: 8px; color: #f0f0f3; font-family: 'DM Sans', sans-serif; font-size: 13px;
          outline: none; transition: border-color .15s;
        }
        .cb-extra-input:focus { border-color: rgba(110,231,183,0.3); }
        .cb-extra-input::placeholder { color: #3a3a48; }
        .cb-extra-input option { background: #17171b; }
        .cb-error { font-size: 12.5px; color: #f87171; margin-top: 6px; }
        .cb-footer { display: flex; align-items: center; justify-content: space-between; padding: 10px 0 14px; margin-top: 4px; border-top: 1px solid #1e1e24; }
        .cb-tools { display: flex; gap: 2px; }
        .cb-tool { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: #5c5c6e; cursor: pointer; border-radius: 8px; transition: all .15s; }
        .cb-tool:hover { color: #6EE7B7; background: rgba(110,231,183,0.08); }
        .cb-right { display: flex; align-items: center; gap: 10px; }
        .cb-ring { flex-shrink: 0; }
        .cb-cancel-btn { padding: 7px 14px; border-radius: 100px; font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif; background: transparent; color: #5c5c6e; border: 1px solid #26262e; cursor: pointer; transition: all .15s; }
        .cb-cancel-btn:hover { color: #f0f0f3; background: #17171b; }
        .cb-post-btn {
          display: inline-flex; align-items: center; gap: 6px; padding: 7px 18px;
          border-radius: 100px; font-size: 13.5px; font-weight: 700; font-family: 'DM Sans', sans-serif;
          background: #6EE7B7; color: #0c0c0f; border: none; cursor: pointer; transition: all .15s;
        }
        .cb-post-btn:hover:not(:disabled) { background: #86efac; }
        .cb-post-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cb-spinner { width: 14px; height: 14px; border: 2px solid rgba(12,12,15,.2); border-top-color: #0c0c0f; border-radius: 50%; animation: spin .6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 480px) { .cb-extras { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
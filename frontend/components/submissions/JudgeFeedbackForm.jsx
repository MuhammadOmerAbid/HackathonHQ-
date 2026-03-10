"use client";

import React, { useState } from "react";
import axios from "../../utils/axios";

/**
 * JudgeFeedbackForm - styled to match app theme.
 * Props:
 *   - submissionId: number
 *   - onFeedbackSaved: function (called after successful submission)
 */
export default function JudgeFeedbackForm({ submissionId, onFeedbackSaved }) {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setLoading(true);
    setError("");
    try {
      await axios.post("/feedback/", {
        submission: submissionId,
        score: parseFloat(score),
        comment,
      });
      setComment("");
      setScore(5);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      if (onFeedbackSaved) onFeedbackSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{jffStyles}</style>
      <div className="jff-wrap">
        <h3 className="jff-title">Add Your Feedback</h3>

        {success && (
          <div className="jff-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            Feedback submitted successfully!
          </div>
        )}
        {error && (
          <div className="jff-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="jff-form">
          <div className="jff-score-section">
            <label className="jff-label">Score (1–10)</label>
            <div className="jff-score-btns">
              {[1,2,3,4,5,6,7,8,9,10].map(num => (
                <button key={num} type="button" onClick={() => setScore(num)}
                  className={`jff-score-btn ${score === num ? "active" : ""}`}>
                  {num}
                </button>
              ))}
            </div>
            <div className="jff-score-bar">
              <div className="jff-score-fill" style={{ width: `${score * 10}%` }} />
            </div>
          </div>

          <div className="jff-field">
            <label className="jff-label">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="jff-textarea"
              placeholder="Share your detailed feedback — what worked, what could improve..."
              rows="4"
              required
            />
          </div>

          <button type="submit" className="jff-btn" disabled={loading || !comment.trim()}>
            {loading ? <><span className="jff-spinner" /> Submitting...</> : "Submit Feedback"}
          </button>
        </form>
      </div>
    </>
  );
}

const jffStyles = `
  .jff-wrap{padding-top:1.5rem;border-top:1px solid var(--border,#1e1e24);margin-top:1.5rem}
  .jff-title{font-family:'Syne',sans-serif;font-size:1rem;font-weight:700;color:var(--text,#f0f0f3);margin:0 0 1.25rem}
  .jff-success{display:flex;align-items:center;gap:.6rem;background:rgba(110,231,183,.1);border:1px solid rgba(110,231,183,.25);color:var(--accent,#6EE7B7);font-family:'DM Sans',sans-serif;font-size:.88rem;padding:.75rem 1rem;border-radius:10px;margin-bottom:1rem}
  .jff-success svg{width:16px;height:16px;flex-shrink:0}
  .jff-error{display:flex;align-items:center;gap:.6rem;background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.2);color:#f87171;font-family:'DM Sans',sans-serif;font-size:.88rem;padding:.75rem 1rem;border-radius:10px;margin-bottom:1rem}
  .jff-error svg{width:16px;height:16px;flex-shrink:0}
  .jff-form{display:flex;flex-direction:column;gap:1.25rem}
  .jff-label{display:block;font-family:'DM Sans',sans-serif;font-size:.85rem;font-weight:500;color:rgba(240,240,243,.8);margin-bottom:.5rem}
  .jff-score-section{}
  .jff-score-btns{display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.6rem}
  .jff-score-btn{width:36px;height:36px;border-radius:8px;background:var(--surface2,#17171b);border:1px solid var(--border,#1e1e24);color:var(--muted,#5c5c6e);font-family:'DM Sans',sans-serif;font-size:.85rem;font-weight:600;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center}
  .jff-score-btn:hover{border-color:var(--accent,#6EE7B7);color:var(--text,#f0f0f3)}
  .jff-score-btn.active{background:var(--accent,#6EE7B7);border-color:var(--accent,#6EE7B7);color:#0c0c0f}
  .jff-score-bar{height:3px;background:var(--border,#1e1e24);border-radius:2px;overflow:hidden}
  .jff-score-fill{height:100%;background:linear-gradient(90deg,var(--accent,#6EE7B7),#FBBF24);border-radius:2px;transition:width .3s ease}
  .jff-field{}
  .jff-textarea{width:100%;background:var(--surface2,#17171b);border:1px solid var(--border,#1e1e24);border-radius:10px;color:var(--text,#f0f0f3);font-family:'DM Sans',sans-serif;font-size:.9rem;padding:.75rem 1rem;outline:none;resize:vertical;min-height:100px;line-height:1.6;transition:border-color .2s;box-sizing:border-box}
  .jff-textarea::placeholder{color:var(--muted,#5c5c6e)}
  .jff-textarea:focus{border-color:var(--accent,#6EE7B7)}
  .jff-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;background:var(--accent,#6EE7B7);color:#0c0c0f;font-family:'DM Sans',sans-serif;font-weight:700;font-size:.9rem;padding:.75rem 1.5rem;border-radius:10px;border:none;cursor:pointer;transition:opacity .2s,transform .2s}
  .jff-btn:hover:not(:disabled){opacity:.88;transform:translateY(-1px)}
  .jff-btn:disabled{opacity:.5;cursor:not-allowed}
  .jff-spinner{width:16px;height:16px;border:2px solid rgba(0,0,0,.2);border-top-color:#0c0c0f;border-radius:50%;animation:jff-spin .7s linear infinite}
  @keyframes jff-spin{to{transform:rotate(360deg)}}
`;
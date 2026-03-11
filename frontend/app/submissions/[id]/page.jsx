"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "../../../utils/axios";

export default function SubmissionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackScore, setFeedbackScore] = useState(5);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("overview"); // "overview" or "feedback"

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, userRes] = await Promise.all([
          axios.get(`/submissions/${id}/`),
          axios.get("/users/me/").catch(() => null)
        ]);
        setSubmission(subRes.data);
        setUser(userRes?.data || null);
        try {
          const feedbackRes = await axios.get(`/submissions/${id}/feedback/`);
          setFeedback(feedbackRes.data.results || feedbackRes.data || []);
        } catch (err) { /* feedback not available */ }
      } catch (err) {
        setError("Submission not found");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setSubmittingFeedback(true);
    try {
      const res = await axios.post(`/submissions/${id}/feedback/`, { 
        comment: feedbackText, 
        score: feedbackScore 
      });
      setFeedback([...feedback, res.data]);
      setFeedbackText("");
      setFeedbackScore(5);
    } catch (err) {
      setError("Failed to submit feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleMarkWinner = async () => {
    if (!confirm("Mark this submission as a winner?")) return;
    try {
      await axios.post(`/submissions/${id}/mark-winner/`);
      const res = await axios.get(`/submissions/${id}/`);
      setSubmission(res.data);
    } catch (err) {
      setError("Failed to mark as winner");
    }
  };

  const avgScore = feedback.length > 0
    ? (feedback.reduce((sum, f) => sum + f.score, 0) / feedback.length).toFixed(1)
    : null;

  if (loading) {
    return (
      <div className="evd-loading">
        <div className="blob blob1" /><div className="blob blob2" /><div className="blob blob3" />
        <div className="evd-spinner" /><p>Loading submission...</p>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="evd-error-page">
        <div className="blob blob1" /><div className="blob blob2" /><div className="blob blob3" />
        <div className="evd-error-card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2>{error || "Submission not found"}</h2>
          <p>The submission you're looking for doesn't exist.</p>
          <button onClick={() => router.push("/submissions")} className="evd-btn-primary">
            Back to Submissions
          </button>
        </div>
      </div>
    );
  }

  const isJudge = user?.is_judge || user?.is_staff;
  const isOwner = user && submission.team?.members?.some(m => m.id === user.id);
  const canEdit = isOwner && !submission.is_reviewed;

  const status = submission.is_winner ? "live" : submission.is_reviewed ? "soon" : "closed";
  const statusText = submission.is_winner ? "Winner" : submission.is_reviewed ? "Reviewed" : "Pending";

  return (
    <div className="evd-page">
      <div className="blob blob1" /><div className="blob blob2" /><div className="blob blob3" />

      
      {/* Back button - Fixed version */}
<button onClick={() => router.push("/submissions")} className="evd-back-btn">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
  <span>Back to Submissions</span>
</button>

      {/* Hero section */}
      <div className="evd-head">
        <div>
          <div className="evd-eyebrow">
            <div className="evd-eyebrow-dot" />
            <span className="evd-eyebrow-label">Project Submission</span>
          </div>
          <h1 className="evd-title">
            {submission.title || "Untitled Project"}
          </h1>
          <p className="evd-organizer">
            by {submission.team?.name || "Team"} · {submission.event?.name || "Hackathon"}
          </p>
        </div>
        <div className={`evd-status-pill evd-pill-${status}`}>
          <span className="evd-pill-dot" />
          {statusText}
          {submission.is_winner && " 🏆"}
        </div>
      </div>

      {/* Enhanced Info strip with card design */}
<div className="evd-info-strip-enhanced">
  {/* Submitted Date Card */}
  <div className="evd-info-card">
    <div className="evd-info-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    </div>
    <div className="evd-info-content">
      <div className="evd-info-label">Submitted</div>
      <div className="evd-info-val">
        {new Date(submission.created_at || Date.now()).toLocaleDateString("en-US", { 
          month: "long", 
          day: "numeric", 
          year: "numeric" 
        })}
      </div>
    </div>
  </div>

  {/* Average Score Card - Only show if exists */}
  {avgScore && (
    <div className="evd-info-card">
      <div className="evd-info-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </div>
      <div className="evd-info-content">
        <div className="evd-info-label">Average Score</div>
        <div className="evd-info-val">
          {avgScore}<span style={{fontSize:'.75rem', opacity:.6, marginLeft:'2px'}}>/10</span>
        </div>
      </div>
    </div>
  )}

  {/* Live Demo Card - Only show if exists */}
  {submission.demo_url && (
    <div className="evd-info-card evd-info-link" onClick={() => window.open(submission.demo_url, '_blank')}>
      <div className="evd-info-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </div>
      <div className="evd-info-content">
        <div className="evd-info-label">Live Demo</div>
        <div className="evd-info-val">
          View Project <span style={{marginLeft:'4px'}}>↗</span>
        </div>
      </div>
    </div>
  )}

  {/* Repository Card - Only show if exists */}
  {submission.repo_url && (
    <div className="evd-info-card evd-info-link" onClick={() => window.open(submission.repo_url, '_blank')}>
      <div className="evd-info-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
        </svg>
      </div>
      <div className="evd-info-content">
        <div className="evd-info-label">Repository</div>
        <div className="evd-info-val">
          View Code <span style={{marginLeft:'4px'}}>↗</span>
        </div>
      </div>
    </div>
  )}
</div>

      {/* Tabs - FIXED with working click handlers */}
<div className="evd-tabs">
  <button 
    className={`evd-tab ${activeTab === 'overview' ? 'active' : ''}`}
    onClick={() => setActiveTab('overview')}
  >
    Overview
  </button>
  <button 
    className={`evd-tab ${activeTab === 'feedback' ? 'active' : ''}`}
    onClick={() => setActiveTab('feedback')}
  >
    Feedback {feedback.length > 0 && `(${feedback.length})`}
  </button>
</div>

      {/* Panel with Tab Content */}
<div className="evd-panel">
  {/* Overview Tab Content */}
  {activeTab === 'overview' && (
    <>
      {/* Description */}
      <div className="evd-about">
        <h3>About the Project</h3>
        <p>{submission.description || submission.summary || "No description provided."}</p>
      </div>

      {/* Technologies */}
      {submission.technologies?.length > 0 && (
        <div style={{ padding: '0 28px 28px' }}>
          <h3 style={{ 
            fontFamily: 'Syne,sans-serif', 
            fontSize: '15px', 
            fontWeight: 700, 
            color: '#f0f0f3', 
            margin: '0 0 14px' 
          }}>
            Technologies Used
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {submission.technologies.map((tech, idx) => (
              <span key={idx} className="tech-tag">
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  )}

  {/* Feedback Tab Content */}
  {activeTab === 'feedback' && (
    <div>
      {/* Feedback Header with Winner Button */}
      <div className="evd-teams-head">
        <h3>Judge Feedback {feedback.length > 0 && `(${feedback.length})`}</h3>
        {isJudge && !submission.is_winner && (
          <button 
            onClick={handleMarkWinner} 
            className="evd-btn-winner"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(251, 191, 36, 0.25)';
              e.currentTarget.style.borderColor = '#fbbf24';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(251, 191, 36, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>🏆</span>
            Mark as Winner
          </button>
        )}
      </div>

      {/* Feedback List */}
      {feedback.length > 0 ? (
        <div className="evd-feedback-list">
          {feedback.map((item) => (
            <div key={item.id} className="evd-feedback-item">
              {/* Header with judge info */}
              <div className="evd-feedback-header">
                <div className="evd-feedback-judge">
                  <div className="evd-feedback-avatar">
                    {item.judge?.username?.charAt(0).toUpperCase() || "J"}
                  </div>
                  <div className="evd-feedback-judge-info">
                    <span className="evd-feedback-judge-name">
                      {item.judge?.username || "Judge"}
                    </span>
                    <span className="evd-feedback-date">
                      {new Date(item.created_at).toLocaleDateString("en-US", {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                <div className="evd-feedback-score-badge">
                  <span className="evd-feedback-score-value">{item.score}</span>
                  <span className="evd-feedback-score-max">/10</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="evd-feedback-progress-container">
                <div className="evd-feedback-progress-bar">
                  <div 
                    className="evd-feedback-progress-fill"
                    style={{ 
                      width: `${(item.score / 10) * 100}%`,
                      background: item.score >= 8 ? 'linear-gradient(90deg, var(--accent), #4ade80)' :
                                 item.score >= 5 ? 'linear-gradient(90deg, #fbbf24, var(--accent))' :
                                 'linear-gradient(90deg, #f87171, #fbbf24)'
                    }}
                  />
                </div>
                <div className="evd-feedback-progress-labels">
                  <span>Needs Work</span>
                  <span>Good</span>
                  <span>Excellent</span>
                </div>
              </div>

              {/* Feedback Comment */}
              <div className="evd-feedback-comment">
                <p>{item.comment}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="evd-empty">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <h4>No feedback yet</h4>
          <p>Judges will review this submission soon.</p>
        </div>
      )}

      {/* Add Feedback Form for Judges */}
      {isJudge && (
        <div style={{ padding: '28px', borderTop: '1px solid #1e1e24' }}>
          <h3 style={{ 
            fontFamily: 'Syne,sans-serif', 
            fontSize: '15px', 
            fontWeight: 700, 
            color: '#f0f0f3', 
            margin: '0 0 20px' 
          }}>
            Add Your Feedback
          </h3>
          <form onSubmit={handleSubmitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.85rem', 
                fontWeight: 500, 
                color: 'rgba(240,240,243,0.8)', 
                marginBottom: '0.5rem' 
              }}>
                Score (1–10)
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setFeedbackScore(num)}
                    className={`score-btn ${feedbackScore === num ? 'active' : ''}`}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: feedbackScore === num ? 'var(--accent)' : 'var(--surface2)',
                      border: feedbackScore === num ? '1px solid var(--accent)' : '1px solid var(--border)',
                      color: feedbackScore === num ? '#0c0c0f' : 'var(--muted)',
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      boxShadow: feedbackScore === num ? '0 4px 12px rgba(110, 231, 183, 0.3)' : 'none'
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.85rem', 
                fontWeight: 500, 
                color: 'rgba(240,240,243,0.8)', 
                marginBottom: '0.5rem' 
              }}>
                Comment
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                style={{
                  width: '100%', 
                  padding: '0.75rem 1rem',
                  background: 'var(--surface2)', 
                  border: '1px solid var(--border)',
                  borderRadius: '10px', 
                  color: 'var(--text)', 
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '0.9rem', 
                  resize: 'vertical', 
                  minHeight: '100px',
                  lineHeight: '1.6', 
                  outline: 'none'
                }}
                placeholder="Share your detailed feedback on this project..."
                required
              />
            </div>

            {error && <p style={{ color: '#f87171', fontSize: '0.85rem' }}>{error}</p>}

            <button
              type="submit"
              disabled={submittingFeedback}
              className="evd-btn-primary"
              style={{ alignSelf: 'flex-start' }}
            >
              {submittingFeedback ? (
                <><span className="evd-spinner" style={{ width: '16px', height: '16px' }} /> Submitting...</>
              ) : (
                "Submit Feedback"
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )}
</div>
 </div> 

          
  );
}
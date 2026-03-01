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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, userRes] = await Promise.all([
          axios.get(`/submissions/${id}/`),
          axios.get("/users/me/").catch(() => null)
        ]);
        
        setSubmission(subRes.data);
        setUser(userRes?.data || null);
        
        // Fetch feedback if available
        try {
          const feedbackRes = await axios.get(`/submissions/${id}/feedback/`);
          setFeedback(feedbackRes.data.results || feedbackRes.data || []);
        } catch (err) {
          console.error("Error fetching feedback:", err);
        }
      } catch (err) {
        console.error("Error fetching submission:", err);
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
      console.error("Error submitting feedback:", err);
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
      console.error("Error marking winner:", err);
      setError("Failed to mark as winner");
    }
  };

  const getStatusBadge = () => {
    if (submission?.is_winner) {
      return { text: '🏆 Winner', class: 'winner' };
    } else if (submission?.is_reviewed) {
      return { text: 'Reviewed', class: 'reviewed' };
    } else {
      return { text: 'Pending Review', class: 'pending' };
    }
  };

  if (loading) {
    return (
      <div className="event-detail-loading">
        <div className="blob blob1"></div>
        <div className="blob blob2"></div>
        <div className="blob blob3"></div>
        <div className="event-detail-spinner"></div>
        <p>Loading submission...</p>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="event-detail-error">
        <div className="blob blob1"></div>
        <div className="blob blob2"></div>
        <div className="blob blob3"></div>
        <div className="event-detail-error-card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h2>{error || "Submission not found"}</h2>
          <p>The submission you're looking for doesn't exist.</p>
          <button onClick={() => router.push("/submissions")} className="event-detail-back-btn">
            Back to Submissions
          </button>
        </div>
      </div>
    );
  }

  const status = getStatusBadge();
  const isJudge = user?.is_judge || user?.is_staff;
  const isOwner = user && submission.team?.members?.some(m => m.id === user.id);
  const canEdit = isOwner && !submission.is_reviewed;

  return (
    <div className="event-detail-container">
      {/* Animated background blobs */}
      <div className="blob blob1"></div>
      <div className="blob blob2"></div>
      <div className="blob blob3"></div>

      <div className="event-detail-card">
        {/* Back Button */}
        <button onClick={() => router.back()} className="event-detail-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Submissions
        </button>

        {/* Submission Header */}
        <div className="event-detail-title-section">
          <div className="event-detail-title-wrapper">
            <h1 className="event-detail-title">{submission.title || "Untitled Project"}</h1>
            {submission.is_winner && (
              <span className="event-detail-premium" style={{ background: 'linear-gradient(135deg, #FBBF24, #F59E0B)' }}>
                🏆 Winner
              </span>
            )}
          </div>
          <div className={`event-detail-status ${status.class}`}>
            {status.text}
          </div>
        </div>
        <p className="event-detail-organizer">
          by {submission.team?.name || "Team"} • {submission.event?.name || "Hackathon"}
        </p>

        {/* Submission Info Grid */}
        <div className="event-detail-info-grid">
          <div className="event-detail-info-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <div>
              <h4>Team</h4>
              <p>{submission.team?.name || "—"}</p>
            </div>
          </div>

          <div className="event-detail-info-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <div>
              <h4>Submitted</h4>
              <p>{new Date(submission.created_at || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>

          {submission.demo_url && (
            <div className="event-detail-info-card" style={{ cursor: 'pointer' }} onClick={() => window.open(submission.demo_url, '_blank')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <div>
                <h4>Live Demo</h4>
                <p>View Project</p>
              </div>
            </div>
          )}

          {submission.repo_url && (
            <div className="event-detail-info-card" style={{ cursor: 'pointer' }} onClick={() => window.open(submission.repo_url, '_blank')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
              <div>
                <h4>Repository</h4>
                <p>View Code</p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="event-detail-description">
          <h3>About the Project</h3>
          <p>{submission.description || submission.summary || "No description provided."}</p>
        </div>

        {/* Additional Details */}
        {submission.technologies && submission.technologies.length > 0 && (
          <div className="event-detail-description">
            <h3>Technologies Used</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {submission.technologies.map((tech, idx) => (
                <span key={idx} className="tech-tag">{tech}</span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="event-detail-cta" style={{ marginTop: '2rem' }}>
          {canEdit && (
            <Link href={`/submissions/${id}/edit`} className="event-detail-cta-btn secondary">
              Edit Submission
            </Link>
          )}
          
          {isJudge && !submission.is_winner && (
            <button onClick={handleMarkWinner} className="event-detail-cta-btn primary">
              🏆 Mark as Winner
            </button>
          )}
        </div>

        {/* Feedback Section */}
        <div style={{ marginTop: '3rem' }}>
          <h3 className="event-detail-teams-header">Judge Feedback</h3>
          
          {/* Feedback List */}
          {feedback.length > 0 ? (
            <div className="feedback-list">
              {feedback.map((item) => (
                <div key={item.id} className="feedback-item">
                  <div className="feedback-header">
                    <div className="feedback-author">
                      <div className="feedback-author-avatar">
                        {item.judge?.username?.charAt(0).toUpperCase() || 'J'}
                      </div>
                      <div>
                        <span className="feedback-author-name">
                          {item.judge?.username || 'Judge'}
                        </span>
                        <span className="feedback-score">
                          Score: {item.score}/10
                        </span>
                      </div>
                    </div>
                    <span className="feedback-date">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="feedback-comment">{item.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="event-detail-teams-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <p>No feedback yet</p>
            </div>
          )}

          {/* Add Feedback Form (for judges) */}
          {isJudge && (
            <form onSubmit={handleSubmitFeedback} className="feedback-form">
              <h4 style={{ color: 'white', marginBottom: '1rem' }}>Add Your Feedback</h4>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '0.5rem' }}>
                  Score (1-10)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[1,2,3,4,5,6,7,8,9,10].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFeedbackScore(num)}
                      className={`score-btn ${feedbackScore === num ? 'active' : ''}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="register-input-group">
                <label className="register-label">Feedback Comment</label>
                <div className="register-input-wrapper">
                  <svg className="register-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="register-input"
                    placeholder="Share your feedback on this project..."
                    rows="3"
                    style={{ paddingTop: '1rem', paddingBottom: '1rem', height: 'auto' }}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="register-button"
                disabled={submittingFeedback}
                style={{ marginTop: '1rem' }}
              >
                {submittingFeedback ? (
                  <>
                    <span className="register-loader"></span>
                    Submitting...
                  </>
                ) : (
                  'Submit Feedback'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "../../../utils/axios";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

// Safe access helper
const safeGet = (obj, path, defaultValue = null) => {
  if (!obj) return defaultValue;
  return path.split('.').reduce((acc, part) => {
    if (acc && acc[part] !== undefined) return acc[part];
    return defaultValue;
  }, obj);
};

export default function SubmissionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: authUser, isJudge, isOrganizer } = useAuth();
  const [submission, setSubmission] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackScore, setFeedbackScore] = useState(5);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Safe data getters
  const getEventName = useCallback(() => {
    return safeGet(submission, 'event.name', 
      safeGet(submission, 'event_name', 
        safeGet(submission, 'event_title', '—')));
  }, [submission]);

  const getTeamName = useCallback(() => {
    return safeGet(submission, 'team.name', 
      safeGet(submission, 'team_name', 
        safeGet(submission, 'team_title', '—')));
  }, [submission]);

  const getTeamMembers = useCallback(() => {
    return safeGet(
      submission,
      'team_details.members_details',
      safeGet(submission, 'team.members', [])
    );
  }, [submission]);

  const getTeamMemberCount = useCallback(() => {
    const members = getTeamMembers();
    return members.length || safeGet(submission, 'team_member_count', 0);
  }, [getTeamMembers, submission]);

  const getSubmittedBy = useCallback(() => {
    return safeGet(submission, 'submitted_by_username',
      safeGet(submission, 'submitted_by.username',
        safeGet(submission, 'submitter.username', null)));
  }, [submission]);

  const getTechnologies = useCallback(() => {
    return safeGet(submission, 'technologies', []);
  }, [submission]);

  // Ownership check
  const isOwner = (() => {
    if (!authUser) return false;
    const members = getTeamMembers();
    return members.some(member => 
      member?.id === authUser.id || member?.username === authUser.username
    );
  })();

  const canEdit = isOwner && !submission?.is_reviewed;

  // Status helpers
  const getStatus = () => {
    if (!submission) return { class: "closed", text: "Unknown" };
    if (submission.is_winner) return { class: "live", text: "Winner 🏆" };
    if (submission.is_reviewed) return { class: "soon", text: "Reviewed" };
    return { class: "closed", text: "Pending Review" };
  };

  const status = getStatus();
  const judgesRequired = submission?.required_judges_count || 0;
  const judgesCompleted = submission?.completed_judges_count || 0;
  const allJudgesScored = submission?.all_judges_scored === true;
  const isAssignedJudge = submission?.is_assigned_judge === true;

  // Calculate average score
  const avgScore = feedback.length > 0
    ? (feedback.reduce((sum, f) => sum + (f.score || 0), 0) / feedback.length).toFixed(1)
    : null;

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError("");
        
        console.log("Fetching submission ID:", id);
        
        // Fetch submission with expanded data if supported
        const subRes = await axios.get(`/submissions/${id}/`);
        console.log("Submission data received:", subRes.data);
        
        setSubmission(subRes.data);

        // Fetch feedback
        try {
          const feedbackRes = await axios.get(`/submissions/${id}/feedback/`);
          console.log("Feedback data:", feedbackRes.data);
          // Handle both paginated and non-paginated responses
          const feedbackData = feedbackRes.data.results || feedbackRes.data || [];
          setFeedback(Array.isArray(feedbackData) ? feedbackData : []);
        } catch (err) {
          if (err.response?.status !== 404) {
            console.error("Error fetching feedback:", err);
          }
          setFeedback([]); // Set empty array on error
        }

      } catch (err) {
        console.error("Error fetching submission:", err);
        
        if (err.response?.status === 404) {
          setError("Submission not found");
        } else if (err.response?.status === 401) {
          setError("Please log in to view this submission");
        } else {
          setError(err.response?.data?.detail || "Failed to load submission");
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      setError("Please enter a comment");
      return;
    }
    
    setSubmittingFeedback(true);
    setError("");
    
    try {
      // The backend expects the submission ID in the payload
      const payload = {
        submission: parseInt(id), // Add the submission ID
        comment: feedbackText.trim(),
        score: Number(feedbackScore)
      };
      
      console.log("Sending feedback payload:", payload);
      
      const res = await axios.post(`/submissions/${id}/feedback/`, payload);
      
      console.log("Feedback response:", res.data);
      
      // Add the new feedback to the list
      setFeedback(prev => Array.isArray(prev) ? [...prev, res.data] : [res.data]);
      
      // Reset form
      setFeedbackText("");
      setFeedbackScore(5);
      
    } catch (err) {
      console.error("Feedback submission error:", err);
      
      // Better error parsing
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'string') {
          setError(errorData);
        } else if (errorData.detail) {
          setError(errorData.detail);
        } else if (errorData.message) {
          setError(errorData.message);
        } else {
          // Handle field errors
          const fieldErrors = Object.entries(errorData)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('; ');
          setError(fieldErrors || "Failed to submit feedback");
        }
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!confirm("Are you sure you want to delete this feedback?")) return;
    
    setSubmittingFeedback(true);
    setError("");
    
    try {
      await axios.delete(`/submissions/${id}/feedback/`, {
        data: { feedback_id: feedbackId }
      });
      
      // Remove the deleted feedback from state
      setFeedback(prev => prev.filter(f => f.id !== feedbackId));
      
    } catch (err) {
      console.error("Error deleting feedback:", err);
      
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to delete feedback");
      }
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleMarkWinner = async () => {
    if (!submission?.all_judges_scored) {
      setError("Cannot mark winner until all assigned judges have scored.");
      return;
    }
    if (!confirm("Mark this submission as a winner?")) return;
    
    try {
      setError("");
      await axios.post(`/submissions/${id}/mark-winner/`);
      
      // Refresh submission data
      const res = await axios.get(`/submissions/${id}/`);
      setSubmission(res.data);
      
    } catch (err) {
      console.error("Error marking as winner:", err);
      setError(err.response?.data?.detail || "Failed to mark as winner");
    }
  };

  const handleBack = () => {
    router.push("/submissions");
  };

  const openLink = (url) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
      return <LoadingSpinner message="Loading submissions..." />;
    }

  if (error && !submission) {
    return (
      <div className="evd-error-page">
        <div className="evd-error-card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2>{error}</h2>
          <p>The submission you're looking for doesn't exist or you don't have permission to view it.</p>
          <button onClick={handleBack} className="evd-btn-primary">
            Back to Submissions
          </button>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="evd-error-page">
        <div className="evd-error-card">
          <h2>Submission not found</h2>
          <button onClick={handleBack} className="evd-btn-primary">
            Back to Submissions
          </button>
        </div>
      </div>
    );
  }

  const eventName = getEventName();
  const teamName = getTeamName();
  const teamMembers = getTeamMembers();
  const teamMemberCount = getTeamMemberCount();
  const submittedBy = getSubmittedBy();
  const technologies = getTechnologies();

  return (
    <div className="evd-page">

      <button onClick={handleBack} className="evd-back-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        <span>Back to Submissions</span>
      </button>

      {/* Hero */}
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
            by {teamName} · {eventName}
            {submittedBy && (
              <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                {" "}· submitted by <span style={{ color: "var(--accent)" }}>{submittedBy}</span>
              </span>
            )}
          </p>
        </div>
        <div className={`evd-status-pill evd-pill-${status.class}`}>
          <span className="evd-pill-dot" />
          {status.text}
        </div>
      </div>

      {/* Info Strip */}
      <div className="evd-info-strip-enhanced">

        {/* Submitted Date */}
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
              {submission.created_at ? new Date(submission.created_at).toLocaleDateString("en-US", {
                month: "long", day: "numeric", year: "numeric"
              }) : "Date unavailable"}
            </div>
          </div>
        </div>

        {/* Event */}
        <div className="evd-info-card">
          <div className="evd-info-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="evd-info-content">
            <div className="evd-info-label">Event</div>
            <div className="evd-info-val">
              {eventName}
              {submission.event?.start_date && (
                <span style={{ fontSize: "0.7rem", color: "var(--muted)", display: "block" }}>
                  {new Date(submission.event.start_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="evd-info-card">
          <div className="evd-info-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="evd-info-content">
            <div className="evd-info-label">Team</div>
            <div className="evd-info-val">
              {teamName}
              {teamMemberCount > 0 && (
                <span style={{ fontSize: "0.7rem", color: "var(--muted)", display: "block" }}>
                  {teamMemberCount} member{teamMemberCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Average Score */}
        {avgScore && (
          <div className="evd-info-card">
            <div className="evd-info-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div className="evd-info-content">
              <div className="evd-info-label">Avg Score</div>
              <div className="evd-info-val">
                {avgScore}<span style={{ fontSize: ".75rem", opacity: .6, marginLeft: "2px" }}>/10</span>
              </div>
            </div>
          </div>
        )}

        {/* Live Demo */}
        {submission.demo_url && (
          <div className="evd-info-card evd-info-link" onClick={() => openLink(submission.demo_url)}>
            <div className="evd-info-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <div className="evd-info-content">
              <div className="evd-info-label">Live Demo</div>
              <div className="evd-info-val">View Project ↗</div>
            </div>
          </div>
        )}

        {/* Repo */}
        {submission.repo_url && (
          <div className="evd-info-card evd-info-link" onClick={() => openLink(submission.repo_url)}>
            <div className="evd-info-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
            </div>
            <div className="evd-info-content">
              <div className="evd-info-label">Repository</div>
              <div className="evd-info-val">View Code ↗</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="evd-tabs">
        <button 
          className={`evd-tab ${activeTab === "overview" ? "active" : ""}`} 
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button 
          className={`evd-tab ${activeTab === "feedback" ? "active" : ""}`} 
          onClick={() => setActiveTab("feedback")}
        >
          Feedback {feedback.length > 0 && `(${feedback.length})`}
        </button>
      </div>

      {/* Panel */}
      <div className="evd-panel">

        {/* Overview */}
        {activeTab === "overview" && (
          <>
            <div className="evd-about">
              <h3>About the Project</h3>
              <p>{submission.description || submission.summary || "No description provided."}</p>
            </div>

            {/* Team Members */}
            {teamMembers.length > 0 && (
              <div style={{ padding: "0 28px 28px", borderTop: "1px solid var(--border)" }}>
                <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "15px", fontWeight: 700, color: "#f0f0f3", margin: "24px 0 14px" }}>
                  Team Members
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {teamMembers.map((member) => (
                    <div key={member.id} style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      background: "var(--surface2)", border: "1px solid var(--border)",
                      borderRadius: "10px", padding: "8px 14px"
                    }}>
                      <div style={{
                        width: "28px", height: "28px", borderRadius: "50%",
                        background: "var(--accent)", color: "#0c0c0f",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "12px", fontWeight: 700, overflow: "hidden"
                      }}>
                        {member.avatar ? (
                          <img src={member.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          member.username?.charAt(0).toUpperCase() || "?"
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
                          {member.username}
                        </div>
                        {(safeGet(submission, 'team.leader_details.id') || submission?.team?.leader) === member.id && (
                          <div style={{ fontSize: "11px", color: "var(--accent)" }}>Leader</div>
                        )}
                        {submittedBy === member.username && (
                          <div style={{ fontSize: "11px", color: "var(--muted)" }}>Submitted</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technologies */}
            {technologies.length > 0 && (
              <div style={{ padding: "0 28px 28px", borderTop: "1px solid var(--border)" }}>
                <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "15px", fontWeight: 700, color: "#f0f0f3", margin: "24px 0 14px" }}>
                  Technologies Used
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {technologies.map((tech, idx) => (
                    <span key={idx} className="tech-tag">{tech}</span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Feedback */}
        {activeTab === "feedback" && (
          <div>
            <div className="evd-teams-head">
              <h3>Judge Feedback {feedback.length > 0 && `(${feedback.length})`}</h3>
              {isOrganizer && !submission.is_winner && (
                <button
                  onClick={handleMarkWinner}
                  className="evd-btn-winner"
                  disabled={!allJudgesScored}
                  style={{ opacity: allJudgesScored ? 1 : 0.5, cursor: allJudgesScored ? "pointer" : "not-allowed" }}
                >
                  <span style={{ fontSize: "1.1rem" }}>🏆</span>
                  {allJudgesScored ? "Mark as Winner" : "Awaiting Judges"}
                </button>
              )}
            </div>
            {judgesRequired > 0 && (
              <div style={{ padding: "0 28px 16px" }}>
                <div style={{ height: 8, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
                  <span
                    style={{
                      display: "block",
                      height: "100%",
                      width: `${Math.min(100, Math.round((judgesCompleted / judgesRequired) * 100))}%`,
                      background: "linear-gradient(90deg, var(--accent), #60a5fa)"
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                  {judgesCompleted}/{judgesRequired} judges scored
                </div>
              </div>
            )}
            {judgesRequired === 0 && (
              <div style={{ padding: "0 28px 16px", fontSize: 12, color: "var(--muted)" }}>
                No judges assigned to this event yet.
              </div>
            )}

            {feedback.length > 0 ? (
              <div className="evd-feedback-list">
                {feedback.map((item) => {
                  const judgeDetails = item.judge_details || (typeof item.judge === "object" ? item.judge : null);
                  const judgeName = judgeDetails?.username || item.judge_username || "Judge";
                  // Check if current user can delete this feedback
                  const canDelete = 
                    judgeDetails?.id === authUser?.id || // The judge who wrote it
                    isOrganizer || // Organizer
                    authUser?.is_staff || // Staff
                    authUser?.is_superuser; // Admin
                  
                  return (
                    <div key={item.id} className="evd-feedback-item">
                      <div className="evd-feedback-header">
                          <div className="evd-feedback-judge">
                          <div className="evd-feedback-avatar">
                            {judgeDetails?.avatar ? (
                              <img src={judgeDetails.avatar} alt="" />
                            ) : (
                              judgeName?.charAt(0).toUpperCase() || "J"
                            )}
                          </div>
                          <div className="evd-feedback-judge-info">
                            <span className="evd-feedback-judge-name">{judgeName}</span>
                            <span className="evd-feedback-date">
                              {item.created_at ? new Date(item.created_at).toLocaleDateString("en-US", { 
                                month: "short", day: "numeric", year: "numeric" 
                              }) : "Date unavailable"}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div className="evd-feedback-score-badge">
                            <span className="evd-feedback-score-value">{item.score}</span>
                            <span className="evd-feedback-score-max">/10</span>
                          </div>
                          
                          {/* Delete button - only shown to authorized users */}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteFeedback(item.id)}
                              className="evd-feedback-delete-btn"
                              title="Delete feedback"
                              style={{
                                background: "transparent",
                                border: "1px solid rgba(248,113,113,0.3)",
                                borderRadius: "6px",
                                color: "#f87171",
                                width: "32px",
                                height: "32px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                fontSize: "1rem",
                                transition: "all 0.2s ease"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(248,113,113,0.1)";
                                e.currentTarget.style.borderColor = "#f87171";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.borderColor = "rgba(248,113,113,0.3)";
                              }}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="evd-feedback-progress-container">
                        <div className="evd-feedback-progress-bar">
                          <div className="evd-feedback-progress-fill" style={{
                            width: `${((item.score || 0) / 10) * 100}%`,
                            background: item.score >= 8 ? "linear-gradient(90deg, var(--accent), #4ade80)" :
                              item.score >= 5 ? "linear-gradient(90deg, #fbbf24, var(--accent))" :
                                "linear-gradient(90deg, #f87171, #fbbf24)"
                          }} />
                        </div>
                        <div className="evd-feedback-progress-labels">
                          <span>Needs Work</span><span>Good</span><span>Excellent</span>
                        </div>
                      </div>
                      <div className="evd-feedback-comment">
                        <p>{item.comment || "No comment provided."}</p>
                      </div>
                    </div>
                  );
                })}
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

            {/* Judge Feedback Form */}
            {isJudge && isAssignedJudge && (
              <div style={{ padding: "28px", borderTop: "1px solid var(--border)" }}>
                <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "15px", fontWeight: 700, color: "#f0f0f3", margin: "0 0 20px" }}>
                  Add Your Feedback
                </h3>
                <form onSubmit={handleSubmitFeedback} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, color: "rgba(240,240,243,0.8)", marginBottom: "0.5rem" }}>
                      Score (1–10)
                    </label>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {[1,2,3,4,5,6,7,8,9,10].map(num => (
                        <button 
                          key={num} 
                          type="button" 
                          onClick={() => setFeedbackScore(num)} 
                          style={{
                            width: "40px", height: "40px", borderRadius: "10px",
                            background: feedbackScore === num ? "var(--accent)" : "var(--surface2)",
                            border: feedbackScore === num ? "1px solid var(--accent)" : "1px solid var(--border)",
                            color: feedbackScore === num ? "#0c0c0f" : "var(--muted)",
                            fontWeight: "600", fontSize: "0.95rem", cursor: "pointer",
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.2s ease"
                          }}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, color: "rgba(240,240,243,0.8)", marginBottom: "0.5rem" }}>
                      Comment
                    </label>
                    <textarea 
                      value={feedbackText} 
                      onChange={(e) => setFeedbackText(e.target.value)} 
                      style={{
                        width: "100%", padding: "0.75rem 1rem",
                        background: "var(--surface2)", border: "1px solid var(--border)",
                        borderRadius: "10px", color: "var(--text)", fontFamily: "DM Sans, sans-serif",
                        fontSize: "0.9rem", resize: "vertical", minHeight: "100px",
                        lineHeight: "1.6", outline: "none", boxSizing: "border-box"
                      }} 
                      placeholder="Share your detailed feedback on this project..." 
                      required 
                    />
                  </div>
                  {error && <p style={{ color: "#f87171", fontSize: "0.85rem" }}>{error}</p>}
                  <button 
                    type="submit" 
                    disabled={submittingFeedback} 
                    className="evd-btn-primary" 
                    style={{ alignSelf: "flex-start" }}
                  >
                    {submittingFeedback ? "Submitting..." : "Submit Feedback"}
                  </button>
                </form>
              </div>
            )}
            {isJudge && !isAssignedJudge && (
              <div style={{ padding: "28px", borderTop: "1px solid var(--border)", color: "var(--muted)" }}>
                You are not assigned to judge this submission.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

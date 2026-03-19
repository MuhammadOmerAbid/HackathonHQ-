"use client";

import React from "react";
import Link from "next/link";

export default function SubmissionCard({ submission }) {
  const getStatus = () => {
    if (submission.is_winner) return { text: "Winner", icon: "🏆", cls: "winner" };
    if (submission.is_reviewed) return { text: "Reviewed", icon: "✓", cls: "reviewed" };
    return { text: "Pending", icon: "●", cls: "pending" };
  };
  
  const status = getStatus();

  const teamName = submission.team_name || submission.team?.name || "—";
  const teamMemberCount = submission.team_details?.members?.length ?? submission.team?.members?.length ?? null;
  const eventName = submission.event_name || submission.event?.name || "—";
  const submittedBy = submission.submitted_by_username || submission.submitted_by?.username || null;

  const formatDate = (dateString) => {
    const date = new Date(dateString || Date.now());
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Status color mapping
  const statusColors = {
    winner: { bg: "rgba(251,191,36,0.12)", text: "#fbbf24", border: "rgba(251,191,36,0.25)" },
    reviewed: { bg: "rgba(96,165,250,0.12)", text: "#60a5fa", border: "rgba(96,165,250,0.25)" },
    pending: { bg: "rgba(156,163,175,0.12)", text: "#9ca3af", border: "rgba(156,163,175,0.25)" }
  };

  const statusColor = statusColors[status.cls];

  return (
    <Link href={`/submissions/${submission.id}`} className="submission-card-link">
      <div className={`submission-card ${status.cls === "winner" ? "winner-border" : ""}`}>
        {/* Gradient overlay */}
        <div className="card-gradient" />
        
        <div className="card-content">
          {/* Header */}
          <div className="submission-header">
            <h3 className="submission-title">{submission.title || "Untitled Project"}</h3>
            <span 
              className="submission-badge"
              style={{ 
                background: statusColor.bg,
                color: statusColor.text,
                borderColor: statusColor.border
              }}
            >
              {status.icon} {status.text}
            </span>
          </div>

          {/* Team & Event Info */}
          <div className="submission-meta">
            <div className="meta-item">
              <span className="meta-label">Team</span>
              <span className="meta-value">{teamName}</span>
              {teamMemberCount !== null && (
                <span className="meta-count">{teamMemberCount} {teamMemberCount === 1 ? 'member' : 'members'}</span>
              )}
            </div>
            
            <div className="meta-item">
              <span className="meta-label">Event</span>
              <span className="meta-value">{eventName}</span>
            </div>

            {submittedBy && (
              <div className="meta-item">
                <span className="meta-label">Submitted by</span>
                <span className="meta-value accent">{submittedBy}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="submission-description">
            {submission.summary || (submission.description ? submission.description.substring(0, 120) + "..." : "No description provided.")}
          </p>

          {/* Technologies */}
          {submission.technologies?.length > 0 && (
            <div className="submission-techs">
              {submission.technologies.slice(0, 4).map((tech, i) => (
                <span key={i} className="tech-tag">{tech}</span>
              ))}
              {submission.technologies.length > 4 && (
                <span className="tech-tag">+{submission.technologies.length - 4}</span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="submission-footer">
            <div className="footer-left">
              <svg className="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="footer-date">{formatDate(submission.created_at)}</span>
            </div>
            
            <div className="footer-right">
              {submission.demo_url && (
                <button 
                  className="footer-link"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(submission.demo_url, "_blank");
                  }}
                  title="Live Demo"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </button>
              )}
              {submission.repo_url && (
                <button 
                  className="footer-link"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(submission.repo_url, "_blank");
                  }}
                  title="Repository"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .submission-card-link {
          text-decoration: none;
          display: block;
        }

        .submission-card {
          position: relative;
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.25s ease;
          height: 100%;
        }

        .submission-card:hover {
          transform: translateY(-3px);
          border-color: rgba(110,231,183,0.3);
          box-shadow: 0 15px 30px rgba(0,0,0,0.4);
        }

        .winner-border {
          border-left: 3px solid #fbbf24;
        }

        .card-gradient {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at top right,
            rgba(110,231,183,0.1),
            transparent 70%
          );
          opacity: 0;
          transition: opacity 0.25s ease;
          pointer-events: none;
        }

        .submission-card:hover .card-gradient {
          opacity: 1;
        }

        .card-content {
          position: relative;
          z-index: 1;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* Header */
        .submission-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .submission-title {
          font-family: 'Syne', sans-serif;
          font-size: 17px;
          font-weight: 700;
          color: #f0f0f3;
          margin: 0;
          flex: 1;
          line-height: 1.3;
        }

        .submission-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid;
          white-space: nowrap;
        }

        /* Meta Information */
        .submission-meta {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-bottom: 12px;
          border-bottom: 1px solid #1e1e24;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 13px;
        }

        .meta-label {
          color: #5c5c6e;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .meta-value {
          color: #f0f0f3;
          font-weight: 500;
        }

        .meta-value.accent {
          color: #6EE7B7;
        }

        .meta-count {
          color: #6EE7B7;
          font-size: 11px;
          margin-left: 4px;
        }

        /* Description */
        .submission-description {
          font-size: 14px;
          color: #b0b0ba;
          line-height: 1.6;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Technologies */
        .submission-techs {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tech-tag {
          padding: 4px 10px;
          background: rgba(110,231,183,0.04);
          border: 1px solid rgba(110,231,183,0.15);
          border-radius: 100px;
          color: #6EE7B7;
          font-size: 11px;
          font-weight: 500;
        }

        /* Footer */
        .submission-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 14px;
          border-top: 1px solid #1e1e24;
        }

        .footer-left {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #5c5c6e;
          font-size: 12px;
        }

        .footer-icon {
          width: 14px;
          height: 14px;
          stroke: currentColor;
        }

        .footer-date {
          color: #5c5c6e;
        }

        .footer-right {
          display: flex;
          gap: 8px;
        }

        .footer-link {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid #1e1e24;
          border-radius: 8px;
          color: #888;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .footer-link:hover {
          border-color: #6EE7B7;
          color: #6EE7B7;
          transform: scale(1.05);
        }

        .footer-link svg {
          width: 16px;
          height: 16px;
          stroke: currentColor;
        }
      `}</style>
    </Link>
  );
}
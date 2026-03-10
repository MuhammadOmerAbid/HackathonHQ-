"use client";

import React from "react";
import Link from "next/link";

export default function SubmissionCard({ submission }) {
  const getStatus = () => {
    if (submission.is_winner) return { text: "Winner", icon: "🏆", cls: "live" };
    if (submission.is_reviewed) return { text: "Reviewed", icon: "✓", cls: "soon" };
    return { text: "Pending", icon: "●", cls: "closed" };
  };
  const status = getStatus();

  return (
    <Link href={`/submissions/${submission.id}`} className="ev-card-link">
      <div className="ev-card">
        <div className="ev-card-top">
          <div className={`ev-dot ev-dot-${status.cls}`} />
          <span className={`ev-tag ev-tag-${status.cls}`}>{status.icon} {status.text}</span>
        </div>
        <h3 className="ev-name">{submission.title || "Untitled Project"}</h3>
        <p className="ev-organizer">
          by {submission.team?.name || "Team"} · {submission.event?.name || "Hackathon"}
        </p>
        <p className="ev-desc">{submission.summary || submission.description || "No description provided."}</p>
        <div className="ev-footer">
          <span className="ev-date" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    style={{ width: '14px', height: '14px', display: 'block' }}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
  {new Date(submission.created_at || Date.now()).toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric", 
    year: "numeric" 
  })}
</span>
          <span className="ev-teams">
            {submission.demo_url && <span style={{ marginRight: '0.5rem' }}>🔗</span>}
            {submission.repo_url && <span>📁</span>}
          </span>
        </div>
      </div>
    </Link>
  );
}
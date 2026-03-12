"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "@/utils/axios";
import { useAuth } from "@/context/AuthContext";

export default function JudgeDashboardPage() {
  const router = useRouter();
  const { user, isJudge } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    myFeedbacks: 0
  });

  useEffect(() => {
    // Redirect if not judge
    if (!isJudge && !loading) {
      router.push("/");
      return;
    }
    fetchData();
  }, [isJudge]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/submissions/?expand=event,team");
      const submissionsData = res.data.results || res.data || [];
      setSubmissions(submissionsData);
      
      // Calculate stats
      const pending = submissionsData.filter(s => !s.is_reviewed).length;
      const reviewed = submissionsData.filter(s => s.is_reviewed && !s.is_winner).length;
      
      // Get feedback given by current judge
      let myFeedbacks = 0;
      try {
        const feedbackRes = await axios.get("/feedback/");
        const feedbacks = feedbackRes.data.results || feedbackRes.data || [];
        myFeedbacks = feedbacks.filter(f => f.judge === user?.id).length;
      } catch (err) {
        console.error("Error fetching feedback:", err);
      }
      
      setStats({
        total: submissionsData.length,
        pending,
        reviewed,
        myFeedbacks
      });
      
    } catch (err) {
      console.error("Error fetching submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (sub) => {
    if (sub.is_winner) {
      return { text: "Winner", color: "#fbbf24", bg: "rgba(251,191,36,0.15)" };
    }
    if (sub.is_reviewed) {
      return { text: "Reviewed", color: "#60a5fa", bg: "rgba(96,165,250,0.15)" };
    }
    return { text: "Pending", color: "#9ca3af", bg: "rgba(156,163,175,0.15)" };
  };

  if (loading) {
    return (
      <div className="judge-loading">
        <div className="judge-spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="judge-page">
      <div className="judge-container">
        {/* Header */}
        <div className="judge-header">
          <div>
            <div className="judge-eyebrow">
              <span className="judge-eyebrow-dot" />
              <span className="judge-eyebrow-label">Judge Portal</span>
            </div>
            <h1 className="judge-title">Judge Dashboard</h1>
            <p className="judge-subtitle">Review submissions and provide feedback</p>
          </div>
          <div className="judge-header-actions">
            <Link href="/submissions" className="ev-btn-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>Browse All</span>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="judge-stats">
          <div className="judge-stat-card">
            <div className="judge-stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" strokeWidth="2">
                <polygon points="12 2 22 7 22 17 12 22 2 17 2 7 12 2" />
                <line x1="12" y1="22" x2="12" y2="12" />
                <polyline points="22 7 12 12 2 7" />
              </svg>
            </div>
            <div className="judge-stat-content">
              <span className="judge-stat-value">{stats.total}</span>
              <span className="judge-stat-label">Total Submissions</span>
            </div>
          </div>

          <div className="judge-stat-card">
            <div className="judge-stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="judge-stat-content">
              <span className="judge-stat-value">{stats.pending}</span>
              <span className="judge-stat-label">Pending Review</span>
            </div>
          </div>

          <div className="judge-stat-card">
            <div className="judge-stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="judge-stat-content">
              <span className="judge-stat-value">{stats.reviewed}</span>
              <span className="judge-stat-label">Reviewed</span>
            </div>
          </div>

          <div className="judge-stat-card">
            <div className="judge-stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 9l5 5 5-5M12 4v10" />
              </svg>
            </div>
            <div className="judge-stat-content">
              <span className="judge-stat-value judge-stat-highlight">{stats.myFeedbacks}</span>
              <span className="judge-stat-label">My Feedbacks</span>
            </div>
          </div>
        </div>

        {/* Quick Actions and Info */}
        <div className="judge-grid">
          {/* Quick Actions */}
          <div className="judge-card">
            <div className="judge-card-header">
              <h2 className="judge-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Quick Actions
              </h2>
            </div>
            <div className="judge-card-body">
              <div className="judge-actions">
                <Link href="/submissions?filter=pending" className="judge-action-item">
                  <div className="judge-action-icon">⏳</div>
                  <div>
                    <h4>Review Pending</h4>
                    <p>{stats.pending} submissions waiting</p>
                  </div>
                </Link>
                <Link href="/submissions" className="judge-action-item">
                  <div className="judge-action-icon">📋</div>
                  <div>
                    <h4>All Submissions</h4>
                    <p>Browse all projects</p>
                  </div>
                </Link>
                <Link href="/submissions?filter=reviewed" className="judge-action-item">
                  <div className="judge-action-icon">✓</div>
                  <div>
                    <h4>Reviewed</h4>
                    <p>See what you've reviewed</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Tips Card */}
          <div className="judge-card">
            <div className="judge-card-header">
              <h2 className="judge-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                Judging Tips
              </h2>
            </div>
            <div className="judge-card-body">
              <ul className="judge-tips-list">
                <li>Score 1-10 based on quality and innovation</li>
                <li>Provide constructive, specific feedback</li>
                <li>Highlight what works and what could improve</li>
                <li>You can edit your feedback anytime</li>
                <li>Be fair and consistent across submissions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="judge-card">
          <div className="judge-card-header">
            <h2 className="judge-card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" strokeWidth="2">
                <polygon points="12 2 22 7 22 17 12 22 2 17 2 7 12 2" />
                <line x1="12" y1="22" x2="12" y2="12" />
                <polyline points="22 7 12 12 2 7" />
              </svg>
              Recent Submissions
            </h2>
            <Link href="/submissions" className="judge-card-link">View All →</Link>
          </div>
          <div className="judge-card-body">
            {submissions.length === 0 ? (
              <div className="judge-empty">
                <p>No submissions yet</p>
              </div>
            ) : (
              <div className="judge-recent-list">
                {submissions.slice(0, 5).map((sub) => {
                  const status = getStatusBadge(sub);
                  return (
                    <Link href={`/submissions/${sub.id}`} key={sub.id} className="judge-recent-item">
                      <div className="judge-recent-header">
                        <h3 className="judge-recent-title">{sub.title || "Untitled Project"}</h3>
                        <span className={`judge-recent-badge judge-badge-${status.text.toLowerCase()}`}>
                          {status.text}
                        </span>
                      </div>
                      <p className="judge-recent-meta">
                        {sub.team_name || sub.team?.name || "Team"} · {sub.event_name || sub.event?.name || "Hackathon"}
                      </p>
                      <div className="judge-recent-footer">
                        <span className="judge-recent-date">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {new Date(sub.created_at).toLocaleDateString()}
                        </span>
                        {sub.feedback_count > 0 && (
                          <span className="judge-recent-feedback">
                            {sub.feedback_count} feedback{sub.feedback_count !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Your Activity Summary */}
        {stats.myFeedbacks > 0 && (
          <div className="judge-card">
            <div className="judge-card-header">
              <h2 className="judge-card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 9l5 5 5-5M12 4v10" />
                </svg>
                Your Activity
              </h2>
            </div>
            <div className="judge-card-body">
              <div className="judge-activity-item">
                <div className="judge-activity-icon">📝</div>
                <div className="judge-activity-content">
                  <p className="judge-activity-message">
                    You have submitted <strong>{stats.myFeedbacks}</strong> feedback{stats.myFeedbacks !== 1 ? 's' : ''}
                  </p>
                  <span className="judge-activity-time">Keep up the great work!</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .judge-page {
          min-height: 100vh;
          background: #0a0a0a;
          font-family: 'DM Sans', sans-serif;
        }

        .judge-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 2rem;
          position: relative;
          z-index: 10;
        }

        /* Header */
        .judge-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 2rem;
        }

        .judge-eyebrow {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .judge-eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6EE7B7;
        }

        .judge-eyebrow-label {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #6EE7B7;
        }

        .judge-title {
          font-family: 'Syne', sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.25rem 0;
          letter-spacing: -0.02em;
        }

        .judge-subtitle {
          color: #888;
          margin: 0;
          font-size: 1rem;
        }

        .judge-header-actions {
          display: flex;
          gap: 1rem;
        }

        /* Stats Cards */
        .judge-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .judge-stat-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          transition: all 0.2s;
        }

        .judge-stat-card:hover {
          border-color: #6EE7B7;
          background: rgba(110,231,183,0.05);
          transform: translateY(-2px);
        }

        .judge-stat-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(110,231,183,0.1);
          border-radius: 12px;
          flex-shrink: 0;
        }

        .judge-stat-icon svg {
          width: 24px;
          height: 24px;
        }

        .judge-stat-content {
          display: flex;
          flex-direction: column;
        }

        .judge-stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .judge-stat-highlight {
          color: #6EE7B7;
        }

        .judge-stat-label {
          font-size: 0.75rem;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Grid Layout */
        .judge-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        /* Cards */
        .judge-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.2s;
        }

        .judge-card:hover {
          border-color: rgba(255,255,255,0.1);
        }

        .judge-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem 0.5rem 1.5rem;
        }

        .judge-card-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: #fff;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .judge-card-title svg {
          width: 20px;
          height: 20px;
        }

        .judge-card-body {
          padding: 0.5rem 1.5rem 1.5rem 1.5rem;
        }

        .judge-card-link {
          color: #6EE7B7;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .judge-card-link:hover {
          color: #86efac;
        }

        /* Quick Actions */
        .judge-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .judge-action-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.2s;
        }

        .judge-action-item:hover {
          background: rgba(255,255,255,0.05);
          border-color: #6EE7B7;
          transform: translateX(4px);
        }

        .judge-action-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
          font-size: 1.25rem;
        }

        .judge-action-item h4 {
          font-size: 0.95rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 0.25rem 0;
        }

        .judge-action-item p {
          font-size: 0.75rem;
          color: #888;
          margin: 0;
        }

        /* Tips List */
        .judge-tips-list {
          margin: 0;
          padding-left: 1.25rem;
          color: rgba(255,255,255,0.7);
          font-size: 0.9rem;
          line-height: 1.8;
        }

        .judge-tips-list li {
          margin-bottom: 0.25rem;
        }

        /* Recent Submissions List */
        .judge-recent-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .judge-recent-item {
          display: block;
          padding: 1rem;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.2s;
        }

        .judge-recent-item:hover {
          background: rgba(255,255,255,0.05);
          border-color: #6EE7B7;
          transform: translateX(4px);
        }

        .judge-recent-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          gap: 0.5rem;
        }

        .judge-recent-title {
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }

        .judge-recent-badge {
          padding: 0.2rem 0.6rem;
          border-radius: 30px;
          font-size: 0.7rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .judge-badge-pending {
          background: rgba(156,163,175,0.15);
          color: #9ca3af;
          border: 1px solid rgba(156,163,175,0.3);
        }

        .judge-badge-reviewed {
          background: rgba(96,165,250,0.15);
          color: #60a5fa;
          border: 1px solid rgba(96,165,250,0.3);
        }

        .judge-badge-winner {
          background: rgba(251,191,36,0.15);
          color: #fbbf24;
          border: 1px solid rgba(251,191,36,0.3);
        }

        .judge-recent-meta {
          font-size: 0.85rem;
          color: #888;
          margin: 0 0 0.75rem 0;
        }

        .judge-recent-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .judge-recent-date {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.4);
        }

        .judge-recent-date svg {
          width: 14px;
          height: 14px;
        }

        .judge-recent-feedback {
          font-size: 0.7rem;
          color: #6EE7B7;
        }

        /* Activity Item */
        .judge-activity-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: rgba(255,255,255,0.02);
          border-radius: 12px;
        }

        .judge-activity-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(110,231,183,0.1);
          border-radius: 10px;
          font-size: 1.25rem;
          color: #6EE7B7;
        }

        .judge-activity-content {
          flex: 1;
        }

        .judge-activity-message {
          font-size: 0.95rem;
          color: #fff;
          margin: 0 0 0.25rem 0;
        }

        .judge-activity-time {
          font-size: 0.75rem;
          color: #888;
        }

        /* Empty State */
        .judge-empty {
          text-align: center;
          padding: 2rem;
          color: #888;
        }

        /* Loading */
        .judge-loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #0a0a0a;
          color: #888;
          gap: 1rem;
        }

        .judge-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: #6EE7B7;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .judge-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .judge-container {
            padding: 1rem;
          }

          .judge-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .judge-title {
            font-size: 2rem;
          }

          .judge-grid {
            grid-template-columns: 1fr;
          }

          .judge-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .judge-stats {
            grid-template-columns: 1fr;
          }

          .judge-header-actions {
            width: 100%;
          }

          .ev-btn-primary {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
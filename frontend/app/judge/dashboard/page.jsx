"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "@/utils/axios";
import { useAuth } from "@/context/AuthContext";
import useSSE from "@/utils/useSSE";
import LoadingSpinner from "@/components/LoadingSpinner";

/* ── Sparkline Component ── */
const Sparkline = ({ series = [], color = "#6EE7B7" }) => {
  const W = 200, H = 52;
  const vals = series.map(s => s.count || 0);
  if (!vals.length) return <div className="no-data">No data yet</div>;
  
  const max = Math.max(1, ...vals);
  const min = Math.min(0, ...vals);
  const step = vals.length > 1 ? W / (vals.length - 1) : W;
  const pts = vals.map((v, i) => {
    const x = i * step;
    const y = H - ((v - min) / (max - min || 1)) * (H - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const gid = `gradient-${color.replace("#", "")}`;
  
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: 52, display: "block" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M0,${H} L${pts.join(" L")} L${W},${H} Z`} fill={`url(#${gid})`} />
      <path d={`M${pts.join(" L")}`} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/* ── Ring Progress Component ── */
const Ring = ({ pct = 0, color = "#6EE7B7", size = 80 }) => {
  const r = 30, cx = 40, cy = 40;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e1e24" strokeWidth="7" />
      <circle 
        cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 40 40)" 
        style={{ transition: "stroke-dasharray 0.7s cubic-bezier(0.16, 1, 0.3, 1)" }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize="14" fontWeight="700" fontFamily="Syne,sans-serif">
        {pct}%
      </text>
    </svg>
  );
};

/* ── Helper Functions ── */
const formatNumber = (v) => v == null ? "0" : new Intl.NumberFormat().format(v);
const timeAgo = (date) => {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d)) return "—";
  const minutes = Math.floor((Date.now() - d) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const DEFAULT_RUBRIC = [
  { key: "innovation", label: "Innovation", weight: 1 },
  { key: "execution", label: "Execution", weight: 1 },
  { key: "design", label: "Design", weight: 1 },
  { key: "impact", label: "Impact", weight: 1 },
];

/* ═══════════════════════════════════════════════════════════
   Main Component
════════════════════════════════════════════════════════════ */
export default function JudgeDashboardPage() {
  const router = useRouter();
  const { user, isJudge, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedMeta, setSelectedMeta] = useState(null);
  const [criteriaScores, setCriteriaScores] = useState({});
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingScore, setSubmittingScore] = useState(false);

  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("access");
  
  useSSE("/analytics/stream/?channel=judge", {
    enabled: hasToken,
    onMessage: (payload) => {
      setData(payload);
      setLoading(false);
    },
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isJudge) {
      router.push("/");
      return;
    }
    
    axios.get("/analytics/judge/")
      .then(response => setData(response.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [authLoading, isJudge, router]);

  const stats = data?.stats || {};
  const series = data?.series || {};
  const queue = data?.assigned_queue || [];
  const distribution = data?.score_distribution || [];
  const recent = data?.recent_feedbacks || [];

  const completionRate = useMemo(() => {
    if (!stats.assigned_total) return 0;
    return Math.round((stats.completed_for_judge / stats.assigned_total) * 100);
  }, [stats]);

  const filteredQueue = useMemo(() => {
    if (filter === "pending") return queue.filter(s => !s.my_score);
    if (filter === "done") return queue.filter(s => !!s.my_score);
    return queue;
  }, [queue, filter]);

  const pendingCount = queue.filter(s => !s.my_score).length;
  const doneCount = queue.filter(s => !!s.my_score).length;

  const getRubric = (submission) => {
    const r = submission?.event?.judging_criteria;
    return Array.isArray(r) && r.length > 0 ? r : DEFAULT_RUBRIC;
  };

  const buildScoreMap = (rubric, existingScores = {}) => {
    const map = {};
    rubric.forEach((c) => {
      const v = existingScores?.[c.key];
      map[c.key] = v != null ? Number(v) : 5;
    });
    return map;
  };

  const openDrawer = async (sub) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerError("");
    setSelectedSubmission(null);
    setSelectedMeta(sub);
    setFeedbackComment("");
    try {
      const subRes = await axios.get(`/submissions/${sub.id}/`);
      const submission = subRes.data;
      setSelectedSubmission(submission);

      const rubric = getRubric(submission);
      let existingScores = {};
      let existingComment = "";

      try {
        const fbRes = await axios.get(`/submissions/${sub.id}/feedback/`);
        const list = fbRes.data?.results || fbRes.data || [];
        const mine = list.find(f => {
          const judgeId = f?.judge_details?.id || f?.judge;
          return judgeId && user?.id && String(judgeId) === String(user.id);
        });
        if (mine) {
          existingScores = mine.criteria_scores || {};
          existingComment = mine.comment || "";
        }
      } catch {
        // ignore feedback prefill errors
      }

      setCriteriaScores(buildScoreMap(rubric, existingScores));
      setFeedbackComment(existingComment);
    } catch (e) {
      setDrawerError("Failed to load submission details.");
    } finally {
      setDrawerLoading(false);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedSubmission(null);
    setSelectedMeta(null);
    setDrawerError("");
  };

  const rubric = getRubric(selectedSubmission);
  const totalScore = useMemo(() => {
    if (!rubric || rubric.length === 0) return 0;
    const totalWeight = rubric.reduce((sum, r) => sum + (r.weight || 1), 0);
    const total = rubric.reduce((sum, r) => sum + (criteriaScores[r.key] || 0) * (r.weight || 1), 0);
    return totalWeight ? Math.round((total / totalWeight) * 10) / 10 : 0;
  }, [criteriaScores, rubric]);

  const handleSubmitScore = async () => {
    if (!selectedSubmission) return;
    if (!feedbackComment.trim()) {
      setDrawerError("Please add a comment before submitting.");
      return;
    }
    setSubmittingScore(true);
    setDrawerError("");
    try {
      const payload = {
        comment: feedbackComment || "",
        criteria_scores: criteriaScores,
      };
      await axios.put(`/submissions/${selectedSubmission.id}/feedback/`, payload);
      // Optimistically update queue score
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          assigned_queue: (prev.assigned_queue || []).map(item =>
            item.id === selectedSubmission.id ? { ...item, my_score: totalScore } : item
          )
        };
      });
    } catch (e) {
      setDrawerError(e.response?.data?.error || "Failed to submit score.");
    } finally {
      setSubmittingScore(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingSpinner message="Loading judge dashboard..." />;
  }

  return (
    <div className="judge-dashboard">
      <div className="dashboard-container">

        {/* Header */}
        <div className="dashboard-header">
          <div>
            <div className="header-badge">
              <span className="badge-dot"></span>
              Judge Dashboard
            </div>
            <h1 className="header-title">Review Pipeline</h1>
            <p className="header-subtitle">
              Assigned submissions update in real time.
              {pendingCount > 0 && <span className="pending-alert"> {pendingCount} pending review.</span>}
            </p>
          </div>
          <div className="header-actions">
            <Link href="/submissions?filter=pending" className="btn-primary">
              Start Reviewing
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="/submissions" className="btn-secondary">All Submissions</Link>
            <Link href="/events?scope=assigned" className="btn-secondary">My Events</Link>
          </div>
        </div>

        {/* Stats Row - Clean Version */}
        <div className="stats-row">
          <div className="stat-item">
            <div className="stat-number">{formatNumber(stats.assigned_total)}</div>
            <div className="stat-label">Assigned</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{formatNumber(stats.pending_for_judge)}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{formatNumber(stats.completed_for_judge)}</div>
            <div className="stat-label">Reviewed</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{formatNumber(stats.my_feedbacks)}</div>
            <div className="stat-label">Feedbacks</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{formatNumber(stats.events_assigned)}</div>
            <div className="stat-label">Events</div>
          </div>
        </div>

        {/* Progress & Distribution Row */}
        <div className="two-column-grid">
          {/* Progress Card */}
          <div className="info-card">
            <div className="card-header">
              <div>
                <div className="card-badge">Velocity</div>
                <div className="card-title">Review Progress</div>
              </div>
              <Ring pct={completionRate} color="#6EE7B7" />
            </div>
            <Sparkline series={series.my_scores || []} color="#6EE7B7" />
            <div className="progress-container">
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${completionRate}%` }} />
              </div>
              <div className="progress-stats">
                <span>{formatNumber(stats.completed_for_judge)} reviewed</span>
                <span>{formatNumber(stats.assigned_total)} total</span>
              </div>
            </div>
          </div>

          {/* Distribution Card */}
          <div className="info-card">
            <div className="card-header">
              <div>
                <div className="card-badge">Scoring</div>
                <div className="card-title">Score Distribution</div>
              </div>
            </div>
            {!distribution.length ? (
              <div className="empty-message">No scores submitted yet.</div>
            ) : (
              <div className="distribution-list">
                {distribution.map(bucket => {
                  const maxCount = Math.max(1, ...distribution.map(x => x.count || 0));
                  const percent = Math.round(((bucket.count || 0) / maxCount) * 100);
                  return (
                    <div key={bucket.label} className="distribution-item">
                      <span className="dist-label">{bucket.label}</span>
                      <div className="dist-bar-bg">
                        <div className="dist-bar-fill" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="dist-count">{bucket.count || 0}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="actions-card">
          <div className="card-header">
            <div>
              <div className="card-badge">Shortcuts</div>
              <div className="card-title">Quick Actions</div>
            </div>
          </div>
          <div className="actions-grid">
            {[
              { label: "Review Pending", desc: `${pendingCount} waiting`, href: "/submissions?filter=pending", color: "#fbbf24", primary: true },
              { label: "All Submissions", desc: "Browse full list", href: "/submissions", color: "#6EE7B7" },
              { label: "My Events", desc: "Events you're assigned to", href: "/events?scope=assigned", color: "#a78bfa" },
              { label: "My Feedbacks", desc: "Feedbacks you've written", href: "/submissions?tab=feedbacks", color: "#60a5fa" },
              { label: "Leaderboard", desc: "Current standings", href: "/submissions?view=scores", color: "#4ade80" },
              { label: "My Profile", desc: "Update profile", href: "/profile", color: "#f472b6" },
            ].map(action => (
              <Link key={action.label} href={action.href} className={`action-link ${action.primary ? "primary" : ""}`}>
                <div>
                  <div className="action-label">{action.label}</div>
                  <div className="action-desc">{action.desc}</div>
                </div>
                <svg className="action-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Assigned Queue - Properly Adjusted */}
<div className="queue-section">
  <div className="section-header">
    <div>
      <div className="card-badge">Assignments</div>
      <div className="card-title">Assigned Queue</div>
    </div>
    <div className="queue-filters">
      <button
        className={`filter-btn ${filter === "all" ? "active" : ""}`}
        onClick={() => setFilter("all")}
      >
        All <span className="filter-count">{queue.length}</span>
      </button>
      <button
        className={`filter-btn ${filter === "pending" ? "active" : ""}`}
        onClick={() => setFilter("pending")}
      >
        Pending <span className="filter-count">{pendingCount}</span>
      </button>
      <button
        className={`filter-btn ${filter === "done" ? "active" : ""}`}
        onClick={() => setFilter("done")}
      >
        Reviewed <span className="filter-count">{doneCount}</span>
      </button>
    </div>
  </div>

  {filteredQueue.length === 0 ? (
    <div className="empty-queue">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p>{filter === "pending" ? "No pending submissions — great work!" : "No submissions in this filter."}</p>
    </div>
  ) : (
    <div className="queue-container">
      {filteredQueue.map(sub => (
        <div
          key={sub.id}
          className="queue-card"
          role="button"
          tabIndex={0}
          onClick={() => openDrawer(sub)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") openDrawer(sub);
          }}
        >
          <div className="queue-card-header">
            <div className="submission-badge">
              {(sub.title || "S")[0].toUpperCase()}
            </div>
            <div className="submission-info">
              <div className="submission-name">{sub.title}</div>
              <div className="submission-meta">
                <span>Added {timeAgo(sub.created_at)}</span>
                <span className="meta-separator">•</span>
                <span>{sub.event_name || "No event"}</span>
                {sub.team_name && (
                  <>
                    <span className="meta-separator">•</span>
                    <span>{sub.team_name}</span>
                  </>
                )}
              </div>
            </div>
            <div className="submission-status">
              <span className={`status-badge ${sub.my_score ? "reviewed" : "pending"}`}>
                {sub.my_score ? "Reviewed" : "Pending"}
              </span>
            </div>
          </div>
          
          <div className="queue-card-stats">
            <div className="stat-group">
              <div className="stat-label">Judge Coverage</div>
              <div className="coverage-wrapper">
                <div className="coverage-bar-bg">
                  <div className="coverage-bar-fill" style={{
                    width: `${sub.required_judges_count ? Math.round((sub.completed_judges_count / sub.required_judges_count) * 100) : 0}%`
                  }} />
                </div>
                <span className="coverage-value">{sub.completed_judges_count}/{sub.required_judges_count}</span>
              </div>
            </div>
            
            <div className="stat-group">
              <div className="stat-label">My Score</div>
              <div className="score-wrapper">
                {sub.my_score != null ? (
                  <span className="score-value">{sub.my_score}<span className="score-max">/10</span></span>
                ) : (
                  <span className="score-placeholder">Not reviewed</span>
                )}
              </div>
            </div>
            
            <div className="stat-group">
              <div className="stat-label">Action</div>
              <button 
                className={`review-btn ${sub.my_score ? "reviewed" : "pending"}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openDrawer(sub);
                }}
              >
                {sub.my_score ? "View Score" : "Review Now"}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

        {/* Recent Feedbacks */}
        {recent.length > 0 && (
          <div className="feedback-section">
            <div className="card-badge">Recent</div>
            <div className="card-title" style={{ marginBottom: 16 }}>My Feedbacks</div>
            <div className="feedback-grid">
              {recent.slice(0, 6).map(fb => {
                const scoreColor = fb.score >= 7 ? "#4ade80" : fb.score >= 4 ? "#fbbf24" : "#f87171";
                return (
                  <Link href={`/submissions/${fb.submission_id}`} key={fb.id} className="feedback-card">
                    <div className="feedback-header">
                      <span className="feedback-score" style={{ color: scoreColor }}>
                        {fb.score}<span className="score-max">/10</span>
                      </span>
                      <span className="feedback-time">{timeAgo(fb.created_at)}</span>
                    </div>
                    <div className="feedback-title">{fb.submission_title || "Submission"}</div>
                    {fb.comment && <div className="feedback-comment">"{fb.comment}"</div>}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {drawerOpen && (
        <div className="drawer-overlay" onClick={closeDrawer}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <div className="drawer-eyebrow">Submission Review</div>
                <div className="drawer-title">{selectedSubmission?.title || selectedMeta?.title || "Submission"}</div>
                <div className="drawer-subtitle">
                  {selectedSubmission?.team_details?.name || selectedMeta?.team_name || "Team"} ·{" "}
                  {selectedSubmission?.event?.name || selectedMeta?.event_name || "Event"}
                </div>
              </div>
              <div className="drawer-actions">
                {selectedSubmission?.id && (
                  <Link href={`/submissions/${selectedSubmission.id}`} className="drawer-link">
                    Open Full Page
                  </Link>
                )}
                <button className="drawer-close" onClick={closeDrawer} aria-label="Close">
                  ✕
                </button>
              </div>
            </div>

            {drawerLoading ? (
              <div className="drawer-loading">Loading submission details…</div>
            ) : drawerError ? (
              <div className="drawer-error">{drawerError}</div>
            ) : (
              <>
                <div className="drawer-section">
                  <div className="drawer-section-title">Project Overview</div>
                  {selectedSubmission?.summary && (
                    <p className="drawer-summary">{selectedSubmission.summary}</p>
                  )}
                  <p className="drawer-description">
                    {selectedSubmission?.description || "No description provided."}
                  </p>

                  <div className="drawer-links">
                    {selectedSubmission?.video_url && (
                      <button className="drawer-link-card" onClick={() => window.open(selectedSubmission.video_url, "_blank")}>
                        Demo Video
                      </button>
                    )}
                    {selectedSubmission?.demo_url && (
                      <button className="drawer-link-card" onClick={() => window.open(selectedSubmission.demo_url, "_blank")}>
                        Live Demo
                      </button>
                    )}
                    {selectedSubmission?.repo_url && (
                      <button className="drawer-link-card" onClick={() => window.open(selectedSubmission.repo_url, "_blank")}>
                        GitHub Repo
                      </button>
                    )}
                  </div>

                  {Array.isArray(selectedSubmission?.key_features) && selectedSubmission.key_features.length > 0 && (
                    <div className="drawer-subsection">
                      <div className="drawer-subsection-title">Key Features</div>
                      <ul className="drawer-features">
                        {selectedSubmission.key_features.map((f, idx) => (
                          <li key={idx}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(selectedSubmission?.technologies) && selectedSubmission.technologies.length > 0 && (
                    <div className="drawer-subsection">
                      <div className="drawer-subsection-title">Technologies</div>
                      <div className="drawer-tags">
                        {selectedSubmission.technologies.map((t, idx) => (
                          <span key={idx} className="drawer-tag">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {Array.isArray(selectedSubmission?.screenshots) && selectedSubmission.screenshots.length > 0 && (
                    <div className="drawer-subsection">
                      <div className="drawer-subsection-title">Screenshots</div>
                      <div className="drawer-screenshots">
                        {selectedSubmission.screenshots.map((src, idx) => (
                          <img key={idx} src={src} alt={`Screenshot ${idx + 1}`} />
                        ))}
                      </div>
                    </div>
                  )}

                  {Array.isArray(selectedSubmission?.team_details?.members_details) && selectedSubmission.team_details.members_details.length > 0 && (
                    <div className="drawer-subsection">
                      <div className="drawer-subsection-title">Team Members</div>
                      <div className="drawer-team">
                        {selectedSubmission.team_details.members_details.map((m) => (
                          <div key={m.id} className="drawer-team-member">
                            <div className="drawer-avatar">
                              {m.avatar ? <img src={m.avatar} alt="" /> : m.username?.charAt(0).toUpperCase()}
                            </div>
                            <span>{m.username}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="drawer-section">
                  <div className="drawer-section-title">Judging Criteria + Score Sheet</div>
                  {!selectedSubmission?.is_assigned_judge && (
                    <div className="drawer-notice">You are not assigned to judge this submission.</div>
                  )}
                  <div className="rubric-list">
                    {rubric.map((c) => (
                      <div key={c.key} className="rubric-row">
                        <div className="rubric-label">
                          {c.label} <span className="rubric-weight">({c.weight || 1}x)</span>
                        </div>
                        <div className="rubric-scores">
                          {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                            <button
                              key={n}
                              type="button"
                              className={`rubric-score-btn ${criteriaScores[c.key] === n ? "active" : ""}`}
                              onClick={() => setCriteriaScores(prev => ({ ...prev, [c.key]: n }))}
                              disabled={!selectedSubmission?.is_assigned_judge}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rubric-total">
                    Total Score: <span>{totalScore}</span> / 10
                  </div>

                  <label className="drawer-label">Judge Comment</label>
                  <textarea
                    className="drawer-textarea"
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Share your feedback on this project…"
                    disabled={!selectedSubmission?.is_assigned_judge}
                  />

                  <button
                  className="drawer-submit"
                  onClick={handleSubmitScore}
                  disabled={submittingScore || !selectedSubmission?.is_assigned_judge}
                >
                  {submittingScore ? "Submitting…" : "Submit Score"}
                </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .judge-dashboard {
          min-height: 100vh;
          background: #0a0a0a;
          font-family: 'DM Sans', sans-serif;
        }
        
        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px 64px;
        }
        
        /* Header */
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid #1e1e24;
        }
        
        .header-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #60a5fa;
          margin-bottom: 12px;
        }
        
        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #60a5fa;
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        
        .header-title {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #f0f0f3;
          margin: 0 0 8px;
          letter-spacing: -0.5px;
        }
        
        .header-subtitle {
          font-size: 14px;
          color: #5c5c6e;
          margin: 0;
        }
        
        .pending-alert {
          color: #fbbf24;
          font-weight: 500;
        }
        
        .header-actions {
          display: flex;
          gap: 12px;
        }
        
        .btn-primary, .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }
        
        .btn-primary {
          background: #60a5fa;
          color: #0c0c0f;
          border: 1px solid #3b82f6;
        }
        
        .btn-primary:hover {
          background: #7dc3fc;
          transform: translateY(-1px);
        }
        
        .btn-secondary {
          background: transparent;
          border: 1px solid #26262e;
          color: #888;
        }
        
        .btn-secondary:hover {
          border-color: #60a5fa;
          color: #60a5fa;
        }
        
        /* Stats Row - Clean */
        .stats-row {
          display: flex;
          gap: 1px;
          margin-bottom: 32px;
          background: #1e1e24;
          border-radius: 12px;
          overflow: hidden;
        }
        
        .stat-item {
          flex: 1;
          background: #111114;
          padding: 20px 16px;
          text-align: center;
        }
        
        .stat-number {
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          font-weight: 700;
          color: #f0f0f3;
          line-height: 1;
          margin-bottom: 6px;
        }
        
        .stat-label {
          font-size: 11px;
          color: #5c5c6e;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 500;
        }
        
        /* Two Column Grid */
        .two-column-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }
        
        .info-card {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 16px;
          padding: 20px;
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        
        .card-badge {
          font-size: 10px;
          font-weight: 600;
          color: #3a3a48;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 4px;
        }
        
        .card-title {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #f0f0f3;
        }
        
        .no-data {
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: #3a3a48;
        }
        
        .progress-container {
          margin-top: 14px;
        }
        
        .progress-bar-bg {
          height: 4px;
          background: #1e1e24;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        
        .progress-bar-fill {
          height: 100%;
          border-radius: 2px;
          background: linear-gradient(90deg, #60a5fa, #6EE7B7);
          transition: width 0.5s;
        }
        
        .progress-stats {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #5c5c6e;
        }
        
        .distribution-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .distribution-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .dist-label {
          width: 35px;
          font-size: 11px;
          color: #5c5c6e;
        }
        
        .dist-bar-bg {
          flex: 1;
          height: 4px;
          background: #1e1e24;
          border-radius: 2px;
          overflow: hidden;
        }
        
        .dist-bar-fill {
          height: 100%;
          border-radius: 2px;
          background: linear-gradient(90deg, #6EE7B7, #60a5fa);
          transition: width 0.5s;
        }
        
        .dist-count {
          width: 30px;
          font-size: 11px;
          color: #5c5c6e;
          text-align: right;
        }
        
        .empty-message {
          font-size: 13px;
          color: #3a3a48;
          padding: 24px 0;
          text-align: center;
        }
        
        /* Actions Card */
        .actions-card {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 32px;
        }
        
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 8px;
        }
        
        .action-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: #17171b;
          border: 1px solid #1e1e24;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.2s;
        }
        
        .action-link:hover {
          border-color: rgba(96, 165, 250, 0.3);
          transform: translateY(-2px);
        }
        
        .action-link.primary {
          background: rgba(251, 191, 36, 0.05);
          border-color: rgba(251, 191, 36, 0.2);
        }
        
        .action-label {
          font-size: 13px;
          font-weight: 600;
          color: #f0f0f3;
          margin-bottom: 2px;
        }
        
        .action-desc {
          font-size: 11px;
          color: #5c5c6e;
        }
        
        .action-arrow {
          color: #3a3a48;
          opacity: 0;
          transition: all 0.2s;
        }
        
        .action-link:hover .action-arrow {
          opacity: 1;
          transform: translateX(3px);
        }
        
        /* Queue Section - Properly Adjusted */
.queue-section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.queue-filters {
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 6px 14px;
  background: transparent;
  border: 1px solid #1e1e24;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 500;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'DM Sans', sans-serif;
}

.filter-btn:hover {
  border-color: #26262e;
  color: #f0f0f3;
}

.filter-btn.active {
  color: #60a5fa;
  border-color: rgba(96, 165, 250, 0.4);
  background: rgba(96, 165, 250, 0.06);
}

.filter-count {
  margin-left: 4px;
  font-size: 11px;
  opacity: 0.7;
}

.queue-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.queue-card {
  background: #111114;
  border: 1px solid #1e1e24;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: block;
}

.queue-card:hover {
  border-color: rgba(96, 165, 250, 0.3);
  transform: translateY(-2px);
  background: #151519;
}

.queue-card:focus-visible {
  outline: 2px solid rgba(96, 165, 250, 0.6);
  outline-offset: 2px;
}

.queue-card-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #1e1e24;
}

.submission-badge {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(96, 165, 250, 0.1);
  border: 1px solid rgba(96, 165, 250, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Syne', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #60a5fa;
  flex-shrink: 0;
}

.submission-info {
  flex: 1;
}

.submission-name {
  font-size: 16px;
  font-weight: 600;
  color: #f0f0f3;
  margin-bottom: 6px;
  line-height: 1.3;
}

.submission-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #5c5c6e;
  flex-wrap: wrap;
}

.meta-separator {
  color: #2a2a30;
}

.submission-status {
  flex-shrink: 0;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
}

.status-badge.pending {
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.status-badge.reviewed {
  background: rgba(74, 222, 128, 0.1);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.2);
}

.queue-card-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-group .stat-label {
  font-size: 11px;
  font-weight: 600;
  color: #3a3a48;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.coverage-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.coverage-bar-bg {
  flex: 1;
  height: 6px;
  background: #1e1e24;
  border-radius: 3px;
  overflow: hidden;
}

.coverage-bar-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #60a5fa, #6EE7B7);
  transition: width 0.3s;
}

.coverage-value {
  font-size: 13px;
  font-weight: 600;
  color: #f0f0f3;
  min-width: 45px;
  text-align: right;
}

.score-wrapper {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.score-value {
  font-family: 'Syne', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #6EE7B7;
  line-height: 1;
}

.score-max {
  font-size: 11px;
  color: #5c5c6e;
  font-weight: 400;
}

.score-placeholder {
  font-size: 13px;
  color: #3a3a48;
  font-weight: 500;
}

.review-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #26262e;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #f0f0f3;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'DM Sans', sans-serif;
  width: fit-content;
}

.review-btn:hover {
  border-color: #60a5fa;
  background: rgba(96, 165, 250, 0.1);
  transform: translateX(2px);
}

.review-btn.pending {
  border-color: #fbbf24;
  color: #fbbf24;
}

.review-btn.pending:hover {
  background: rgba(251, 191, 36, 0.1);
}

.review-btn.reviewed {
  border-color: #4ade80;
  color: #4ade80;
}

.review-btn.reviewed:hover {
  background: rgba(74, 222, 128, 0.1);
}

.empty-queue {
  background: #111114;
  border: 1px solid #1e1e24;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  text-align: center;
}

.empty-queue svg {
  margin-bottom: 12px;
  color: #3a3a48;
}

.empty-queue p {
  color: #5c5c6e;
  font-size: 13px;
  margin: 0;
}

/* Responsive */
@media (max-width: 900px) {
  .queue-card-stats {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .queue-card-header {
    flex-wrap: wrap;
  }
  
  .submission-status {
    width: 100%;
    text-align: left;
  }
  
  .review-btn {
    width: 100%;
    justify-content: center;
  }
  
  .coverage-wrapper {
    flex: 1;
  }
}

@media (max-width: 600px) {
  .queue-card {
    padding: 16px;
  }
  
  .submission-badge {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
  
  .submission-name {
    font-size: 14px;
  }
  
  .score-value {
    font-size: 20px;
  }
}
        
        /* Feedback Section */
        .feedback-section {
          margin-top: 8px;
        }
        
        .feedback-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        
        .feedback-card {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 14px;
          padding: 16px;
          text-decoration: none;
          transition: all 0.2s;
        }
        
        .feedback-card:hover {
          border-color: rgba(96, 165, 250, 0.3);
          transform: translateY(-2px);
        }
        
        .feedback-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .feedback-score {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 800;
        }
        
        .feedback-time {
          font-size: 11px;
          color: #5c5c6e;
        }
        
        .feedback-title {
          font-size: 14px;
          font-weight: 600;
          color: #f0f0f3;
          margin-bottom: 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .feedback-comment {
          font-size: 12px;
          color: #5c5c6e;
          line-height: 1.4;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        /* Drawer */
        .drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          display: flex;
          justify-content: flex-end;
          z-index: 2000;
        }
        .drawer-panel {
          width: min(720px, 100%);
          height: 100%;
          background: #0f0f12;
          border-left: 1px solid #1e1e24;
          padding: 20px 24px;
          overflow-y: auto;
        }
        .drawer-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #1e1e24;
          margin-bottom: 20px;
        }
        .drawer-eyebrow {
          font-size: 11px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #60a5fa;
          margin-bottom: 6px;
        }
        .drawer-title {
          font-size: 20px;
          font-weight: 700;
          color: #f0f0f3;
        }
        .drawer-subtitle {
          font-size: 12px;
          color: #5c5c6e;
          margin-top: 4px;
        }
        .drawer-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .drawer-link {
          font-size: 12px;
          color: #6EE7B7;
          text-decoration: none;
          border: 1px solid rgba(110,231,183,0.3);
          padding: 6px 10px;
          border-radius: 999px;
        }
        .drawer-close {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid #1e1e24;
          background: transparent;
          color: #5c5c6e;
          cursor: pointer;
        }
        .drawer-section {
          margin-bottom: 24px;
        }
        .drawer-section-title {
          font-size: 14px;
          font-weight: 700;
          color: #f0f0f3;
          margin-bottom: 10px;
        }
        .drawer-summary {
          font-size: 13px;
          color: #b0b0ba;
          margin-bottom: 10px;
        }
        .drawer-description {
          font-size: 13px;
          color: #888;
          line-height: 1.6;
        }
        .drawer-links {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin: 16px 0;
        }
        .drawer-link-card {
          padding: 8px 12px;
          border-radius: 10px;
          background: #17171b;
          border: 1px solid #1e1e24;
          color: #f0f0f3;
          font-size: 12px;
          cursor: pointer;
        }
        .drawer-subsection {
          margin-top: 16px;
        }
        .drawer-subsection-title {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #3a3a48;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .drawer-features {
          margin: 0;
          padding-left: 18px;
          color: #b0b0ba;
          font-size: 13px;
          line-height: 1.6;
        }
        .drawer-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .drawer-tag {
          padding: 4px 10px;
          border-radius: 100px;
          background: rgba(110,231,183,0.08);
          border: 1px solid rgba(110,231,183,0.2);
          color: #6EE7B7;
          font-size: 11px;
        }
        .drawer-screenshots {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 10px;
        }
        .drawer-screenshots img {
          width: 100%;
          height: 110px;
          object-fit: cover;
          border-radius: 10px;
          border: 1px solid #1e1e24;
        }
        .drawer-team {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .drawer-team-member {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: #17171b;
          border: 1px solid #1e1e24;
          border-radius: 10px;
          font-size: 12px;
          color: #f0f0f3;
        }
        .drawer-avatar {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          overflow: hidden;
          background: rgba(110,231,183,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6EE7B7;
          font-weight: 700;
          font-size: 12px;
        }
        .drawer-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .drawer-notice {
          padding: 10px 12px;
          background: rgba(251,191,36,0.08);
          border: 1px solid rgba(251,191,36,0.2);
          color: #fbbf24;
          border-radius: 10px;
          font-size: 12px;
          margin-bottom: 12px;
        }
        .rubric-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .rubric-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .rubric-label {
          font-size: 12px;
          color: #f0f0f3;
          font-weight: 600;
        }
        .rubric-weight {
          color: #5c5c6e;
          font-weight: 500;
        }
        .rubric-scores {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .rubric-score-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #17171b;
          border: 1px solid #1e1e24;
          color: #5c5c6e;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .rubric-score-btn.active {
          background: #6EE7B7;
          border-color: #6EE7B7;
          color: #0c0c0f;
        }
        .rubric-score-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .rubric-total {
          margin: 16px 0;
          font-size: 13px;
          color: #f0f0f3;
          font-weight: 600;
        }
        .rubric-total span {
          color: #6EE7B7;
          margin-left: 6px;
        }
        .drawer-label {
          display: block;
          font-size: 12px;
          color: #cbd5f5;
          margin-bottom: 6px;
        }
        .drawer-textarea {
          width: 100%;
          min-height: 100px;
          background: #17171b;
          border: 1px solid #1e1e24;
          border-radius: 10px;
          color: #f0f0f3;
          padding: 10px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          resize: vertical;
          margin-bottom: 12px;
        }
        .drawer-submit {
          padding: 10px 18px;
          border-radius: 10px;
          border: none;
          background: #6EE7B7;
          color: #0c0c0f;
          font-weight: 700;
          cursor: pointer;
        }
        .drawer-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .drawer-loading, .drawer-error {
          padding: 20px;
          color: #5c5c6e;
        }
        
        /* Responsive */
        @media (max-width: 900px) {
          .stats-row { flex-wrap: wrap; gap: 1px; }
          .stat-item { min-width: calc(33.33% - 1px); }
          .actions-grid { grid-template-columns: repeat(2, 1fr); }
          .queue-item { flex-direction: column; align-items: flex-start; gap: 12px; }
          .queue-item-stats { width: 100%; justify-content: space-between; }
          .feedback-grid { grid-template-columns: repeat(2, 1fr); }
        }
        
        @media (max-width: 768px) {
          .dashboard-container { padding: 20px 16px 48px; }
          .dashboard-header { flex-direction: column; gap: 20px; }
          .two-column-grid { grid-template-columns: 1fr; }
          .actions-grid { grid-template-columns: 1fr; }
          .feedback-grid { grid-template-columns: 1fr; }
        }
        
        @media (max-width: 600px) {
          .stats-row { flex-direction: column; gap: 1px; }
          .stat-item { min-width: 100%; }
          .header-actions { flex-direction: column; width: 100%; }
          .btn-primary, .btn-secondary { justify-content: center; }
          .queue-item-stats { flex-direction: column; align-items: flex-start; gap: 10px; }
        }
      `}</style>
    </div>
  );
}

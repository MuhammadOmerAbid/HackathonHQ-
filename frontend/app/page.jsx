"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "../utils/axios";
import { useAuth } from "@/context/AuthContext";
import useSSE from "@/utils/useSSE";

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className="rt-icon">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  events: ["M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"],
  users: ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0", "M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"],
  teams: ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0"],
  submit: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"],
  pulse: ["M3 12h4l2-5 4 10 2-5h4"],
  trophy: ["M6 9H3l3-7h12l3 7h-3", "M6 9c0 5.523 2.686 10 6 10s6-4.477 6-10", "M12 19v3M8 22h8"],
  arrowRight: ["M5 12h14M12 5l7 7-7 7"],
};

function LineChart({ series, color = "#6EE7B7" }) {
  const w = 200;
  const h = 60;
  const values = series?.map((s) => s.count) || [];
  const max = Math.max(1, ...values);
  const min = Math.min(...values, 0);
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const points = values.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / (max - min || 1)) * (h - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = points.join(" L");
  const area = `M0,${h} L${path} L${w},${h} Z`;
  const id = `grad-${Math.random().toString(36).slice(2, 6)}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="rt-chart">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={`M${path}`} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const timeAgo = (ts) => {
  if (!ts) return "";
  const date = new Date(ts);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  const mins = Math.floor(diff / 60);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("access");
  const { data: sseData } = useSSE("/analytics/stream/?channel=overview", {
    enabled: hasToken,
    onMessage: (payload) => {
      setData(payload);
      setLoading(false);
    },
  });

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const res = await axios.get("/analytics/overview/");
        setData(res.data);
      } catch (e) {
        setError("Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    if (sseData) setData(sseData);
  }, [sseData]);

  // All hooks at the top level - FIXED
  const stats = data?.stats || {};
  const series = data?.series || {};
  const recentActivity = data?.recent_activity || [];
  const recentEvents = data?.recent_events || [];
  const topTeams = data?.top_teams || [];

  const reviewRate = useMemo(() => {
    const rate = stats.review_rate || 0;
    return Math.min(100, Math.round(rate * 100));
  }, [stats.review_rate]);

  if (loading) {
    return (
      <div className="rt-loading">
        <div className="rt-loading-ring" />
        <span>Loading live analytics...</span>
      </div>
    );
  }

  return (
    <div className="rt-page">
      <main className="rt-wrap">
        <div className="rt-header">
          <div>
            <div className="rt-eyebrow">
              <span className="rt-dot" />
              <span className="rt-label">Realtime Control Room</span>
            </div>
            <h1 className="rt-title">
              {user ? `Welcome back, ${user.username}` : "Analytics Dashboard"}
            </h1>
            <p className="rt-subtitle">
              Live activity across events, teams, and submissions. Updated every few seconds.
            </p>
          </div>
          <div className="rt-actions">
            {/* FIXED: Replaced Links with proper buttons */}
            <button 
              onClick={() => router.push('/events')} 
              className="rt-btn rt-btn-ghost"
            >
              Browse Events
            </button>
            <button 
              onClick={() => router.push('/submissions')} 
              className="rt-btn rt-btn-primary"
            >
              View Submissions
            </button>
          </div>
        </div>

        {error && <div className="rt-error">{error}</div>}

        <div className="rt-stats">
          {[
            { label: "Events", value: stats.events_total, sub: `${stats.events_live || 0} live / ${stats.events_upcoming || 0} upcoming`, icon: "events" },
            { label: "Teams", value: stats.teams_total, sub: "Registered teams", icon: "teams" },
            { label: "Submissions", value: stats.submissions_total, sub: `${stats.reviewed_total || 0} reviewed`, icon: "submit" },
            { label: "Users", value: stats.users_total, sub: `${stats.judges_total || 0} judges`, icon: "users" },
          ].map((s, i) => (
            <div className="rt-stat" key={i}>
              <div className="rt-stat-icon"><Icon d={ICONS[s.icon]} size={18} /></div>
              <div>
                <div className="rt-stat-label">{s.label}</div>
                <div className="rt-stat-value">{s.value ?? 0}</div>
                <div className="rt-stat-sub">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="rt-grid">
          <div className="rt-card">
            <div className="rt-card-head">
              <h3>Submissions Trend</h3>
              <span className="rt-pill">Last 30 days</span>
            </div>
            <LineChart series={series.submissions || []} color="#6EE7B7" />
          </div>
          <div className="rt-card">
            <div className="rt-card-head">
              <h3>User Growth</h3>
              <span className="rt-pill rt-pill-warn">Live</span>
            </div>
            <LineChart series={series.users || []} color="#fbbf24" />
          </div>
          <div className="rt-card">
            <div className="rt-card-head">
              <h3>Review Completion</h3>
              <span className="rt-pill rt-pill-calm">{reviewRate}%</span>
            </div>
            <div className="rt-progress">
              <div className="rt-progress-bar">
                <span style={{ width: `${reviewRate}%` }} />
              </div>
              <div className="rt-progress-meta">
                <span>{stats.reviewed_total || 0} reviewed</span>
                <span>{stats.submissions_total || 0} total</span>
              </div>
            </div>
            <div className="rt-mini-grid">
              <div className="rt-mini">
                <div className="rt-mini-label">Live Events</div>
                <div className="rt-mini-value">{stats.events_live || 0}</div>
              </div>
              <div className="rt-mini">
                <div className="rt-mini-label">Judges</div>
                <div className="rt-mini-value">{stats.judges_total || 0}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rt-grid rt-grid-2">
          <div className="rt-card">
            <div className="rt-card-head">
              <h3>Recent Activity</h3>
              <span className="rt-activity-badge">
                {recentActivity.length > 0 ? `${recentActivity.length} updates` : ''}
              </span>
            </div>
            <div className="rt-activity">
              {recentActivity.length === 0 ? (
                <div className="rt-empty">No recent activity.</div>
              ) : (
                recentActivity.map((a) => (
                  <div className="rt-activity-item" key={a.id}>
                    <div className="rt-activity-icon"><Icon d={ICONS.pulse} size={14} /></div>
                    <div className="rt-activity-text">
                      <div className="rt-activity-title">{a.title || "Activity"}</div>
                      <div className="rt-activity-desc">{a.description}</div>
                    </div>
                    <div className="rt-activity-time">{timeAgo(a.created_at)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rt-card">
            <div className="rt-card-head">
              <h3>Top Teams</h3>
              <button 
                onClick={() => router.push('/teams')} 
                className="rt-link-btn"
              >
                View all <Icon d={ICONS.arrowRight} size={12} />
              </button>
            </div>
            <div className="rt-team-list">
              {topTeams.length === 0 ? (
                <div className="rt-empty">No teams yet.</div>
              ) : (
                topTeams.map((t) => (
                  <div className="rt-team-row" key={t.id}>
                    <div className="rt-team-avatar">{t.name?.charAt(0)?.toUpperCase()}</div>
                    <div className="rt-team-meta">
                      <div className="rt-team-name">{t.name}</div>
                      <div className="rt-team-sub">{t.event__name || "Event"}</div>
                    </div>
                    <div className="rt-team-stats">
                      <span>{t.members_count || 0} members</span>
                      <span>{t.submissions_count || 0} subs</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rt-card">
          <div className="rt-card-head">
            <h3>Latest Events</h3>
            <button 
              onClick={() => router.push('/events')} 
              className="rt-link-btn"
            >
              Explore all <Icon d={ICONS.arrowRight} size={12} />
            </button>
          </div>
          <div className="rt-event-grid">
            {recentEvents.length === 0 ? (
              <div className="rt-empty">No events available.</div>
            ) : (
              recentEvents.map((e) => (
                <div 
                  onClick={() => router.push(`/events/${e.id}`)} 
                  key={e.id} 
                  className="rt-event-tile"
                >
                  <div className="rt-event-title">{e.name}</div>
                  <div className="rt-event-sub">
                    {new Date(e.start_date).toLocaleDateString()} - {new Date(e.end_date).toLocaleDateString()}
                  </div>
                  <div className="rt-event-footer">
                    <span>{e.teams_count || 0} teams</span>
                    <span>{e.judges_count || 0} judges</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .rt-page {
          min-height: 100vh;
          background: radial-gradient(circle at top, rgba(110,231,183,0.08), transparent 55%), #0b0b0f;
          color: #f0f0f3;
        }
        .rt-wrap {
          max-width: 1320px;
          margin: 0 auto;
          padding: 40px 28px 80px;
        }
        .rt-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 32px;
        }
        .rt-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .rt-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #6EE7B7;
          box-shadow: 0 0 10px rgba(110,231,183,0.5);
        }
        .rt-label {
          font-size: 11px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #6EE7B7;
          font-weight: 600;
        }
        .rt-title {
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          margin: 0 0 6px;
        }
        .rt-subtitle {
          font-size: 14px;
          color: #8b8b9b;
          max-width: 520px;
        }
        .rt-actions {
          display: flex;
          gap: 10px;
        }
        .rt-btn {
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid #1e1e24;
          color: #f0f0f3;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .rt-btn-ghost:hover {
          border-color: #6EE7B7;
          color: #6EE7B7;
        }
        .rt-btn-primary {
          background: #6EE7B7;
          color: #0b0b0f;
          border-color: #6EE7B7;
        }
        .rt-btn-primary:hover {
          background: #86efac;
        }
        .rt-link-btn {
          background: transparent;
          border: none;
          color: #6EE7B7;
          font-size: 12px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        .rt-link-btn:hover {
          background: rgba(110,231,183,0.1);
        }
        .rt-error {
          background: rgba(248,113,113,0.08);
          border: 1px solid rgba(248,113,113,0.3);
          color: #f87171;
          padding: 12px 16px;
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .rt-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 26px;
        }
        .rt-stat {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 16px;
          padding: 18px;
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .rt-stat-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: rgba(110,231,183,0.12);
          border: 1px solid rgba(110,231,183,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rt-stat-label { font-size: 12px; color: #8b8b9b; text-transform: uppercase; letter-spacing: 0.6px; }
        .rt-stat-value { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; margin: 2px 0; }
        .rt-stat-sub { font-size: 12px; color: #5c5c6e; }

        .rt-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }
        .rt-grid-2 {
          grid-template-columns: 1.3fr 1fr;
        }
        .rt-card {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 18px;
          padding: 18px;
        }
        .rt-card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .rt-card-head h3 {
          font-size: 15px;
          font-weight: 700;
          margin: 0;
        }
        .rt-pill {
          font-size: 10px;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid rgba(110,231,183,0.25);
          color: #6EE7B7;
        }
        .rt-pill-warn {
          border-color: rgba(251,191,36,0.3);
          color: #fbbf24;
        }
        .rt-pill-calm {
          border-color: rgba(96,165,250,0.3);
          color: #60a5fa;
        }
        .rt-activity-badge {
          font-size: 11px;
          color: #8b8b9b;
        }
        .rt-chart {
          width: 100%;
          height: 70px;
        }
        .rt-progress {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .rt-progress-bar {
          height: 8px;
          background: #1e1e24;
          border-radius: 999px;
          overflow: hidden;
        }
        .rt-progress-bar span {
          display: block;
          height: 100%;
          background: linear-gradient(90deg, #6EE7B7, #60a5fa);
        }
        .rt-progress-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #8b8b9b;
        }
        .rt-mini-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 6px;
        }
        .rt-mini {
          background: #17171b;
          border: 1px solid #1e1e24;
          padding: 10px;
          border-radius: 12px;
        }
        .rt-mini-label { font-size: 11px; color: #8b8b9b; }
        .rt-mini-value { font-size: 16px; font-weight: 700; }

        .rt-activity {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .rt-activity-item {
          display: grid;
          grid-template-columns: 32px 1fr auto;
          gap: 10px;
          align-items: center;
          padding: 10px;
          border-radius: 12px;
          background: #17171b;
          border: 1px solid #1e1e24;
        }
        .rt-activity-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(110,231,183,0.12);
          color: #6EE7B7;
        }
        .rt-activity-title { font-size: 13px; font-weight: 600; }
        .rt-activity-desc { font-size: 12px; color: #8b8b9b; }
        .rt-activity-time { font-size: 11px; color: #5c5c6e; }

        .rt-team-list { display: flex; flex-direction: column; gap: 10px; }
        .rt-team-row {
          display: grid;
          grid-template-columns: 36px 1fr auto;
          gap: 10px;
          align-items: center;
          padding: 10px;
          border-radius: 12px;
          background: #17171b;
          border: 1px solid #1e1e24;
        }
        .rt-team-avatar {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: rgba(110,231,183,0.1);
          border: 1px solid rgba(110,231,183,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #6EE7B7;
        }
        .rt-team-name { font-size: 13px; font-weight: 600; }
        .rt-team-sub { font-size: 11px; color: #8b8b9b; }
        .rt-team-stats { display: flex; gap: 12px; font-size: 11px; color: #5c5c6e; }

        .rt-event-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }
        .rt-event-tile {
          cursor: pointer;
          padding: 14px;
          border-radius: 14px;
          border: 1px solid #1e1e24;
          background: #17171b;
          transition: all 0.2s ease;
        }
        .rt-event-tile:hover {
          border-color: rgba(110,231,183,0.4);
          transform: translateY(-2px);
        }
        .rt-event-title { font-size: 13.5px; font-weight: 600; margin-bottom: 4px; }
        .rt-event-sub { font-size: 11px; color: #8b8b9b; margin-bottom: 8px; }
        .rt-event-footer { display: flex; gap: 12px; font-size: 11px; color: #5c5c6e; }
        .rt-icon { fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }

        .rt-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 12px;
          color: #8b8b9b;
        }
        .rt-loading-ring {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 3px solid rgba(255,255,255,0.08);
          border-top-color: #6EE7B7;
          animation: spin 0.8s linear infinite;
        }
        .rt-empty { font-size: 12px; color: #8b8b9b; padding: 8px; }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .rt-grid { grid-template-columns: 1fr; }
          .rt-grid-2 { grid-template-columns: 1fr; }
          .rt-stats { grid-template-columns: repeat(2, 1fr); }
          .rt-header { flex-direction: column; }
        }
        @media (max-width: 640px) {
          .rt-stats { grid-template-columns: 1fr; }
          .rt-actions { width: 100%; flex-direction: column; }
          .rt-btn { width: 100%; text-align: center; }
        }
      `}</style>
    </div>
  );
}
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";
import { useAuth } from "@/context/AuthContext";
import useSSE from "@/utils/useSSE";
import LoadingSpinner from "@/components/LoadingSpinner";

const Sparkline = ({ series, color = "#6EE7B7" }) => {
  const w = 220;
  const h = 70;
  const values = Array.isArray(series) ? series.map((s) => s.count || 0) : [];
  if (values.length === 0) {
    return <div className="dash-empty">No data yet</div>;
  }
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const points = values.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / (max - min || 1)) * (h - 10) - 5;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = points.join(" L");
  const area = `M0,${h} L${path} L${w},${h} Z`;
  const id = `grad-${Math.random().toString(36).slice(2, 7)}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="dash-chart">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={`M${path}`} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const formatNumber = (value) => {
  if (value === null || value === undefined) return "0";
  return new Intl.NumberFormat().format(value);
};

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
};

const formatTimeAgo = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
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
    if (authLoading) return;
    if (!user) {
      router.push("/login?redirect=/dashboard");
      return;
    }
    const fetchOverview = async () => {
      try {
        const res = await api.get("/analytics/overview/");
        setData(res.data);
        setError("");
      } catch (e) {
        setError("Could not load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [authLoading, user, router]);

  useEffect(() => {
    if (sseData) setData(sseData);
  }, [sseData]);

  const stats = data?.stats || {};
  const series = data?.series || {};
  const recentActivity = data?.recent_activity || [];
  const recentEvents = data?.recent_events || [];
  const topTeams = data?.top_teams || [];
  const reviewRate = useMemo(() => {
    const rate = stats.review_rate || 0;
    return Math.round(rate * 100);
  }, [stats.review_rate]);

  if (authLoading || loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="dash-page">
      <div className="dash-wrap">
        <header className="dash-header">
          <div>
            <div className="dash-eyebrow">Overview</div>
            <h1>Welcome back{user?.username ? `, ${user.username}` : ""}</h1>
            <p>Live platform metrics, activity, and event momentum.</p>
          </div>
          <div className="dash-header-right">
            <div className="dash-updated">
              Updated {formatTimeAgo(data?.updated_at)}
            </div>
            <div className="dash-actions">
              <Link href="/events" className="dash-btn dash-btn-ghost">Browse Events</Link>
              <Link href="/community" className="dash-btn dash-btn-primary">Open Community</Link>
            </div>
          </div>
        </header>

        {error && <div className="dash-error">{error}</div>}

        <section className="dash-stats">
          {[
            { label: "Events", value: stats.events_total },
            { label: "Live Now", value: stats.events_live },
            { label: "Upcoming", value: stats.events_upcoming },
            { label: "Teams", value: stats.teams_total },
            { label: "Submissions", value: stats.submissions_total },
            { label: "Users", value: stats.users_total },
            { label: "Judges", value: stats.judges_total },
            { label: "Reviewed", value: stats.reviewed_total },
            { label: "Review Rate", value: `${reviewRate}%` },
          ].map((s) => (
            <div className="dash-stat" key={s.label}>
              <div className="dash-stat-label">{s.label}</div>
              <div className="dash-stat-value">{typeof s.value === "string" ? s.value : formatNumber(s.value)}</div>
            </div>
          ))}
        </section>

        <section className="dash-charts">
          <div className="dash-card">
            <div className="dash-card-head">
              <h3>Submissions Trend</h3>
              <span>Last 30 days</span>
            </div>
            <Sparkline series={series.submissions} color="#6EE7B7" />
          </div>
          <div className="dash-card">
            <div className="dash-card-head">
              <h3>New Users</h3>
              <span>Last 30 days</span>
            </div>
            <Sparkline series={series.users} color="#60a5fa" />
          </div>
          <div className="dash-card">
            <div className="dash-card-head">
              <h3>Reviews</h3>
              <span>Last 30 days</span>
            </div>
            <Sparkline series={series.reviews} color="#f59e0b" />
          </div>
        </section>

        <section className="dash-lists">
          <div className="dash-card">
            <div className="dash-card-head">
              <h3>Recent Activity</h3>
              <span>{recentActivity.length} items</span>
            </div>
            <div className="dash-list">
              {recentActivity.length === 0 ? (
                <div className="dash-empty">No activity yet.</div>
              ) : (
                recentActivity.map((item) => (
                  <div className="dash-list-item" key={item.id}>
                    <div>
                      <div className="dash-list-title">{item.title || item.description || item.type}</div>
                      <div className="dash-list-meta">{item.description || "Activity update"}</div>
                    </div>
                    <span className="dash-time">{formatTimeAgo(item.created_at)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-card-head">
              <h3>Recent Events</h3>
              <span>{recentEvents.length} events</span>
            </div>
            <div className="dash-list">
              {recentEvents.length === 0 ? (
                <div className="dash-empty">No events yet.</div>
              ) : (
                recentEvents.map((event) => (
                  <div className="dash-list-item" key={event.id}>
                    <div>
                      <div className="dash-list-title">{event.name}</div>
                      <div className="dash-list-meta">
                        {formatDate(event.start_date)} → {formatDate(event.end_date)}
                      </div>
                    </div>
                    <div className="dash-pill-group">
                      <span className="dash-pill">{formatNumber(event.participants_count)} participants</span>
                      <span className="dash-pill">{formatNumber(event.submissions_count)} submissions</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-card-head">
              <h3>Top Teams</h3>
              <span>{topTeams.length} teams</span>
            </div>
            <div className="dash-list">
              {topTeams.length === 0 ? (
                <div className="dash-empty">No teams yet.</div>
              ) : (
                topTeams.map((team) => (
                  <div className="dash-list-item" key={team.id}>
                    <div>
                      <div className="dash-list-title">{team.name}</div>
                      <div className="dash-list-meta">{team.event__name || "Event not set"}</div>
                    </div>
                    <div className="dash-pill-group">
                      <span className="dash-pill">{formatNumber(team.submissions_count)} submissions</span>
                      <span className="dash-pill">{formatNumber(team.members_count)} members</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .dash-page {
          min-height: 100vh;
          background: radial-gradient(circle at top left, rgba(110,231,183,0.12), transparent 45%), #0a0a0f;
          color: #f0f0f3;
        }
        .dash-wrap {
          max-width: 1280px;
          margin: 0 auto;
          padding: 32px 24px 72px;
        }
        .dash-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 24px;
        }
        .dash-eyebrow {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #6EE7B7;
          margin-bottom: 8px;
        }
        .dash-header h1 {
          font-size: 30px;
          margin: 0 0 6px;
        }
        .dash-header p {
          font-size: 14px;
          color: #8b8b9b;
        }
        .dash-header-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
        }
        .dash-updated {
          font-size: 12px;
          color: #8b8b9b;
        }
        .dash-actions {
          display: flex;
          gap: 10px;
        }
        .dash-btn {
          padding: 9px 16px;
          border-radius: 999px;
          border: 1px solid #1e1e24;
          text-decoration: none;
          font-size: 12px;
          font-weight: 600;
          color: #f0f0f3;
        }
        .dash-btn-primary {
          background: #6EE7B7;
          border-color: #6EE7B7;
          color: #0a0a0f;
        }
        .dash-btn-ghost:hover { border-color: #6EE7B7; color: #6EE7B7; }

        .dash-error {
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.3);
          color: #fca5a5;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 13px;
          margin-bottom: 16px;
        }

        .dash-stats {
          display: grid;
          grid-template-columns: repeat(9, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        .dash-stat {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 14px;
          padding: 12px;
        }
        .dash-stat-label {
          font-size: 10px;
          color: #8b8b9b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .dash-stat-value {
          font-size: 18px;
          font-weight: 700;
          margin-top: 6px;
        }

        .dash-charts {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 16px;
        }
        .dash-card {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 16px;
          padding: 16px;
        }
        .dash-card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-size: 12px;
          color: #8b8b9b;
        }
        .dash-card-head h3 {
          margin: 0;
          font-size: 14px;
          color: #f0f0f3;
        }
        .dash-chart {
          width: 100%;
          height: 70px;
        }

        .dash-lists {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .dash-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .dash-list-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          border-radius: 12px;
          background: #17171b;
          border: 1px solid #1e1e24;
        }
        .dash-list-title {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .dash-list-meta {
          font-size: 11px;
          color: #8b8b9b;
        }
        .dash-time {
          font-size: 10px;
          color: #6EE7B7;
          white-space: nowrap;
        }
        .dash-pill-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: flex-end;
        }
        .dash-pill {
          font-size: 10px;
          padding: 4px 8px;
          border-radius: 999px;
          border: 1px solid rgba(110,231,183,0.3);
          color: #6EE7B7;
          background: rgba(110,231,183,0.1);
        }
        .dash-empty {
          font-size: 12px;
          color: #8b8b9b;
          padding: 12px 0;
        }

        @media (max-width: 1200px) {
          .dash-stats { grid-template-columns: repeat(3, 1fr); }
          .dash-charts { grid-template-columns: 1fr; }
          .dash-lists { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .dash-header { flex-direction: column; }
          .dash-header-right { align-items: flex-start; }
          .dash-actions { width: 100%; flex-direction: column; }
          .dash-btn { width: 100%; text-align: center; }
          .dash-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 520px) {
          .dash-stats { grid-template-columns: 1fr; }
          .dash-list-item { flex-direction: column; align-items: flex-start; }
          .dash-pill-group { align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}

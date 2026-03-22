"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "@/utils/axios";
import { useAuth } from "@/context/AuthContext";
import useSSE from "@/utils/useSSE";
import LoadingSpinner from "@/components/LoadingSpinner";

const LineChart = ({ series, color = "#6EE7B7" }) => {
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
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="jd-chart">
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
};

export default function JudgeDashboardPage() {
  const router = useRouter();
  const { isJudge, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("access");
  const { data: sseData } = useSSE("/analytics/stream/?channel=judge", {
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
    const fetchInitial = async () => {
      try {
        const res = await axios.get("/analytics/judge/");
        setData(res.data);
      } catch (e) {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, [authLoading, isJudge, router]);

  useEffect(() => {
    if (sseData) setData(sseData);
  }, [sseData]);

  const stats = data?.stats || {};
  const series = data?.series || {};
  const queue = data?.assigned_queue || [];
  const dist = data?.score_distribution || [];

  const completionRate = useMemo(() => {
    if (!stats.assigned_total) return 0;
    return Math.round((stats.completed_for_judge / stats.assigned_total) * 100);
  }, [stats.assigned_total, stats.completed_for_judge]);

  if (authLoading || loading) {
    return <LoadingSpinner message="Loading judge dashboard..." />;
  }

  return (
    <div className="jd-page">
      <div className="jd-wrap">
        <div className="jd-header">
          <div>
            <div className="jd-eyebrow">Judge Command</div>
            <h1>Review Pipeline</h1>
            <p>Assigned submissions update in real time. Keep the queue moving.</p>
          </div>
          <div className="jd-actions">
            <Link href="/submissions" className="jd-btn jd-btn-ghost">Browse All</Link>
            <Link href="/submissions?filter=pending" className="jd-btn jd-btn-primary">Review Pending</Link>
          </div>
        </div>

        <div className="jd-stats">
          {[
            { label: "Assigned", value: stats.assigned_total },
            { label: "Pending", value: stats.pending_for_judge },
            { label: "Reviewed", value: stats.completed_for_judge },
            { label: "My Feedbacks", value: stats.my_feedbacks },
            { label: "Events", value: stats.events_assigned },
          ].map((s, i) => (
            <div className="jd-stat radial-card" key={i}>
              <div className="jd-stat-label">{s.label}</div>
              <div className="jd-stat-value">{s.value ?? 0}</div>
            </div>
          ))}
        </div>

        <div className="jd-grid">
          <div className="jd-card radial-card">
            <div className="jd-card-head">
              <h3>My Review Velocity</h3>
              <span>{completionRate}% done</span>
            </div>
            <LineChart series={series.my_scores || []} color="#6EE7B7" />
            <div className="jd-progress">
              <div className="jd-progress-bar">
                <span style={{ width: `${completionRate}%` }} />
              </div>
              <div className="jd-progress-meta">
                <span>{stats.completed_for_judge || 0} completed</span>
                <span>{stats.assigned_total || 0} assigned</span>
              </div>
            </div>
          </div>

          <div className="jd-card radial-card">
            <div className="jd-card-head">
              <h3>Score Distribution</h3>
            </div>
            <div className="jd-bars">
              {dist.map((b) => (
                <div className="jd-bar-row" key={b.label}>
                  <span>{b.label}</span>
                  <div className="jd-bar">
                    <div style={{ width: `${Math.min(100, (b.count || 0) * 10)}%` }} />
                  </div>
                  <span>{b.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="jd-card radial-card">
            <div className="jd-card-head">
              <h3>Assigned Queue</h3>
            </div>
            <div className="jd-queue">
              {queue.length === 0 ? (
                <div className="jd-empty">No assigned submissions yet.</div>
              ) : (
                queue.map((sub) => (
                  <Link href={`/submissions/${sub.id}`} key={sub.id} className="jd-queue-item">
                    <div className="jd-queue-info">
                      <div className="jd-queue-title">{sub.title}</div>
                      <div className="jd-queue-meta">
                        {sub.team_name} / {sub.event_name}
                      </div>
                    </div>
                    <div className="jd-queue-right">
                      <div className={`jd-pill ${sub.my_score ? "jd-pill-done" : "jd-pill-pending"}`}>
                        {sub.my_score ? `Scored ${sub.my_score}` : "Pending"}
                      </div>
                      <div className="jd-queue-progress">
                        {sub.completed_judges_count}/{sub.required_judges_count} judges
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .jd-page {
          min-height: 100vh;
          background: radial-gradient(circle at top left, rgba(96,165,250,0.12), transparent 45%), #0a0a0f;
          color: #f0f0f3;
        }
        .jd-wrap {
          max-width: 1280px;
          margin: 0 auto;
          padding: 36px 24px 72px;
        }
        .jd-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 24px;
        }
        .jd-eyebrow {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #60a5fa;
          margin-bottom: 8px;
        }
        .jd-header h1 {
          font-size: 30px;
          margin: 0 0 6px;
        }
        .jd-header p {
          font-size: 14px;
          color: #8b8b9b;
        }
        .jd-actions {
          display: flex;
          gap: 10px;
        }
        .jd-btn {
          padding: 9px 16px;
          border-radius: 999px;
          border: 1px solid #1e1e24;
          text-decoration: none;
          font-size: 12px;
          font-weight: 600;
          color: #f0f0f3;
        }
        .jd-btn-primary {
          background: #60a5fa;
          border-color: #60a5fa;
          color: #0a0a0f;
        }
        .jd-btn-ghost:hover { border-color: #60a5fa; color: #60a5fa; }

        .jd-stats {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .jd-stat {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 14px;
          padding: 14px;
        }
        .jd-stat-label { font-size: 11px; color: #8b8b9b; text-transform: uppercase; letter-spacing: 0.5px; }
        .jd-stat-value { font-size: 20px; font-weight: 700; margin-top: 6px; }

        .jd-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .jd-card {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 16px;
          padding: 16px;
        }
        .jd-card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-size: 13px;
        }
        .jd-chart { width: 100%; height: 70px; }
        .jd-progress { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
        .jd-progress-bar { height: 8px; background: #1e1e24; border-radius: 999px; overflow: hidden; }
        .jd-progress-bar span { display: block; height: 100%; background: linear-gradient(90deg, #60a5fa, #6EE7B7); }
        .jd-progress-meta { display: flex; justify-content: space-between; font-size: 11px; color: #8b8b9b; }

        .jd-bars { display: flex; flex-direction: column; gap: 10px; }
        .jd-bar-row { display: grid; grid-template-columns: 50px 1fr 24px; gap: 8px; font-size: 11px; color: #8b8b9b; align-items: center; }
        .jd-bar { height: 8px; background: #1e1e24; border-radius: 999px; overflow: hidden; }
        .jd-bar div { height: 100%; background: linear-gradient(90deg, #6EE7B7, #60a5fa); }

        .jd-queue { display: flex; flex-direction: column; gap: 10px; }
        .jd-queue-item {
          text-decoration: none;
          color: inherit;
          background: #17171b;
          border: 1px solid #1e1e24;
          padding: 12px;
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }
        .jd-queue-item:hover { border-color: rgba(96,165,250,0.4); }
        .jd-queue-title { font-size: 13px; font-weight: 600; }
        .jd-queue-meta { font-size: 11px; color: #8b8b9b; }
        .jd-queue-right { text-align: right; display: flex; flex-direction: column; gap: 6px; }
        .jd-pill { padding: 3px 8px; border-radius: 999px; font-size: 10px; }
        .jd-pill-pending { background: rgba(156,163,175,0.15); color: #9ca3af; border: 1px solid rgba(156,163,175,0.3); }
        .jd-pill-done { background: rgba(110,231,183,0.15); color: #6EE7B7; border: 1px solid rgba(110,231,183,0.3); }
        .jd-queue-progress { font-size: 11px; color: #5c5c6e; }

        .jd-empty { font-size: 12px; color: #8b8b9b; }

        @media (max-width: 1024px) {
          .jd-grid { grid-template-columns: 1fr; }
          .jd-stats { grid-template-columns: repeat(2, 1fr); }
          .jd-header { flex-direction: column; }
        }
        @media (max-width: 640px) {
          .jd-stats { grid-template-columns: 1fr; }
          .jd-actions { width: 100%; flex-direction: column; }
          .jd-btn { width: 100%; text-align: center; }
        }
      `}</style>
    </div>
  );
}

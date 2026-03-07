"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "../utils/axios";

// Inline styles to replicate Vision UI dark blue aesthetic
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .db-root {
    min-height: 100vh;
    background: #0a0f1a;  // Darker, more sophisticated background
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #fff;
    display: flex;
  }

  /* ── Sidebar ── */
  .db-sidebar {
    width: 220px;
    min-height: 100vh;
    background: linear-gradient(180deg, #0d1326 0%, #0a0f1f 100%);
    border-right: 1px solid rgba(16, 185, 129, 0.15);  // Emerald tinted border
    backdrop-filter: blur(20px);
    display: flex;
    flex-direction: column;
    padding: 28px 16px;
    position: fixed;
    left: 0; top: 0; bottom: 0;
    z-index: 100;
  }
  .db-logo {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 2px;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    padding: 0 12px 28px;
    border-bottom: 1px solid rgba(16, 185, 129, 0.15);
    margin-bottom: 20px;
  }
  .db-logo span { 
    background: linear-gradient(135deg, #10b981 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .db-nav-label {
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    padding: 0 12px;
    margin: 18px 0 8px;
  }
  .db-nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    border-radius: 12px;
    color: rgba(255,255,255,0.5);
    font-size: 13.5px;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s;
    margin-bottom: 2px;
  }
  .db-nav-item:hover { background: rgba(16, 185, 129, 0.1); color: #fff; }
  .db-nav-item.active {
    background: linear-gradient(90deg, rgba(16, 185, 129, 0.25) 0%, rgba(139, 92, 246, 0.15) 100%);
    color: #fff;
    border-left: 3px solid #10b981;
  }
  .db-nav-item svg { width: 17px; height: 17px; flex-shrink: 0; }

  .db-help-card {
    margin-top: auto;
    background: linear-gradient(135deg, #059669 0%, #7c3aed 100%);
    border-radius: 16px;
    padding: 18px;
    font-size: 12.5px;
  }
  .db-help-card h4 { font-weight: 700; margin-bottom: 4px; }
  .db-help-card p { color: rgba(255,255,255,0.75); line-height: 1.5; font-size: 12px; }
  .db-help-btn {
    display: block;
    margin-top: 12px;
    text-align: center;
    background: rgba(255,255,255,0.15);
    border-radius: 8px;
    padding: 7px;
    color: #fff;
    text-decoration: none;
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: 0.5px;
    transition: background 0.2s;
  }
  .db-help-btn:hover { background: rgba(255,255,255,0.25); }

  /* ── Main ── */
  .db-main {
    margin-left: 220px;
    flex: 1;
    padding: 28px 28px 40px;
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
  }

  /* background glow blobs - updated colors */
  .db-main::before {
    content: '';
    position: fixed;
    top: -100px; left: 200px;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }
  .db-main::after {
    content: '';
    position: fixed;
    bottom: -100px; right: 0;
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .db-inner { position: relative; z-index: 1; }

  /* ── Top Bar ── */
  .db-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
  }
  .db-breadcrumb { font-size: 12px; color: rgba(255,255,255,0.4); }
  .db-breadcrumb span { color: rgba(255,255,255,0.8); }
  .db-topbar-right { display: flex; align-items: center; gap: 14px; }
  .db-search {
    background: rgba(16, 185, 129, 0.05);
    border: 1px solid rgba(16, 185, 129, 0.15);
    border-radius: 40px;
    padding: 9px 18px;
    color: rgba(255,255,255,0.5);
    font-size: 13px;
    width: 200px;
    outline: none;
    font-family: inherit;
    transition: all 0.2s;
  }
  .db-search:focus { border-color: rgba(16, 185, 129, 0.5); color: #fff; }
  .db-topbar-icon {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.15);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: background 0.2s;
  }
  .db-topbar-icon:hover { background: rgba(16, 185, 129, 0.15); }
  .db-topbar-icon svg { width: 16px; height: 16px; color: rgba(255,255,255,0.6); }
  .db-signin-btn {
    background: none;
    border: none;
    color: rgba(255,255,255,0.7);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    display: flex; align-items: center; gap: 6px;
  }

  /* ── Stat Cards Row ── */
  .db-stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
    margin-bottom: 22px;
  }
  .db-stat {
    background: linear-gradient(127deg, #0d1428 19%, #0a1020 76%);
    border: 1px solid rgba(16, 185, 129, 0.12);
    border-radius: 20px;
    padding: 20px 22px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    position: relative;
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .db-stat:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(16, 185, 129, 0.15); }
  .db-stat-icon-wrap {
    width: 42px; height: 42px;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 8px;
    font-size: 20px;
  }
  .db-stat-label { font-size: 12px; color: rgba(255,255,255,0.45); font-weight: 500; }
  .db-stat-value { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
  .db-stat-delta {
    font-size: 11.5px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 20px;
    width: fit-content;
    margin-top: 2px;
  }
  .delta-green { background: rgba(16, 185, 129, 0.15); color: #10b981; }
  .delta-purple { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }
  .delta-blue { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }

  /* ── Middle Row ── */
  .db-mid-row {
    display: grid;
    grid-template-columns: 1.6fr 1fr 1fr;
    gap: 18px;
    margin-bottom: 22px;
  }

  .db-card {
    background: linear-gradient(127deg, #0d1428 19%, #0a1020 76%);
    border: 1px solid rgba(16, 185, 129, 0.12);
    border-radius: 20px;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }
  .db-card-title {
    font-size: 14px;
    font-weight: 700;
    color: rgba(255,255,255,0.85);
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .db-card-title a {
    font-size: 11.5px;
    color: rgba(16, 185, 129, 0.9);
    text-decoration: none;
    font-weight: 600;
  }

  /* Welcome card */
  .db-welcome-card {
    background: linear-gradient(127deg, #0d1428 19%, #0a1020 76%);
    border: 1px solid rgba(16, 185, 129, 0.12);
    border-radius: 20px;
    padding: 28px;
    display: flex;
    align-items: center;
    gap: 28px;
    position: relative;
    overflow: hidden;
  }
  .db-welcome-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 70% 50%, rgba(16, 185, 129, 0.12) 0%, transparent 60%);
    pointer-events: none;
  }
  .db-welcome-jellyfish {
    width: 130px;
    height: 110px;
    border-radius: 16px;
    background: linear-gradient(135deg, #065f46, #1e1b4b);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 60px;
    flex-shrink: 0;
    box-shadow: 0 0 40px rgba(16, 185, 129, 0.2);
    border: 1px solid rgba(16, 185, 129, 0.2);
  }
  .db-welcome-text h2 {
    font-size: 22px;
    font-weight: 800;
    margin-bottom: 6px;
    background: linear-gradient(90deg, #10b981 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .db-welcome-text p {
    font-size: 13px;
    color: rgba(255,255,255,0.5);
    line-height: 1.6;
    max-width: 260px;
  }
  .db-welcome-cta {
    margin-top: 14px;
    font-size: 12px;
    color: rgba(255,255,255,0.6);
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }

  /* Satisfaction / donut */
  .db-donut-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    flex: 1;
  }
  .db-donut {
    position: relative;
    width: 110px;
    height: 110px;
  }
  .db-donut svg { transform: rotate(-90deg); }
  .db-donut-label {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .db-donut-label span:first-child {
    font-size: 22px;
    font-weight: 800;
    line-height: 1;
    background: linear-gradient(135deg, #10b981, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .db-donut-label span:last-child {
    font-size: 11px;
    color: rgba(255,255,255,0.4);
  }
  .db-donut-scale {
    display: flex;
    justify-content: space-between;
    width: 100%;
    font-size: 11px;
    color: rgba(255,255,255,0.35);
  }

  /* Referral / score */
  .db-score-wrap {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .db-score-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .db-score-item label { font-size: 11.5px; color: rgba(255,255,255,0.4); display: block; margin-bottom: 2px; }
  .db-score-item strong { font-size: 18px; font-weight: 800; }
  .db-score-badge {
    width: 70px; height: 70px;
    border-radius: 50%;
    background: conic-gradient(#10b981 0% 93%, rgba(16, 185, 129, 0.1) 93% 100%);
    display: flex; align-items: center; justify-content: center;
    position: relative;
  }
  .db-score-badge::before {
    content: '';
    position: absolute;
    inset: 6px;
    border-radius: 50%;
    background: #0a0f1a;
  }
  .db-score-badge span { position: relative; z-index: 1; font-size: 16px; font-weight: 800; color: #10b981; }
  .db-score-sub { font-size: 10px; color: rgba(255,255,255,0.3); text-align: center; margin-top: 2px; }

  /* ── Chart Row ── */
  .db-chart-row {
    display: grid;
    grid-template-columns: 1.6fr 1fr;
    gap: 18px;
    margin-bottom: 22px;
  }

  /* Simple SVG line chart */
  .db-chart-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 6px; }
  .db-chart-header h3 { font-size: 14px; font-weight: 700; }
  .db-chart-delta { font-size: 11.5px; color: #10b981; font-weight: 600; }
  .db-chart-sub { font-size: 11.5px; color: rgba(255,255,255,0.35); margin-bottom: 16px; }
  .db-chart-svg-wrap { width: 100%; }

  /* Bar chart */
  .db-bar-chart { display: flex; align-items: flex-end; gap: 8px; height: 100px; margin-top: 8px; }
  .db-bar { flex: 1; border-radius: 6px 6px 0 0; position: relative; min-width: 12px; transition: opacity 0.2s; }
  .db-bar:hover { opacity: 0.8; }

  /* Active users */
  .db-active-row {
    display: flex;
    gap: 20px;
    margin-top: 16px;
  }
  .db-active-stat { display: flex; flex-direction: column; gap: 2px; }
  .db-active-stat label { font-size: 10.5px; color: rgba(255,255,255,0.4); display: flex; align-items: center; gap: 5px; }
  .db-active-dot { width: 8px; height: 8px; border-radius: 50%; }
  .db-active-stat strong { font-size: 16px; font-weight: 800; }

  /* ── Bottom Row ── */
  .db-bottom-row {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 18px;
  }

  /* Projects table */
  .db-table { width: 100%; border-collapse: collapse; }
  .db-table th {
    font-size: 10.5px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    font-weight: 600;
    padding: 0 12px 12px;
    text-align: left;
  }
  .db-table td {
    padding: 10px 12px;
    font-size: 13px;
    border-top: 1px solid rgba(16, 185, 129, 0.08);
  }
  .db-table tr:hover td { background: rgba(16, 185, 129, 0.03); }
  .db-table .project-name { font-weight: 600; display: flex; align-items: center; gap: 8px; }
  .db-project-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .db-avatars { display: flex; }
  .db-avatar {
    width: 24px; height: 24px;
    border-radius: 50%;
    border: 2px solid #0a0f1a;
    margin-left: -6px;
    font-size: 10px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700;
    color: #fff;
  }
  .db-avatars .db-avatar:first-child { margin-left: 0; }
  .db-progress-bar {
    height: 4px;
    border-radius: 4px;
    background: rgba(255,255,255,0.07);
    width: 80px;
    overflow: hidden;
  }
  .db-progress-fill { height: 100%; border-radius: 4px; }
  .db-table-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .db-table-meta { font-size: 11.5px; color: rgba(255,255,255,0.35); }
  .db-table-meta span { color: #10b981; }

  /* Orders */
  .db-order-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 0;
    border-bottom: 1px solid rgba(16, 185, 129, 0.08);
  }
  .db-order-item:last-child { border-bottom: none; }
  .db-order-icon {
    width: 34px; height: 34px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px;
    flex-shrink: 0;
  }
  .db-order-info { flex: 1; min-width: 0; }
  .db-order-info p { font-size: 12.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .db-order-info span { font-size: 11px; color: rgba(255,255,255,0.35); }
  .db-order-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .db-order-header-badge { font-size: 11px; color: #10b981; background: rgba(16, 185, 129, 0.12); padding: 3px 9px; border-radius: 20px; font-weight: 600; }

  /* Loading */
  .db-loading {
    min-height: 100vh;
    background: #0a0f1a;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 16px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: rgba(255,255,255,0.5);
  }
  .db-spinner {
    width: 40px; height: 40px;
    border: 3px solid rgba(16, 185, 129, 0.2);
    border-top-color: #10b981;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

// ─── mini SVG line chart ───────────────────────────────────────────────
function LineChart({ data, color, height = 80 }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 440, h = height;
  const xStep = w / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = i * xStep;
    const y = h - ((v - min) / (max - min || 1)) * (h - 10) - 5;
    return `${x},${y}`;
  });
  const linePath = `M${pts.join(" L")}`;
  const areaPath = `M0,${h} L${pts.join(" L")} L${w},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: h }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${color})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Donut ───────────────────────────────────────────────────────────
function Donut({ pct }) {
  const r = 44, cx = 55, cy = 55;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="db-donut">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="url(#donutGrad)"
          strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="donutGrad" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4cc9f0" />
            <stop offset="100%" stopColor="#4361ee" />
          </linearGradient>
        </defs>
      </svg>
      <div className="db-donut-label">
        <span>{pct}%</span>
        <span>Based on likes</span>
      </div>
    </div>
  );
}

const avatarColors = ["#4361ee", "#7b2ff7", "#f72585", "#4cc9f0", "#48c78e"];

export default function DashboardPage() {
  const [stats, setStats] = useState({ events: { total: 0, live: 0, upcoming: 0 }, teams: 0, submissions: 0, users: 0 });
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, teamsRes, submissionsRes, usersRes] = await Promise.all([
          axios.get("/events/"),
          axios.get("/teams/"),
          axios.get("/submissions/"),
          axios.get("/users/")
        ]);
        const events = eventsRes.data.results || [];
        const teams = teamsRes.data.results || teamsRes.data || [];
        const submissions = submissionsRes.data.results || submissionsRes.data || [];
        const users = usersRes.data.results || usersRes.data || [];
        const now = new Date();
        const liveEvents = events.filter(e => new Date(e.start_date) <= now && new Date(e.end_date) >= now);
        const upcomingEvents = events.filter(e => new Date(e.start_date) > now);
        setStats({ events: { total: events.length, live: liveEvents.length, upcoming: upcomingEvents.length }, teams: teams.length, submissions: submissions.length, users: users.length });
        setFeaturedEvents(events.slice(0, 4));
        setRecentActivities([
          { id: 1, type: "team", message: 'New team "Code Warriors" formed', time: "21 DEC, 1:21 PM", icon: "👥", color: "#4361ee" },
          { id: 2, type: "submission", message: 'Project "AI Assistant" submitted', time: "21 DEC, 11:21 PM", icon: "🚀", color: "#7b2ff7" },
          { id: 3, type: "event", message: 'Hackathon "TechFest 2025" started', time: "20 DEC, 3:52 PM", icon: "📅", color: "#f72585" },
          { id: 4, type: "user", message: "New card added for order #3210145", time: "18 DEC, 4:41 PM", icon: "👤", color: "#4cc9f0" },
          { id: 5, type: "submission", message: 'Unlock packages for Development', time: "18 DEC, 4:41 PM", icon: "📦", color: "#48c78e" }
        ]);
        try { const r = await axios.get("/users/me/"); setUser(r.data); } catch { setUser(null); }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = [20, 35, 28, 55, 40, 70, 45, 90, 65, 80, 55, 75];
  const barData = [
    { v: 60, c: "rgba(255,255,255,0.12)" },
    { v: 85, c: "rgba(255,255,255,0.12)" },
    { v: 45, c: "rgba(255,255,255,0.12)" },
    { v: 100, c: "#4361ee" },
    { v: 70, c: "rgba(255,255,255,0.12)" },
    { v: 55, c: "rgba(255,255,255,0.12)" },
    { v: 80, c: "rgba(255,255,255,0.12)" },
  ];
  const projects = [
    { name: "TechFest Hackathon", members: 4, budget: "$14,000", completion: 60, color: "#f72585" },
    { name: "Add Progress Track", members: 2, budget: "$3,000", completion: 10, color: "#4361ee" },
    { name: "Fix Platform Errors", members: 3, budget: "Not set", completion: 100, color: "#48c78e" },
    { name: "Launch Mobile App", members: 5, budget: "$32,000", completion: 100, color: "#7b2ff7" },
    { name: "New Pricing Page", members: 2, budget: "$400", completion: 25, color: "#4cc9f0" },
  ];

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="db-loading">
          <div className="db-spinner" />
          <p>Loading your dashboard...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="db-root">
        {/* ── Sidebar ── */}
        <aside className="db-sidebar">
          <div className="db-logo"><span>HACKATHON</span> PLATFORM</div>
          <span className="db-nav-label">Main Pages</span>
          <Link href="/dashboard" className="db-nav-item active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
            Dashboard
          </Link>
          <Link href="/events" className="db-nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            Events
          </Link>
          <Link href="/teams" className="db-nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            Teams
          </Link>
          <Link href="/submissions" className="db-nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 22 7 22 17 12 22 2 17 2 7 12 2" /><line x1="12" y1="22" x2="12" y2="12" /><polyline points="22 7 12 12 2 7" /></svg>
            Submissions
          </Link>
          <Link href="/posts" className="db-nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
            Posts
          </Link>
          <span className="db-nav-label">Account Pages</span>
          <Link href="/profile" className="db-nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            Profile
          </Link>
          <Link href="/login" className="db-nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
            Sign In
          </Link>
          <Link href="/register" className="db-nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
            Sign Up
          </Link>
          <div className="db-help-card">
            <h4>Need help?</h4>
            <p>Please check our docs</p>
            <Link href="/docs" className="db-help-btn">DOCUMENTATION</Link>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="db-main">
          <div className="db-inner">
            {/* Topbar */}
            <div className="db-topbar">
              <div>
                <div className="db-breadcrumb">Pages / Dashboard</div>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>Dashboard</div>
              </div>
              <div className="db-topbar-right">
                <input className="db-search" placeholder="Type here..." />
                <button className="db-signin-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  Sign In
                </button>
                <div className="db-topbar-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>
                </div>
                <div className="db-topbar-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="db-stats-row">
              {[
                { label: "Total Events", value: stats.events.total, delta: `+${stats.events.live} Live`, cls: "delta-green", icon: "📅", bg: "linear-gradient(135deg,#4361ee,#7b2ff7)" },
                { label: "Total Users", value: stats.users, delta: "+0.1%", cls: "delta-blue", icon: "👤", bg: "linear-gradient(135deg,#f72585,#b5179e)" },
                { label: "Active Teams", value: stats.teams, delta: `+${stats.events.upcoming} upcoming`, cls: "delta-green", icon: "👥", bg: "linear-gradient(135deg,#4cc9f0,#4361ee)" },
                { label: "Submissions", value: stats.submissions, delta: "+8%", cls: "delta-red", icon: "📦", bg: "linear-gradient(135deg,#fa709a,#fee140)" },
              ].map((s, i) => (
                <div className="db-stat" key={i}>
                  <div className="db-stat-icon-wrap" style={{ background: s.bg }}>{s.icon}</div>
                  <div className="db-stat-label">{s.label}</div>
                  <div className="db-stat-value">{s.value}</div>
                  <div className={`db-stat-delta ${s.cls}`}>{s.delta}</div>
                </div>
              ))}
            </div>

            {/* Middle Row: Welcome + Satisfaction + Referral */}
            <div className="db-mid-row">
              {/* Welcome */}
              <div className="db-welcome-card">
                <div className="db-welcome-jellyfish">🪼</div>
                <div className="db-welcome-text">
                  <h2>Welcome back, {user?.username || "Hacker"}!</h2>
                  <p>Glad to see you again!<br />Explore hackathons, build amazing projects.</p>
                  <div className="db-welcome-cta">
                    <Link href="/events" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 12 }}>Browse Events →</Link>
                  </div>
                </div>
              </div>

              {/* Satisfaction */}
              <div className="db-card">
                <div className="db-card-title">Satisfaction Rate<span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>From all projects</span></div>
                <div className="db-donut-wrap">
                  <Donut pct={95} />
                  <div className="db-donut-scale"><span>0%</span><span>100%</span></div>
                </div>
              </div>

              {/* Referral */}
              <div className="db-card">
                <div className="db-card-title">Referral Tracking</div>
                <div className="db-score-wrap">
                  <div className="db-score-row">
                    <div>
                      <div className="db-score-item"><label>Invited</label><strong>{stats.users} people</strong></div>
                      <div style={{ height: 14 }} />
                      <div className="db-score-item"><label>Bonus</label><strong>{stats.teams + stats.submissions}</strong></div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div className="db-score-badge"><span>9.3</span></div>
                      <div className="db-score-sub">Total Score</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart Row */}
            <div className="db-chart-row">
              {/* Line chart */}
              <div className="db-card">
                <div className="db-chart-header">
                  <div>
                    <h3>Submissions Overview</h3>
                    <div className="db-chart-sub">(+8% more in 2025)</div>
                  </div>
                </div>
                <div className="db-chart-svg-wrap">
                  <LineChart data={chartData} color="#4361ee" height={100} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  {["Jan", "Mar", "May", "Jul", "Sep", "Nov"].map(m => (
                    <span key={m} style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{m}</span>
                  ))}
                </div>
              </div>

              {/* Bar chart + Active users */}
              <div className="db-card">
                <div className="db-card-title">
                  Active Users
                  <span className="db-chart-delta">+23% than last week</span>
                </div>
                <div className="db-bar-chart">
                  {barData.map((b, i) => (
                    <div key={i} className="db-bar" style={{ height: `${b.v}%`, background: b.c }} />
                  ))}
                </div>
                <div className="db-active-row">
                  {[
                    { label: "Users", val: stats.users.toLocaleString(), color: "#4361ee" },
                    { label: "Clicks", val: "2.4m", color: "#4cc9f0" },
                    { label: "Submissions", val: stats.submissions, color: "#48c78e" },
                    { label: "Events", val: stats.events.total, color: "#f72585" },
                  ].map((a, i) => (
                    <div className="db-active-stat" key={i}>
                      <label><span className="db-active-dot" style={{ background: a.color }} />{a.label}</label>
                      <strong>{a.val}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="db-bottom-row">
              {/* Projects table */}
              <div className="db-card">
                <div className="db-table-header-row">
                  <div>
                    <div className="db-card-title" style={{ marginBottom: 2 }}>Projects</div>
                    <div className="db-table-meta"><span>30 done</span> this month</div>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" style={{ width: 18, height: 18, cursor: "pointer" }}><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                </div>
                <table className="db-table">
                  <thead>
                    <tr>
                      <th>Companies</th>
                      <th>Members</th>
                      <th>Budget</th>
                      <th>Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p, i) => (
                      <tr key={i}>
                        <td>
                          <div className="project-name">
                            <div className="db-project-dot" style={{ background: p.color }} />
                            {p.name}
                          </div>
                        </td>
                        <td>
                          <div className="db-avatars">
                            {Array.from({ length: Math.min(p.members, 4) }).map((_, j) => (
                              <div key={j} className="db-avatar" style={{ background: avatarColors[j % avatarColors.length] }}>
                                {String.fromCharCode(65 + j)}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{p.budget}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className="db-progress-bar">
                              <div className="db-progress-fill" style={{ width: `${p.completion}%`, background: p.completion === 100 ? "#48c78e" : "#4361ee" }} />
                            </div>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{p.completion}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Orders / Recent activity */}
              <div className="db-card">
                <div className="db-order-header">
                  <div>
                    <div className="db-card-title" style={{ marginBottom: 2 }}>Orders Overview</div>
                    <span className="db-order-header-badge">+30% this month</span>
                  </div>
                </div>
                {recentActivities.map(a => (
                  <div className="db-order-item" key={a.id}>
                    <div className="db-order-icon" style={{ background: `${a.color}22` }}>{a.icon}</div>
                    <div className="db-order-info">
                      <p>{a.message}</p>
                      <span>{a.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
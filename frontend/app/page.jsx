"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "../utils/axios";

/* ─────────────────────────────────────────────────────────────
   DESIGN SYSTEM
   Font: Syne (display) + DM Sans (body)
   Base: #0c0c0f  Card: #111114  Border: #1e1e24
   Accent: #6EE7B7 (mint — used sparingly)
   Secondary text: #5c5c6e
   ───────────────────────────────────────────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:        #0c0c0f;
  --surface:   #111114;
  --surface2:  #17171b;
  --border:    #1e1e24;
  --border2:   #26262e;
  --accent:    #6EE7B7;
  --accent-dim:#6EE7B720;
  --accent-mid:#6EE7B740;
  --text:      #f0f0f3;
  --muted:     #5c5c6e;
  --muted2:    #3a3a48;
  --danger:    #f87171;
  --warn:      #fbbf24;
  --radius:    12px;
  --radius-lg: 18px;
  --radius-xl: 24px;
}

body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; }

/* ── PAGE SHELL ── */
.dash-page {
  min-height: 100vh;
  background: var(--bg);
  /* subtle grid texture */
  background-image:
    linear-gradient(rgba(110,231,183,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(110,231,183,0.025) 1px, transparent 1px);
  background-size: 60px 60px;
}

/* ── TOP NAV ── */
.dash-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  height: 60px;
  border-bottom: 1px solid var(--border);
  background: rgba(12,12,15,0.85);
  backdrop-filter: blur(16px);
  position: sticky;
  top: 0;
  z-index: 100;
}
.dash-nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}
.dash-nav-logomark {
  width: 28px;
  height: 28px;
  border: 1.5px solid var(--accent);
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dash-nav-logomark svg { width: 14px; height: 14px; color: var(--accent); }
.dash-nav-wordmark {
  font-family: 'Syne', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0.3px;
}
.dash-nav-links {
  display: flex;
  align-items: center;
  gap: 2px;
}
.dash-nav-link {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--muted);
  text-decoration: none;
  transition: color 0.15s, background 0.15s;
  letter-spacing: 0.1px;
}
.dash-nav-link:hover { color: var(--text); background: var(--surface2); }
.dash-nav-link.active { color: var(--text); }
.dash-nav-right { display: flex; align-items: center; gap: 10px; }
.dash-nav-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.15s;
  text-decoration: none;
  border: none;
}
.dash-nav-btn-ghost {
  background: transparent;
  border: 1px solid var(--border2);
  color: var(--muted);
}
.dash-nav-btn-ghost:hover { border-color: var(--border2); color: var(--text); background: var(--surface2); }
.dash-nav-btn-accent {
  background: var(--accent);
  color: #0c0c0f;
  font-weight: 600;
}
.dash-nav-btn-accent:hover { background: #86efac; }
.dash-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--accent-dim);
  border: 1.5px solid var(--accent-mid);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
}

/* ── MAIN CONTENT ── */
.dash-main {
  max-width: 1280px;
  margin: 0 auto;
  padding: 36px 32px 64px;
}

/* ── PAGE HEADER ── */
.dash-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 40px;
  gap: 20px;
}
.dash-header-eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.dash-header-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}
.dash-header-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--accent);
}
.dash-title {
  font-family: 'Syne', sans-serif;
  font-size: 30px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.1;
  letter-spacing: -0.5px;
}
.dash-subtitle {
  font-size: 14px;
  color: var(--muted);
  margin-top: 6px;
  font-weight: 400;
  line-height: 1.6;
}
.dash-header-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.dash-action-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  border-radius: var(--radius);
  font-size: 13.5px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.15s;
  text-decoration: none;
  border: none;
}
.dash-action-outline {
  background: transparent;
  border: 1px solid var(--border2);
  color: var(--muted);
}
.dash-action-outline:hover { color: var(--text); border-color: var(--border2); background: var(--surface2); }
.dash-action-primary {
  background: var(--accent);
  color: #0c0c0f;
  font-weight: 600;
}
.dash-action-primary:hover { background: #86efac; }

/* ── STAT CARDS ── */
.dash-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: 32px;
}
.dash-stat {
  background: var(--surface);
  padding: 24px 28px;
  transition: background 0.15s;
  position: relative;
}
.dash-stat:hover { background: var(--surface2); }
.dash-stat-label {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--muted);
  letter-spacing: 0.3px;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}
.dash-stat-value {
  font-family: 'Syne', sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -1px;
  line-height: 1;
  margin-bottom: 10px;
}
.dash-stat-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
}
.dash-stat-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
}
.badge-green { background: rgba(110,231,183,0.1); color: var(--accent); border: 1px solid rgba(110,231,183,0.2); }
.badge-yellow { background: rgba(251,191,36,0.1); color: #fbbf24; border: 1px solid rgba(251,191,36,0.2); }
.badge-neutral { background: var(--surface2); color: var(--muted); border: 1px solid var(--border2); }

/* ── GRID LAYOUT ── */
.dash-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}
.dash-grid-3 {
  display: grid;
  grid-template-columns: 1.8fr 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}
.col-span-2 { grid-column: span 2; }

/* ── CARD ── */
.dash-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.dash-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
  margin-bottom: 20px;
}
.dash-card-title {
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.2px;
}
.dash-card-link {
  font-size: 12px;
  color: var(--muted);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s;
  display: flex;
  align-items: center;
  gap: 4px;
}
.dash-card-link:hover { color: var(--accent); }
.dash-card-body { padding: 0 24px 24px; }

/* ── WELCOME CARD ── */
.dash-welcome {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 28px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
}
.dash-welcome::before {
  content: '';
  position: absolute;
  right: -60px;
  top: -60px;
  width: 240px;
  height: 240px;
  background: radial-gradient(circle, rgba(110,231,183,0.06) 0%, transparent 70%);
  pointer-events: none;
}
.dash-welcome-left {}
.dash-welcome-greeting {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  margin-bottom: 4px;
  letter-spacing: 0.2px;
}
.dash-welcome-name {
  font-family: 'Syne', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.4px;
  margin-bottom: 8px;
}
.dash-welcome-desc { font-size: 13.5px; color: var(--muted); line-height: 1.6; max-width: 380px; }
.dash-welcome-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

/* ── MINI CHART ── */
.dash-sparkline { display: flex; align-items: flex-end; gap: 3px; height: 40px; }
.dash-sparkline-bar {
  width: 6px;
  border-radius: 3px 3px 0 0;
  background: var(--border2);
  transition: background 0.15s;
  flex-shrink: 0;
}
.dash-sparkline-bar.active { background: var(--accent); }

/* ── EVENT CARDS ── */
.dash-event-list { display: flex; flex-direction: column; gap: 1px; background: var(--border); border-radius: var(--radius); overflow: hidden; }
.dash-event-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: var(--surface);
  text-decoration: none;
  transition: background 0.15s;
  cursor: pointer;
}
.dash-event-item:hover { background: var(--surface2); }
.dash-event-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-live   { background: var(--accent); box-shadow: 0 0 8px rgba(110,231,183,0.5); }
.dot-soon   { background: var(--warn); }
.dot-closed { background: var(--muted2); }
.dash-event-info { flex: 1; min-width: 0; }
.dash-event-name {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}
.dash-event-meta { font-size: 12px; color: var(--muted); }
.dash-event-tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  flex-shrink: 0;
}
.tag-live   { background: rgba(110,231,183,0.08); color: var(--accent); border: 1px solid rgba(110,231,183,0.15); }
.tag-soon   { background: rgba(251,191,36,0.08);  color: #fbbf24; border: 1px solid rgba(251,191,36,0.15); }
.tag-closed { background: var(--surface2); color: var(--muted); border: 1px solid var(--border2); }

/* ── ACTIVITY FEED ── */
.dash-activity { display: flex; flex-direction: column; }
.dash-activity-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 24px;
  border-bottom: 1px solid var(--border);
  transition: background 0.15s;
}
.dash-activity-item:last-child { border-bottom: none; }
.dash-activity-item:hover { background: var(--surface2); }
.dash-activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--surface2);
  border: 1px solid var(--border2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}
.dash-activity-icon svg { width: 14px; height: 14px; color: var(--muted); }
.dash-activity-icon.accent-icon { background: var(--accent-dim); border-color: var(--accent-mid); }
.dash-activity-icon.accent-icon svg { color: var(--accent); }
.dash-activity-text { flex: 1; min-width: 0; }
.dash-activity-msg { font-size: 13px; color: var(--text); line-height: 1.5; margin-bottom: 2px; }
.dash-activity-msg strong { font-weight: 600; }
.dash-activity-time { font-size: 11.5px; color: var(--muted); }

/* ── QUICK ACTIONS ── */
.dash-actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.dash-action-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--surface2);
  border: 1px solid var(--border2);
  border-radius: var(--radius);
  text-decoration: none;
  transition: all 0.15s;
  cursor: pointer;
}
.dash-action-card:hover {
  border-color: var(--accent-mid);
  background: var(--accent-dim);
}
.dash-action-card:hover .dash-action-card-icon { border-color: var(--accent-mid); background: var(--accent-dim); }
.dash-action-card:hover .dash-action-card-icon svg { color: var(--accent); }
.dash-action-card-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: var(--surface);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
}
.dash-action-card-icon svg { width: 16px; height: 16px; color: var(--muted); transition: color 0.15s; }
.dash-action-card-label { font-size: 13px; font-weight: 500; color: var(--text); margin-bottom: 1px; }
.dash-action-card-sub   { font-size: 11.5px; color: var(--muted); }

/* ── TEAMS TABLE ── */
.dash-table { width: 100%; border-collapse: collapse; }
.dash-table th {
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--muted);
  padding: 0 24px 12px;
  border-bottom: 1px solid var(--border);
}
.dash-table td {
  padding: 14px 24px;
  font-size: 13px;
  color: var(--text);
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}
.dash-table tr:last-child td { border-bottom: none; }
.dash-table tr:hover td { background: var(--surface2); }
.dash-team-name { font-weight: 500; display: flex; align-items: center; gap: 10px; }
.dash-team-avatar {
  width: 28px; height: 28px;
  border-radius: 7px;
  background: var(--surface2);
  border: 1px solid var(--border2);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  flex-shrink: 0;
}
.dash-member-stack { display: flex; }
.dash-member-pip {
  width: 22px; height: 22px;
  border-radius: 50%;
  border: 2px solid var(--surface);
  background: var(--surface2);
  margin-left: -6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px;
  font-weight: 700;
  color: var(--muted);
}
.dash-member-stack .dash-member-pip:first-child { margin-left: 0; }
.dash-progress-wrap { display: flex; align-items: center; gap: 10px; }
.dash-progress {
  flex: 1;
  height: 3px;
  background: var(--border2);
  border-radius: 2px;
  overflow: hidden;
  max-width: 80px;
}
.dash-progress-fill { height: 100%; background: var(--accent); border-radius: 2px; }
.dash-progress-pct { font-size: 11.5px; color: var(--muted); white-space: nowrap; }

/* ── STATUS DOTS ── */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 500;
}
.status-pill-green  { background: rgba(110,231,183,0.08); color: var(--accent); border: 1px solid rgba(110,231,183,0.15); }
.status-pill-yellow { background: rgba(251,191,36,0.08);  color: #fbbf24; border: 1px solid rgba(251,191,36,0.15); }
.status-pill-muted  { background: var(--surface2); color: var(--muted); border: 1px solid var(--border2); }

/* ── SECTION DIVIDER ── */
.dash-section-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 14px;
  padding: 0 2px;
}

/* ── LOADING ── */
.dash-loading {
  min-height: 100vh;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  font-family: 'DM Sans', sans-serif;
  color: var(--muted);
}
.dash-loading-ring {
  width: 36px; height: 36px;
  border: 2px solid var(--border2);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
.dash-loading-label { font-size: 13px; letter-spacing: 0.3px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── SVG ICONS (inline, stroke-based) ── */
.icon { display: block; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }

/* ── EMPTY STATE ── */
.dash-empty { padding: 32px 24px; text-align: center; color: var(--muted); font-size: 13px; }
.dash-empty svg { width: 28px; height: 28px; margin: 0 auto 10px; opacity: 0.3; }

/* ── RESPONSIVE ── */
@media (max-width: 900px) {
  .dash-main { padding: 24px 20px 48px; }
  .dash-stats { grid-template-columns: repeat(2, 1fr); }
  .dash-grid-3, .dash-grid { grid-template-columns: 1fr; }
  .col-span-2 { grid-column: span 1; }
  .dash-nav-links { display: none; }
  .dash-title { font-size: 22px; }
}
@media (max-width: 600px) {
  .dash-nav { padding: 0 16px; }
  .dash-main { padding: 20px 16px 48px; }
  .dash-stats { grid-template-columns: repeat(2, 1fr); }
  .dash-header { flex-direction: column; gap: 16px; }
  .dash-welcome { flex-direction: column; align-items: flex-start; gap: 20px; }
  .dash-actions-grid { grid-template-columns: 1fr; }
}
`;

/* ─── ICONS ─── (SVG, no emoji) */
const Icon = ({ d, size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className="icon" style={{ display: "block" }} {...props}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  logo:        "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  events:      ["M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"],
  teams:       ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75", "M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0"],
  submit:      ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"],
  posts:       ["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"],
  profile:     ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 3m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0"],
  arrow:       "M5 12h14M12 5l7 7-7 7",
  arrowRight:  "M9 18l6-6-6-6",
  plus:        "M12 5v14M5 12h14",
  bell:        ["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9", "M13.73 21a2 2 0 0 1-3.46 0"],
  search:      ["M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0"],
  team_act:    ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0", "M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"],
  file:        ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6M16 13H8M16 17H8M10 9H8"],
  zap:         "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  trophy:      ["M6 9H3l3-7h12l3 7h-3", "M6 9c0 5.523 2.686 10 6 10s6-4.477 6-10", "M12 19v3M8 22h8"],
};

/* ─── SVG SPARKLINE CHART ─── */
function SparkChart({ data, color = "var(--accent)", h = 52 }) {
  const max = Math.max(...data), min = Math.min(...data), w = 200;
  const xs = w / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = i * xs;
    const y = h - ((v - min) / (max - min || 1)) * (h - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" L");
  const area = `M0,${h} L${pts} L${w},${h} Z`;
  const id = `sg${Math.random().toString(36).slice(2,6)}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: h }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={`M${pts}`} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── MAIN COMPONENT ─── */
export default function DashboardPage() {
  const [stats, setStats] = useState({ events: { total: 0, live: 0, upcoming: 0 }, teams: 0, submissions: 0, users: 0 });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [eR, tR, sR, uR] = await Promise.all([
          axios.get("/events/"), axios.get("/teams/"),
          axios.get("/submissions/"), axios.get("/users/"),
        ]);
        const evts = eR.data.results || [];
        const teams = tR.data.results || tR.data || [];
        const subs  = sR.data.results || sR.data || [];
        const users = uR.data.results || uR.data || [];
        const now = new Date();
        const live     = evts.filter(e => new Date(e.start_date) <= now && new Date(e.end_date) >= now);
        const upcoming = evts.filter(e => new Date(e.start_date) > now);
        setStats({ events: { total: evts.length, live: live.length, upcoming: upcoming.length }, teams: teams.length, submissions: subs.length, users: users.length });
        setEvents(evts.slice(0, 5));
        try { const r = await axios.get("/users/me/"); setUser(r.data); } catch { setUser(null); }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const chartData     = [14, 22, 18, 35, 28, 44, 38, 52, 46, 61, 55, 68];
  const subChartData  = [8,  12, 9,  20, 15, 28, 22, 35, 30, 42, 38, 48];

  const recentActivity = [
    { id: 1, icon: "team_act",  accent: true,  msg: <><strong>Code Warriors</strong> registered a new team</>,        time: "2 hours ago" },
    { id: 2, icon: "file",      accent: false, msg: <><strong>Project Atlas</strong> submitted to TechFest 2025</>,   time: "5 hours ago" },
    { id: 3, icon: "zap",       accent: true,  msg: <><strong>HackBuild Spring</strong> is now live</>,               time: "1 day ago" },
    { id: 4, icon: "profile",   accent: false, msg: <><strong>jane_dev</strong> joined the platform</>,               time: "2 days ago" },
    { id: 5, icon: "trophy",    accent: true,  msg: <><strong>Team Quantum</strong> won Best Innovation award</>,     time: "3 days ago" },
  ];

  const mockTeams = [
    { name: "Code Warriors", event: "TechFest 2025",    members: 4, completion: 60,  status: "active" },
    { name: "Team Quantum",  event: "HackBuild Spring", members: 3, completion: 100, status: "done"   },
    { name: "Dev Ninjas",    event: "HackBuild Spring", members: 5, completion: 25,  status: "active" },
    { name: "BuildFast",     event: "OpenHack III",     members: 2, completion: 10,  status: "active" },
  ];

  const eventStatus = (e) => {
    const now = new Date();
    if (new Date(e.start_date) > now) return "soon";
    if (new Date(e.end_date) >= now)  return "live";
    return "closed";
  };

  if (loading) {
    return (
      <>
        <style>{css}</style>
        <div className="dash-loading">
          <div className="dash-loading-ring" />
          <span className="dash-loading-label">Loading dashboard</span>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="dash-page">

        {/* ── NAV ──
        <nav className="dash-nav">
          <Link href="/dashboard" className="dash-nav-brand">
            <div className="dash-nav-logomark">
              <Icon d={ICONS.logo} size={14} />
            </div>
            <span className="dash-nav-wordmark">Hackboard</span>
          </Link>

          <div className="dash-nav-links">
            {[
              { href: "/dashboard",   label: "Overview" },
              { href: "/events",      label: "Events" },
              { href: "/teams",       label: "Teams" },
              { href: "/submissions", label: "Submissions" },
              { href: "/posts",       label: "Posts" },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className={`dash-nav-link${l.href === "/dashboard" ? " active" : ""}`}>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="dash-nav-right">
            <button className="dash-nav-btn dash-nav-btn-ghost">
              <Icon d={ICONS.bell} size={14} />
            </button>
            <button className="dash-nav-btn dash-nav-btn-ghost">
              <Icon d={ICONS.search} size={14} />
            </button>
            {user ? (
              <div className="dash-avatar">{(user.username || "U")[0].toUpperCase()}</div>
            ) : (
              <>
                <Link href="/login"    className="dash-nav-btn dash-nav-btn-ghost">Sign in</Link>
                <Link href="/register" className="dash-nav-btn dash-nav-btn-accent">Register</Link>
              </>
            )}
          </div>
        </nav>  */}
        {/* ── CONTENT ── */}
        <main className="dash-main">

          {/* Page header */}
          <div className="dash-header">
            <div>
              <div className="dash-header-eyebrow">
                <div className="dash-header-dot" />
                <span className="dash-header-label">Overview</span>
              </div>
              <h1 className="dash-title">
                {user ? `Welcome back, ${user.username}` : "Platform Dashboard"}
              </h1>
              <p className="dash-subtitle">
                Everything happening across your hackathon platform, at a glance.
              </p>
            </div>
            <div className="dash-header-actions">
              <Link href="/events" className="dash-action-btn dash-action-outline">
                Browse events
              </Link>
              <Link href="/teams/create" className="dash-action-btn dash-action-primary">
                <Icon d={ICONS.plus} size={14} />
                Create team
              </Link>
            </div>
          </div>

          {/* Stat strip */}
          <div className="dash-stats">
            {[
              {
                label: "Total events",
                value: stats.events.total,
                sub: <><span className="dash-stat-badge badge-green">{stats.events.live} live</span><span style={{color:"var(--muted)"}}>·</span><span className="dash-stat-badge badge-yellow">{stats.events.upcoming} upcoming</span></>,
              },
              {
                label: "Registered teams",
                value: stats.teams,
                sub: <span className="dash-stat-badge badge-neutral">across all events</span>,
              },
              {
                label: "Submissions",
                value: stats.submissions,
                sub: <span className="dash-stat-badge badge-green">+8% this week</span>,
              },
              {
                label: "Platform users",
                value: stats.users,
                sub: <span className="dash-stat-badge badge-neutral">total registered</span>,
              },
            ].map((s, i) => (
              <div className="dash-stat" key={i}>
                <div className="dash-stat-label">{s.label}</div>
                <div className="dash-stat-value">{s.value}</div>
                <div className="dash-stat-sub" style={{ flexWrap: "wrap", gap: 6 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Welcome + sparklines */}
          <div className="dash-welcome">
            <div className="dash-welcome-left">
              <div className="dash-welcome-greeting">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </div>
              <div className="dash-welcome-name">
                {user ? `Good to see you, ${user.username}` : "Your hackathon hub"}
              </div>
              <div className="dash-welcome-desc">
                {stats.events.live > 0
                  ? `${stats.events.live} event${stats.events.live > 1 ? "s are" : " is"} live right now. Don't miss the deadline.`
                  : "No events live right now. Check upcoming events below."}
              </div>
            </div>
            <div className="dash-welcome-right">
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6, letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 600 }}>Submissions</div>
                <div style={{ width: 160 }}>
                  <SparkChart data={subChartData} />
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6, letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 600 }}>Users</div>
                <div style={{ width: 160 }}>
                  <SparkChart data={chartData} color="#fbbf24" />
                </div>
              </div>
            </div>
          </div>

          {/* Events + Activity */}
          <div className="dash-grid" style={{ marginBottom: 20 }}>
            {/* Events */}
            <div className="dash-card">
              <div className="dash-card-head">
                <span className="dash-card-title">Active Events</span>
                <Link href="/events" className="dash-card-link">
                  View all <Icon d={ICONS.arrowRight} size={12} />
                </Link>
              </div>
              <div style={{ padding: "0 0 8px" }}>
                {events.length > 0 ? (
                  <div className="dash-event-list">
                    {events.map((ev, i) => {
                      const st = eventStatus(ev);
                      return (
                        <Link href={`/events/${ev.id}`} key={ev.id} className="dash-event-item">
                          <div className={`dash-event-dot ${st === "live" ? "dot-live" : st === "soon" ? "dot-soon" : "dot-closed"}`} />
                          <div className="dash-event-info">
                            <div className="dash-event-name">{ev.name}</div>
                            <div className="dash-event-meta">
                              {new Date(ev.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              {ev.end_date ? ` – ${new Date(ev.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
                            </div>
                          </div>
                          <span className={`dash-event-tag ${st === "live" ? "tag-live" : st === "soon" ? "tag-soon" : "tag-closed"}`}>
                            {st === "live" ? "Live" : st === "soon" ? "Soon" : "Ended"}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="dash-empty">
                    <Icon d={ICONS.events[0]} size={28} />
                    <p>No events yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Activity */}
            <div className="dash-card">
              <div className="dash-card-head">
                <span className="dash-card-title">Recent Activity</span>
              </div>
              <div className="dash-activity">
                {recentActivity.map(a => (
                  <div key={a.id} className="dash-activity-item">
                    <div className={`dash-activity-icon${a.accent ? " accent-icon" : ""}`}>
                      <Icon d={ICONS[a.icon]} size={14} />
                    </div>
                    <div className="dash-activity-text">
                      <div className="dash-activity-msg">{a.msg}</div>
                      <div className="dash-activity-time">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Teams table + Quick actions */}
          <div className="dash-grid">
            {/* Teams table */}
            <div className="dash-card">
              <div className="dash-card-head">
                <span className="dash-card-title">Teams</span>
                <Link href="/teams" className="dash-card-link">
                  View all <Icon d={ICONS.arrowRight} size={12} />
                </Link>
              </div>
              <div>
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Team</th>
                      <th>Event</th>
                      <th>Members</th>
                      <th>Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockTeams.map((t, i) => (
                      <tr key={i}>
                        <td>
                          <div className="dash-team-name">
                            <div className="dash-team-avatar">{t.name[0]}</div>
                            {t.name}
                          </div>
                        </td>
                        <td style={{ color: "var(--muted)", fontSize: 12 }}>{t.event}</td>
                        <td>
                          <div className="dash-member-stack">
                            {Array.from({ length: Math.min(t.members, 3) }).map((_, j) => (
                              <div key={j} className="dash-member-pip">{String.fromCharCode(65 + j)}</div>
                            ))}
                            {t.members > 3 && (
                              <div className="dash-member-pip">+{t.members - 3}</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="dash-progress-wrap">
                            <div className="dash-progress">
                              <div className="dash-progress-fill" style={{ width: `${t.completion}%` }} />
                            </div>
                            <span className="dash-progress-pct">{t.completion}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick actions */}
            <div className="dash-card">
              <div className="dash-card-head">
                <span className="dash-card-title">Quick Actions</span>
              </div>
              <div className="dash-card-body">
                <div className="dash-actions-grid">
                  {[
                    { icon: "events",  href: "/events",           label: "Browse Events",   sub: "Find hackathons"       },
                    { icon: "teams",   href: "/teams/create",     label: "Create Team",     sub: "Start collaborating"   },
                    { icon: "submit",  href: "/submissions/create",label: "Submit Project",  sub: "Upload your work"      },
                    { icon: "posts",   href: "/posts",            label: "Community",        sub: "Posts & discussions"   },
                    { icon: "profile", href: "/profile",          label: "Edit Profile",    sub: "Update your info"      },
                    { icon: "trophy",  href: "/submissions",      label: "Leaderboard",     sub: "See top submissions"   },
                  ].map((a, i) => (
                    <Link key={i} href={a.href} className="dash-action-card">
                      <div className="dash-action-card-icon">
                        <Icon d={ICONS[a.icon]} size={16} />
                      </div>
                      <div>
                        <div className="dash-action-card-label">{a.label}</div>
                        <div className="dash-action-card-sub">{a.sub}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}
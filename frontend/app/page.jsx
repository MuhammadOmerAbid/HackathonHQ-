"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "../utils/axios";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

/* ─────────────────────────────────────────────────────────────
   DESIGN SYSTEM (keep your existing ICONS and SparkChart here)
───────────────────────────────────────────────────────────── */

/* ─── ICONS ─── (keep your existing ICONS object) */
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
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
  const fetchData = async () => {
    try {
      // Fetch all data in parallel with error handling for each
      const [eR, tR, sR, uR] = await Promise.allSettled([
        axios.get("/events/"),
        axios.get("/teams/"),
        axios.get("/submissions/"),
        axios.get("/users/")
      ]);

      // Handle events
      const evts = eR.status === 'fulfilled' ? (eR.value.data.results || eR.value.data || []) : [];
      const teams = tR.status === 'fulfilled' ? (tR.value.data.results || tR.value.data || []) : [];
      const subs = sR.status === 'fulfilled' ? (sR.value.data.results || sR.value.data || []) : [];
      
      // FIX: Get the TOTAL user count from the API response
      let userCount = 0;
      if (uR.status === 'fulfilled') {
        // If paginated, use the count field
        if (uR.value.data.count !== undefined) {
          userCount = uR.value.data.count;
        } 
        // Otherwise count the results array
        else {
          const usersArray = uR.value.data.results || uR.value.data || [];
          userCount = usersArray.length;
        }
      }

      const now = new Date();
      const live = evts.filter(e => new Date(e.start_date) <= now && new Date(e.end_date) >= now);
      const upcoming = evts.filter(e => new Date(e.start_date) > now);

      setStats({
        events: { total: evts.length, live: live.length, upcoming: upcoming.length },
        teams: teams.length,
        submissions: subs.length,
        users: userCount // Now using the total count, not just first page
      });
      
      setEvents(evts.slice(0, 5));
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);

  const chartData = [14, 22, 18, 35, 28, 44, 38, 52, 46, 61, 55, 68];
  const subChartData = [8, 12, 9, 20, 15, 28, 22, 35, 30, 42, 38, 48];

  const recentActivity = [
    { id: 1, icon: "team_act",  accent: true,  msg: <><strong>Code Warriors</strong> registered a new team</>, time: "2 hours ago" },
    { id: 2, icon: "file",      accent: false, msg: <><strong>Project Atlas</strong> submitted to TechFest 2025</>, time: "5 hours ago" },
    { id: 3, icon: "zap",       accent: true,  msg: <><strong>HackBuild Spring</strong> is now live</>, time: "1 day ago" },
    { id: 4, icon: "profile",   accent: false, msg: <><strong>jane_dev</strong> joined the platform</>, time: "2 days ago" },
    { id: 5, icon: "trophy",    accent: true,  msg: <><strong>Team Quantum</strong> won Best Innovation award</>, time: "3 days ago" },
  ];

  const mockTeams = [
    { name: "Code Warriors", event: "TechFest 2025",    members: 4, completion: 60,  status: "active" },
    { name: "Team Quantum",  event: "HackBuild Spring", members: 3, completion: 100, status: "done" },
    { name: "Dev Ninjas",    event: "HackBuild Spring", members: 5, completion: 25,  status: "active" },
    { name: "BuildFast",     event: "OpenHack III",     members: 2, completion: 10,  status: "active" },
  ];

  const eventStatus = (e) => {
    const now = new Date();
    if (new Date(e.start_date) > now) return "soon";
    if (new Date(e.end_date) >= now) return "live";
    return "closed";
  };

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-loading-ring" />
        <span className="dash-loading-label">Loading dashboard</span>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
      /* ── Circular Action Buttons ── */
.dash-action-outline-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1.5rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 100px;  /* Circular shape */
  color: #fff;
  font-size: 0.9rem;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  white-space: nowrap;
  backdrop-filter: blur(5px);
}

.dash-action-outline-circle:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #6EE7B7;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(110, 231, 183, 0.15);
}

.dash-action-primary-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1.5rem;
  background: #6EE7B7;
  border: 1px solid #4fb88b;
  border-radius: 100px;  /* Circular shape */
  color: #0c0c0f;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(110, 231, 183, 0.2);
}

.dash-action-primary-circle:hover {
  background: #86efac;
  border-color: #3a9e75;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(110, 231, 183, 0.3);
}

.dash-action-primary-circle svg {
  width: 16px;
  height: 16px;
  display: block;
  flex-shrink: 0;
  stroke: #0c0c0f;
}

      `}</style>
    <div className="dash-page">
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
  <button 
    onClick={() => router.push('/events')} 
    className="dash-action-outline-circle"
  >
    Browse events
  </button>
  <button 
    onClick={() => router.push('/teams/create')} 
    className="dash-action-primary-circle"
  >
    <Icon d={ICONS.plus} size={16} />
    Create team
  </button>
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
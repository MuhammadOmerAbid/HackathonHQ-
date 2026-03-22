"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";
import { useAuth } from "@/context/AuthContext";
import useSSE from "@/utils/useSSE";
import LoadingSpinner from "@/components/LoadingSpinner";

/* ─── Sparkline ─── */
const Sparkline = ({ series, color = "#6EE7B7" }) => {
  const W = 260, H = 56;
  const vals = Array.isArray(series) ? series.map(s => s.count || 0) : [];
  if (!vals.length) return <div className="dp-no-data">No data yet</div>;
  const max  = Math.max(1, ...vals);
  const min  = Math.min(0, ...vals);
  const step = vals.length > 1 ? W / (vals.length - 1) : W;
  const pts  = vals.map((v, i) => {
    const x = i * step;
    const y = H - ((v - min) / (max - min || 1)) * (H - 10) - 5;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const gid = `dpg${color.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="dp-spark">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0"   />
        </linearGradient>
      </defs>
      <path d={`M0,${H} L${pts.join(" L")} L${W},${H} Z`} fill={`url(#${gid})`} />
      <path d={`M${pts.join(" L")}`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/* ─── Helpers ─── */
const fmt  = v => v == null ? "0" : new Intl.NumberFormat().format(v);
const fmtD = v => { if (!v) return "—"; const d = new Date(v); return isNaN(d) ? "—" : d.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }); };
const ago  = v => {
  if (!v) return "—";
  const d = new Date(v); if (isNaN(d)) return "—";
  const m = Math.floor((Date.now() - d) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

/* ─── Section header ─── */
const SectionHead = ({ label, title, action, href }) => (
  <div className="dp-sh">
    <div>
      <div className="dp-sh-label">{label}</div>
      <div className="dp-sh-title">{title}</div>
    </div>
    {action && href && <Link href={href} className="dp-sh-link">{action}</Link>}
  </div>
);

/* ══════════════════════════════════
   MAIN
══════════════════════════════════ */
export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [activeTab, setActiveTab] = useState("activity");

  const isOrganizer = user?.is_organizer || user?.is_staff;
  const isJudge     = user?.is_judge;
  const isHacker    = !isOrganizer && !isJudge;

  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("access");
  useSSE("/analytics/stream/?channel=overview", {
    enabled: hasToken,
    onMessage: p => { setData(p); setLoading(false); },
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login?redirect=/dashboard"); return; }
    api.get("/analytics/overview/")
      .then(r => { setData(r.data); setError(""); })
      .catch(() => setError("Could not load dashboard data."))
      .finally(() => setLoading(false));
  }, [authLoading, user, router]);

  const stats          = data?.stats          || {};
  const series         = data?.series         || {};
  const recentActivity = data?.recent_activity || [];
  const recentEvents   = data?.recent_events   || [];
  const topTeams       = data?.top_teams       || [];
  const reviewRate     = useMemo(() => Math.round((stats.review_rate || 0) * 100), [stats.review_rate]);

  if (authLoading || loading) return <LoadingSpinner message="Loading dashboard…" />;
  if (!user) return null;

  /* ─── Role-aware quick actions ─── */
  const allActions = [
    { label:"Browse Events",   desc:"Discover & join hackathons",       icon:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",                                                                                                                                                 accent:"#6EE7B7", href:"/events",              roles:["all"]        },
    { label:"Browse Teams",    desc:"Find or join a team",              icon:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",                            accent:"#a78bfa", href:"/teams",              roles:["all"]        },
    { label:"Submit Project",  desc:"Upload your hackathon project",    icon:"M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",                                                                                                                                                                             accent:"#f472b6", href:"/submissions/create",  roles:["hacker"]     },
    { label:"My Submissions",  desc:"Track your submitted projects",    icon:"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",                                                                                                                    accent:"#f472b6", href:"/submissions",         roles:["hacker"]     },
    { label:"Community",       desc:"Posts, discussions, and DMs",      icon:"M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z",                                                                                               accent:"#60a5fa", href:"/community",           roles:["all"]        },
    { label:"Create Event",    desc:"Launch a new hackathon",           icon:"M12 4v16m8-8H4",                                                                                                                                                                                                                               accent:"#6EE7B7", href:"/events/create",       roles:["organizer"]  },
    { label:"Manage Users",    desc:"View and manage all participants", icon:"M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",                                                                                                                            accent:"#fbbf24", href:"/organizer/users",     roles:["organizer"]  },
    { label:"All Submissions", desc:"Review every project submitted",  icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",                                                                                             accent:"#f472b6", href:"/submissions",         roles:["organizer"]  },
    { label:"Judge Dashboard", desc:"Score and review submissions",     icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",                                                                                             accent:"#fbbf24", href:"/judge/dashboard",     roles:["judge"]      },
    { label:"My Profile",      desc:"Edit bio, skills, and avatar",    icon:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",                                                                                                                                                                         accent:"#60a5fa", href:"/profile",             roles:["all"]        },
  ];

  const quickActions = allActions.filter(a => {
    if (a.roles.includes("all")) return true;
    if (a.roles.includes("organizer") && isOrganizer) return true;
    if (a.roles.includes("judge")     && isJudge)     return true;
    if (a.roles.includes("hacker")    && isHacker)    return true;
    return false;
  });

  /* ─── Health metrics (organizer/judge only — they care about platform stats) ─── */
  const healthMetrics = [
    { label:"Review Coverage", value: reviewRate, color: reviewRate >= 75 ? "#4ade80" : reviewRate >= 40 ? "#fbbf24" : "#f87171", desc: reviewRate >= 75 ? "Excellent coverage" : reviewRate >= 40 ? "In progress" : "Needs attention" },
    { label:"Submission Rate",  value: Math.min(100, stats.submissions_total && stats.teams_total ? Math.round((stats.submissions_total / stats.teams_total) * 100) : 0), color:"#60a5fa", desc:"Submissions per team" },
    { label:"Judge Coverage",   value: Math.min(100, stats.judges_total && stats.events_total ? Math.round((stats.judges_total / stats.events_total) * 10) : 0), color:"#fbbf24", desc:"Judges per event ratio" },
    { label:"Events Live",      value: Math.min(100, stats.events_total ? Math.round(((stats.events_live || 0) / stats.events_total) * 100) : 0), color:"#4ade80", desc:`${fmt(stats.events_live)} of ${fmt(stats.events_total)} running` },
  ];

  /* ─── Hero stats ─── */
  const heroStats = [
    { label:"Total Events",  value: stats.events_total,     sub:[{ label:"Live", value: stats.events_live, accent:"#4ade80" },{ label:"Upcoming", value: stats.events_upcoming, accent:"#60a5fa" }], accent:"#6EE7B7", icon:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", href:"/events"      },
    { label:"Teams",         value: stats.teams_total,      sub:[], accent:"#a78bfa", icon:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",                href:"/teams"        },
    { label:"Submissions",   value: stats.submissions_total,sub:[{ label:"Reviewed", value: stats.reviewed_total, accent:"#6EE7B7" },{ label:"Rate", value:`${reviewRate}%`, accent:"#fbbf24" }], accent:"#f472b6", icon:"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", href:"/submissions" },
    { label:"Users",         value: stats.users_total,      sub:[{ label:"Judges", value: stats.judges_total, accent:"#fbbf24" }], accent:"#60a5fa", icon:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",                                                                                        href:"/users"        },
  ];

  return (
    <div className="dp">
      <div className="dp-wrap">

        {/* ── HEADER ── */}
        <header className="dp-header">
          <div className="dp-header-left">
            <div className="dp-eyebrow">
              <span className="dp-pulse-dot" />
              Dashboard
            </div>
            <h1 className="dp-title">
              Welcome back{user?.username ? `, ${user.username}` : ""}
            </h1>
            <p className="dp-sub">
              Real-time platform overview · Updated {ago(data?.updated_at)}
            </p>
          </div>
          <div className="dp-header-right">
            {/* Role badge */}
            <div className="dp-role-badge">
              {isOrganizer && <span className="dp-rb dp-rb-org">Organizer</span>}
              {isJudge     && <span className="dp-rb dp-rb-judge">Judge</span>}
              {isHacker    && <span className="dp-rb dp-rb-hacker">Hacker</span>}
            </div>
            <div className="dp-header-btns">
              <Link href="/events"    className="dp-btn-ghost">Browse Events</Link>
              <Link href="/community" className="dp-btn-primary">Community →</Link>
            </div>
          </div>
        </header>

        {error && (
          <div className="dp-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        {/* ── HERO STATS ── */}
        <section className="dp-hero-stats">
          {heroStats.map(s => (
            <Link key={s.label} href={s.href} className="dp-hstat" style={{ "--sa": s.accent }}>
              <div className="dp-hstat-top">
                <div className="dp-hstat-icon" style={{ background:`${s.accent}12`, border:`1px solid ${s.accent}20`, color:s.accent }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="18" height="18"><path d={s.icon}/></svg>
                </div>
                <span className="dp-hstat-label">{s.label}</span>
                <svg className="dp-hstat-arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
              <div className="dp-hstat-val">{fmt(s.value)}</div>
              {s.sub.length > 0 && (
                <div className="dp-hstat-subs">
                  {s.sub.map(sb => (
                    <div key={sb.label} className="dp-hstat-sub">
                      <span className="dp-hstat-sub-dot" style={{ background:sb.accent }}/>
                      <span className="dp-hstat-sub-v" style={{ color:sb.accent }}>{typeof sb.value === "string" ? sb.value : fmt(sb.value)}</span>
                      <span className="dp-hstat-sub-l">{sb.label}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="dp-hstat-bar" style={{ background:s.accent }}/>
            </Link>
          ))}
        </section>

        {/* ── BODY: CHARTS + ACTIVITY ── */}
        <div className="dp-body">
          {/* Left: charts */}
          <div className="dp-charts-col">
            <div className="dp-col-lbl">Trends</div>
            {[
              { title:"Submissions", sub:"Last 30 days", key:"submissions", color:"#6EE7B7" },
              { title:"New Users",   sub:"Last 30 days", key:"users",       color:"#60a5fa" },
              { title:"Reviews",     sub:"Last 30 days", key:"reviews",     color:"#fbbf24" },
            ].map(c => (
              <div key={c.key} className="dp-chart-card">
                <div className="dp-chart-head">
                  <div>
                    <div className="dp-chart-title">{c.title}</div>
                    <div className="dp-chart-sub">{c.sub}</div>
                  </div>
                  <div className="dp-chart-dot" style={{ background:c.color }}/>
                </div>
                <Sparkline series={series[c.key]} color={c.color}/>
              </div>
            ))}
          </div>

          {/* Right: activity tabs */}
          <div className="dp-lists-col">
            <div className="dp-col-lbl">Live Activity</div>
            <div className="dp-panel">
              <div className="dp-tabs">
                {[
                  { key:"activity", label:"Activity",  count:recentActivity.length },
                  { key:"events",   label:"Events",    count:recentEvents.length   },
                  { key:"teams",    label:"Top Teams", count:topTeams.length       },
                ].map(t => (
                  <button key={t.key} className={`dp-tab${activeTab===t.key?" dp-tab-on":""}`} onClick={()=>setActiveTab(t.key)}>
                    {t.label}
                    <span className="dp-tab-ct">{t.count}</span>
                  </button>
                ))}
              </div>

              {activeTab === "activity" && (
                <div className="dp-list">
                  {!recentActivity.length ? <div className="dp-empty">No recent activity.</div>
                    : recentActivity.map(item => (
                      <div key={item.id} className="dp-row">
                        <div className="dp-row-ico dp-row-ico-mint">
                          <svg viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" strokeWidth="2" width="11" height="11"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        </div>
                        <div className="dp-row-body">
                          <div className="dp-row-title">{item.title || item.description || item.type}</div>
                          <div className="dp-row-meta">{item.description || "Activity update"}</div>
                        </div>
                        <span className="dp-row-time">{ago(item.created_at)}</span>
                      </div>
                    ))}
                </div>
              )}

              {activeTab === "events" && (
                <div className="dp-list">
                  {!recentEvents.length ? <div className="dp-empty">No events yet.</div>
                    : recentEvents.map(ev => (
                      <div key={ev.id} className="dp-row">
                        <div className="dp-row-ico dp-row-ico-blue">
                          <svg viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" width="11" height="11"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        </div>
                        <div className="dp-row-body">
                          <div className="dp-row-title">{ev.name}</div>
                          <div className="dp-row-meta">{fmtD(ev.start_date)} → {fmtD(ev.end_date)}</div>
                        </div>
                        <div className="dp-row-pills">
                          <span className="dp-pill dp-pill-blue">{fmt(ev.participants_count)} joined</span>
                          <span className="dp-pill">{fmt(ev.submissions_count)} subs</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {activeTab === "teams" && (
                <div className="dp-list">
                  {!topTeams.length ? <div className="dp-empty">No teams yet.</div>
                    : topTeams.map((team, i) => (
                      <div key={team.id} className="dp-row">
                        <span className="dp-row-rank">#{i+1}</span>
                        <div className="dp-row-avi">{team.name?.[0]?.toUpperCase()||"T"}</div>
                        <div className="dp-row-body">
                          <div className="dp-row-title">{team.name}</div>
                          <div className="dp-row-meta">{team.event__name || "No event"}</div>
                        </div>
                        <div className="dp-row-pills">
                          <span className="dp-pill">{fmt(team.submissions_count)} subs</span>
                          <span className="dp-pill dp-pill-purple">{fmt(team.members_count)} members</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── LEADERBOARD (full width, proper) ── */}
        <section className="dp-lb-section">
          <SectionHead label="Rankings" title="Submission Leaderboard" action="View all submissions →" href="/submissions" />
          <div className="dp-lb-table">
            {/* Header */}
            <div className="dp-lb-thead">
              <div className="dp-lb-th dp-lb-th-rank">Rank</div>
              <div className="dp-lb-th">Team</div>
              <div className="dp-lb-th">Event</div>
              <div className="dp-lb-th dp-lb-th-num">Members</div>
              <div className="dp-lb-th dp-lb-th-num">Submissions</div>
              <div className="dp-lb-th dp-lb-th-num">Score</div>
            </div>
            {/* Rows */}
            {!topTeams.length ? (
              <div className="dp-lb-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32" style={{color:"#3a3a48",marginBottom:10}}><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                No submissions scored yet
              </div>
            ) : topTeams.map((team, i) => {
              const podium = ["dp-lb-gold","dp-lb-silver","dp-lb-bronze"];
              const medals = ["🥇","🥈","🥉"];
              const isPodium = i < 3;
              return (
                <div key={team.id} className={`dp-lb-row${isPodium ? " dp-lb-row-podium" : ""}`}>
                  <div className="dp-lb-td dp-lb-td-rank">
                    {isPodium
                      ? <span className="dp-lb-medal">{medals[i]}</span>
                      : <span className="dp-lb-num">#{i+1}</span>
                    }
                  </div>
                  <div className="dp-lb-td dp-lb-td-team">
                    <div className={`dp-lb-avi${isPodium ? " "+podium[i] : ""}`}>
                      {team.name?.[0]?.toUpperCase() || "T"}
                    </div>
                    <div>
                      <div className="dp-lb-name">{team.name}</div>
                      {isPodium && <div className="dp-lb-winner-tag">Top {i+1}</div>}
                    </div>
                  </div>
                  <div className="dp-lb-td dp-lb-td-event">{team.event__name || "—"}</div>
                  <div className="dp-lb-td dp-lb-td-num">
                    <span className="dp-lb-pill">{fmt(team.members_count)}</span>
                  </div>
                  <div className="dp-lb-td dp-lb-td-num">
                    <span className="dp-lb-pill dp-lb-pill-pink">{fmt(team.submissions_count)}</span>
                  </div>
                  <div className="dp-lb-td dp-lb-td-num">
                    <span className={`dp-lb-score${isPodium?" dp-lb-score-top":""}`}>
                      {team.avg_score != null ? team.avg_score.toFixed(1) : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── BOTTOM ROW: QUICK ACTIONS + HEALTH + PROFILE ── */}
        <div className="dp-bottom">

          {/* Quick Actions */}
          <div className="dp-bottom-qa">
            <SectionHead label="Shortcuts" title="Quick Actions" />
            <div className="dp-qa-grid">
              {quickActions.map(a => (
                <Link key={a.label} href={a.href} className="dp-qa" style={{ "--qa": a.accent }}>
                  <div className="dp-qa-ico" style={{ background:`${a.accent}12`, border:`1px solid ${a.accent}20`, color:a.accent }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="16" height="16"><path d={a.icon}/></svg>
                  </div>
                  <div className="dp-qa-body">
                    <div className="dp-qa-label">{a.label}</div>
                    <div className="dp-qa-desc">{a.desc}</div>
                  </div>
                  <svg className="dp-qa-arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Right col: health + profile stacked */}
          <div className="dp-bottom-right">

            {/* Platform health — organizer/judge only */}
            {(isOrganizer || isJudge) && (
              <div className="dp-health-card">
                <SectionHead label="Analytics" title="Platform Health" />
                <div className="dp-health-list">
                  {healthMetrics.map(h => (
                    <div key={h.label} className="dp-hm">
                      <div className="dp-hm-top">
                        <span className="dp-hm-label">{h.label}</span>
                        <span className="dp-hm-val" style={{ color:h.color }}>{h.value}%</span>
                      </div>
                      <div className="dp-hm-track">
                        <div className="dp-hm-fill" style={{ width:`${h.value}%`, background:h.color }}/>
                      </div>
                      <div className="dp-hm-desc">{h.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Profile card */}
            <div className="dp-profile">
              <div className="dp-profile-head">
                <div className="dp-profile-avi">
                  {user?.avatar
                    ? <img src={user.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}/>
                    : user?.username?.[0]?.toUpperCase() || "U"
                  }
                </div>
                <div>
                  <div className="dp-profile-name">{user?.username || "Hacker"}</div>
                  <div className="dp-profile-email">{user?.email || ""}</div>
                </div>
              </div>
              <div className="dp-profile-badges">
                {user?.is_staff     && <span className="dp-rb dp-rb-org"   style={{fontSize:11}}>Staff</span>}
                {isOrganizer && !user?.is_staff && <span className="dp-rb dp-rb-org"   style={{fontSize:11}}>Organizer</span>}
                {isJudge            && <span className="dp-rb dp-rb-judge" style={{fontSize:11}}>Judge</span>}
                {isHacker           && <span className="dp-rb dp-rb-hacker"style={{fontSize:11}}>Hacker</span>}
              </div>
              <div className="dp-profile-links">
                <Link href="/profile"              className="dp-profile-link">View profile</Link>
                <Link href="/profile?tab=settings" className="dp-profile-link">Settings</Link>
              </div>
            </div>

          </div>
        </div>

        {/* ── UPCOMING EVENTS (full width) ── */}
        <section className="dp-upcoming">
          <SectionHead label="Schedule" title="Upcoming Events" action="Browse all →" href="/events" />
          <div className="dp-up-grid">
            {!recentEvents.length ? (
              <div className="dp-empty" style={{gridColumn:"1/-1"}}>No upcoming events scheduled.</div>
            ) : recentEvents.slice(0, 6).map(ev => (
              <Link key={ev.id} href={`/events/${ev.id}`} className="dp-up-card">
                <div className="dp-up-card-top">
                  <div className="dp-up-datebox">
                    <div className="dp-up-day">{ev.start_date ? new Date(ev.start_date).getDate() : "—"}</div>
                    <div className="dp-up-mon">{ev.start_date ? new Date(ev.start_date).toLocaleString("default",{month:"short"}) : "—"}</div>
                  </div>
                  <span className="dp-up-status">Upcoming</span>
                </div>
                <div className="dp-up-name">{ev.name}</div>
                <div className="dp-up-dates">{fmtD(ev.start_date)} → {fmtD(ev.end_date)}</div>
                <div className="dp-up-footer">
                  <span className="dp-pill dp-pill-blue">{fmt(ev.participants_count)} joined</span>
                  <span className="dp-pill">{fmt(ev.submissions_count)} subs</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </div>

      <style jsx>{`
        /* ── Base ── */
        .dp { min-height:100vh; background:#0c0c0f; color:#f0f0f3; font-family:'DM Sans',sans-serif; }
        .dp-wrap { max-width:1280px; margin:0 auto; padding:36px 32px 80px; animation:dpIn .35s ease both; }
        @keyframes dpIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

        /* ── Section head ── */
        .dp-sh { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:18px; }
        .dp-sh-label { font-size:10.5px; font-weight:700; color:#3a3a48; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
        .dp-sh-title { font-family:'Syne',sans-serif; font-size:17px; font-weight:700; color:#f0f0f3; letter-spacing:-.3px; }
        .dp-sh-link  { font-size:12px; font-weight:600; color:#6EE7B7; text-decoration:none; opacity:.8; transition:opacity .15s; flex-shrink:0; }
        .dp-sh-link:hover { opacity:1; }

        /* ── Column label (inline) ── */
        .dp-col-lbl { font-size:10.5px; font-weight:700; color:#3a3a48; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px; }

        /* ── Header ── */
        .dp-header { display:flex; justify-content:space-between; align-items:flex-start; gap:20px; margin-bottom:32px; padding-bottom:24px; border-bottom:1px solid #1e1e24; }
        .dp-header-left {}
        .dp-header-right { display:flex; flex-direction:column; align-items:flex-end; gap:12px; flex-shrink:0; }
        .dp-eyebrow { display:flex; align-items:center; gap:7px; font-size:11px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; color:#6EE7B7; margin-bottom:8px; }
        .dp-pulse-dot { width:6px; height:6px; border-radius:50%; background:#4ade80; flex-shrink:0; animation:dpPulse 2s ease-in-out infinite; }
        @keyframes dpPulse { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.4)} 50%{box-shadow:0 0 0 5px rgba(74,222,128,0)} }
        .dp-title { font-family:'Syne',sans-serif; font-size:26px; font-weight:700; color:#f0f0f3; margin:0 0 5px; letter-spacing:-.5px; line-height:1.2; }
        .dp-sub   { font-size:13px; color:#5c5c6e; margin:0; }
        .dp-role-badge { display:flex; gap:6px; }
        .dp-rb { font-size:11px; font-weight:700; padding:4px 12px; border-radius:100px; letter-spacing:.3px; }
        .dp-rb-org    { background:rgba(110,231,183,.1); color:#6EE7B7; border:1px solid rgba(110,231,183,.2); }
        .dp-rb-judge  { background:rgba(251,191,36,.1);  color:#fbbf24; border:1px solid rgba(251,191,36,.25); }
        .dp-rb-hacker { background:rgba(96,165,250,.1);  color:#60a5fa; border:1px solid rgba(96,165,250,.2);  }
        .dp-header-btns { display:flex; gap:10px; }
        .dp-btn-ghost   { padding:8px 18px; border-radius:10px; font-size:13px; font-weight:600; font-family:'DM Sans',sans-serif; text-decoration:none; background:transparent; border:1px solid #26262e; color:#5c5c6e; transition:all .15s; }
        .dp-btn-ghost:hover   { border-color:rgba(110,231,183,.4); color:#6EE7B7; }
        .dp-btn-primary { padding:8px 18px; border-radius:10px; font-size:13px; font-weight:600; font-family:'DM Sans',sans-serif; text-decoration:none; background:#6EE7B7; color:#0c0c0f; border:1px solid #4fb88b; transition:all .15s; }
        .dp-btn-primary:hover { background:#86efac; transform:translateY(-1px); box-shadow:0 6px 16px rgba(110,231,183,.25); }
        .dp-error { display:flex; align-items:center; gap:8px; background:rgba(248,113,113,.07); border:1px solid rgba(248,113,113,.2); color:#fca5a5; padding:11px 14px; border-radius:10px; font-size:13px; margin-bottom:20px; }

        /* ── Hero stat cards ── */
        .dp-hero-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
        .dp-hstat { position:relative; overflow:hidden; background:#111114; border:1px solid #1e1e24; border-radius:16px; padding:22px 20px 20px; text-decoration:none; color:inherit; display:block; transition:border-color .18s, transform .18s, box-shadow .18s; }
        .dp-hstat:hover { border-color:color-mix(in srgb, var(--sa) 35%, transparent); transform:translateY(-2px); box-shadow:0 8px 28px rgba(0,0,0,.3); }
        .dp-hstat-top { display:flex; align-items:center; gap:10px; margin-bottom:16px; }
        .dp-hstat-icon { width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .dp-hstat-label { font-size:11.5px; font-weight:600; color:#5c5c6e; flex:1; text-transform:uppercase; letter-spacing:.5px; }
        .dp-hstat-arr { color:#3a3a48; opacity:0; transition:opacity .15s, transform .15s; }
        .dp-hstat:hover .dp-hstat-arr { opacity:1; transform:translateX(3px); }
        .dp-hstat-val  { font-family:'Syne',sans-serif; font-size:36px; font-weight:800; color:#f0f0f3; letter-spacing:-2px; line-height:1; margin-bottom:14px; }
        .dp-hstat-subs { display:flex; gap:14px; flex-wrap:wrap; padding-top:12px; border-top:1px solid #1e1e24; }
        .dp-hstat-sub  { display:flex; align-items:center; gap:5px; }
        .dp-hstat-sub-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }
        .dp-hstat-sub-v   { font-family:'Syne',sans-serif; font-size:13px; font-weight:700; }
        .dp-hstat-sub-l   { font-size:11px; color:#5c5c6e; }
        .dp-hstat-bar { position:absolute; bottom:0; left:0; right:0; height:2px; opacity:0; transition:opacity .18s; }
        .dp-hstat:hover .dp-hstat-bar { opacity:.6; }

        /* ── Body ── */
        .dp-body { display:grid; grid-template-columns:1fr 1.4fr; gap:16px; margin-bottom:20px; align-items:start; }
        .dp-charts-col { display:flex; flex-direction:column; gap:11px; }
        .dp-chart-card { background:#111114; border:1px solid #1e1e24; border-radius:14px; padding:18px 20px; transition:border-color .15s; }
        .dp-chart-card:hover { border-color:#26262e; }
        .dp-chart-head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; }
        .dp-chart-title { font-family:'Syne',sans-serif; font-size:13.5px; font-weight:700; color:#f0f0f3; margin-bottom:2px; letter-spacing:-.2px; }
        .dp-chart-sub   { font-size:11px; color:#5c5c6e; }
        .dp-chart-dot   { width:8px; height:8px; border-radius:50%; margin-top:3px; flex-shrink:0; }
        .dp-spark { width:100%; height:56px; display:block; }
        .dp-no-data { font-size:12px; color:#3a3a48; height:56px; display:flex; align-items:center; }
        .dp-lists-col { display:flex; flex-direction:column; }
        .dp-panel { background:#111114; border:1px solid #1e1e24; border-radius:16px; overflow:hidden; }
        .dp-tabs { display:flex; border-bottom:1px solid #1e1e24; background:#0c0c0f; padding:0 16px; }
        .dp-tab { display:flex; align-items:center; gap:6px; padding:13px 14px; font-size:12.5px; font-weight:600; font-family:'DM Sans',sans-serif; color:#5c5c6e; background:transparent; border:none; border-bottom:2px solid transparent; margin-bottom:-1px; cursor:pointer; transition:color .15s; white-space:nowrap; }
        .dp-tab:hover { color:#f0f0f3; }
        .dp-tab-on { color:#6EE7B7; border-bottom-color:#6EE7B7; }
        .dp-tab-ct { font-size:10px; font-weight:700; padding:1px 6px; border-radius:100px; background:#17171b; color:#5c5c6e; }
        .dp-tab-on .dp-tab-ct { background:rgba(110,231,183,.1); color:#6EE7B7; }
        .dp-list { display:flex; flex-direction:column; max-height:400px; overflow-y:auto; }
        .dp-list::-webkit-scrollbar { width:3px; }
        .dp-list::-webkit-scrollbar-thumb { background:#26262e; border-radius:2px; }
        .dp-row { display:flex; align-items:center; gap:11px; padding:12px 18px; transition:background .1s; }
        .dp-row:hover { background:rgba(255,255,255,.02); }
        .dp-row + .dp-row { border-top:1px solid #1e1e24; }
        .dp-row-ico { width:26px; height:26px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .dp-row-ico-mint { background:rgba(110,231,183,.08); border:1px solid rgba(110,231,183,.15); }
        .dp-row-ico-blue { background:rgba(96,165,250,.08);  border:1px solid rgba(96,165,250,.15);  }
        .dp-row-rank { font-family:'Syne',sans-serif; font-size:11px; font-weight:700; color:#3a3a48; min-width:22px; flex-shrink:0; }
        .dp-row-avi  { width:26px; height:26px; border-radius:7px; background:rgba(110,231,183,.1); border:1px solid rgba(110,231,183,.2); display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; font-size:11px; font-weight:700; color:#6EE7B7; flex-shrink:0; }
        .dp-row-body { flex:1; min-width:0; }
        .dp-row-title { font-size:13px; font-weight:600; color:#f0f0f3; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .dp-row-meta  { font-size:11px; color:#5c5c6e; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .dp-row-time  { font-size:10.5px; color:#6EE7B7; white-space:nowrap; flex-shrink:0; font-weight:600; }
        .dp-row-pills { display:flex; flex-direction:column; gap:4px; align-items:flex-end; flex-shrink:0; }
        .dp-pill { font-size:10px; padding:3px 8px; border-radius:100px; background:rgba(110,231,183,.07); border:1px solid rgba(110,231,183,.18); color:#6EE7B7; white-space:nowrap; font-weight:600; }
        .dp-pill-blue   { background:rgba(96,165,250,.07);  border-color:rgba(96,165,250,.2);   color:#60a5fa; }
        .dp-pill-purple { background:rgba(167,139,250,.07); border-color:rgba(167,139,250,.2);  color:#a78bfa; }
        .dp-pill-pink   { background:rgba(244,114,182,.07); border-color:rgba(244,114,182,.2);  color:#f472b6; }
        .dp-empty { font-size:13px; color:#3a3a48; padding:22px 18px; }

        /* ── Leaderboard ── */
        .dp-lb-section { margin-bottom:20px; }
        .dp-lb-table { background:#111114; border:1px solid #1e1e24; border-radius:16px; overflow:hidden; }
        .dp-lb-thead { display:grid; grid-template-columns:60px 1fr 1fr 90px 110px 80px; padding:10px 20px; border-bottom:1px solid #1e1e24; background:#0c0c0f; }
        .dp-lb-th { font-size:10.5px; font-weight:700; color:#3a3a48; text-transform:uppercase; letter-spacing:.6px; }
        .dp-lb-th-rank { text-align:center; }
        .dp-lb-th-num  { text-align:right; }
        .dp-lb-row { display:grid; grid-template-columns:60px 1fr 1fr 90px 110px 80px; align-items:center; padding:13px 20px; transition:background .1s; border-bottom:1px solid #1e1e24; }
        .dp-lb-row:last-child { border-bottom:none; }
        .dp-lb-row:hover { background:rgba(255,255,255,.02); }
        .dp-lb-row-podium { background:rgba(110,231,183,.025); }
        .dp-lb-row-podium:hover { background:rgba(110,231,183,.04); }
        .dp-lb-td { display:flex; align-items:center; }
        .dp-lb-td-rank  { justify-content:center; }
        .dp-lb-td-num   { justify-content:flex-end; }
        .dp-lb-td-team  { gap:10px; }
        .dp-lb-medal { font-size:18px; }
        .dp-lb-num   { font-family:'Syne',sans-serif; font-size:13px; font-weight:700; color:#3a3a48; }
        .dp-lb-avi   { width:30px; height:30px; border-radius:9px; background:rgba(110,231,183,.1); border:1px solid rgba(110,231,183,.2); display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; font-size:12px; font-weight:700; color:#6EE7B7; flex-shrink:0; }
        .dp-lb-gold   { background:rgba(251,191,36,.15);  border-color:rgba(251,191,36,.3);  color:#fbbf24; }
        .dp-lb-silver { background:rgba(148,163,184,.15); border-color:rgba(148,163,184,.3); color:#94a3b8; }
        .dp-lb-bronze { background:rgba(180,120,60,.15);  border-color:rgba(180,120,60,.3);  color:#cd7f32; }
        .dp-lb-name  { font-size:13.5px; font-weight:600; color:#f0f0f3; margin-bottom:2px; }
        .dp-lb-winner-tag { font-size:10px; font-weight:700; color:#6EE7B7; background:rgba(110,231,183,.1); border:1px solid rgba(110,231,183,.2); padding:1px 7px; border-radius:100px; display:inline-block; }
        .dp-lb-td-event { font-size:12.5px; color:#5c5c6e; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block; }
        .dp-lb-pill { font-size:11px; font-weight:600; padding:3px 10px; border-radius:100px; background:#17171b; border:1px solid #26262e; color:#888; }
        .dp-lb-pill-pink { background:rgba(244,114,182,.07); border-color:rgba(244,114,182,.2); color:#f472b6; }
        .dp-lb-score { font-family:'Syne',sans-serif; font-size:15px; font-weight:700; color:#5c5c6e; }
        .dp-lb-score-top { color:#6EE7B7; }
        .dp-lb-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:48px 20px; color:#3a3a48; font-size:13px; }

        /* ── Bottom row ── */
        .dp-bottom { display:grid; grid-template-columns:1fr 360px; gap:16px; margin-bottom:20px; align-items:start; }
        .dp-bottom-qa {}
        .dp-bottom-right { display:flex; flex-direction:column; gap:14px; }

        /* Quick actions */
        .dp-qa-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }
        .dp-qa { display:flex; align-items:center; gap:12px; background:#111114; border:1px solid #1e1e24; border-radius:12px; padding:14px 16px; text-decoration:none; color:inherit; transition:border-color .18s, transform .15s; position:relative; overflow:hidden; }
        .dp-qa::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:var(--qa); opacity:0; transition:opacity .18s; }
        .dp-qa:hover { border-color:color-mix(in srgb, var(--qa) 30%, transparent); transform:translateY(-1px); }
        .dp-qa:hover::before { opacity:.7; }
        .dp-qa-ico   { width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .dp-qa-body  { flex:1; min-width:0; }
        .dp-qa-label { font-size:13px; font-weight:700; color:#f0f0f3; margin-bottom:2px; font-family:'Syne',sans-serif; letter-spacing:-.15px; }
        .dp-qa-desc  { font-size:11px; color:#5c5c6e; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .dp-qa-arr   { color:#3a3a48; flex-shrink:0; opacity:0; transition:opacity .15s, transform .15s; }
        .dp-qa:hover .dp-qa-arr { opacity:1; transform:translateX(2px); }

        /* Health card */
        .dp-health-card { background:#111114; border:1px solid #1e1e24; border-radius:16px; padding:20px; }
        .dp-health-list { display:flex; flex-direction:column; gap:14px; }
        .dp-hm {}
        .dp-hm-top   { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:7px; }
        .dp-hm-label { font-size:12px; color:#5c5c6e; font-weight:600; }
        .dp-hm-val   { font-family:'Syne',sans-serif; font-size:15px; font-weight:700; letter-spacing:-.5px; }
        .dp-hm-track { height:4px; background:#1e1e24; border-radius:2px; overflow:hidden; margin-bottom:4px; }
        .dp-hm-fill  { height:100%; border-radius:2px; transition:width .7s cubic-bezier(.16,1,.3,1); }
        .dp-hm-desc  { font-size:10.5px; color:#3a3a48; }

        /* Profile */
        .dp-profile { background:#111114; border:1px solid #1e1e24; border-radius:16px; padding:20px; }
        .dp-profile-head  { display:flex; align-items:center; gap:13px; margin-bottom:14px; padding-bottom:14px; border-bottom:1px solid #1e1e24; }
        .dp-profile-avi   { width:44px; height:44px; border-radius:50%; background:rgba(110,231,183,.1); border:2px solid rgba(110,231,183,.2); display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; font-size:18px; font-weight:700; color:#6EE7B7; flex-shrink:0; overflow:hidden; }
        .dp-profile-name  { font-family:'Syne',sans-serif; font-size:14px; font-weight:700; color:#f0f0f3; margin-bottom:2px; letter-spacing:-.2px; }
        .dp-profile-email { font-size:11.5px; color:#5c5c6e; }
        .dp-profile-badges{ display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px; }
        .dp-profile-links { display:flex; gap:8px; }
        .dp-profile-link  { font-size:12px; font-weight:600; color:#5c5c6e; text-decoration:none; padding:6px 14px; border:1px solid #26262e; border-radius:8px; transition:all .15s; flex:1; text-align:center; }
        .dp-profile-link:hover { color:#6EE7B7; border-color:rgba(110,231,183,.3); }

        /* ── Upcoming events grid ── */
        .dp-upcoming {}
        .dp-up-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
        .dp-up-card { background:#111114; border:1px solid #1e1e24; border-radius:14px; padding:18px; text-decoration:none; color:inherit; display:flex; flex-direction:column; gap:8px; transition:border-color .18s, transform .18s; }
        .dp-up-card:hover { border-color:rgba(110,231,183,.25); transform:translateY(-2px); }
        .dp-up-card-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px; }
        .dp-up-datebox { width:38px; height:42px; background:#17171b; border:1px solid #26262e; border-radius:10px; display:flex; flex-direction:column; align-items:center; justify-content:center; flex-shrink:0; }
        .dp-up-day    { font-family:'Syne',sans-serif; font-size:16px; font-weight:700; color:#f0f0f3; line-height:1; }
        .dp-up-mon    { font-size:9px; color:#5c5c6e; text-transform:uppercase; letter-spacing:.4px; }
        .dp-up-status { font-size:10px; font-weight:700; padding:3px 9px; border-radius:100px; background:rgba(96,165,250,.1); color:#60a5fa; border:1px solid rgba(96,165,250,.2); }
        .dp-up-name   { font-family:'Syne',sans-serif; font-size:14px; font-weight:700; color:#f0f0f3; letter-spacing:-.2px; line-height:1.3; }
        .dp-up-dates  { font-size:11.5px; color:#5c5c6e; }
        .dp-up-footer { display:flex; gap:6px; flex-wrap:wrap; margin-top:auto; }

        /* ── Responsive ── */
        @media(max-width:1200px) { .dp-bottom{grid-template-columns:1fr} .dp-bottom-right{flex-direction:row} .dp-health-card,.dp-profile{flex:1} .dp-up-grid{grid-template-columns:repeat(2,1fr)} }
        @media(max-width:1100px) { .dp-hero-stats{grid-template-columns:repeat(2,1fr)} .dp-body{grid-template-columns:1fr} .dp-lb-thead,.dp-lb-row{grid-template-columns:50px 1fr 1fr 80px 100px 70px} }
        @media(max-width:900px)  { .dp-lb-thead,.dp-lb-row{grid-template-columns:50px 1fr 80px 80px} .dp-lb-td-event{display:none} .dp-lb-th:nth-child(3){display:none} }
        @media(max-width:768px)  { .dp-wrap{padding:24px 20px 60px} .dp-header{flex-direction:column} .dp-header-right{align-items:flex-start} .dp-header-btns{width:100%} .dp-btn-ghost,.dp-btn-primary{flex:1;justify-content:center;text-align:center} .dp-hero-stats{grid-template-columns:repeat(2,1fr)} .dp-qa-grid{grid-template-columns:1fr} .dp-up-grid{grid-template-columns:1fr} .dp-bottom-right{flex-direction:column} }
        @media(max-width:520px)  { .dp-hero-stats{grid-template-columns:1fr} .dp-hstat-val{font-size:28px} .dp-lb-thead,.dp-lb-row{grid-template-columns:40px 1fr 70px} .dp-lb-td-num:nth-child(4),.dp-lb-th-num:nth-child(4){display:none} }
      `}</style>
    </div>
  );
}
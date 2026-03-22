"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/utils/axios";
import { useAuth } from "@/context/AuthContext";
import useSSE from "@/utils/useSSE";
import LoadingSpinner from "@/components/LoadingSpinner";

/* ── Sparkline ── */
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

/* ── Helpers ── */
const fmt  = v => v == null ? "0" : new Intl.NumberFormat().format(v);
const fmtD = v => { if (!v) return "—"; const d = new Date(v); return isNaN(d) ? "—" : d.toLocaleDateString("en-US", { month:"short", day:"numeric" }); };
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
  const eventWinners   = data?.event_winners   || [];
  const reviewRate     = useMemo(() => Math.round((stats.review_rate || 0) * 100), [stats.review_rate]);

  if (authLoading || loading) return <LoadingSpinner message="Loading dashboard…" />;
  if (!user) return null;

  /* ── Hero stats ── */
  const heroStats = [
    { label:"Total Events",  value:stats.events_total,     accent:"#6EE7B7", icon:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", href:"/events",      sub:[{label:"Live",accent:"#4ade80",value:stats.events_live},{label:"Upcoming",accent:"#60a5fa",value:stats.events_upcoming}] },
    { label:"Teams",         value:stats.teams_total,      accent:"#a78bfa", icon:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", href:"/teams",       sub:[] },
    { label:"Submissions",   value:stats.submissions_total,accent:"#f472b6", icon:"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", href:"/submissions",sub:[{label:"Reviewed",accent:"#6EE7B7",value:stats.reviewed_total},{label:"Rate",accent:"#fbbf24",value:`${reviewRate}%`}] },
    { label:"Users",         value:stats.users_total,      accent:"#60a5fa", icon:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",                      href:"/users",       sub:[{label:"Judges",accent:"#fbbf24",value:stats.judges_total}] },
  ];

  /* ── Winners data ── */
  const winners = eventWinners.length
    ? eventWinners
    : topTeams.filter(t => t.is_winner || t.rank != null);
  const medals = ["🥇","🥈","🥉"];
  const aviCls = ["dp-lb-gold","dp-lb-silver","dp-lb-bronze"];

  return (
    <div className="dp">
      <div className="dp-wrap">

        {/* ── HEADER ── */}
       
<header className="dp-header">
  <div>
    <div className="dp-eyebrow">
      <span className="dp-pulse-dot"/>
      Dashboard
      <span className={`dp-role-pill ${isOrganizer ? "dp-rp-org" : isJudge ? "dp-rp-judge" : "dp-rp-hacker"}`}>
        {isOrganizer ? "Organizer" : isJudge ? "Judge" : "Hacker"}
      </span>
    </div>
    <h1 className="dp-title">Welcome back{user?.username ? `, ${user.username}` : ""}</h1>
    <p className="dp-sub">Real-time platform overview · Updated {ago(data?.updated_at)}</p>
  </div>
  <div className="dp-header-btns">
    <button onClick={() => router.push("/events")} className="dp-btn-ghost">
      Browse Events
    </button>
    <button onClick={() => router.push("/community")} className="dp-btn-primary">
      Community →
    </button>
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
            <Link key={s.label} href={s.href} className="dp-hstat" style={{"--sa":s.accent}}>
              <div className="dp-hstat-top">
                <div className="dp-hstat-icon" style={{background:`${s.accent}12`,border:`1px solid ${s.accent}20`,color:s.accent}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="18" height="18"><path d={s.icon}/></svg>
                </div>
                <span className="dp-hstat-label">{s.label}</span>
                <svg className="dp-hstat-arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
              <div className="dp-hstat-val">{fmt(s.value)}</div>
              {s.sub.length > 0 && (
                <div className="dp-hstat-subs">
                  {s.sub.map(sb=>(
                    <div key={sb.label} className="dp-hstat-sub">
                      <span className="dp-hstat-sub-dot" style={{background:sb.accent}}/>
                      <span className="dp-hstat-sub-v" style={{color:sb.accent}}>{typeof sb.value==="string"?sb.value:fmt(sb.value)}</span>
                      <span className="dp-hstat-sub-l">{sb.label}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="dp-hstat-bar" style={{background:s.accent}}/>
            </Link>
          ))}
        </section>

        {/* ── TRENDS + ACTIVITY + PROFILE (aligned) ── */}
        <div className="dp-body">
          {/* Left: Charts */}
          <div className="dp-charts-col">
            <div className="dp-col-lbl">Trends</div>
            {[
              {title:"Submissions",sub:"Last 30 days",key:"submissions",color:"#6EE7B7"},
              {title:"New Users",  sub:"Last 30 days",key:"users",      color:"#60a5fa"},
              {title:"Reviews",    sub:"Last 30 days",key:"reviews",    color:"#fbbf24"},
            ].map(c=>(
              <div key={c.key} className="dp-chart-card">
                <div className="dp-chart-head">
                  <div><div className="dp-chart-title">{c.title}</div><div className="dp-chart-sub">{c.sub}</div></div>
                  <div className="dp-chart-dot" style={{background:c.color}}/>
                </div>
                <Sparkline series={series[c.key]} color={c.color}/>
              </div>
            ))}
          </div>

          {/* Right: Activity Panel + Profile Card (aligned) */}
          <div className="dp-right-col">
            {/* Activity Panel */}
            <div className="dp-panel">
              <div className="dp-tabs">
                {[{key:"activity",label:"Activity",count:recentActivity.length},{key:"events",label:"Events",count:recentEvents.length},{key:"teams",label:"Top Teams",count:topTeams.length}].map(t=>(
                  <button key={t.key} className={`dp-tab${activeTab===t.key?" dp-tab-on":""}`} onClick={()=>setActiveTab(t.key)}>
                    {t.label}<span className="dp-tab-ct">{t.count}</span>
                  </button>
                ))}
              </div>

              {activeTab==="activity"&&(
                <div className="dp-list">
                  {!recentActivity.length?<div className="dp-empty">No recent activity.</div>
                  :recentActivity.map(item=>(
                    <div key={item.id} className="dp-row">
                      <div className="dp-row-ico dp-ico-mint"><svg viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" strokeWidth="2" width="11" height="11"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div>
                      <div className="dp-row-body"><div className="dp-row-title">{item.title||item.description||item.type}</div><div className="dp-row-meta">{item.description||"Activity update"}</div></div>
                      <span className="dp-row-time">{ago(item.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeTab==="events"&&(
                <div className="dp-list">
                  {!recentEvents.length?<div className="dp-empty">No events yet.</div>
                  :recentEvents.map(ev=>(
                    <div key={ev.id} className="dp-row">
                      <div className="dp-row-ico dp-ico-blue"><svg viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" width="11" height="11"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>
                      <div className="dp-row-body"><div className="dp-row-title">{ev.name}</div><div className="dp-row-meta">{fmtD(ev.start_date)} → {fmtD(ev.end_date)}</div></div>
                      <div className="dp-row-pills"><span className="dp-pill dp-pill-blue">{fmt(ev.participants_count)} joined</span><span className="dp-pill">{fmt(ev.submissions_count)} subs</span></div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab==="teams"&&(
                <div className="dp-list">
                  {!topTeams.length?<div className="dp-empty">No teams yet.</div>
                  :topTeams.map((team,i)=>(
                    <div key={team.id} className="dp-row">
                      <span className="dp-row-rank">#{i+1}</span>
                      <div className="dp-row-avi">{team.name?.[0]?.toUpperCase()||"T"}</div>
                      <div className="dp-row-body"><div className="dp-row-title">{team.name}</div><div className="dp-row-meta">{team.event__name||"No event"}</div></div>
                      <div className="dp-row-pills"><span className="dp-pill">{fmt(team.submissions_count)} subs</span><span className="dp-pill dp-pill-purple">{fmt(team.members_count)}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile Card - Clickable, redirects to profile */}
            <div className="dp-profile-card" onClick={() => router.push("/profile")}>
              <div className="dp-profile-avi">
                {user?.avatar
                  ? <img src={user.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}/>
                  : user?.username?.[0]?.toUpperCase()||"U"
                }
              </div>
              <div className="dp-profile-body">
                <div className="dp-profile-meta">
                  <div className="dp-profile-name">{user?.username||"Hacker"}</div>
                  <div className="dp-profile-email">{user?.email||""}</div>
                  <div className="dp-profile-badges">
                    {user?.is_staff     && <span className="dp-badge dp-badge-gold">Staff</span>}
                    {user?.is_organizer && <span className="dp-badge dp-badge-mint">Organizer</span>}
                    {user?.is_judge     && <span className="dp-badge dp-badge-amber">Judge</span>}
                    {!user?.is_staff && !user?.is_organizer && !user?.is_judge && (
                      <span className="dp-badge dp-badge-mint">Hacker</span>
                    )}
                  </div>
                </div>
                <div className="dp-profile-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── LEADERBOARD (full-width) ── */}
        <section className="dp-lb-section">
          <div className="dp-section-head">
            <div><div className="dp-sh-label">Hall of Fame</div><div className="dp-sh-title">Event Winners</div></div>
            <Link href="/submissions" className="dp-sh-link">All results →</Link>
          </div>
          <div className="dp-lb-table">
            <div className="dp-lb-thead">
              <div className="dp-lb-th dp-lb-tc">Place</div>
              <div className="dp-lb-th">Winner</div>
              <div className="dp-lb-th">Event</div>
              <div className="dp-lb-th dp-lb-tr">Score</div>
              <div className="dp-lb-th dp-lb-tr">Members</div>
              <div className="dp-lb-th dp-lb-tr">Announced</div>
            </div>
            {!winners.length ? (
              <div className="dp-lb-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
                <div className="dp-lb-empty-h">No winners announced yet</div>
                <div className="dp-lb-empty-s">Results appear here once organizers announce event outcomes</div>
              </div>
            ) : winners.map((w, i) => {
              const place  = w.rank || (i + 1);
              const isTop3 = place <= 3;
              return (
                <div key={w.id} className={`dp-lb-row${isTop3?" dp-lb-podium":""}`}>
                  <div className="dp-lb-td dp-lb-tc">
                    {medals[place-1] ? <span className="dp-lb-medal">{medals[place-1]}</span> : <span className="dp-lb-num">#{place}</span>}
                  </div>
                  <div className="dp-lb-td dp-lb-team">
                    <div className={`dp-lb-avi${aviCls[place-1]?" "+aviCls[place-1]:""}`}>{(w.team_name||w.name||"T")[0].toUpperCase()}</div>
                    <div>
                      <div className="dp-lb-name">{w.team_name||w.name||"Unknown Team"}</div>
                      {isTop3&&<span className={`dp-lb-ptag dp-lb-p${place}`}>{place===1?"1st Place":place===2?"2nd Place":"3rd Place"}</span>}
                    </div>
                  </div>
                  <div className="dp-lb-td dp-lb-event">{w.event_name||w.event__name||"—"}</div>
                  <div className="dp-lb-td dp-lb-tr"><span className={`dp-lb-score${isTop3?" dp-lb-stop":""}`}>{w.score!=null?Number(w.score).toFixed(1):w.avg_score!=null?Number(w.avg_score).toFixed(1):"—"}</span></div>
                  <div className="dp-lb-td dp-lb-tr"><span className="dp-lb-pill">{fmt(w.members_count)}</span></div>
                  <div className="dp-lb-td dp-lb-tr"><span className="dp-lb-time">{ago(w.announced_at||w.updated_at)}</span></div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── PLATFORM HEALTH (below leaderboard) ── */}
        <section className="dp-health-section">
          <div className="dp-section-head">
            <div><div className="dp-sh-label">Analytics</div><div className="dp-sh-title">Platform Health</div></div>
          </div>
          <div className="dp-health-grid">
            {[
              { label:"Review Coverage", value:reviewRate, color:reviewRate>=75?"#4ade80":reviewRate>=40?"#fbbf24":"#f87171", desc:reviewRate>=75?"Excellent":reviewRate>=40?"In progress":"Needs attention" },
              { label:"Submission Rate",  value:Math.min(100, stats.submissions_total&&stats.teams_total ? Math.round((stats.submissions_total/stats.teams_total)*100) : 0), color:"#60a5fa", desc:"Submissions per team" },
              { label:"Judge Coverage",   value:Math.min(100, stats.judges_total&&stats.events_total ? Math.round((stats.judges_total/stats.events_total)*10) : 0), color:"#fbbf24", desc:"Judges per event" },
              { label:"Events Live",      value:Math.min(100, stats.events_total ? Math.round(((stats.events_live||0)/stats.events_total)*100) : 0), color:"#4ade80", desc:`${fmt(stats.events_live)} of ${fmt(stats.events_total)} running` },
            ].map(h=>(
              <div key={h.label} className="dp-health-card">
                <div className="dp-health-top">
                  <span className="dp-health-label">{h.label}</span>
                  <span className="dp-health-val" style={{color:h.color}}>{h.value}%</span>
                </div>
                <div className="dp-health-track">
                  <div className="dp-health-fill" style={{width:`${h.value}%`,background:h.color}}/>
                </div>
                <div className="dp-health-desc">{h.desc}</div>
              </div>
            ))}
          </div>
        </section>

      </div>

      <style jsx>{`
        .dp{min-height:100vh;background:#0c0c0f;color:#f0f0f3;font-family:'DM Sans',sans-serif}
        .dp-wrap{max-width:1280px;margin:0 auto;padding:36px 32px 80px;animation:dpIn .35s ease both}
        @keyframes dpIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

        /* Section heads */
        .dp-section-head{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:16px}
        .dp-sh-label{font-size:10.5px;font-weight:700;color:#3a3a48;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
        .dp-sh-title{font-family:'Syne',sans-serif;font-size:17px;font-weight:700;color:#f0f0f3;letter-spacing:-.3px}
        .dp-sh-link{font-size:12px;font-weight:600;color:#6EE7B7;text-decoration:none;opacity:.8;transition:opacity .15s;flex-shrink:0}
        .dp-sh-link:hover{opacity:1}
        .dp-col-lbl{font-size:10.5px;font-weight:700;color:#3a3a48;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}

        /* Header */
        .dp-header{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid #1e1e24}
        .dp-eyebrow{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#6EE7B7;margin-bottom:8px}
        .dp-pulse-dot{width:6px;height:6px;border-radius:50%;background:#4ade80;flex-shrink:0;animation:dpPulse 2s ease-in-out infinite}
        @keyframes dpPulse{0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.4)}50%{box-shadow:0 0 0 5px rgba(74,222,128,0)}}
        .dp-title{font-family:'Syne',sans-serif;font-size:26px;font-weight:700;color:#f0f0f3;margin:0 0 5px;letter-spacing:-.5px;line-height:1.2}
        .dp-sub{font-size:13px;color:#5c5c6e;margin:0}
        .dp-header-right{display:flex;flex-direction:column;align-items:flex-end;gap:10px;flex-shrink:0}
        .dp-header-btns {
  display: flex;
  gap: 10px;
}

.dp-btn-ghost {
  padding: 8px 18px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  background: transparent;
  border: 1px solid #26262e;
  color: #5c5c6e;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dp-btn-ghost:hover {
  border-color: rgba(110, 231, 183, 0.4);
  color: #6EE7B7;
  transform: translateY(-1px);
}

.dp-btn-primary {
  padding: 8px 18px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  background: #6EE7B7;
  border: 1px solid #4fb88b;
  color: #0c0c0f;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.dp-btn-primary:hover {
  background: #86efac;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(110, 231, 183, 0.25);
}
        .dp-role-pill{font-size:11px;font-weight:700;padding:4px 12px;border-radius:100px;letter-spacing:.3px}
        .dp-rp-org{background:rgba(110,231,183,.1);color:#6EE7B7;border:1px solid rgba(110,231,183,.2)}
        .dp-rp-judge{background:rgba(251,191,36,.1);color:#fbbf24;border:1px solid rgba(251,191,36,.25)}
        .dp-rp-hacker{background:rgba(96,165,250,.1);color:#60a5fa;border:1px solid rgba(96,165,250,.2)}
        .dp-error{display:flex;align-items:center;gap:8px;background:rgba(248,113,113,.07);border:1px solid rgba(248,113,113,.2);color:#fca5a5;padding:11px 14px;border-radius:10px;font-size:13px;margin-bottom:20px}

        /* Hero stats */
        .dp-hero-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}
        .dp-hstat{position:relative;overflow:hidden;background:#111114;border:1px solid #1e1e24;border-radius:16px;padding:22px 20px 20px;text-decoration:none;color:inherit;display:block;transition:border-color .18s,transform .18s,box-shadow .18s}
        .dp-hstat:hover{border-color:color-mix(in srgb,var(--sa) 35%,transparent);transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,.3)}
        .dp-hstat-top{display:flex;align-items:center;gap:10px;margin-bottom:16px}
        .dp-hstat-icon{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .dp-hstat-label{font-size:11.5px;font-weight:600;color:#5c5c6e;flex:1;text-transform:uppercase;letter-spacing:.5px}
        .dp-hstat-arr{color:#3a3a48;opacity:0;transition:opacity .15s,transform .15s}
        .dp-hstat:hover .dp-hstat-arr{opacity:1;transform:translateX(3px)}
        .dp-hstat-val{font-family:'Syne',sans-serif;font-size:36px;font-weight:800;color:#f0f0f3;letter-spacing:-2px;line-height:1;margin-bottom:14px}
        .dp-hstat-subs{display:flex;gap:14px;flex-wrap:wrap;padding-top:12px;border-top:1px solid #1e1e24}
        .dp-hstat-sub{display:flex;align-items:center;gap:5px}
        .dp-hstat-sub-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
        .dp-hstat-sub-v{font-family:'Syne',sans-serif;font-size:13px;font-weight:700}
        .dp-hstat-sub-l{font-size:11px;color:#5c5c6e}
        .dp-hstat-bar{position:absolute;bottom:0;left:0;right:0;height:2px;opacity:0;transition:opacity .18s}
        .dp-hstat:hover .dp-hstat-bar{opacity:.6}

        /* Body - Two column layout */
        .dp-body{display:grid;grid-template-columns:1fr 1.4fr;gap:16px;margin-bottom:20px;align-items:start}
        .dp-charts-col{display:flex;flex-direction:column;gap:11px}
        .dp-chart-card{background:#111114;border:1px solid #1e1e24;border-radius:14px;padding:18px 20px;transition:border-color .15s}
        .dp-chart-card:hover{border-color:#26262e}
        .dp-chart-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}
        .dp-chart-title{font-family:'Syne',sans-serif;font-size:13.5px;font-weight:700;color:#f0f0f3;margin-bottom:2px;letter-spacing:-.2px}
        .dp-chart-sub{font-size:11px;color:#5c5c6e}
        .dp-chart-dot{width:8px;height:8px;border-radius:50%;margin-top:3px;flex-shrink:0}
        .dp-spark{width:100%;height:56px;display:block}
        .dp-no-data{font-size:12px;color:#3a3a48;height:56px;display:flex;align-items:center}
        
        /* Right column */
        .dp-right-col{display:flex;flex-direction:column;gap:16px;height:100%}
        
        /* Activity Panel */
        .dp-panel{background:#111114;border:1px solid #1e1e24;border-radius:16px;overflow:hidden;flex:1}
        .dp-tabs{display:flex;border-bottom:1px solid #1e1e24;background:#0c0c0f;padding:0 16px}
        .dp-tab{display:flex;align-items:center;gap:6px;padding:13px 14px;font-size:12.5px;font-weight:600;font-family:'DM Sans',sans-serif;color:#5c5c6e;background:transparent;border:none;border-bottom:2px solid transparent;margin-bottom:-1px;cursor:pointer;transition:color .15s;white-space:nowrap}
        .dp-tab:hover{color:#f0f0f3}
        .dp-tab-on{color:#6EE7B7;border-bottom-color:#6EE7B7}
        .dp-tab-ct{font-size:10px;font-weight:700;padding:1px 6px;border-radius:100px;background:#17171b;color:#5c5c6e}
        .dp-tab-on .dp-tab-ct{background:rgba(110,231,183,.1);color:#6EE7B7}
        .dp-list{display:flex;flex-direction:column;max-height:380px;overflow-y:auto}
        .dp-list::-webkit-scrollbar{width:3px}
        .dp-list::-webkit-scrollbar-thumb{background:#26262e;border-radius:2px}
        .dp-row{display:flex;align-items:center;gap:11px;padding:12px 18px;transition:background .1s}
        .dp-row:hover{background:rgba(255,255,255,.02)}
        .dp-row+.dp-row{border-top:1px solid #1e1e24}
        .dp-row-ico{width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .dp-ico-mint{background:rgba(110,231,183,.08);border:1px solid rgba(110,231,183,.15)}
        .dp-ico-blue{background:rgba(96,165,250,.08);border:1px solid rgba(96,165,250,.15)}
        .dp-row-rank{font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:#3a3a48;min-width:22px;flex-shrink:0}
        .dp-row-avi{width:26px;height:26px;border-radius:7px;background:rgba(110,231,183,.1);border:1px solid rgba(110,231,183,.2);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:#6EE7B7;flex-shrink:0}
        .dp-row-body{flex:1;min-width:0}
        .dp-row-title{font-size:13px;font-weight:600;color:#f0f0f3;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .dp-row-meta{font-size:11px;color:#5c5c6e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .dp-row-time{font-size:10.5px;color:#6EE7B7;white-space:nowrap;flex-shrink:0;font-weight:600}
        .dp-row-pills{display:flex;flex-direction:column;gap:4px;align-items:flex-end;flex-shrink:0}
        .dp-pill{font-size:10px;padding:3px 8px;border-radius:100px;background:rgba(110,231,183,.07);border:1px solid rgba(110,231,183,.18);color:#6EE7B7;white-space:nowrap;font-weight:600}
        .dp-pill-blue{background:rgba(96,165,250,.07);border-color:rgba(96,165,250,.2);color:#60a5fa}
        .dp-pill-purple{background:rgba(167,139,250,.07);border-color:rgba(167,139,250,.2);color:#a78bfa}
        .dp-empty{font-size:13px;color:#3a3a48;padding:22px 18px}

        /* Profile Card - Clickable, matches activity panel width */
        .dp-profile-card{background:#111114;border:1px solid #1e1e24;border-radius:16px;padding:20px 24px;display:flex;align-items:center;gap:18px;cursor:pointer;transition:all 0.2s ease}
        .dp-profile-card:hover{border-color:rgba(110,231,183,.3);transform:translateY(-2px);background:#151519}
        .dp-profile-avi{width:52px;height:52px;border-radius:50%;flex-shrink:0;background:rgba(110,231,183,.1);border:2px solid rgba(110,231,183,.2);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:20px;font-weight:700;color:#6EE7B7;overflow:hidden}
        .dp-profile-avi img{width:100%;height:100%;object-fit:cover}
        .dp-profile-body{flex:1;min-width:0;display:flex;align-items:center;justify-content:space-between;gap:16px}
        .dp-profile-meta{flex:1;min-width:0}
        .dp-profile-name{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:#f0f0f3;margin-bottom:3px;letter-spacing:-.2px}
        .dp-profile-email{font-size:11.5px;color:#5c5c6e;margin-bottom:8px}
        .dp-profile-badges{display:flex;gap:6px;flex-wrap:wrap}
        .dp-badge{font-size:10px;font-weight:600;padding:2px 10px;border-radius:100px}
        .dp-badge-mint{background:rgba(110,231,183,.1);color:#6EE7B7;border:1px solid rgba(110,231,183,.2)}
        .dp-badge-gold{background:rgba(251,191,36,.1);color:#fbbf24;border:1px solid rgba(251,191,36,.25)}
        .dp-badge-amber{background:rgba(245,158,11,.1);color:#f59e0b;border:1px solid rgba(245,158,11,.25)}
        .dp-profile-arrow{color:#3a3a48;opacity:0;transition:opacity 0.2s ease}
        .dp-profile-card:hover .dp-profile-arrow{opacity:1;transform:translateX(3px);color:#6EE7B7}

        /* Leaderboard */
        .dp-lb-section{margin-bottom:20px}
        .dp-lb-table{background:#111114;border:1px solid #1e1e24;border-radius:16px;overflow:hidden}
        .dp-lb-thead{display:grid;grid-template-columns:56px 1fr 1fr 80px 90px 100px;padding:10px 20px;border-bottom:1px solid #1e1e24;background:#0c0c0f}
        .dp-lb-th{font-size:10.5px;font-weight:700;color:#3a3a48;text-transform:uppercase;letter-spacing:.6px}
        .dp-lb-tc{text-align:center;justify-content:center}
        .dp-lb-tr{text-align:right}
        .dp-lb-row{display:grid;grid-template-columns:56px 1fr 1fr 80px 90px 100px;align-items:center;padding:13px 20px;border-bottom:1px solid #1e1e24;transition:background .1s}
        .dp-lb-row:last-child{border-bottom:none}
        .dp-lb-row:hover{background:rgba(255,255,255,.02)}
        .dp-lb-podium{background:rgba(110,231,183,.02)}
        .dp-lb-podium:hover{background:rgba(110,231,183,.04)}
        .dp-lb-td{display:flex;align-items:center}
        .dp-lb-team{gap:10px}
        .dp-lb-event{font-size:12.5px;color:#5c5c6e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .dp-lb-medal{font-size:18px;margin:0 auto}
        .dp-lb-num{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:#3a3a48;margin:0 auto}
        .dp-lb-avi{width:30px;height:30px;border-radius:9px;background:rgba(110,231,183,.1);border:1px solid rgba(110,231,183,.2);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:#6EE7B7;flex-shrink:0}
        .dp-lb-gold{background:rgba(251,191,36,.15);border-color:rgba(251,191,36,.3);color:#fbbf24}
        .dp-lb-silver{background:rgba(148,163,184,.15);border-color:rgba(148,163,184,.3);color:#94a3b8}
        .dp-lb-bronze{background:rgba(180,120,60,.15);border-color:rgba(180,120,60,.3);color:#cd7f32}
        .dp-lb-name{font-size:13.5px;font-weight:600;color:#f0f0f3;margin-bottom:2px}
        .dp-lb-ptag{font-size:10px;font-weight:700;padding:1px 7px;border-radius:100px;display:inline-block}
        .dp-lb-p1{background:rgba(251,191,36,.12);color:#fbbf24;border:1px solid rgba(251,191,36,.25)}
        .dp-lb-p2{background:rgba(148,163,184,.1);color:#94a3b8;border:1px solid rgba(148,163,184,.2)}
        .dp-lb-p3{background:rgba(180,120,60,.12);color:#cd7f32;border:1px solid rgba(180,120,60,.25)}
        .dp-lb-score{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:#5c5c6e;margin-left:auto}
        .dp-lb-stop{color:#6EE7B7}
        .dp-lb-pill{font-size:11px;font-weight:600;padding:3px 10px;border-radius:100px;background:#17171b;border:1px solid #26262e;color:#888;margin-left:auto}
        .dp-lb-time{font-size:11px;color:#5c5c6e;margin-left:auto}
        .dp-lb-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:52px 20px;color:#3a3a48;text-align:center}
        .dp-lb-empty-h{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:#5c5c6e;margin:12px 0 6px}
        .dp-lb-empty-s{font-size:12.5px;color:#3a3a48;max-width:300px;line-height:1.6}

        /* Health Section */
        .dp-health-section{margin-bottom:0}
        .dp-health-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
        .dp-health-card{background:#111114;border:1px solid #1e1e24;border-radius:14px;padding:18px;transition:border-color .15s}
        .dp-health-card:hover{border-color:#26262e}
        .dp-health-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px}
        .dp-health-label{font-size:11.5px;font-weight:600;color:#5c5c6e;text-transform:uppercase;letter-spacing:.4px}
        .dp-health-val{font-family:'Syne',sans-serif;font-size:20px;font-weight:700;letter-spacing:-1px}
        .dp-health-track{height:4px;background:#1e1e24;border-radius:2px;overflow:hidden;margin-bottom:7px}
        .dp-health-fill{height:100%;border-radius:2px;transition:width .6s cubic-bezier(.16,1,.3,1)}
        .dp-health-desc{font-size:11px;color:#5c5c6e}

        /* Responsive */
        @media(max-width:1100px){.dp-hero-stats{grid-template-columns:repeat(2,1fr)}.dp-body{grid-template-columns:1fr}.dp-health-grid{grid-template-columns:repeat(2,1fr)}.dp-lb-thead,.dp-lb-row{grid-template-columns:50px 1fr 1fr 80px 80px}}
        @media(max-width:768px){.dp-wrap{padding:24px 20px 60px}.dp-header{flex-direction:column}.dp-header-right{align-items:flex-start}.dp-header-btns{width:100%}.dp-btn-ghost,.dp-btn-primary{flex:1;text-align:center;justify-content:center}.dp-hero-stats{grid-template-columns:repeat(2,1fr)}.dp-health-grid{grid-template-columns:repeat(2,1fr)}.dp-lb-thead,.dp-lb-row{grid-template-columns:44px 1fr 70px 80px}.dp-lb-th:nth-child(3),.dp-lb-td:nth-child(3){display:none}}
        @media(max-width:520px){.dp-hero-stats{grid-template-columns:1fr}.dp-hstat-val{font-size:28px}.dp-health-grid{grid-template-columns:repeat(2,1fr)}}
      `}</style>
    </div>
  );
}
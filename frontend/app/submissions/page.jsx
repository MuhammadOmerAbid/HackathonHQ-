"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "../../utils/axios";
import SubmissionCard from "../../components/submissions/SubmissionCard";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function SubmissionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams?.get("event") || "";
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, pending: 0, reviewed: 0, winners: 0 });
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [eventInfo, setEventInfo] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (eventId) params.set("event", eventId);
      const res = await axios.get(`/submissions/stats/?${params.toString()}`);
      setStats(res.data || { total: 0, pending: 0, reviewed: 0, winners: 0 });
    } catch (err) {
      console.error("Error fetching submission stats:", err);
    }
  }, [eventId]);

  const fetchData = useCallback(async (withLoading = true) => {
    try {
      if (withLoading) setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(pageSize));
      if (searchTerm) params.set("q", searchTerm);
      if (filter && filter !== "all") params.set("filter", filter);
      if (eventId) params.set("event", eventId);
      params.set("expand", "event,team,team.members");
      const [submissionsRes, userRes] = await Promise.all([
        axios.get(`/submissions/?${params.toString()}`),
        axios.get("/users/me/").catch(() => null)
      ]);
      const list = submissionsRes.data.results || submissionsRes.data || [];
      setSubmissions(list);
      setTotalCount(submissionsRes.data.count ?? list.length);
      setUser(userRes?.data || null);
    } catch (err) {
      console.error("Error fetching submissions:", err);
    } finally {
      if (withLoading) setLoading(false);
    }
  }, [page, pageSize, searchTerm, filter, eventId]);
  
  useEffect(() => {
    fetchData(true);
    fetchStats();
  }, [fetchData, fetchStats]);

  useEffect(() => {
    if (searchParams?.get("refresh") === "1") {
      fetchData(false);
      fetchStats();
      const params = new URLSearchParams(searchParams.toString());
      params.delete("refresh");
      const qs = params.toString();
      router.replace(qs ? `/submissions?${qs}` : "/submissions");
    }
  }, [searchParams, router, fetchData, fetchStats]);

  useEffect(() => {
    const handleFocus = () => {
      fetchData(false);
      fetchStats();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchData(false);
        fetchStats();
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchData, fetchStats]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filter, eventId]);

  useEffect(() => {
    if (!eventId) {
      setEventInfo(null);
      return;
    }
    let active = true;
    const token = localStorage.getItem("access");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    axios.get(`/events/${eventId}/`)
      .then((res) => {
        if (active) setEventInfo(res.data);
      })
      .catch(() => {
        if (active) setEventInfo({ id: eventId, name: `Event #${eventId}` });
      });
    return () => { active = false; };
  }, [eventId]);

  const getStatus = (sub) => {
    if (sub.is_winner)   return { text: "Winner",   cls: "winner"   };
    if (sub.is_reviewed) return { text: "Reviewed", cls: "reviewed" };
    return                      { text: "Pending",  cls: "pending"  };
  };

  if (loading) return <LoadingSpinner message="Loading submissions…" />;

  const total    = stats.total || totalCount || submissions.length;
  const pending  = stats.pending || 0;
  const reviewed = stats.reviewed || 0;
  const winners  = stats.winners || 0;

  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / pageSize));

  return (
    <div className="sub-page">

      {/* ── HEADER ── */}
      <div className="sub-header">
        <div>
          <div className="sub-eyebrow">
            <span className="sub-eyebrow-dot" />
            <span className="sub-eyebrow-label">Projects</span>
          </div>
          <h1 className="sub-title">Submissions</h1>
          <p className="sub-subtitle">Explore projects from hackathon participants</p>
        </div>
        <div className="sub-header-right">
          {user && (
            <button 
              onClick={() => router.push(eventId ? `/submissions/create?event=${eventId}` : '/submissions/create')} 
              className="sub-btn-primary"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>New Submission</span>
            </button>
          )}
          <button
            onClick={() => setViewMode(v => v === "grid" ? "list" : "grid")}
            className="sub-btn-ghost"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {viewMode === "grid"
                ? <path d="M4 6h16M4 12h16M4 18h16"/>
                : <path d="M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM10 10h4v4h-4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h4v4h-4zM16 16h4v4h-4z"/>
              }
            </svg>
            {viewMode === "grid" ? "List" : "Grid"}
          </button>
        </div>
      </div>
      {eventId && (
        <div className="sub-event-filter">
          <span className="sub-filter-label">Filtered by event:</span>
          <span className="sub-filter-chip">{eventInfo?.name || `Event #${eventId}`}</span>
          <button
            className="sub-filter-clear"
            onClick={() => router.push("/submissions")}
          >
            Clear
          </button>
        </div>
      )}

      <div className="sub-stats">
        {[
          {
            value: total, label: "Total Projects",
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><polygon points="12 2 22 7 22 17 12 22 2 17 2 7 12 2"/><line x1="12" y1="22" x2="12" y2="12"/><polyline points="22 7 12 12 2 7"/></svg>
          },
          {
            value: pending, label: "Pending",
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          },
          {
            value: reviewed, label: "Reviewed",
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          },
          {
            value: winners, label: "Winners", accent: true,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
          },
        ].map((s, i) => (
          <div className="sub-stat-card" key={i}>
            <div className="sub-stat-icon">{s.icon}</div>
            <div className="sub-stat-body">
              <div className={`sub-stat-value${s.accent ? " accent" : ""}`}>{s.value}</div>
              <div className="sub-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── TOOLBAR ── */}
      <div className="sub-toolbar">
        <div className="sub-search-wrap">
          <svg className="sub-search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="sub-search"
            placeholder="Search projects…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sub-filters">
          {["all","pending","reviewed","winning"].map(f => (
            <button
              key={f}
              className={`sub-filter-btn${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "winning" ? "Winners" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      {submissions.length === 0 ? (
        <div className="sub-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="12 2 22 7 22 17 12 22 2 17 2 7 12 2"/>
            <line x1="12" y1="22" x2="12" y2="12"/>
            <polyline points="22 7 12 12 2 7"/>
          </svg>
          <h3>No submissions found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="sub-grid">
          {submissions.map(s => <SubmissionCard key={s.id} submission={s} />)}
        </div>
      ) : (
        <div className="sub-list">
          <table className="sub-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Team</th>
                <th>Event</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(sub => {
                const status = getStatus(sub);
                return (
                  <tr key={sub.id} onClick={() => router.push(`/submissions/${sub.id}`)} className="sub-table-row">
                    <td className="sub-table-title">{sub.title || "Untitled"}</td>
                    <td>
                      {sub.team_name || sub.team?.name || "—"}
                      {sub.team_details?.members?.length > 0 && (
                        <span className="sub-table-meta">({sub.team_details.members.length} members)</span>
                      )}
                    </td>
                    <td>
                      {sub.event_name || sub.event?.name || "—"}
                      {sub.event?.start_date && (
                        <span className="sub-table-meta">{new Date(sub.event.start_date).toLocaleDateString()}</span>
                      )}
                    </td>
                    <td>
                      <span className={`sub-table-badge sub-badge-${status.cls}`}>{status.text}</span>
                    </td>
                    <td>{new Date(sub.created_at || Date.now()).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="sub-pagination">
          <button
            className="sub-page-btn"
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span className="sub-page-info">
            Page {page} of {totalPages}
          </span>
          <button
            className="sub-page-btn"
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}

      <style jsx>{`
        /* ── Page shell ── */
        .sub-page {
          max-width: 1280px;
          margin: 0 auto;
          padding: 36px 32px 64px;
          font-family: 'DM Sans', sans-serif;
          min-height: calc(100vh - 70px);
        }

        /* ── Header ── */
        .sub-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 32px;
          gap: 20px;
        }
        .sub-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .sub-eyebrow-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #6EE7B7;
        }
        .sub-eyebrow-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #6EE7B7;
        }
        .sub-title {
          font-family: 'Syne', sans-serif;
          font-size: 30px;
          font-weight: 700;
          color: #f0f0f3;
          letter-spacing: -0.5px;
          line-height: 1.1;
          margin: 0;
        }
        .sub-subtitle {
          font-size: 14px;
          color: #5c5c6e;
          margin-top: 6px;
          line-height: 1.6;
        }
        .sub-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        /* ── Buttons (fully rounded style) ── */
.sub-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem 0.6rem 1rem;
  background: #6EE7B7;
  border: 1px solid #4fb88b;
  border-radius: 100px;  /* This makes it fully rounded */
  color: #0c0c0f;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1.4;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(110, 231, 183, 0.2);
}

.sub-btn-primary:hover {
  background: #86efac;
  border-color: #3a9e75;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(110, 231, 183, 0.3);
}

.sub-btn-primary svg {
  width: 18px;
  height: 18px;
  display: block;
  flex-shrink: 0;
  stroke: #0c0c0f;
}
        /* ── Ghost Button (for List/Grid toggle) ── */
.sub-btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 100px;  /* Same rounded style as primary button */
  color: #fff;
  font-size: 0.9rem;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1.4;
  white-space: nowrap;
  backdrop-filter: blur(5px);
}

.sub-btn-ghost:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #6EE7B7;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(110, 231, 183, 0.15);
}

.sub-btn-ghost svg {
  width: 18px;
  height: 18px;
  display: block;
  flex-shrink: 0;
  stroke: currentColor;
  transition: transform 0.2s ease;
}

.sub-btn-ghost:hover svg {
  stroke: #6EE7B7;
  transform: scale(1.05);
}

        /* ── Stat cards ── */

.sub-event-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 8px 0 20px;
  padding: 10px 14px;
  background: #111114;
  border: 1px solid #1e1e24;
  border-radius: 12px;
}
.sub-filter-label {
  font-size: 12px;
  color: #888;
}
.sub-filter-chip {
  font-size: 12px;
  font-weight: 600;
  color: #0c0c0f;
  background: #6EE7B7;
  padding: 4px 10px;
  border-radius: 999px;
}
.sub-filter-clear {
  margin-left: auto;
  font-size: 12px;
  color: #5c5c6e;
  background: transparent;
  border: 1px solid #26262e;
  border-radius: 999px;
  padding: 4px 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.sub-filter-clear:hover {
  color: #f0f0f3;
  border-color: #3a3a48;
  background: #17171b;
}

.sub-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 28px;
        }
        .sub-stat-card {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 14px;
          padding: 20px 22px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: all 0.2s ease;
        }
        .sub-stat-card:hover {
          border-color: rgba(110,231,183,0.3);
          background: #17171b;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        }
        .sub-stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 11px;
          background: rgba(110,231,183,0.08);
          border: 1px solid rgba(110,231,183,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #6EE7B7;
        }
        .sub-stat-icon svg {
          width: 20px;
          height: 20px;
          stroke: #6EE7B7;
        }
        .sub-stat-body {}
        .sub-stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: #f0f0f3;
          letter-spacing: -1px;
          line-height: 1;
          margin-bottom: 4px;
        }
        .sub-stat-value.accent { color: #6EE7B7; }
        .sub-stat-label {
          font-size: 11px;
          font-weight: 500;
          color: #5c5c6e;
          text-transform: uppercase;
          letter-spacing: 0.7px;
        }

        /* ── Toolbar ── */
.sub-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.sub-search-wrap {
  position: relative;
  flex: 1;
  max-width: 360px;
}
.sub-search-ico {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  color: #3a3a48;
  pointer-events: none;
  width: 16px;
  height: 16px;
}
.sub-search {
  width: 100%;
  padding: 9px 14px 9px 36px;
  background: #111114;
  border: 1px solid #1e1e24;
  border-radius: 100px;  /* Changed from 10px to 100px for circular shape */
  font-size: 13.5px;
  color: #f0f0f3;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  transition: border-color .15s;
}
.sub-search:focus { 
  border-color: rgba(110,231,183,0.4); 
}
.sub-search::placeholder { 
  color: #3a3a48; 
}

/* ── Circular Filter Buttons ── */
.sub-filters {
  display: flex;
  gap: 4px;
  background: #111114;
  border: 1px solid #1e1e24;
  border-radius: 100px;  /* Makes the container circular */
  padding: 4px;
}
.sub-filter-btn {
  padding: 6px 16px;  /* Slightly wider padding for better proportions */
  border: none;
  border-radius: 100px;  /* Circular buttons */
  font-size: 12.5px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  color: #5c5c6e;
  background: transparent;
  cursor: pointer;
  transition: all .15s;
  white-space: nowrap;
}
.sub-filter-btn:hover { 
  color: #f0f0f3; 
  background: #17171b; 
}
.sub-filter-btn.active { 
  background: #6EE7B7; 
  color: #0c0c0f; 
  font-weight: 600; 
}

        /* ── Grid ── */
        .sub-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
          animation: fadeIn 0.4s ease;
        }

        /* ── List / Table ── */
        .sub-list {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 14px;
          overflow: hidden;
          animation: fadeIn 0.4s ease;
        }

        .sub-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 18px;
        }

        .sub-page-btn {
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid #26262e;
          background: transparent;
          color: #cbd5f5;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sub-page-btn:hover:not(:disabled) {
          border-color: #6EE7B7;
          color: #6EE7B7;
        }

        .sub-page-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .sub-page-info {
          font-size: 12px;
          color: #8b8b9b;
        }
        .sub-table {
          width: 100%;
          border-collapse: collapse;
        }
        .sub-table th {
          text-align: left;
          padding: 14px 20px;
          background: #0c0c0f;
          color: #5c5c6e;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.7px;
        }
        .sub-table td {
          padding: 14px 20px;
          color: #f0f0f3;
          font-size: 13px;
          border-top: 1px solid #1e1e24;
        }
        .sub-table-row { cursor: pointer; transition: background .15s; }
        .sub-table-row:hover td { background: #17171b; }
        .sub-table-title { color: #f0f0f3; font-weight: 500; }
        .sub-table-meta {
          font-size: 11px;
          color: #6EE7B7;
          margin-left: 6px;
          opacity: 0.75;
        }
        .sub-table-badge {
          display: inline-flex;
          padding: 2px 9px;
          border-radius: 100px;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.3px;
        }
        .sub-badge-winner  { background: rgba(251,191,36,0.12);  color: #fbbf24; border: 1px solid rgba(251,191,36,0.25); }
        .sub-badge-reviewed{ background: rgba(96,165,250,0.12);  color: #60a5fa; border: 1px solid rgba(96,165,250,0.25); }
        .sub-badge-pending { background: rgba(92,92,110,0.15);   color: #5c5c6e; border: 1px solid #26262e; }

        /* ── Empty ── */
        .sub-empty {
          padding: 56px 24px;
          text-align: center;
          color: #5c5c6e;
          font-size: 13px;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 14px;
          gap: 8px;
        }
        .sub-empty svg {
          width: 40px; height: 40px;
          color: #3a3a48;
          margin-bottom: 4px;
        }
        .sub-empty h3 {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #f0f0f3;
          margin: 0;
        }
        .sub-empty p { font-size: 13px; color: #5c5c6e; margin: 0; }

        /* ── Animation ── */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .sub-page { padding: 24px 20px 48px; }
.sub-stats { grid-template-columns: repeat(2, 1fr); }
          .sub-header { flex-direction: column; gap: 16px; }
        }
        @media (max-width: 600px) {
          .sub-page { padding: 20px 16px 48px; }
.sub-stats { grid-template-columns: 1fr 1fr; gap: 0.75rem; }
          .sub-stat-card { padding: 16px; gap: 10px; }
          .sub-stat-icon { width: 38px; height: 38px; }
          .sub-stat-value { font-size: 22px; }
          .sub-toolbar { flex-direction: column; align-items: stretch; }
          .sub-search-wrap { max-width: none; }
          .sub-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}











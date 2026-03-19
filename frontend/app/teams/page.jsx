"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "../../utils/axios";
import TeamCard from "../../components/teams/TeamCard";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function TeamsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams?.get("event") || "";
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, open: 0, full: 0, mine: 0 });
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const userCacheRef = useRef({});
  const [eventInfo, setEventInfo] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (eventId) params.set("event", eventId);
      const res = await axios.get(`/teams/stats/?${params.toString()}`);
      setStats(res.data || { total: 0, open: 0, full: 0, mine: 0 });
    } catch (err) {
      console.error("Error fetching team stats:", err);
    }
  }, [eventId]);

  const fetchData = useCallback(async (withLoading = true) => {
    try {
      if (withLoading) setLoading(true);
      const token = localStorage.getItem("access");
      if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        try {
          const userRes = await axios.get("/users/me/");
          setUser(userRes.data);
        } catch { setUser(null); }
      }
      
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(pageSize));
      if (searchTerm) params.set("q", searchTerm);
      if (filter && filter !== "all") params.set("filter", filter);
      if (eventId) params.set("event", eventId);
      const teamsRes = await axios.get(`/teams/?${params.toString()}`);
      const teamsData = teamsRes.data.results || teamsRes.data || [];
      setTotalCount(teamsRes.data.count ?? teamsData.length);
      
      // Fetch member details for all teams
      const memberIds = new Set();
      teamsData.forEach(team => {
        team.members?.forEach(member => {
          if (typeof member === 'number' || (typeof member === 'object' && member.id)) {
            const id = typeof member === 'number' ? member : member.id;
            memberIds.add(id);
          }
        });
      });
      
      // Fetch user details for all unique member IDs
      const cache = { ...userCacheRef.current };
      for (const id of memberIds) {
        if (!cache[id]) {
          try {
            const userRes = await axios.get(`/users/${id}/`);
            cache[id] = userRes.data;
          } catch (err) {
            console.error(`Failed to fetch user ${id}:`, err);
            cache[id] = { username: `User ${id}`, id };
          }
        }
      }
      userCacheRef.current = cache;
      
      // Enhance teams with full member objects
      const enhancedTeams = teamsData.map(team => ({
        ...team,
        members: team.members?.map(member => {
          const id = typeof member === 'number' ? member : member.id;
          return cache[id] || { username: `User ${id}`, id };
        }) || []
      }));
      
      setTeams(enhancedTeams);
    } catch (err) {
      console.error("Error fetching teams:", err);
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
      router.replace(qs ? `/teams?${qs}` : "/teams");
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

  const totalTeams  = stats.total || totalCount || teams.length;
  const openTeams   = stats.open || 0;
  const fullTeams   = stats.full || 0;
  const myTeams     = stats.mine || 0;

  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / pageSize));

  const handleCreateClick = () => {
    const createHref = eventId ? `/teams/create?event=${eventId}` : "/teams/create";
    const token = localStorage.getItem("access");
    if (!token) {
      router.push(`/login?redirect=${encodeURIComponent(createHref)}&message=Please login to create a team`);
    } else {
      router.push(createHref);
    }
  };

  if (loading) return <LoadingSpinner message="Loading teams…" />;

  return (
    <>
      <style jsx>{`
        /* ── Stat cards ── */
        .tp-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 28px;
        }
        .tp-stat-card {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 14px;
          padding: 20px 22px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: all 0.2s ease;
          cursor: default;
        }
        .tp-stat-card:hover {
          border-color: rgba(110,231,183,0.3);
          background: #17171b;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        }
        .tp-stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 11px;
          background: rgba(110,231,183,0.08);
          border: 1px solid rgba(110,231,183,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .tp-stat-icon svg {
          width: 20px;
          height: 20px;
          color: #6EE7B7;
        }
        .tp-stat-icon.warn {
          background: rgba(251,191,36,0.08);
          border-color: rgba(251,191,36,0.15);
        }
        .tp-stat-icon.warn svg { color: #fbbf24; }
        .tp-stat-icon.danger {
          background: rgba(248,113,113,0.08);
          border-color: rgba(248,113,113,0.15);
        }
        .tp-stat-icon.danger svg { color: #f87171; }
        .tp-stat-icon.neutral {
          background: rgba(92,92,110,0.1);
          border-color: rgba(92,92,110,0.2);
        }
        .tp-stat-icon.neutral svg { color: #5c5c6e; }
        .tp-stat-body {}
        .tp-stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: #f0f0f3;
          letter-spacing: -1px;
          line-height: 1;
          margin-bottom: 4px;
        }
        .tp-stat-value.accent { color: #6EE7B7; }
        .tp-stat-value.warn   { color: #fbbf24; }
        .tp-stat-value.danger { color: #f87171; }
        .tp-stat-label {
          font-size: 11px;
          font-weight: 500;
          color: #5c5c6e;
          text-transform: uppercase;
          letter-spacing: 0.7px;
        }

        /* ── Toolbar ── */
        .tm-event-filter {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 8px 0 20px;
          padding: 10px 14px;
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 12px;
        }
        .tm-filter-label {
          font-size: 12px;
          color: #888;
        }
        .tm-filter-chip {
          font-size: 12px;
          font-weight: 600;
          color: #0c0c0f;
          background: #6EE7B7;
          padding: 4px 10px;
          border-radius: 999px;
        }
        .tm-filter-clear {
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
        .tm-filter-clear:hover {
          color: #f0f0f3;
          border-color: #3a3a48;
          background: #17171b;
        }
.tm-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.tm-search-wrap {
  position: relative;
  flex: 1;
  max-width: 360px;
}

.tm-search-ico {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  color: #3a3a48;
  pointer-events: none;
  width: 16px;
  height: 16px;
}

.tm-search {
  width: 100%;
  padding: 9px 14px 9px 36px;
  background: #111114;
  border: 1px solid #1e1e24;
  border-radius: 100px;  /* Circular search bar */
  font-size: 13.5px;
  color: #f0f0f3;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  transition: border-color .15s;
}

.tm-search:focus { 
  border-color: rgba(110,231,183,0.4); 
}

.tm-search::placeholder { 
  color: #3a3a48; 
}

/* ── Circular Filter Buttons ── */
.tm-filters {
  display: flex;
  gap: 4px;
  background: #111114;
  border: 1px solid #1e1e24;
  border-radius: 100px;  /* Makes the container circular */
  padding: 4px;
}

.tm-filter-btn {
  padding: 6px 16px;
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

.tm-filter-btn:hover { 
  color: #f0f0f3; 
  background: #17171b; 
}

.tm-filter-btn.active { 
  background: #6EE7B7; 
  color: #0c0c0f; 
  font-weight: 600; 
}

/* ── Ghost Button for View Toggle ── */
.tm-btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 100px;  /* Circular shape */
  color: #fff;
  font-size: 0.9rem;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  backdrop-filter: blur(5px);
}

.tm-btn-ghost:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #6EE7B7;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(110, 231, 183, 0.15);
}

.tm-btn-ghost svg {
  width: 18px;
  height: 18px;
  display: block;
  flex-shrink: 0;
  stroke: currentColor;
  transition: transform 0.2s ease;
}

.tm-btn-ghost:hover svg {
  stroke: #6EE7B7;
  transform: scale(1.05);
}

/* ── List View Styles ── */
.tm-list-view {
  background: #111114;
  border: 1px solid #1e1e24;
  border-radius: 14px;
  overflow: hidden;
  animation: fadeIn 0.4s ease;
}

.tm-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 18px;
}

.tm-page-btn {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid #26262e;
  background: transparent;
  color: #cbd5f5;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tm-page-btn:hover:not(:disabled) {
  border-color: #6EE7B7;
  color: #6EE7B7;
}

.tm-page-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.tm-page-info {
  font-size: 12px;
  color: #8b8b9b;
}

.tm-table {
  width: 100%;
  border-collapse: collapse;
}

.tm-table th {
  text-align: left;
  padding: 14px 20px;
  background: #0c0c0f;
  color: #5c5c6e;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.7px;
}

.tm-table td {
  padding: 14px 20px;
  color: #f0f0f3;
  font-size: 13px;
  border-top: 1px solid #1e1e24;
}

.tm-table-row { 
  cursor: pointer; 
  transition: background .15s; 
}

.tm-table-row:hover td { 
  background: #17171b; 
}

.tm-table-title { 
  color: #f0f0f3; 
  font-weight: 500; 
}

.tm-table-members-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tm-table-members-count {
  display: inline-block;
  background: rgba(110,231,183,0.1);
  color: #6EE7B7;
  padding: 2px 8px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
  min-width: 50px;
  text-align: center;
}

.tm-table-avatars {
  display: flex;
  align-items: center;
}

.tm-table-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: #0c0c0f;
  margin-right: -8px;
  border: 2px solid #111114;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  backdrop-filter: blur(2px);
  overflow: hidden;
}
 .tm-table-avatar img {
   width: 100%;
   height: 100%;
   object-fit: cover;
 }

/* Green variations with opacity */
.tm-table-avatar[data-letter="A"],
.tm-table-avatar[data-letter="B"],
.tm-table-avatar[data-letter="C"] { background: rgba(110, 231, 183, 0.9); }

.tm-table-avatar[data-letter="D"],
.tm-table-avatar[data-letter="E"],
.tm-table-avatar[data-letter="F"] { background: rgba(110, 231, 183, 0.8); }

.tm-table-avatar[data-letter="G"],
.tm-table-avatar[data-letter="H"],
.tm-table-avatar[data-letter="I"] { background: rgba(110, 231, 183, 0.7); }

.tm-table-avatar[data-letter="J"],
.tm-table-avatar[data-letter="K"],
.tm-table-avatar[data-letter="L"] { background: rgba(110, 231, 183, 0.6); }

.tm-table-avatar[data-letter="M"],
.tm-table-avatar[data-letter="N"],
.tm-table-avatar[data-letter="O"] { background: rgba(110, 231, 183, 0.9); }

.tm-table-avatar[data-letter="P"],
.tm-table-avatar[data-letter="Q"],
.tm-table-avatar[data-letter="R"] { background: rgba(110, 231, 183, 0.8); }

.tm-table-avatar[data-letter="S"],
.tm-table-avatar[data-letter="T"],
.tm-table-avatar[data-letter="U"] { background: rgba(110, 231, 183, 0.7); }

.tm-table-avatar[data-letter="V"],
.tm-table-avatar[data-letter="W"],
.tm-table-avatar[data-letter="X"] { background: rgba(110, 231, 183, 0.6); }

.tm-table-avatar[data-letter="Y"],
.tm-table-avatar[data-letter="Z"] { background: rgba(110, 231, 183, 0.9); }

/* Fallback for any other characters */
.tm-table-avatar:not([data-letter]) {
  background: rgba(110, 231, 183, 0.5);
}

/* More avatar (the +X one) stays subtle */
.tm-table-avatar.more {
  background: #26262e;
  color: #9ca3af;
  font-size: 10px;
  border: 2px solid #111114;
}

.tm-table-no-members {
  font-size: 11px;
  color: #5c5c6e;
  font-style: italic;
}

.tm-table-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
}

.tm-table-badge.open {
  background: rgba(110,231,183,0.15);
  color: #6EE7B7;
  border: 1px solid rgba(110,231,183,0.3);
}

.tm-table-badge.full {
  background: rgba(248,113,113,0.15);
  color: #f87171;
  border: 1px solid rgba(248,113,113,0.3);
}

.tm-table-leader {
  color: #f0f0f3;
  font-weight: 500;
  font-size: 12px;
  background: rgba(255,255,255,0.05);
  padding: 4px 10px;
  border-radius: 100px;
  display: inline-block;
}

        @media (max-width: 900px) {
          .tp-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .tp-stats { grid-template-columns: 1fr 1fr; gap: 0.75rem; }
          .tp-stat-card { padding: 16px; gap: 10px; }
          .tp-stat-icon { width: 38px; height: 38px; }
          .tp-stat-value { font-size: 22px; }
        }
      `}</style>

      <div className="tm-page">

        {/* Header */}
        <div className="tm-header">
          <div>
            <div className="tm-eyebrow">
              <span className="tm-eyebrow-dot" />
              <span className="tm-eyebrow-label">Hackathon</span>
            </div>
            <h1 className="tm-title">Find Your Team</h1>
            <p className="tm-subtitle">Browse open teams or create your own crew for the hackathon.</p>
          </div>
          <div className="tm-header-right">
  <button onClick={handleCreateClick} className="tm-btn-primary">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4"/>
      <path d="M5.5 20v-2a5 5 0 0 1 10 0v2"/>
      <line x1="19" y1="11" x2="19" y2="15"/>
      <line x1="21" y1="13" x2="17" y2="13"/>
    </svg>
    Create Team
  </button>
  <button
    onClick={() => setViewMode(v => v === "grid" ? "list" : "grid")}
    className="tm-btn-ghost"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <div className="tm-event-filter">
            <span className="tm-filter-label">Filtered by event:</span>
            <span className="tm-filter-chip">{eventInfo?.name || `Event #${eventId}`}</span>
            <button
              className="tm-filter-clear"
              onClick={() => router.push("/teams")}
            >
              Clear
            </button>
          </div>
        )}

        {/* Icon stat cards — matching submissions page */}
        <div className="tp-stats">
          <div className="tp-stat-card">
            <div className="tp-stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="tp-stat-body">
              <div className="tp-stat-value">{totalTeams}</div>
              <div className="tp-stat-label">Total Teams</div>
            </div>
          </div>

          <div className="tp-stat-card">
            <div className="tp-stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </div>
            <div className="tp-stat-body">
              <div className="tp-stat-value accent">{openTeams}</div>
              <div className="tp-stat-label">Open</div>
            </div>
          </div>

          <div className="tp-stat-card">
            <div className="tp-stat-icon danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="12" r="10"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </div>
            <div className="tp-stat-body">
              <div className="tp-stat-value danger">{fullTeams}</div>
              <div className="tp-stat-label">Full</div>
            </div>
          </div>

          <div className="tp-stat-card">
            <div className="tp-stat-icon accent">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
      <path d="M17 11h4" />
      <path d="M19 9v4" />
    </svg>
  </div>
            <div className="tp-stat-body">
              <div className="tp-stat-value accent">{myTeams}</div>
              <div className="tp-stat-label">My Teams</div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="tm-toolbar">
          <div className="tm-search-wrap">
            <svg className="tm-search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              className="tm-search"
              placeholder="Search teams…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="tm-filters">
            {["all","open","full"].map(f => (
              <button
                key={f}
                className={`tm-filter-btn${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Grid or Empty */}
        {teams.length === 0 ? (
  <div className="tm-empty">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
    <h3>No teams found</h3>
    <p>
      {searchTerm ? "Try adjusting your search terms."
       : filter !== "all" ? `No ${filter} teams available.`
       : "Be the first to create a team!"}
    </p>
    <button onClick={handleCreateClick} className="tm-btn-primary" style={{ marginTop: 8 }}>
      Create a Team
    </button>
  </div>
) : viewMode === "grid" ? (
  <div className="tm-grid">
    {teams.map(team => (
      <TeamCard key={team.id} team={team} user={user} />
    ))}
  </div>
) : (
  <div className="tm-list-view">
    <table className="tm-table">
      <thead>
        <tr>
          <th>Team</th>
          <th>Event</th>
          <th>Members</th>
          <th>Status</th>
          <th>Leader</th>
        </tr>
      </thead>
      <tbody>
        {teams.map(team => {
          const isFull = (team.members?.length || 0) >= (team.max_members || 4);
          const memberCount = team.members?.length || 0;
          const maxMembers = team.max_members || 4;
          
          return (
            <tr 
              key={team.id} 
              onClick={() => router.push(`/teams/${team.id}`)}
              className="tm-table-row"
            >
              <td className="tm-table-title">{team.name}</td>
              <td>{team.event?.name || team.event_name || "—"}</td>
              
  <td>
  <div className="tm-table-members-info">
    <span className="tm-table-members-count">
      {memberCount}/{maxMembers}
    </span>
    {memberCount > 0 ? (
      <div className="tm-table-avatars">
        {team.members?.slice(0, 3).map((member, idx) => {
          // Now member is a full user object with username
          const username = member.username || `User ${member.id}`;
          const initial = username.charAt(0).toUpperCase();
          
          return (
            <div 
              key={idx} 
              className="tm-table-avatar" 
              data-letter={initial}
              title={username}
            >
              {member.avatar ? <img src={member.avatar} alt="" /> : initial}
            </div>
          );
        })}
        {memberCount > 3 && (
          <div className="tm-table-avatar more">
            +{memberCount - 3}
          </div>
        )}
      </div>
    ) : (
      <span className="tm-table-no-members">No members</span>
    )}
  </div>
</td>
              <td>
                <span className={`tm-table-badge ${isFull ? 'full' : 'open'}`}>
                  {isFull ? 'Full' : 'Open'}
                </span>
              </td>
              <td>
                <span className="tm-table-leader">
                  {team.leader?.username || team.leader_details?.username || "—"}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
)}

        {totalPages > 1 && (
          <div className="tm-pagination">
            <button
              className="tm-page-btn"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span className="tm-page-info">
              Page {page} of {totalPages}
            </span>
            <button
              className="tm-page-btn"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}


"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "../../utils/axios";
import TeamCard from "../../components/teams/TeamCard";

const tmPageCss = `
.tm-page { max-width: 1280px; margin: 0 auto; padding: 36px 32px 64px; font-family: 'DM Sans', sans-serif; min-height: calc(100vh - 70px); }
.tm-loading { min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; color: #5c5c6e; font-size: 13px; }
.tm-spinner { width: 34px; height: 34px; border: 2px solid #1e1e24; border-top-color: #6EE7B7; border-radius: 50%; animation: spin .7s linear infinite; }
.tm-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 32px; gap: 20px; }
.tm-eyebrow { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.tm-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #6EE7B7; }
.tm-eyebrow-label { font-size: 11px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; color: #6EE7B7; }
.tm-title { font-family: 'Syne', sans-serif; font-size: 30px; font-weight: 700; color: #f0f0f3; letter-spacing: -0.5px; line-height: 1.1; }
.tm-subtitle { font-size: 14px; color: #5c5c6e; margin-top: 6px; line-height: 1.6; }
.tm-header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.tm-btn-primary { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 10px; font-size: 13.5px; font-weight: 600; font-family: 'DM Sans', sans-serif; background: #6EE7B7; color: #0c0c0f; border: none; cursor: pointer; transition: background .15s; text-decoration: none; }
.tm-btn-primary:hover { background: #86efac; }
.tm-btn-primary svg { width: 16px; height: 16px; }
.tm-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #1e1e24; border: 1px solid #1e1e24; border-radius: 14px; overflow: hidden; margin-bottom: 28px; }
.tm-stat { background: #111114; padding: 20px 24px; transition: background .15s; }
.tm-stat:hover { background: #17171b; }
.tm-stat-value { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 700; color: #f0f0f3; letter-spacing: -1px; line-height: 1; margin-bottom: 6px; }
.tm-stat-accent { color: #6EE7B7; }
.tm-stat-label { font-size: 11px; font-weight: 500; color: #5c5c6e; text-transform: uppercase; letter-spacing: 0.7px; }
.tm-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.tm-search-wrap { position: relative; flex: 1; max-width: 360px; }
.tm-search-ico { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: #3a3a48; pointer-events: none; width: 16px; height: 16px; }
.tm-search { width: 100%; padding: 9px 14px 9px 36px; background: #111114; border: 1px solid #1e1e24; border-radius: 10px; font-size: 13.5px; color: #f0f0f3; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color .15s; }
.tm-search:focus { border-color: #6EE7B740; }
.tm-search::placeholder { color: #3a3a48; }
.tm-filters { display: flex; gap: 4px; background: #111114; border: 1px solid #1e1e24; border-radius: 10px; padding: 4px; }
.tm-filter-btn { padding: 6px 14px; border: none; border-radius: 7px; font-size: 12.5px; font-weight: 500; font-family: 'DM Sans', sans-serif; color: #5c5c6e; background: transparent; cursor: pointer; transition: all .15s; }
.tm-filter-btn:hover { color: #f0f0f3; background: #17171b; }
.tm-filter-btn.active { background: #6EE7B7; color: #0c0c0f; font-weight: 600; }
.tm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; margin-top: 4px; }
.tm-card-link { text-decoration: none; display: block; height: 100%; }
.tm-card { background: #111114; border: 1px solid #1e1e24; border-radius: 16px; padding: 22px 24px; display: flex; flex-direction: column; transition: all .2s ease; cursor: pointer; height: 100%; }
.tm-card:hover { background: #17171b; border-color: #6EE7B7; box-shadow: 0 10px 25px -5px rgba(110,231,183,.15); transform: translateY(-3px); }
.tm-card-top { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.tm-card-avatar { width: 38px; height: 38px; border-radius: 10px; background: rgba(110,231,183,.1); border: 1px solid rgba(110,231,183,.2); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #6EE7B7; flex-shrink: 0; }
.tm-card-info { flex: 1; min-width: 0; }
.tm-card-name { font-family: 'Syne', sans-serif; font-size: 14.5px; font-weight: 700; color: #f0f0f3; margin: 0 0 2px; letter-spacing: -0.2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tm-card-event { font-size: 11.5px; color: #5c5c6e; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tm-card-status { padding: 2px 9px; border-radius: 100px; font-size: 10.5px; font-weight: 600; letter-spacing: 0.3px; flex-shrink: 0; }
.tm-card-status.open { background: rgba(110,231,183,.08); color: #6EE7B7; border: 1px solid rgba(110,231,183,.15); }
.tm-card-status.full { background: rgba(248,113,113,.08); color: #f87171; border: 1px solid rgba(248,113,113,.15); }
.tm-card-desc { font-size: 13px; color: #5c5c6e; line-height: 1.6; margin: 0 0 16px; flex: 1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.tm-card-members { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-top: 1px solid #1e1e24; border-bottom: 1px solid #1e1e24; margin-bottom: 14px; }
.tm-pip-stack { display: flex; align-items: center; }
.tm-pip { width: 24px; height: 24px; border-radius: 50%; border: 2px solid #111114; background: #17171b; margin-left: -6px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; color: #5c5c6e; transition: transform .15s; }
.tm-pip:first-child { margin-left: 0; }
.tm-pip:hover { transform: translateY(-2px); z-index: 10; }
.tm-pip-more { background: #26262e; color: #5c5c6e; font-size: 8px; }
.tm-members-count { font-size: 11.5px; color: #3a3a48; }
.tm-card-footer { display: flex; align-items: center; justify-content: space-between; }
.tm-leader { display: flex; align-items: center; gap: 5px; font-size: 11.5px; }
.tm-leader-label { color: #3a3a48; }
.tm-leader-name { color: #f0f0f3; font-weight: 500; }
.tm-badge { padding: 1px 8px; border-radius: 100px; font-size: 10px; font-weight: 600; }
.tm-badge-leader { background: rgba(110,231,183,.1); color: #6EE7B7; border: 1px solid rgba(110,231,183,.2); }
.tm-badge-member { background: rgba(110,231,183,.06); color: #6EE7B7; border: 1px solid rgba(110,231,183,.12); }
.tm-empty { padding: 56px 24px; text-align: center; color: #5c5c6e; font-size: 13px; display: flex; flex-direction: column; align-items: center; background: #111114; border: 1px solid #1e1e24; border-radius: 14px; gap: 8px; }
.tm-empty svg { width: 40px; height: 40px; color: #3a3a48; margin-bottom: 4px; }
.tm-empty h3 { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #f0f0f3; margin: 0; }
.tm-empty p { font-size: 13px; color: #5c5c6e; margin: 0; }
.tm-empty-btn { margin-top: 8px; display: inline-flex; align-items: center; gap: 7px; padding: 9px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif; background: #6EE7B7; color: #0c0c0f; border: none; cursor: pointer; transition: background .15s; }
.tm-empty-btn:hover { background: #86efac; }
@media (max-width: 900px) {
  .tm-page { padding: 24px 20px 48px; }
  .tm-stats { grid-template-columns: repeat(2, 1fr); }
  .tm-header { flex-direction: column; gap: 16px; }
}
@media (max-width: 600px) {
  .tm-page { padding: 20px 16px 48px; }
  .tm-toolbar { flex-direction: column; align-items: stretch; }
  .tm-search-wrap { max-width: none; }
  .tm-grid { grid-template-columns: 1fr; }
  .tm-stats { grid-template-columns: repeat(2, 1fr); }
}
`;

export default function TeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access");
        if (token) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          try {
            const userRes = await axios.get("/users/me/");
            setUser(userRes.data);
          } catch {
            setUser({ username: "User" });
          }
        }
        const teamsRes = await axios.get("/teams/");
        setTeams(teamsRes.data.results || teamsRes.data || []);
      } catch (err) {
        console.error("Error fetching teams:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const isFull = (team.members?.length || 0) >= (team.max_members || 4);
    const matchesFilter =
      filter === "all" ? true : filter === "open" ? !isFull : filter === "full" ? isFull : true;
    return matchesSearch && matchesFilter;
  });

  const handleCreateClick = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access");
    if (!token) {
      router.push("/login?redirect=/teams/create&message=Please login to create a team");
    } else {
      router.push("/teams/create");
    }
  };

  const totalTeams = teams.length;
  const openTeams = teams.filter((t) => (t.members?.length || 0) < (t.max_members || 4)).length;
  const fullTeams = totalTeams - openTeams;
  const myTeams = user
    ? teams.filter(
        (t) => (t.leader_details?.id ?? t.leader) === user.id || t.members?.some((m) => m.id === user.id)
      ).length
    : 0;

  if (loading) {
    return (
      <>
        <style>{tmPageCss}</style>
        <div className="tm-loading">
          <div className="tm-spinner" />
          <span>Loading teams…</span>
        </div>
      </>
    );
  }

  return (
    <>
      {/*
        The <style> tag injects tm-* CSS into the page.
        TeamCard reads these classes — it has no CSS of its own,
        relying entirely on the parent page's injected styles.
        This is intentional: one CSS block, shared by page + component.
      */}
      <style>{tmPageCss}</style>

      <div className="tm-page">

        {/* ── Header ── */}
        <div className="tm-header">
          <div>
            <div className="tm-eyebrow">
              <span className="tm-eyebrow-dot" />
              <span className="tm-eyebrow-label">Teams</span>
            </div>
            <h1 className="tm-title">Find Your Team</h1>
            <p className="tm-subtitle">Browse open teams or create your own crew for the hackathon.</p>
          </div>
          <div className="tm-header-right">
            <button onClick={handleCreateClick} className="tm-btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M5.5 20v-2a5 5 0 0 1 10 0v2" />
                <line x1="19" y1="11" x2="19" y2="15" />
                <line x1="21" y1="13" x2="17" y2="13" />
              </svg>
              Create Team
            </button>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="tm-stats">
          <div className="tm-stat">
            <div className="tm-stat-value">{totalTeams}</div>
            <div className="tm-stat-label">Total Teams</div>
          </div>
          <div className="tm-stat">
            <div className="tm-stat-value tm-stat-accent">{openTeams}</div>
            <div className="tm-stat-label">Open</div>
          </div>
          <div className="tm-stat">
            <div className="tm-stat-value">{fullTeams}</div>
            <div className="tm-stat-label">Full</div>
          </div>
          <div className="tm-stat">
            <div className="tm-stat-value tm-stat-accent">{myTeams}</div>
            <div className="tm-stat-label">My Teams</div>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="tm-toolbar">
          <div className="tm-search-wrap">
            <svg className="tm-search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="tm-search"
              placeholder="Search teams by name or description…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="tm-filters">
            {["all", "open", "full"].map((f) => (
              <button
                key={f}
                className={`tm-filter-btn${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ── Grid or Empty ── */}
        {filteredTeams.length === 0 ? (
          <div className="tm-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h3>No teams found</h3>
            <p>
              {searchTerm
                ? "Try adjusting your search terms."
                : filter !== "all"
                ? `No ${filter} teams available.`
                : "Be the first to create a team!"}
            </p>
            <button onClick={handleCreateClick} className="tm-empty-btn">
              Create a Team
            </button>
          </div>
        ) : (
          <div className="tm-grid">
            {filteredTeams.map((team) => (
              /*
                TeamCard handles the entire card UI.
                Props:
                  team — the full team object from the API
                  user — the logged-in user (or null), used to show
                         Leader / Member badges on the card footer
              */
              <TeamCard key={team.id} team={team} user={user} />
            ))}
          </div>
        )}

      </div>
    </>
  );
}
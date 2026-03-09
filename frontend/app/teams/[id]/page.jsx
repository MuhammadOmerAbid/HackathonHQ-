"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "../../../utils/axios";

const tmdPageCss = `
.tmd-page { max-width: 960px; margin: 0 auto; padding: 36px 32px 64px; font-family: 'DM Sans', sans-serif; min-height: calc(100vh - 70px); }
.tmd-loading { min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; color: #5c5c6e; font-size: 13px; }
.tmd-spinner { width: 34px; height: 34px; border: 2px solid #1e1e24; border-top-color: #6EE7B7; border-radius: 50%; animation: spin .7s linear infinite; }
.tmd-back { display: inline-flex; align-items: center; gap: 7px; padding: 7px 14px; border-radius: 8px; background: transparent; border: 1px solid #26262e; color: #5c5c6e; font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all .15s; margin-bottom: 28px; }
.tmd-back:hover { color: #f0f0f3; background: #17171b; }
.tmd-back svg { width: 15px; height: 15px; }
.tmd-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 28px; flex-wrap: wrap; }
.tmd-eyebrow { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.tmd-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #6EE7B7; }
.tmd-eyebrow-label { font-size: 11px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; color: #6EE7B7; }
.tmd-hero { display: flex; align-items: center; gap: 18px; }
.tmd-avatar { width: 64px; height: 64px; border-radius: 18px; background: rgba(110,231,183,.1); border: 1px solid rgba(110,231,183,.2); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 700; color: #6EE7B7; flex-shrink: 0; }
.tmd-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 700; color: #f0f0f3; letter-spacing: -0.4px; line-height: 1.1; margin: 0 0 4px; }
.tmd-event { font-size: 13.5px; color: #5c5c6e; }
.tmd-status-pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 100px; font-size: 12px; font-weight: 600; flex-shrink: 0; }
.tmd-pill-open { background: rgba(110,231,183,.08); color: #6EE7B7; border: 1px solid rgba(110,231,183,.2); }
.tmd-pill-full { background: rgba(248,113,113,.08); color: #f87171; border: 1px solid rgba(248,113,113,.2); }
.tmd-pill-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.tmd-info-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #1e1e24; border: 1px solid #1e1e24; border-radius: 14px; overflow: hidden; margin-bottom: 24px; }
.tmd-info-cell { background: #111114; padding: 18px 22px; transition: background .15s; }
.tmd-info-cell:hover { background: #17171b; }
.tmd-info-label { font-size: 11px; font-weight: 500; color: #5c5c6e; text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 8px; }
.tmd-info-val { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600; color: #f0f0f3; }
.tmd-info-val.open { color: #6EE7B7; }
.tmd-info-val.full { color: #f87171; }
.tmd-panel { background: #111114; border: 1px solid #1e1e24; border-radius: 14px; overflow: hidden; margin-bottom: 20px; }
.tmd-panel-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; border-bottom: 1px solid #1e1e24; }
.tmd-panel-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #f0f0f3; margin: 0; }
.tmd-panel-body { padding: 24px; }
.tmd-desc { font-size: 14px; color: #5c5c6e; line-height: 1.8; margin: 0; }
.tmd-members-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1px; background: #1e1e24; }
.tmd-member-row { display: flex; align-items: center; gap: 12px; padding: 14px 20px; background: #111114; text-decoration: none; transition: background .15s; }
.tmd-member-row:hover { background: #17171b; }
.tmd-member-pip { width: 32px; height: 32px; border-radius: 9px; background: rgba(110,231,183,.08); border: 1px solid rgba(110,231,183,.15); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: #6EE7B7; flex-shrink: 0; }
.tmd-member-info { flex: 1; min-width: 0; }
.tmd-member-name { font-size: 13px; font-weight: 500; color: #f0f0f3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
.tmd-member-badge { display: inline-flex; padding: 1px 7px; border-radius: 100px; font-size: 10px; font-weight: 600; background: rgba(110,231,183,.1); color: #6EE7B7; border: 1px solid rgba(110,231,183,.2); }
.tmd-empty { padding: 40px 24px; text-align: center; color: #5c5c6e; font-size: 13px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.tmd-empty svg { width: 36px; height: 36px; color: #3a3a48; }
.tmd-cta { display: flex; gap: 10px; padding-top: 24px; border-top: 1px solid #1e1e24; flex-wrap: wrap; }
.tmd-btn-primary { display: inline-flex; align-items: center; gap: 7px; padding: 10px 22px; border-radius: 10px; font-size: 13.5px; font-weight: 600; font-family: 'DM Sans', sans-serif; background: #6EE7B7; color: #0c0c0f; border: none; cursor: pointer; text-decoration: none; transition: background .15s; }
.tmd-btn-primary:hover:not(:disabled) { background: #86efac; }
.tmd-btn-primary:disabled { opacity: .45; cursor: not-allowed; }
.tmd-btn-ghost { display: inline-flex; align-items: center; gap: 7px; padding: 9px 22px; border-radius: 10px; font-size: 13.5px; font-weight: 500; font-family: 'DM Sans', sans-serif; background: transparent; color: #5c5c6e; border: 1px solid #26262e; cursor: pointer; text-decoration: none; transition: all .15s; }
.tmd-btn-ghost:hover { color: #f0f0f3; background: #17171b; }
.tmd-btn-danger { display: inline-flex; align-items: center; gap: 7px; padding: 9px 22px; border-radius: 10px; font-size: 13.5px; font-weight: 500; font-family: 'DM Sans', sans-serif; background: rgba(248,113,113,.08); color: #f87171; border: 1px solid rgba(248,113,113,.2); cursor: pointer; text-decoration: none; transition: all .15s; }
.tmd-btn-danger:hover { background: rgba(248,113,113,.15); }
.tmd-btn-warn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 22px; border-radius: 10px; font-size: 13.5px; font-weight: 500; font-family: 'DM Sans', sans-serif; background: rgba(251,191,36,.08); color: #fbbf24; border: 1px solid rgba(251,191,36,.2); cursor: pointer; transition: all .15s; }
.tmd-btn-warn:hover:not(:disabled) { background: rgba(251,191,36,.15); }
.tmd-btn-warn:disabled { opacity: .45; cursor: not-allowed; }
.tmd-btn-disabled { display: inline-flex; align-items: center; gap: 7px; padding: 9px 22px; border-radius: 10px; font-size: 13.5px; font-weight: 500; font-family: 'DM Sans', sans-serif; background: #17171b; color: #3a3a48; border: 1px solid #26262e; cursor: not-allowed; }
.tmd-error-page { min-height: 80vh; display: flex; align-items: center; justify-content: center; }
.tmd-error-card { background: #111114; border: 1px solid #1e1e24; border-radius: 18px; padding: 48px 40px; max-width: 400px; width: 100%; text-align: center; }
.tmd-error-card svg { color: #f87171; margin-bottom: 16px; }
.tmd-error-card h2 { font-family: 'Syne', sans-serif; font-size: 20px; color: #f0f0f3; margin: 0 0 8px; }
.tmd-error-card p { font-size: 13.5px; color: #5c5c6e; margin: 0 0 24px; }
.tmd-error-alert { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 9px; background: rgba(248,113,113,.08); border: 1px solid rgba(248,113,113,.2); color: #f87171; font-size: 13px; margin-bottom: 20px; }
.tmd-error-alert svg { width: 16px; height: 16px; flex-shrink: 0; }
@media (max-width: 900px) {
  .tmd-page { padding: 24px 20px 48px; }
  .tmd-info-strip { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .tmd-page { padding: 20px 16px 48px; }
  .tmd-hero { flex-direction: column; align-items: flex-start; gap: 12px; }
  .tmd-info-strip { grid-template-columns: 1fr; }
  .tmd-members-grid { grid-template-columns: 1fr; }
  .tmd-cta { flex-direction: column; }
  .tmd-btn-primary, .tmd-btn-ghost, .tmd-btn-danger, .tmd-btn-warn, .tmd-btn-disabled { width: 100%; justify-content: center; }
}
`;

export default function TeamDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [error, setError] = useState("");

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
            // not authenticated
          }
        }
        const teamRes = await axios.get(`/teams/${id}/`);
        setTeam(teamRes.data);
      } catch (err) {
        console.error("Error fetching team:", err);
        setError("Team not found");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleJoinTeam = async () => {
    const token = localStorage.getItem("access");
    if (!token) {
      router.push(`/login?redirect=/teams/${id}&message=Please login to join this team`);
      return;
    }
    setJoinLoading(true);
    try {
      await axios.post(`/teams/${id}/join/`);
      const res = await axios.get(`/teams/${id}/`);
      setTeam(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join team");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    setJoinLoading(true);
    try {
      await axios.post(`/teams/${id}/leave/`);
      const res = await axios.get(`/teams/${id}/`);
      setTeam(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to leave team");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!confirm("Are you sure you want to delete this team?")) return;
    try {
      await axios.delete(`/teams/${id}/`);
      router.push("/teams");
    } catch {
      setError("Failed to delete team");
    }
  };

  if (loading) {
    return (
      <>
        <style>{tmdPageCss}</style>
        <div className="tmd-loading">
          <div className="tmd-spinner" />
          <span>Loading team…</span>
        </div>
      </>
    );
  }

  if (error || !team) {
    return (
      <>
        <style>{tmdPageCss}</style>
        <div className="tmd-page">
          <button onClick={() => router.back()} className="tmd-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Teams
          </button>
          <div className="tmd-error-page">
            <div className="tmd-error-card">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h2>{error || "Team not found"}</h2>
              <p>The team you're looking for doesn't exist or has been removed.</p>
              <button onClick={() => router.push("/teams")} className="tmd-btn-primary">
                Back to Teams
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const memberCount = team.members_details?.length || 0;
  const maxMembers = team.max_members || 4;
  const isFull = memberCount >= maxMembers;
  const isLeader = user && team.leader?.id === user.id;
  const isMember = user && team.members_details?.some((m) => m.id === user.id);

  return (
    <>
      <style>{tmdPageCss}</style>
      <div className="tmd-page">
        {/* Back */}
        <button onClick={() => router.back()} className="tmd-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Teams
        </button>

        {/* Inline error alert */}
        {error && (
          <div className="tmd-error-alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Head */}
        <div className="tmd-head">
          <div>
            <div className="tmd-eyebrow">
              <span className="tmd-eyebrow-dot" />
              <span className="tmd-eyebrow-label">Team Detail</span>
            </div>
            <div className="tmd-hero">
              <div className="tmd-avatar">
                {team.name?.charAt(0).toUpperCase() || "T"}
              </div>
              <div>
                <h1 className="tmd-title">{team.name}</h1>
                <p className="tmd-event">{team.event_name || "Hackathon Team"}</p>
              </div>
            </div>
          </div>
          <span className={`tmd-status-pill ${isFull ? "tmd-pill-full" : "tmd-pill-open"}`}>
            <span className="tmd-pill-dot" />
            {isFull ? "Full" : "Open"}
          </span>
        </div>

        {/* Info strip */}
        <div className="tmd-info-strip">
          <div className="tmd-info-cell">
            <div className="tmd-info-label">Size</div>
            <div className="tmd-info-val">{memberCount} / {maxMembers}</div>
          </div>
          <div className="tmd-info-cell">
            <div className="tmd-info-label">Leader</div>
            <div className="tmd-info-val">{team.leader?.username || "Unknown"}</div>
          </div>
          <div className="tmd-info-cell">
            <div className="tmd-info-label">Status</div>
            <div className={`tmd-info-val ${isFull ? "full" : "open"}`}>
              {isFull ? "Full" : "Open for Join"}
            </div>
          </div>
        </div>

        {/* Description panel */}
        <div className="tmd-panel">
          <div className="tmd-panel-head">
            <h3 className="tmd-panel-title">About the Team</h3>
          </div>
          <div className="tmd-panel-body">
            <p className="tmd-desc">{team.description || "No description provided."}</p>
          </div>
        </div>

        {/* Members panel */}
        <div className="tmd-panel">
          <div className="tmd-panel-head">
            <h3 className="tmd-panel-title">Members ({memberCount})</h3>
          </div>

          {team.members_details && team.members_details.length > 0 ? (
            <div className="tmd-members-grid">
              {team.members_details.map((member, index) => {
                const safeKey = member?.id ? `member-${member.id}` : `member-index-${index}`;
                const initial = member?.username ? member.username.charAt(0).toUpperCase() : "?";
                const isLeaderMember = member?.id === team.leader?.id;

                const Inner = () => (
                  <>
                    <div className="tmd-member-pip">{initial}</div>
                    <div className="tmd-member-info">
                      <div className="tmd-member-name">{member?.username || "Unknown User"}</div>
                      {isLeaderMember && <span className="tmd-member-badge">Leader</span>}
                    </div>
                  </>
                );

                if (!member?.id) {
                  return (
                    <div key={safeKey} className="tmd-member-row" style={{ cursor: "default" }}>
                      <Inner />
                    </div>
                  );
                }

                return (
                  <Link href={`/users/${member.id}`} key={safeKey} className="tmd-member-row">
                    <Inner />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="tmd-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              <span>No members yet.</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="tmd-cta">
          {!user ? (
            <button onClick={handleJoinTeam} className="tmd-btn-primary">
              Login to Join Team
            </button>
          ) : isLeader ? (
            <>
              <Link href={`/teams/${id}/edit`} className="tmd-btn-ghost">
                Edit Team
              </Link>
              <button onClick={handleDeleteTeam} className="tmd-btn-danger">
                Delete Team
              </button>
            </>
          ) : isMember ? (
            <button onClick={handleLeaveTeam} className="tmd-btn-warn" disabled={joinLoading}>
              {joinLoading ? "Leaving…" : "Leave Team"}
            </button>
          ) : !isFull ? (
            <button onClick={handleJoinTeam} className="tmd-btn-primary" disabled={joinLoading}>
              {joinLoading ? "Joining…" : "Join Team"}
            </button>
          ) : (
            <span className="tmd-btn-disabled">Team Full</span>
          )}
        </div>
      </div>
    </>
  );
}
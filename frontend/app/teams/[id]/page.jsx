"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "../../../utils/axios";
import LoadingSpinner from "@/components/LoadingSpinner";

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
          } catch { /* not authenticated */ }
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
    } finally { setJoinLoading(false); }
  };

  const handleLeaveTeam = async () => {
    setJoinLoading(true);
    try {
      await axios.post(`/teams/${id}/leave/`);
      const res = await axios.get(`/teams/${id}/`);
      setTeam(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to leave team");
    } finally { setJoinLoading(false); }
  };

  const handleDeleteTeam = async () => {
    if (!confirm("Are you sure you want to delete this team?")) return;
    try {
      await axios.delete(`/teams/${id}/`);
      router.push("/teams");
    } catch { setError("Failed to delete team"); }
  };

  if (loading) return <LoadingSpinner message="Loading team…" />;

  if (error || !team) {
    return (
      <div className="tmd-page">
        <button onClick={() => router.push("/teams")} className="evd-back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Teams
        </button>
        <div className="tmd-error-page">
          <div className="tmd-error-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h2>{error || "Team not found"}</h2>
            <p>The team you're looking for doesn't exist or has been removed.</p>
            <button onClick={() => router.push("/teams")} className="tmd-btn-primary">Back to Teams</button>
          </div>
        </div>
      </div>
    );
  }

  const memberCount = team.members_details?.length || 0;
  const maxMembers = team.max_members || 4;
  const isFull = memberCount >= maxMembers;
  const isLeader = user && (team.leader_details?.id ?? team.leader) === user.id;
  const isMember = user && team.members_details?.some((m) => m.id === user.id);

  return (
    <div className="tmd-page">

      {/* Back — circular style (evd-back-btn is already in global.css) */}
      <button onClick={() => router.push("/teams")} className="evd-back-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Teams
      </button>

      {/* Inline error alert */}
      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 16px", borderRadius: 9,
          background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)",
          color: "#f87171", fontSize: 13, marginBottom: 20
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
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
            <div className="tmd-avatar">{team.name?.charAt(0).toUpperCase() || "T"}</div>
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
          <div className="tmd-info-val">{team.leader_details?.username || team.leader?.username || "Unknown"}</div>
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
        {team.members_details?.length > 0 ? (
          <div className="tmd-members-grid">
            {team.members_details.map((member, index) => {
              const safeKey = member?.id ? `member-${member.id}` : `member-index-${index}`;
              const initial = member?.username?.charAt(0).toUpperCase() || "?";
              const isLeaderMember = member?.id === (team.leader_details?.id ?? team.leader);
              const Inner = () => (
                <>
                  <div className="tmd-member-pip">{initial}</div>
                  <div className="tmd-member-info">
                    <div className="tmd-member-name">{member?.username || "Unknown"}</div>
                    {isLeaderMember && <span className="tmd-member-badge">Leader</span>}
                  </div>
                </>
              );
              if (!member?.id) return (
                <div key={safeKey} className="tmd-member-row" style={{ cursor: "default" }}><Inner /></div>
              );
              return (
                <Link href={`/users/${member.id}`} key={safeKey} className="tmd-member-row"><Inner /></Link>
              );
            })}
          </div>
        ) : (
          <div className="tmd-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
            <span>No members yet.</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="tmd-cta">
        {!user ? (
          <button onClick={handleJoinTeam} className="tmd-btn-primary">Login to Join Team</button>
        ) : isLeader ? (
          <>
            <Link href={`/teams/${id}/edit`} className="tmd-btn-ghost">Edit Team</Link>
            <button onClick={handleDeleteTeam} className="tmd-btn-danger">Delete Team</button>
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
  );
}
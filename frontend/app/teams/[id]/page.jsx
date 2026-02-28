"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "../../../utils/axios";

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
        const [teamRes, userRes] = await Promise.all([
          axios.get(`/teams/${id}/`),
          axios.get("/users/me/").catch(() => null)
        ]);
        
        setTeam(teamRes.data);
        setUser(userRes?.data || null);
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
    if (!user) {
      router.push(`/login?redirect=/teams/${id}`);
      return;
    }

    setJoinLoading(true);
    try {
      await axios.post(`/teams/${id}/join/`);
      const res = await axios.get(`/teams/${id}/`);
      setTeam(res.data);
    } catch (err) {
      console.error("Error joining team:", err);
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
      console.error("Error leaving team:", err);
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
    } catch (err) {
      console.error("Error deleting team:", err);
      setError("Failed to delete team");
    }
  };

  if (loading) {
    return (
      <div className="event-detail-loading">
        <div className="blob blob1"></div>
        <div className="blob blob2"></div>
        <div className="blob blob3"></div>
        <div className="event-detail-spinner"></div>
        <p>Loading team details...</p>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="event-detail-error">
        <div className="blob blob1"></div>
        <div className="blob blob2"></div>
        <div className="blob blob3"></div>
        <div className="event-detail-error-card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h2>{error || "Team not found"}</h2>
          <p>The team you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => router.push("/teams")} className="event-detail-back-btn">
            Back to Teams
          </button>
        </div>
      </div>
    );
  }

  const memberCount = team.members?.length || 0;
  const maxMembers = team.max_members || 4;
  const isFull = memberCount >= maxMembers;
  const isLeader = user && team.leader?.id === user.id;
  const isMember = user && team.members?.some(m => m.id === user.id);

  return (
    <div className="event-detail-container">
      {/* Animated background blobs */}
      <div className="blob blob1"></div>
      <div className="blob blob2"></div>
      <div className="blob blob3"></div>

      <div className="event-detail-card">
        {/* Back Button */}
        <button onClick={() => router.back()} className="event-detail-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Teams
        </button>

        {/* Team Header */}
        <div className="event-detail-title-section">
          <div className="event-detail-title-wrapper">
            <h1 className="event-detail-title">{team.name}</h1>
          </div>
          <div className={`event-detail-status ${isFull ? 'gray' : 'green'}`}>
            {isFull ? 'Team Full' : 'Open for Join'}
          </div>
        </div>
        <p className="event-detail-organizer">Event: {team.event?.name || "Hackathon Team"}</p>

        {/* Team Info Grid */}
        <div className="event-detail-info-grid">
          <div className="event-detail-info-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <div>
              <h4>Team Size</h4>
              <p>{memberCount}/{maxMembers} members</p>
            </div>
          </div>

          <div className="event-detail-info-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4"></circle>
              <path d="M5.37 20c.92-3 4.29-4 6.63-4s5.71 1 6.63 4"></path>
            </svg>
            <div>
              <h4>Team Lead</h4>
              <p>{team.leader?.username}</p>
            </div>
          </div>

          <div className="event-detail-info-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <div>
              <h4>Created</h4>
              <p>{new Date(team.created_at || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="event-detail-description">
          <h3>About the Team</h3>
          <p>{team.description || "No description provided."}</p>
        </div>

        {/* Members Section */}
        <div className="event-detail-teams-header" style={{ marginTop: '2rem' }}>
          <h3>Team Members ({memberCount})</h3>
        </div>

        {team.members?.length > 0 ? (
          <div className="event-detail-teams-grid">
            {team.members.map((member) => (
              <Link href={`/users/${member.id}`} key={member.id} className="event-detail-team-card">
                <div className="event-detail-team-header">
                  <h4>{member.username}</h4>
                  {member.id === team.leader?.id && (
                    <span className="team-card-badge">Leader</span>
                  )}
                </div>
                <div className="event-detail-team-members">
                  <div className="event-detail-team-member-avatar">
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                  <span>{member.email || "No email"}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="event-detail-teams-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
            </svg>
            <p>No members in this team yet.</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="event-detail-cta" style={{ marginTop: '2rem' }}>
          {!user ? (
            <button onClick={handleJoinTeam} className="event-detail-cta-btn primary">
              Login to Join Team
            </button>
          ) : isLeader ? (
            <>
              <Link href={`/teams/${id}/edit`} className="event-detail-cta-btn secondary">
                Edit Team
              </Link>
              <button onClick={handleDeleteTeam} className="event-detail-cta-btn secondary" style={{ borderColor: '#f87171', color: '#f87171' }}>
                Delete Team
              </button>
            </>
          ) : isMember ? (
            <button onClick={handleLeaveTeam} className="event-detail-cta-btn secondary" disabled={joinLoading}>
              {joinLoading ? "Leaving..." : "Leave Team"}
            </button>
          ) : !isFull ? (
            <button onClick={handleJoinTeam} className="event-detail-cta-btn primary" disabled={joinLoading}>
              {joinLoading ? "Joining..." : "Join Team"}
            </button>
          ) : (
            <button className="event-detail-cta-btn secondary" disabled>
              Team Full
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
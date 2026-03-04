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
        // Check if user is logged in
        const token = localStorage.getItem('access');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          try {
            const userRes = await axios.get("/users/me/");
            setUser(userRes.data);
          } catch {
            // User not authenticated
          }
        }

        // Fetch team details
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
    const token = localStorage.getItem('access');
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
      <div className="team-detail-loading">
        <div className="blob blob1"></div>
        <div className="blob blob2"></div>
        <div className="blob blob3"></div>
        <div className="loading-spinner"></div>
        <p>Loading team details...</p>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="team-detail-error">
        <div className="blob blob1"></div>
        <div className="blob blob2"></div>
        <div className="blob blob3"></div>
        <div className="team-detail-error-card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h2>{error || "Team not found"}</h2>
          <p>The team you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => router.push("/teams")} className="back-btn">
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
    <div className="team-detail-container">
      {/* Animated background blobs */}
      <div className="blob blob1"></div>
      <div className="blob blob2"></div>
      <div className="blob blob3"></div>

      <div className="team-detail-card">
        {/* Back Button */}
        <div className="team-detail-header">
          <button onClick={() => router.back()} className="back-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Teams
          </button>
        </div>

        {/* Team Header */}
        <div className="team-detail-title-section">
          <div className="team-detail-avatar">
            {team.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="team-detail-name">{team.name}</h1>
            <p className="team-detail-event">
              {team.event?.name || "Hackathon Team"}
            </p>
          </div>
        </div>

        {/* Team Info Grid */}
        <div className="team-detail-meta">
          <div className="team-detail-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <div>
              <span className="meta-label">Team Size</span>
              <span className="meta-value">{memberCount}/{maxMembers}</span>
            </div>
          </div>

          <div className="team-detail-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4"></circle>
              <path d="M5.37 20c.92-3 4.29-4 6.63-4s5.71 1 6.63 4"></path>
            </svg>
            <div>
              <span className="meta-label">Team Lead</span>
              <span className="meta-value">{team.leader?.username}</span>
            </div>
          </div>

          <div className="team-detail-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <div>
              <span className="meta-label">Status</span>
              <span className={`meta-value status-${isFull ? 'full' : 'open'}`}>
                {isFull ? 'Full' : 'Open for Join'}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="team-detail-description">
          <h3>About the Team</h3>
          <p>{team.description || "No description provided."}</p>
        </div>

        {/* Members Section */}
        <div className="team-detail-members-section">
          <h3>Team Members ({memberCount})</h3>
          {team.members?.length > 0 ? (
            <div className="team-detail-members-grid">
              {team.members.map((member) => (
                <Link href={`/users/${member.id}`} key={member.id} className="member-card">
                  <div className="member-card-avatar">
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="member-card-info">
                    <span className="member-card-name">{member.username}</span>
                    {member.id === team.leader?.id && (
                      <span className="member-card-badge">Leader</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="team-detail-members-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
              <p>No members in this team yet.</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="team-detail-actions">
          {!user ? (
            <button onClick={handleJoinTeam} className="action-btn primary">
              Login to Join Team
            </button>
          ) : isLeader ? (
            <>
              <Link href={`/teams/${id}/edit`} className="action-btn secondary">
                Edit Team
              </Link>
              <button onClick={handleDeleteTeam} className="action-btn danger">
                Delete Team
              </button>
            </>
          ) : isMember ? (
            <button onClick={handleLeaveTeam} className="action-btn warning" disabled={joinLoading}>
              {joinLoading ? "Leaving..." : "Leave Team"}
            </button>
          ) : !isFull ? (
            <button onClick={handleJoinTeam} className="action-btn primary" disabled={joinLoading}>
              {joinLoading ? "Joining..." : "Join Team"}
            </button>
          ) : (
            <button className="action-btn disabled" disabled>
              Team Full
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
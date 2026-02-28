"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "../../utils/axios";

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // all, open, full
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamsRes, userRes] = await Promise.all([
          axios.get("/teams/"),
          axios.get("/users/me/").catch(() => null)
        ]);
        
        setTeams(teamsRes.data.results || teamsRes.data || []);
        setUser(userRes?.data || null);
      } catch (err) {
        console.error("Error fetching teams:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

    const isFull = team.members?.length >= (team.max_members || 4);
    const matchesFilter = 
      filter === "all" ? true :
      filter === "open" ? !isFull :
      filter === "full" ? isFull : true;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="blob blob1"></div>
        <div className="blob blob2"></div>
        <div className="blob blob3"></div>
        <div className="dashboard-spinner"></div>
        <p>Loading teams...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Animated background blobs */}
      <div className="blob blob1"></div>
      <div className="blob blob2"></div>
      <div className="blob blob3"></div>

      <div className="dashboard-content">
        {/* Header */}
        <div className="dashboard-welcome">
          <div>
            <h1 className="dashboard-welcome-title">Teams</h1>
            <p className="dashboard-welcome-subtitle">Find teammates or create your own team</p>
          </div>
          {user && (
            <Link href="/teams/create" className="dashboard-btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px', marginRight: '0.5rem' }}>
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create Team
            </Link>
          )}
        </div>

        {/* Search and Filter */}
        <div className="events-filters">
          <div className="events-search-wrapper">
            <svg className="events-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="events-search-input"
            />
          </div>

          <div className="events-filter-tabs">
            <button
              className={`events-filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Teams
            </button>
            <button
              className={`events-filter-tab ${filter === 'open' ? 'active' : ''}`}
              onClick={() => setFilter('open')}
            >
              Open
            </button>
            <button
              className={`events-filter-tab ${filter === 'full' ? 'active' : ''}`}
              onClick={() => setFilter('full')}
            >
              Full
            </button>
          </div>
        </div>

        {/* Teams Grid */}
        {filteredTeams.length === 0 ? (
  <div className="teams-empty">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
    <h3>No teams found</h3>
    <p>Try adjusting your search or create a new team</p>
    {user && (
      <Link href="/teams/create" className="teams-empty-btn">
        Create a team
      </Link>
            )}
          </div>
        ) : (
          <div className="events-grid">
            {filteredTeams.map((team) => {
              const memberCount = team.members?.length || 0;
              const maxMembers = team.max_members || 4;
              const isFull = memberCount >= maxMembers;
              const isLeader = user && team.leader?.id === user.id;

              return (
                <Link href={`/teams/${team.id}`} key={team.id} className="events-item-link">
                  <div className="events-item">
                    {/* Team Header */}
                    <div className="events-item-header">
                      <div>
                        <h3 className="events-item-title">{team.name}</h3>
                        <p className="events-item-organizer">{team.event?.name || "Hackathon Team"}</p>
                      </div>
                      <span className={`events-status-badge ${isFull ? 'gray' : 'green'}`}>
                        {isFull ? 'Full' : 'Open'}
                      </span>
                    </div>

                    {/* Team Description */}
                    <p className="events-item-description">
                      {team.description || "No description provided"}
                    </p>

                    {/* Team Members */}
                    <div className="events-item-footer">
                      <div className="events-item-stat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span>{memberCount}/{maxMembers} members</span>
                      </div>
                      <div className="events-item-stat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="8" r="4"></circle>
                          <path d="M5.37 20c.92-3 4.29-4 6.63-4s5.71 1 6.63 4"></path>
                        </svg>
                        <span>{team.leader?.username || "Unknown"}</span>
                      </div>
                    </div>

                    {/* Leader Badge */}
                    {isLeader && (
                      <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
                        <span className="team-card-badge">You are the leader</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
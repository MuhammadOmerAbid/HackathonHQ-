"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "../../utils/axios";

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
        // Check if user is logged in by looking for token
        const token = localStorage.getItem('access');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          // Try to get user info
          try {
            const userRes = await axios.get("/users/me/");
            setUser(userRes.data);
          } catch {
            setUser({ username: 'User' }); // Fallback
          }
        }
        
        // Fetch teams
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

  const handleCreateClick = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access');
    if (!token) {
      // Not logged in, redirect to login with return URL
      router.push('/login?redirect=/teams/create&message=Please login to create a team');
    } else {
      router.push('/teams/create');
    }
  };

  if (loading) {
    return (
      <div className="teams-loading">
        <div className="blob blob1"></div>
        <div className="blob blob2"></div>
        <div className="blob blob3"></div>
        <div className="loading-spinner"></div>
        <p>Loading teams...</p>
      </div>
    );
  }

  return (
    <div className="teams-container">
      {/* Animated background blobs */}
      <div className="blob blob1"></div>
      <div className="blob blob2"></div>
      <div className="blob blob3"></div>

      <div className="teams-content">
        {/* Header with Create Button */}
        <div className="teams-header">
          <div>
            <h1 className="teams-title">Teams</h1>
            <p className="teams-subtitle">Find teammates or create your own team</p>
          </div>
          
          <button onClick={handleCreateClick} className="teams-create-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M5.5 20v-2a5 5 0 0 1 10 0v2" />
              <line x1="19" y1="11" x2="19" y2="15" />
              <line x1="21" y1="13" x2="17" y2="13" />
            </svg>
            Create New Team
          </button>
        </div>

        {/* Search and Filter */}
        <div className="teams-filters">
          <div className="teams-search">
            <svg className="teams-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search teams by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="teams-search-input"
            />
          </div>

          <div className="teams-filter-tabs">
            <button
              className={`teams-filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Teams
            </button>
            <button
              className={`teams-filter-tab ${filter === 'open' ? 'active' : ''}`}
              onClick={() => setFilter('open')}
            >
              Open
            </button>
            <button
              className={`teams-filter-tab ${filter === 'full' ? 'active' : ''}`}
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
            <p>
              {searchTerm 
                ? "Try adjusting your search terms"
                : filter !== 'all' 
                ? `No ${filter} teams available`
                : "Be the first to create a team!"}
            </p>
            <button onClick={handleCreateClick} className="teams-empty-btn">
              Create a Team
            </button>
          </div>
        ) : (
          <div className="teams-grid">
            {filteredTeams.map((team) => {
              const memberCount = team.members?.length || 0;
              const maxMembers = team.max_members || 4;
              const isFull = memberCount >= maxMembers;
              const isLeader = user && team.leader?.id === user.id;
              const isMember = user && team.members?.some(m => m.id === user.id);

              return (
                <Link href={`/teams/${team.id}`} key={team.id} className="team-card-link">
                  <div className="team-card">
                    {/* Team Header */}
                    <div className="team-card-header">
                      <div className="team-card-avatar">
                        {team.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="team-card-info">
                        <h3 className="team-card-name">{team.name}</h3>
                        <p className="team-card-event">{team.event?.name || "Hackathon Team"}</p>
                      </div>
                      <div className={`team-card-status ${isFull ? 'full' : 'open'}`}>
                        {isFull ? 'Full' : 'Open'}
                      </div>
                    </div>

                    {/* Team Description */}
                    <p className="team-card-description">
                      {team.description || "No description provided"}
                    </p>

                    {/* Team Members */}
                    <div className="team-card-members">
                      <div className="team-card-members-avatars">
                        {team.members?.slice(0, 4).map((member, idx) => (
                          <div 
                            key={idx} 
                            className="member-avatar"
                            style={{ 
                              background: `linear-gradient(135deg, #${Math.floor(Math.random()*16777215).toString(16).slice(0,6)}, #${Math.floor(Math.random()*16777215).toString(16).slice(0,6)})`,
                              zIndex: 4 - idx
                            }}
                          >
                            {member.username?.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {memberCount > 4 && (
                          <div className="member-avatar more">
                            +{memberCount - 4}
                          </div>
                        )}
                      </div>
                      <span className="team-card-members-count">
                        {memberCount}/{maxMembers} members
                      </span>
                    </div>

                    {/* Team Footer */}
                    <div className="team-card-footer">
                      <div className="team-card-leader">
                        <span className="leader-label">Lead by</span>
                        <span className="leader-name">{team.leader?.username || "Unknown"}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {isLeader && (
                          <span className="team-card-badge">Leader</span>
                        )}
                        {isMember && !isLeader && (
                          <span className="team-card-badge" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>
                            Member
                          </span>
                        )}
                      </div>
                    </div>
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
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
        // Fetch user first
        const userRes = await axios.get("/users/me/").catch(() => null);
        setUser(userRes?.data || null);
        
        // Then fetch teams
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
    if (!user) {
      // Store the intended destination
      sessionStorage.setItem('redirectAfterLogin', '/teams/create');
      router.push('/login?message=Please login to create a team');
    } else {
      router.push('/teams/create');
    }
  };

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
        {/* Header with Create Button - Always visible */}
        <div className="event-detail-teams-header">
          <div>
            <h1 className="dashboard-welcome-title">Teams</h1>
            <p className="dashboard-welcome-subtitle">Find teammates or create your own team</p>
          </div>
          
          {/* Create Team Button - Always visible, handles auth internally */}
          <button onClick={handleCreateClick} className="event-detail-teams-create">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M5.5 20v-2a5 5 0 0 1 10 0v2" />
              <line x1="19" y1="11" x2="19" y2="15" />
              <line x1="21" y1="13" x2="17" y2="13" />
            </svg>
            Create New Team
          </button>
        </div>

        {/* Search and Filter - Using events classes */}
        <div className="events-filters">
          <div className="events-search-wrapper">
            <svg className="events-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search teams by name or description..."
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
          <div className="event-detail-teams-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>No teams found</h3>
            <p>
              {searchTerm 
                ? "Try adjusting your search terms"
                : filter !== 'all' 
                ? `No ${filter} teams available`
                : "Be the first to create a team!"}
            </p>
            <button onClick={handleCreateClick} className="event-detail-teams-empty-btn">
              Create a Team
            </button>
          </div>
        ) : (
          <div className="event-detail-teams-grid">
            {filteredTeams.map((team) => {
              const memberCount = team.members?.length || 0;
              const maxMembers = team.max_members || 4;
              const isFull = memberCount >= maxMembers;
              const isLeader = user && team.leader?.id === user.id;
              const isMember = user && team.members?.some(m => m.id === user.id);

              return (
                <Link href={`/teams/${team.id}`} key={team.id} className="event-detail-team-card">
                  {/* Team Header */}
                  <div className="event-detail-team-header">
                    <h4>{team.name}</h4>
                    <span className="event-detail-team-size">
                      {memberCount}/{maxMembers}
                    </span>
                  </div>

                  {/* Team Event */}
                  <p style={{ 
                    fontSize: '0.85rem', 
                    color: 'rgba(255,255,255,0.5)', 
                    marginBottom: '0.75rem' 
                  }}>
                    {team.event?.name || "Hackathon Team"}
                  </p>

                  {/* Team Description */}
                  <p style={{ 
                    fontSize: '0.9rem', 
                    color: 'rgba(255,255,255,0.7)', 
                    marginBottom: '1rem',
                    lineHeight: '1.5'
                  }}>
                    {team.description || "No description provided"}
                  </p>

                  {/* Team Members */}
                  <div className="event-detail-team-members">
                    {team.members?.slice(0, 3).map((member, idx) => (
                      <div key={idx} className="event-detail-team-member">
                        <div className="event-detail-team-member-avatar">
                          {member.username?.charAt(0).toUpperCase()}
                        </div>
                        <span>{member.username}</span>
                      </div>
                    ))}
                    {memberCount > 3 && (
                      <div className="event-detail-team-member-more">
                        +{memberCount - 3}
                      </div>
                    )}
                  </div>

                  {/* Leader and Status */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginTop: '1rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                        Lead by
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: '500' }}>
                        {team.leader?.username || "Unknown"}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {isLeader && (
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          background: 'rgba(59, 130, 246, 0.15)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          color: '#3B82F6'
                        }}>
                          Leader
                        </span>
                      )}
                      {isMember && !isLeader && (
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          background: 'rgba(34, 197, 94, 0.15)',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          color: '#4ade80'
                        }}>
                          Member
                        </span>
                      )}
                      <span className={`event-detail-team-size ${isFull ? 'full' : 'open'}`}
                        style={{
                          color: isFull ? '#f87171' : '#4ade80',
                          fontWeight: '600'
                        }}>
                        {isFull ? 'Full' : 'Open'}
                      </span>
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
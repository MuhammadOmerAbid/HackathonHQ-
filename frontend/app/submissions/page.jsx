"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "../../utils/axios";

export default function SubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // all, pending, reviewed, winning
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [submissionsRes, userRes] = await Promise.all([
          axios.get("/submissions/"),
          axios.get("/users/me/").catch(() => null)
        ]);
        
        setSubmissions(submissionsRes.data.results || submissionsRes.data || []);
        setUser(userRes?.data || null);
      } catch (err) {
        console.error("Error fetching submissions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredSubmissions = submissions.filter(sub => {
    // Search filter
    const matchesSearch = sub.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.team?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.event?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesFilter = 
      filter === "all" ? true :
      filter === "pending" ? !sub.is_reviewed :
      filter === "reviewed" ? sub.is_reviewed && !sub.is_winner :
      filter === "winning" ? sub.is_winner : true;

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (sub) => {
    if (sub.is_winner) {
      return { text: 'Winner 🏆', class: 'winner' };
    } else if (sub.is_reviewed) {
      return { text: 'Reviewed', class: 'reviewed' };
    } else {
      return { text: 'Pending', class: 'pending' };
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="blob blob1"></div>
        <div className="blob blob2"></div>
        <div className="blob blob3"></div>
        <div className="dashboard-spinner"></div>
        <p>Loading submissions...</p>
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
            <h1 className="dashboard-welcome-title">Submissions</h1>
            <p className="dashboard-welcome-subtitle">Explore projects from hackathon participants</p>
          </div>
          {user && (
            <Link href="/submissions/create" className="dashboard-btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px', marginRight: '0.5rem' }}>
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New Submission
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
              placeholder="Search submissions..."
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
              All
            </button>
            <button
              className={`events-filter-tab ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending
            </button>
            <button
              className={`events-filter-tab ${filter === 'reviewed' ? 'active' : ''}`}
              onClick={() => setFilter('reviewed')}
            >
              Reviewed
            </button>
            <button
              className={`events-filter-tab ${filter === 'winning' ? 'active' : ''}`}
              onClick={() => setFilter('winning')}
            >
              Winners
            </button>
          </div>
        </div>

        {/* Submissions Grid */}
        {filteredSubmissions.length === 0 ? (
          <div className="teams-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 22 7 22 17 12 22 2 17 2 7 12 2"></polygon>
              <line x1="12" y1="22" x2="12" y2="12"></line>
              <polyline points="22 7 12 12 2 7"></polyline>
            </svg>
            <h3>No submissions found</h3>
            <p>Try adjusting your search or create a new submission</p>
            {user && (
              <Link href="/submissions/create" className="teams-empty-btn">
                Submit a Project
              </Link>
            )}
          </div>
        ) : (
          <div className="events-grid">
            {filteredSubmissions.map((sub) => {
              const status = getStatusBadge(sub);
              
              return (
                <Link href={`/submissions/${sub.id}`} key={sub.id} className="events-item-link">
                  <div className="events-item">
                    {/* Submission Header */}
                    <div className="events-item-header">
                      <div>
                        <h3 className="events-item-title">{sub.title || "Untitled Project"}</h3>
                        <p className="events-item-organizer">
                          {sub.team?.name || "Team"} • {sub.event?.name || "Hackathon"}
                        </p>
                      </div>
                      <span className={`submission-status-badge ${status.class}`}>
                        {status.text}
                      </span>
                    </div>

                    {/* Submission Description */}
                    <p className="events-item-description">
                      {sub.description || sub.summary || "No description provided"}
                    </p>

                    {/* Submission Footer */}
                    <div className="events-item-footer">
                      <div className="events-item-date">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>Submitted {new Date(sub.created_at || Date.now()).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="events-item-stats">
                        {sub.feedback_count > 0 && (
                          <div className="events-item-stat">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span>{sub.feedback_count}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Demo/Repo Links */}
                    {(sub.demo_url || sub.repo_url) && (
                      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                        {sub.demo_url && (
                          <span className="submission-link-tag" onClick={(e) => e.preventDefault()}>
                            🔗 Live Demo
                          </span>
                        )}
                        {sub.repo_url && (
                          <span className="submission-link-tag" onClick={(e) => e.preventDefault()}>
                            📁 Repository
                          </span>
                        )}
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
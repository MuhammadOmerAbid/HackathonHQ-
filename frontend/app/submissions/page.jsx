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
  const [filter, setFilter] = useState("all");
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState("grid");

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
    const matchesSearch =
      sub.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.team?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.event?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter =
      filter === "all" ? true :
      filter === "pending" ? !sub.is_reviewed :
      filter === "reviewed" ? sub.is_reviewed && !sub.is_winner :
      filter === "winning" ? sub.is_winner : true;
    
    return matchesSearch && matchesFilter;
  });

  const getStatus = (sub) => {
    if (sub.is_winner) return { text: "Winner", cls: "winner" };
    if (sub.is_reviewed) return { text: "Reviewed", cls: "reviewed" };
    return { text: "Pending", cls: "pending" };
  };

  if (loading) {
    return (
      <div className="submissions-loading">
        <div className="submissions-spinner" />
        <p>Loading submissions...</p>
      </div>
    );
  }

  return (
    <div className="submissions-page">
      <div className="submissions-container">
        {/* Header */}
        <div className="submissions-header">
          <div>
            <div className="submissions-eyebrow">
              <span className="submissions-eyebrow-dot" />
              <span className="submissions-eyebrow-label">Projects</span>
            </div>
            <h1 className="submissions-title">Submissions</h1>
            <p className="submissions-subtitle">Explore projects from hackathon participants</p>
          </div>
          <div className="submissions-header-actions">
  {user && (
    <Link href="/submissions/create" className="ev-btn-primary">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      <span>New Submission</span>
    </Link>
  )}
  <button 
    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
    className="ev-btn-ghost"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {viewMode === 'grid' ? (
        <path d="M4 6h16M4 12h16M4 18h16" />
      ) : (
        <path d="M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM10 10h4v4h-4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h4v4h-4zM16 16h4v4h-4z" />
      )}
    </svg>
    {viewMode === 'grid' ? 'List' : 'Grid'}
  </button>
</div>
        </div>

        {/* Stats Cards - SVG Icons */}
        <div className="submissions-stats">
          <div className="submissions-stat-card">
            <div className="submissions-stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" strokeWidth="2">
                <polygon points="12 2 22 7 22 17 12 22 2 17 2 7 12 2" />
                <line x1="12" y1="22" x2="12" y2="12" />
                <polyline points="22 7 12 12 2 7" />
              </svg>
            </div>
            <div className="submissions-stat-content">
              <span className="submissions-stat-value">{submissions.length}</span>
              <span className="submissions-stat-label">Total Projects</span>
            </div>
          </div>

          <div className="submissions-stat-card">
            <div className="submissions-stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="submissions-stat-content">
              <span className="submissions-stat-value">{submissions.filter(s => !s.is_reviewed).length}</span>
              <span className="submissions-stat-label">Pending</span>
            </div>
          </div>

          <div className="submissions-stat-card">
            <div className="submissions-stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="submissions-stat-content">
              <span className="submissions-stat-value">{submissions.filter(s => s.is_reviewed && !s.is_winner).length}</span>
              <span className="submissions-stat-label">Reviewed</span>
            </div>
          </div>

          <div className="submissions-stat-card">
            <div className="submissions-stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="submissions-stat-content">
              <span className="submissions-stat-value submissions-stat-highlight">{submissions.filter(s => s.is_winner).length}</span>
              <span className="submissions-stat-label">Winners</span>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="submissions-filter-section">
          <div className="submissions-search-wrapper">
            <svg className="submissions-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="submissions-search-input"
            />
          </div>

          <div className="submissions-filter-tabs">
            {["all", "pending", "reviewed", "winning"].map(tab => (
              <button
                key={tab}
                className={`submissions-filter-tab ${filter === tab ? "active" : ""}`}
                onClick={() => setFilter(tab)}
              >
                {tab === "winning" ? "Winners" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {filteredSubmissions.length === 0 ? (
          <div className="submissions-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="12 2 22 7 22 17 12 22 2 17 2 7 12 2" />
              <line x1="12" y1="22" x2="12" y2="12" />
              <polyline points="22 7 12 12 2 7" />
            </svg>
            <h3>No submissions found</h3>
            <p>Try adjusting your search or be the first to submit</p>
            {user && (
              <Link href="/submissions/create" className="submissions-empty-btn">
                Submit a Project
              </Link>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="submissions-grid">
            {filteredSubmissions.map((sub) => {
              const status = getStatus(sub);
              return (
                <Link href={`/submissions/${sub.id}`} key={sub.id} className="submissions-card-link">
                  <div className={`submissions-card ${status.cls === "winner" ? "submissions-card-winner" : ""}`}>
                    <div className="submissions-card-header">
                      <h3 className="submissions-card-title">{sub.title || "Untitled Project"}</h3>
                      <span className={`submissions-badge submissions-badge-${status.cls}`}>
                        {status.text}
                      </span>
                    </div>
                    
                    <p className="submissions-card-team">
                      {sub.team?.name || "Team"} · {sub.event?.name || "Hackathon"}
                    </p>
                    
                    <p className="submissions-card-description">
                      {sub.summary || sub.description?.substring(0, 120) + "..." || "No description provided."}
                    </p>

                    {sub.technologies?.length > 0 && (
                      <div className="submissions-card-techs">
                        {sub.technologies.slice(0, 3).map((tech, i) => (
                          <span key={i} className="submissions-tech-tag">{tech}</span>
                        ))}
                      </div>
                    )}

                    <div className="submissions-card-footer">
                      <span className="submissions-card-date">
                        {new Date(sub.created_at || Date.now()).toLocaleDateString()}
                      </span>
                      <div className="submissions-card-links">
                        {sub.demo_url && (
                          <span className="submissions-link-icon" title="Live Demo">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="2" y1="12" x2="22" y2="12" />
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                          </span>
                        )}
                        {sub.repo_url && (
                          <span className="submissions-link-icon" title="Repository">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="submissions-list-view">
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Team</th>
                  <th>Event</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((sub) => {
                  const status = getStatus(sub);
                  return (
                    <tr 
                      key={sub.id} 
                      onClick={() => router.push(`/submissions/${sub.id}`)}
                      className="submissions-table-row"
                    >
                      <td className="submissions-table-title">{sub.title || "Untitled"}</td>
                      <td>{sub.team?.name || "—"}</td>
                      <td>{sub.event?.name || "—"}</td>
                      <td>
                        <span className={`submissions-table-badge submissions-badge-${status.cls}`}>
                          {status.text}
                        </span>
                      </td>
                      <td>{new Date(sub.created_at || Date.now()).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
  .submissions-page {
    min-height: 100vh;
    background: #0a0a0a;
    font-family: 'DM Sans', sans-serif;
  }

  .submissions-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 2rem;
    position: relative;
    z-index: 10;
  }

  /* Header */
  .submissions-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 2rem;
  }

  .submissions-eyebrow {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .submissions-eyebrow-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #6EE7B7;
  }

  .submissions-eyebrow-label {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #6EE7B7;
  }

  .submissions-title {
    font-family: 'Syne', sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    color: #fff;
    margin: 0 0 0.25rem 0;
  }

  .submissions-subtitle {
    color: #888;
    margin: 0;
    font-size: 1rem;
  }

  .submissions-header-actions {
    display: flex;
    gap: 1rem;
  }

/* Button Styles - Fixed with visible border */
.submissions-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #6EE7B7;
  color: #0c0c0f;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
  line-height: 1.4;
  white-space: nowrap;
  border: 1px solid #4fb88b; /* Darker green border */
  cursor: pointer;
  min-height: 44px;
  min-width: fit-content;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Subtle shadow */
}

.submissions-btn-primary:hover {
  background: #86efac;
  border-color: #3a9e75; /* Darker border on hover */
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(110, 231, 183, 0.3); /* Glow effect on hover */
}

.submissions-btn-primary svg {
  width: 20px;
  height: 20px;
  display: block;
  flex-shrink: 0;
  stroke: #0c0c0f; /* Dark stroke for contrast */
}

.submissions-view-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.2); /* More visible border */
  border-radius: 8px;
  color: white;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1.4;
  white-space: nowrap;
  min-height: 44px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.submissions-view-toggle-btn:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.3);
  transform: translateY(-1px);
}

.submissions-view-toggle-btn svg {
  width: 20px;
  height: 20px;
  display: block;
  flex-shrink: 0;
}

  /* Stats Cards */
  .submissions-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .submissions-stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 12px;
    transition: all 0.2s;
  }

  .submissions-stat-card:hover {
    border-color: #6EE7B7;
    background: rgba(110,231,183,0.05);
  }

  .submissions-stat-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(110,231,183,0.1);
    border-radius: 12px;
  }

  .submissions-stat-icon svg {
    width: 24px;
    height: 24px;
  }

  .submissions-stat-content {
    display: flex;
    flex-direction: column;
  }

  .submissions-stat-value {
    font-family: 'Syne', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    line-height: 1;
    margin-bottom: 0.25rem;
  }

  .submissions-stat-highlight {
    color: #6EE7B7;
  }

  .submissions-stat-label {
    font-size: 0.75rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Search and Filter */
  .submissions-filter-section {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }

  .submissions-search-wrapper {
    position: relative;
    flex: 1;
    min-width: 280px;
  }

  .submissions-search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    color: rgba(255,255,255,0.4);
  }

  .submissions-search-input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.75rem;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    color: white;
    font-size: 0.95rem;
    outline: none;
    transition: all 0.2s;
  }

  .submissions-search-input:focus {
    border-color: #6EE7B7;
  }

  .submissions-filter-tabs {
    display: flex;
    gap: 0.25rem;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 8px;
    padding: 0.25rem;
  }

  .submissions-filter-tab {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: rgba(255,255,255,0.6);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .submissions-filter-tab:hover {
    color: #fff;
  }

  .submissions-filter-tab.active {
    background: #6EE7B7;
    color: #0c0c0f;
    font-weight: 600;
  }

  /* Grid View */
  .submissions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .submissions-card-link {
    text-decoration: none;
  }

  .submissions-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.2s;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .submissions-card:hover {
    border-color: #6EE7B7;
    transform: translateY(-2px);
    box-shadow: 0 10px 20px -10px rgba(110,231,183,0.2);
  }

  .submissions-card-winner {
    border-left: 3px solid #fbbf24;
  }

  .submissions-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
  }

  .submissions-card-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: #fff;
    margin: 0;
  }

  .submissions-badge {
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 600;
  }

  .submissions-badge-winner {
    background: rgba(251,191,36,0.15);
    color: #fbbf24;
  }

  .submissions-badge-reviewed {
    background: rgba(96,165,250,0.15);
    color: #60a5fa;
  }

  .submissions-badge-pending {
    background: rgba(156,163,175,0.15);
    color: #9ca3af;
  }

  .submissions-card-team {
    font-size: 0.85rem;
    color: rgba(255,255,255,0.5);
    margin: 0 0 1rem 0;
  }

  .submissions-card-description {
    font-size: 0.9rem;
    color: rgba(255,255,255,0.7);
    line-height: 1.6;
    margin: 0 0 1rem 0;
    flex: 1;
  }

  .submissions-card-techs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 1rem;
  }

  .submissions-tech-tag {
    font-size: 0.7rem;
    padding: 0.2rem 0.5rem;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 4px;
    color: rgba(255,255,255,0.6);
  }

  .submissions-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 1rem;
    border-top: 1px solid rgba(255,255,255,0.05);
    margin-top: auto;
  }

  .submissions-card-date {
    font-size: 0.8rem;
    color: rgba(255,255,255,0.4);
  }

  .submissions-card-links {
    display: flex;
    gap: 0.5rem;
  }

  .submissions-link-icon {
    color: rgba(255,255,255,0.4);
    transition: color 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .submissions-link-icon:hover {
    color: #6EE7B7;
  }

  .submissions-link-icon svg {
    width: 16px;
    height: 16px;
  }

  /* List View */
  .submissions-list-view {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 12px;
    overflow: hidden;
  }

  .submissions-table {
    width: 100%;
    border-collapse: collapse;
  }

  .submissions-table th {
    text-align: left;
    padding: 1rem;
    background: rgba(0,0,0,0.2);
    color: rgba(255,255,255,0.5);
    font-size: 0.8rem;
    font-weight: 600;
  }

  .submissions-table td {
    padding: 1rem;
    color: rgba(255,255,255,0.8);
    font-size: 0.9rem;
    border-top: 1px solid rgba(255,255,255,0.05);
  }

  .submissions-table-row {
    cursor: pointer;
    transition: background 0.2s;
  }

  .submissions-table-row:hover {
    background: rgba(255,255,255,0.05);
  }

  .submissions-table-title {
    color: #fff;
    font-weight: 500;
  }

  .submissions-table-badge {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    font-size: 0.7rem;
  }

  /* Empty State */
  .submissions-empty {
    text-align: center;
    padding: 4rem;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 12px;
  }

  .submissions-empty svg {
    color: rgba(255,255,255,0.2);
    margin-bottom: 1rem;
  }

  .submissions-empty h3 {
    font-size: 1.2rem;
    font-weight: 600;
    color: #fff;
    margin: 0 0 0.5rem 0;
  }

  .submissions-empty p {
    color: rgba(255,255,255,0.5);
    margin: 0 0 1.5rem 0;
  }

  .submissions-empty-btn {
    display: inline-block;
    padding: 0.6rem 1.2rem;
    background: #6EE7B7;
    color: #0c0c0f;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    transition: background 0.2s;
  }

  .submissions-empty-btn:hover {
    background: #86efac;
  }

  .submissions-empty-btn svg {
    display: block;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  /* Loading */
  .submissions-loading {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #0a0a0a;
    color: rgba(255,255,255,0.5);
    gap: 1rem;
  }

  .submissions-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255,255,255,0.1);
    border-top-color: #6EE7B7;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .submissions-container {
      padding: 1rem;
    }

    .submissions-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .submissions-stats {
      grid-template-columns: repeat(2, 1fr);
    }

    .submissions-filter-section {
      flex-direction: column;
    }
  }
`}</style>
    </div>
  );
}
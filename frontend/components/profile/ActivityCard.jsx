"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import axios from "@/utils/axios";

export default function ActivityCard({ activities: propActivities, loading: propLoading }) {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  // Fetch real user activities using axios
  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get('/users/activities/');
        setActivities(response.data || []);
      } catch (err) {
        console.error('Error fetching activities:', err);
        
        if (err.response) {
          setError(err.response.data?.error || `Error ${err.response.status}: Failed to fetch activities`);
        } else if (err.request) {
          setError('No response from server. Please check your connection.');
        } else {
          setError(err.message || 'Failed to fetch activities');
        }
      } finally {
        setLoading(false);
      }
    };

    if (propActivities) {
      setActivities(propActivities);
      setLoading(propLoading || false);
    } else {
      fetchActivities();
    }
  }, [user, propActivities, propLoading]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getActivityIcon = (type) => {
  const icons = {
    // Team activities
    team_join: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    team_create: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 4v16M4 12h16"></path>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    ),
    team_leave: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
      </svg>
    ),
    
    // Submission activities
    submission: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
    ),
    feedback: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    ),
    winner: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="7"></circle>
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
      </svg>
    ),
    
    // NEW: Role change activities
    became_judge: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
        <path d="M12 22v-4"></path>
      </svg>
    ),
    became_organizer: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.5"></path>
        <path d="M16 2v4"></path>
        <path d="M8 2v4"></path>
        <path d="M3 10h18"></path>
      </svg>
    ),
    role_removed: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      </svg>
    ),
  };
  return icons[type] || icons.submission;
};

const getActivityColor = (type) => {
  const colors = {
    // Team activities
    team_join: '#6EE7B7',
    team_create: '#6EE7B7',
    team_leave: '#f87171',
    
    // Submission activities
    submission: '#60a5fa',
    feedback: '#fbbf24',
    winner: '#fbbf24',
    
    // NEW: Role change activities
    became_judge: '#a78bfa',      // Purple
    became_organizer: '#f472b6',   // Pink
    role_removed: '#f87171',       // Red
  };
  return colors[type] || '#888';
};

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'teams') return activity.type?.includes('team');
    if (filter === 'submissions') return ['submission', 'feedback', 'review', 'winner'].includes(activity.type);
    return true;
  });

  if (!user) {
    return (
      <div className="profile-card">
        <div className="activity-empty-state">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3>Sign in to view your activity</h3>
          <p>Track your teams, submissions, and feedback</p>
          <Link href="/login" className="activity-login-btn">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-card">
        <div className="activity-header">
          <h3>Activity Feed</h3>
          <div className="activity-filters">
            <button className="filter-btn active">All</button>
            <button className="filter-btn">Teams</button>
            <button className="filter-btn">Submissions</button>
          </div>
        </div>
        <div className="activity-loading">
          {[1, 2, 3].map((i) => (
            <div key={i} className="activity-item loading">
              <div className="activity-icon loading"></div>
              <div className="activity-content">
                <div className="activity-title loading"></div>
                <div className="activity-description loading"></div>
                <div className="activity-time loading"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-card">
        <div className="activity-header">
          <h3>Activity Feed</h3>
        </div>
        <div className="activity-empty-state error">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3>Failed to load activity</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="activity-retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-card">
      {/* Header with filters - ALWAYS shown */}
      <div className="activity-header">
        <h3>Activity Feed</h3>
        <div className="activity-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'teams' ? 'active' : ''}`}
            onClick={() => setFilter('teams')}
          >
            Teams
          </button>
          <button 
            className={`filter-btn ${filter === 'submissions' ? 'active' : ''}`}
            onClick={() => setFilter('submissions')}
          >
            Submissions
          </button>
        </div>
      </div>

      {/* Content - changes based on filtered activities */}
      {filteredActivities.length === 0 ? (
        <div className="activity-empty-state">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3>No activity yet</h3>
          <p>
            {filter === 'all' && 'Join teams, make submissions, and participate in events to see your activity here'}
            {filter === 'teams' && 'Join or create teams to see your team activity here'}
            {filter === 'submissions' && 'Submit projects and get feedback to see your submission activity here'}
          </p>
          <Link href={filter === 'submissions' ? '/events' : '/teams'} className="activity-browse-btn">
            {filter === 'all' && 'Browse Events'}
            {filter === 'teams' && 'Browse Teams'}
            {filter === 'submissions' && 'Browse Events'}
          </Link>
        </div>
      ) : (
        <div className="activity-list">
          {filteredActivities.map((activity) => {
            const color = getActivityColor(activity.type);
            
            return (
              <div key={activity.id} className="activity-item">
                <div 
                  className="activity-icon-wrapper"
                  style={{ 
                    backgroundColor: `${color}20`,
                  }}
                >
                  <div className="activity-icon" style={{ color: color }}>
                    {getActivityIcon(activity.type)}
                  </div>
                </div>

                <div className="activity-content">
                  <div className="activity-header-row">
                    <h4 className="activity-title">{activity.title}</h4>
                    <span className="activity-time">{formatTimestamp(activity.created_at)}</span>
                  </div>
                  
                  <p className="activity-description">{activity.description}</p>
                  
                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <div className="activity-metadata">
                      {activity.metadata.team && (
                        <Link href={`/teams/${activity.metadata.teamId}`} className="metadata-tag">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                          </svg>
                          <span>{activity.metadata.team}</span>
                        </Link>
                      )}
                      {activity.metadata.project && (
                        <Link href={`/submissions/${activity.metadata.submissionId}`} className="metadata-tag">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                          </svg>
                          <span>{activity.metadata.project}</span>
                        </Link>
                      )}
                      {activity.metadata.score && (
                        <span className="metadata-tag score">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                          <span>Score: {activity.metadata.score}/10</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .profile-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 1.5rem;
        }

        .activity-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .activity-header h3 {
          font-family: 'Syne', sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }

        .activity-filters {
          display: flex;
          gap: 0.5rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px;
          padding: 0.25rem;
        }

        .filter-btn {
          padding: 0.4rem 0.8rem;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: #888;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-btn:hover {
          color: #fff;
          background: rgba(255,255,255,0.05);
        }

        .filter-btn.active {
          background: #6EE7B7;
          color: #0a0a0a;
          font-weight: 600;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .activity-item {
          display: flex;
          gap: 1rem;
          padding: 0.75rem;
          border-radius: 8px;
          transition: background 0.2s ease;
        }

        .activity-item:hover {
          background: rgba(255,255,255,0.02);
        }

        .activity-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .activity-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
        }

        .activity-icon svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        .activity-content {
          flex: 1;
          min-width: 0; /* Prevents text overflow issues */
        }

        .activity-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.25rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .activity-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: #fff;
          margin: 0;
          word-break: break-word;
        }

        .activity-time {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.3);
          white-space: nowrap;
        }

        .activity-description {
          font-size: 0.85rem;
          color: #888;
          margin: 0 0 0.5rem 0;
          line-height: 1.5;
          word-break: break-word;
        }

        .activity-metadata {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .metadata-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.2rem 0.6rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          font-size: 0.7rem;
          color: #888;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .metadata-tag svg {
          width: 12px;
          height: 12px;
          flex-shrink: 0;
        }

        .metadata-tag span {
          line-height: 1;
        }

        .metadata-tag:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.2);
          color: #fff;
        }

        .metadata-tag.score {
          background: rgba(251,191,36,0.1);
          color: #fbbf24;
          border-color: rgba(251,191,36,0.3);
        }

        .activity-empty-state {
          text-align: center;
          padding: 2rem;
        }

        .empty-state-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .empty-state-icon svg {
          color: rgba(255,255,255,0.2);
        }

        .activity-empty-state h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 0.5rem 0;
        }

        .activity-empty-state p {
          color: #888;
          font-size: 0.85rem;
          margin: 0 0 1.5rem 0;
          max-width: 300px;
          margin-left: auto;
          margin-right: auto;
        }

        .activity-login-btn,
        .activity-browse-btn,
        .activity-retry-btn {
          display: inline-block;
          padding: 0.5rem 1.2rem;
          background: #6EE7B7;
          border: none;
          border-radius: 8px;
          color: #0c0c0f;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .activity-retry-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
        }

        .activity-login-btn:hover,
        .activity-browse-btn:hover {
          background: #86efac;
          transform: translateY(-2px);
        }

        .activity-retry-btn:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.3);
        }

        /* Loading States */
        .activity-loading {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .activity-item.loading {
          pointer-events: none;
        }

        .activity-icon.loading {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(255,255,255,0.05) !important;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .activity-title.loading,
        .activity-description.loading,
        .activity-time.loading {
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .activity-title.loading {
          width: 120px;
          height: 16px;
        }

        .activity-description.loading {
          width: 200px;
          height: 14px;
          margin: 0.5rem 0;
        }

        .activity-time.loading {
          width: 80px;
          height: 12px;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
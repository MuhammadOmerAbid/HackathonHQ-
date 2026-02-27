"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "../utils/axios";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    events: { total: 0, live: 0, upcoming: 0 },
    teams: 0,
    submissions: 0,
    users: 0
  });
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all required data in parallel
        const [eventsRes, teamsRes, submissionsRes, usersRes] = await Promise.all([
          axios.get("/events/"),
          axios.get("/teams/"),
          axios.get("/submissions/"),
          axios.get("/users/")
        ]);

        const events = eventsRes.data.results || [];
        const teams = teamsRes.data.results || teamsRes.data || [];
        const submissions = submissionsRes.data.results || submissionsRes.data || [];
        const users = usersRes.data.results || usersRes.data || [];

        // Calculate event stats
        const now = new Date();
        const liveEvents = events.filter(event => {
          const start = new Date(event.start_date);
          const end = new Date(event.end_date);
          return start <= now && end >= now;
        });

        const upcomingEvents = events.filter(event => {
          const start = new Date(event.start_date);
          return start > now;
        });

        setStats({
          events: {
            total: events.length,
            live: liveEvents.length,
            upcoming: upcomingEvents.length
          },
          teams: teams.length,
          submissions: submissions.length,
          users: users.length
        });

        // Get featured/upcoming events (limit to 3)
        setFeaturedEvents(events.slice(0, 3));

        // Mock recent activities (replace with real data from backend)
        setRecentActivities([
          { id: 1, type: 'team', message: 'New team "Code Warriors" formed', time: '2 hours ago' },
          { id: 2, type: 'submission', message: 'Project "AI Assistant" submitted', time: '5 hours ago' },
          { id: 3, type: 'event', message: 'Hackathon "TechFest 2024" started', time: '1 day ago' },
          { id: 4, type: 'user', message: 'New user "johndoe" joined', time: '2 days ago' }
        ]);

        // Get current user (if authenticated)
        try {
          const userRes = await axios.get("/users/me/");
          setUser(userRes.data);
        } catch {
          setUser(null);
        }

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="blob blob1"></div>
        <div className="blob blob2"></div>
        <div className="blob blob3"></div>
        <div className="dashboard-spinner"></div>
        <p>Loading your dashboard...</p>
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
        {/* Welcome Section */}
        <div className="dashboard-welcome">
          <div className="dashboard-welcome-text">
            <h1 className="dashboard-welcome-title">
              Welcome back, {user?.username || 'Hacker'}! 👋
            </h1>
            <p className="dashboard-welcome-subtitle">
              Ready to build something amazing? Explore hackathons, form teams, and submit your projects.
            </p>
          </div>
          {!user && (
            <div className="dashboard-welcome-actions">
              <Link href="/login" className="dashboard-btn-primary">
                Login
              </Link>
              <Link href="/register" className="dashboard-btn-secondary">
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div className="dashboard-stat-info">
              <h3 className="dashboard-stat-value">{stats.events.total}</h3>
              <p className="dashboard-stat-label">Total Events</p>
            </div>
            <div className="dashboard-stat-badge">
              <span className="badge-live">{stats.events.live} Live</span>
              <span className="badge-upcoming">{stats.events.upcoming} Upcoming</span>
            </div>
          </div>

          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div className="dashboard-stat-info">
              <h3 className="dashboard-stat-value">{stats.teams}</h3>
              <p className="dashboard-stat-label">Active Teams</p>
            </div>
            <Link href="/teams" className="dashboard-stat-link">
              View Teams →
            </Link>
          </div>

          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 22 7 22 17 12 22 2 17 2 7 12 2"></polygon>
                <line x1="12" y1="22" x2="12" y2="12"></line>
                <polyline points="22 7 12 12 2 7"></polyline>
                <line x1="16" y1="5.5" x2="8" y2="9.5"></line>
              </svg>
            </div>
            <div className="dashboard-stat-info">
              <h3 className="dashboard-stat-value">{stats.submissions}</h3>
              <p className="dashboard-stat-label">Submissions</p>
            </div>
            <Link href="/submissions" className="dashboard-stat-link">
              View Submissions →
            </Link>
          </div>

          <div className="dashboard-stat-card">
            <div className="dashboard-stat-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="dashboard-stat-info">
              <h3 className="dashboard-stat-value">{stats.users}</h3>
              <p className="dashboard-stat-label">Total Users</p>
            </div>
            <Link href="/users" className="dashboard-stat-link">
              View Users →
            </Link>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="dashboard-main-grid">
          {/* Quick Actions */}
          <div className="dashboard-card">
            <h2 className="dashboard-card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Quick Actions
            </h2>
            <div className="dashboard-quick-actions">
              <Link href="/events" className="dashboard-quick-action">
                <div className="quick-action-icon">📋</div>
                <div>
                  <h4>Browse Events</h4>
                  <p>Find hackathons to join</p>
                </div>
              </Link>
              <Link href="/teams/create" className="dashboard-quick-action">
                <div className="quick-action-icon">👥</div>
                <div>
                  <h4>Create Team</h4>
                  <p>Form a new team</p>
                </div>
              </Link>
              <Link href="/submissions/create" className="dashboard-quick-action">
                <div className="quick-action-icon">🚀</div>
                <div>
                  <h4>Submit Project</h4>
                  <p>Submit your hackathon project</p>
                </div>
              </Link>
              <Link href="/profile" className="dashboard-quick-action">
                <div className="quick-action-icon">⚙️</div>
                <div>
                  <h4>Profile Settings</h4>
                  <p>Update your information</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Featured/Upcoming Events */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2 className="dashboard-card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"></path>
                </svg>
                Featured Events
              </h2>
              <Link href="/events" className="dashboard-card-link">
                View All
              </Link>
            </div>
            <div className="dashboard-featured-events">
              {featuredEvents.length > 0 ? (
                featuredEvents.map(event => (
                  <Link href={`/events/${event.id}`} key={event.id} className="dashboard-featured-event">
                    <div className="featured-event-header">
                      <h3 className="featured-event-title">{event.name}</h3>
                      {event.is_premium && (
                        <span className="featured-event-premium">PREMIUM</span>
                      )}
                    </div>
                    <p className="featured-event-description">{event.description.substring(0, 100)}...</p>
                    <div className="featured-event-footer">
                      <span className="featured-event-date">
                        {new Date(event.start_date).toLocaleDateString()}
                      </span>
                      <span className="featured-event-link">View Details →</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="dashboard-empty">
                  <p>No featured events available</p>
                  <Link href="/events" className="dashboard-empty-link">
                    Browse Events
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="dashboard-card">
            <h2 className="dashboard-card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Recent Activity
            </h2>
            <div className="dashboard-activity">
              {recentActivities.length > 0 ? (
                recentActivities.map(activity => (
                  <div key={activity.id} className="dashboard-activity-item">
                    <div className={`activity-icon activity-${activity.type}`}>
                      {activity.type === 'team' && '👥'}
                      {activity.type === 'submission' && '🚀'}
                      {activity.type === 'event' && '📅'}
                      {activity.type === 'user' && '👤'}
                    </div>
                    <div className="activity-content">
                      <p className="activity-message">{activity.message}</p>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="dashboard-empty">
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Cards */}
          <div className="dashboard-card dashboard-nav-card">
            <h2 className="dashboard-card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
              Quick Navigation
            </h2>
            <div className="dashboard-nav-grid">
              <Link href="/events" className="dashboard-nav-item">
                <span className="nav-item-icon">📅</span>
                <span className="nav-item-label">Events</span>
              </Link>
              <Link href="/teams" className="dashboard-nav-item">
                <span className="nav-item-icon">👥</span>
                <span className="nav-item-label">Teams</span>
              </Link>
              <Link href="/submissions" className="dashboard-nav-item">
                <span className="nav-item-icon">📤</span>
                <span className="nav-item-label">Submissions</span>
              </Link>
              <Link href="/posts" className="dashboard-nav-item">
                <span className="nav-item-icon">📝</span>
                <span className="nav-item-label">Posts</span>
              </Link>
              <Link href="/users" className="dashboard-nav-item">
                <span className="nav-item-icon">👤</span>
                <span className="nav-item-label">Users</span>
              </Link>
              <Link href="/profile" className="dashboard-nav-item">
                <span className="nav-item-icon">⚙️</span>
                <span className="nav-item-label">Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
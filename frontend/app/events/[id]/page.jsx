"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "../../../utils/axios";

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventRes, teamsRes] = await Promise.all([
          axios.get(`/events/${id}/`),
          axios.get(`/events/${id}/teams/`)
        ]);
        setEvent(eventRes.data);
        setTeams(teamsRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const getEventStatus = () => {
    if (!event) return null;
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);

    if (startDate > now) return { label: "Upcoming", color: "blue" };
    if (endDate < now) return { label: "Ended", color: "gray" };
    return { label: "Live Now", color: "green" };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="event-detail-loading">
        <div className="blob blob1"></div>
        <div className="blob blob2"></div>
        <div className="blob blob3"></div>
        <div className="event-detail-spinner"></div>
        <p>Loading hackathon details...</p>
      </div>
    );
  }

  if (!event) {
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
          <h2>Hackathon Not Found</h2>
          <p>The hackathon you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => router.push('/events')} className="event-detail-back-btn">
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const status = getEventStatus();

  return (
    <div className="event-detail-container">
      {/* Animated background blobs */}
      <div className="blob blob1"></div>
      <div className="blob blob2"></div>
      <div className="blob blob3"></div>

      <div className="event-detail-card">
        {/* Header */}
        <div className="event-detail-header">
          <button onClick={() => router.push('/events')} className="event-detail-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Events
          </button>

          <div className="event-detail-title-section">
            <div className="event-detail-title-wrapper">
              <h1 className="event-detail-title">{event.name}</h1>
              {event.is_premium && (
                <span className="event-detail-premium">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  PREMIUM
                </span>
              )}
            </div>
            <p className="event-detail-organizer">Organized by {event.organizer?.username || 'Hackathon Team'}</p>
          </div>

          <div className={`event-detail-status ${status.color}`}>
            {status.label}
          </div>
        </div>

        {/* Tabs */}
        <div className="event-detail-tabs">
          {["overview", "teams", "submissions", "prizes"].map((tab) => (
            <button
              key={tab}
              className={`event-detail-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="event-detail-content">
          {activeTab === "overview" && (
            <div className="event-detail-overview">
              <div className="event-detail-info-grid">
                <div className="event-detail-info-card">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <div>
                    <h4>Start Date</h4>
                    <p>{formatDate(event.start_date)}</p>
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
                    <h4>End Date</h4>
                    <p>{formatDate(event.end_date)}</p>
                  </div>
                </div>

                <div className="event-detail-info-card">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <div>
                    <h4>Participants</h4>
                    <p>{teams.reduce((acc, team) => acc + team.members.length, 0)} hackers</p>
                  </div>
                </div>

                <div className="event-detail-info-card">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <div>
                    <h4>Teams</h4>
                    <p>{teams.length} teams registered</p>
                  </div>
                </div>
              </div>

              <div className="event-detail-description">
                <h3>About this Hackathon</h3>
                <p>{event.description}</p>
              </div>

              {status.label === "Live Now" && (
                <div className="event-detail-cta">
                  <Link href={`/events/${id}/register-team`} className="event-detail-cta-btn primary">
                    Register Team
                  </Link>
                  <Link href={`/events/${id}/submit`} className="event-detail-cta-btn secondary">
                    Make Submission
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === "teams" && (
            <div className="event-detail-teams">
              <div className="event-detail-teams-header">
                <h3>Registered Teams ({teams.length})</h3>
                {status.label === "Live Now" && (
                  <Link href={`/events/${id}/register-team`} className="event-detail-teams-create">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Create Team
                  </Link>
                )}
              </div>

              {teams.length === 0 ? (
                <div className="event-detail-teams-empty">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <p>No teams have registered yet</p>
                  {status.label === "Live Now" && (
                    <Link href={`/events/${id}/register-team`} className="event-detail-teams-empty-btn">
                      Be the first to register
                    </Link>
                  )}
                </div>
              ) : (
                <div className="event-detail-teams-grid">
                  {teams.map((team) => (
                    <Link href={`/teams/${team.id}`} key={team.id} className="event-detail-team-card">
                      <div className="event-detail-team-header">
                        <h4>{team.name}</h4>
                        <span className="event-detail-team-size">{team.members.length} members</span>
                      </div>
                      <div className="event-detail-team-members">
                        {team.members.slice(0, 3).map((member, idx) => (
                          <div key={idx} className="event-detail-team-member">
                            <div className="event-detail-team-member-avatar">
                              {member.username.charAt(0).toUpperCase()}
                            </div>
                            <span>{member.username}</span>
                          </div>
                        ))}
                        {team.members.length > 3 && (
                          <div className="event-detail-team-member-more">
                            +{team.members.length - 3}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "submissions" && (
            <div className="event-detail-submissions">
              <h3>Project Submissions</h3>
              <p className="event-detail-submissions-placeholder">
                Submissions will appear here once teams start submitting their projects.
              </p>
            </div>
          )}

          {activeTab === "prizes" && (
            <div className="event-detail-prizes">
              <h3>Prizes & Recognition</h3>
              <div className="event-detail-prizes-grid">
                <div className="event-detail-prize-card">
                  <div className="event-detail-prize-icon">🥇</div>
                  <h4>First Place</h4>
                  <p>$5,000 + Mentorship</p>
                </div>
                <div className="event-detail-prize-card">
                  <div className="event-detail-prize-icon">🥈</div>
                  <h4>Second Place</h4>
                  <p>$3,000 + Swag Pack</p>
                </div>
                <div className="event-detail-prize-card">
                  <div className="event-detail-prize-icon">🥉</div>
                  <h4>Third Place</h4>
                  <p>$1,500 + Swag Pack</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
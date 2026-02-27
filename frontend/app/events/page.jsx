"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "../../utils/axios";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, upcoming, ongoing, past
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get("/events/");
        setEvents(res.data.results);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filterEvents = (events) => {
    const now = new Date();
    
    return events.filter(event => {
      // Search filter
      if (searchTerm && !event.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !event.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Date filter
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);

      switch(filter) {
        case "upcoming":
          return startDate > now;
        case "ongoing":
          return startDate <= now && endDate >= now;
        case "past":
          return endDate < now;
        default:
          return true;
      }
    });
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);

    if (startDate > now) return { label: "Upcoming", color: "blue" };
    if (endDate < now) return { label: "Ended", color: "gray" };
    return { label: "Live", color: "green" };
  };

  const filteredEvents = filterEvents(events);

  if (loading) {
    return (
      <div className="events-loading">
        <div className="blob blob1"></div>
        <div className="blob blob2"></div>
        <div className="blob blob3"></div>
        <div className="events-spinner"></div>
        <p>Loading hackathons...</p>
      </div>
    );
  }

  return (
    <div className="events-container">
      {/* Animated background blobs */}
      <div className="blob blob1"></div>
      <div className="blob blob2"></div>
      <div className="blob blob3"></div>

      <div className="events-card">
        <div className="events-header">
          <h1 className="events-title">Hackathons</h1>
          <p className="events-subtitle">Discover and join exciting hackathon events</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="events-filters">
          <div className="events-search-wrapper">
            <svg className="events-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search hackathons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="events-search-input"
            />
          </div>

          <div className="events-filter-tabs">
            {["all", "upcoming", "ongoing", "past"].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`events-filter-tab ${filter === filterType ? "active" : ""}`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="events-empty">
            <svg className="events-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p className="events-empty-text">No hackathons found</p>
          </div>
        ) : (
          <div className="events-grid">
            {filteredEvents.map((event) => {
              const status = getEventStatus(event);
              return (
                <Link href={`/events/${event.id}`} key={event.id} className="events-item-link">
                  <div className="events-item">
                    {event.is_premium && (
                      <div className="events-premium-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        PREMIUM
                      </div>
                    )}
                    
                    <div className="events-item-header">
                      <div>
                        <h3 className="events-item-title">{event.name}</h3>
                        <p className="events-item-organizer">by {event.organizer?.username || 'Organizer'}</p>
                      </div>
                      <span className={`events-status-badge ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    <p className="events-item-description">{event.description}</p>

                    <div className="events-item-footer">
                      <div className="events-item-date">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span>
                          {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(event.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      
                      <div className="events-item-stats">
                        <div className="events-item-stat">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </svg>
                          <span>{event.teams_count || 0} teams</span>
                        </div>
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
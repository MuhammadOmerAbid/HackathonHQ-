"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "@/utils/axios";
import EventCard from "./EventCard"; // You already have this!

export default function EventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [error, setError] = useState("");

  // Check for error message from redirect
  useEffect(() => {
    const errorMsg = searchParams.get('error');
    if (errorMsg) {
      setError(errorMsg);
      setTimeout(() => setError(""), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsRes = await axios.get("/events/");
        setEvents(eventsRes.data.results || []);
        
        const token = localStorage.getItem('access');
        if (token) {
          try {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const userRes = await axios.get("/users/me/");
            setUser(userRes.data);
            
            const organizerStatus = 
              userRes.data.profile?.is_organizer === true || 
              userRes.data.is_staff || 
              userRes.data.is_superuser;
            
            setIsOrganizer(organizerStatus);
          } catch (err) {
            console.error("Error fetching user:", err);
          }
        }
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filterEvents = (events) => {
    const now = new Date();
    
    return events.filter(event => {
      if (searchTerm && !event.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !event.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

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

  const handleCreateClick = () => {
    const token = localStorage.getItem('access');
    
    if (!token) {
      sessionStorage.setItem('redirectAfterLogin', '/events/create');
      router.push('/login?message=Please login to create an event');
    } else if (!isOrganizer) {
      setError("Only event organizers can create events. If you're interested in organizing, please contact us.");
    } else {
      router.push('/events/create');
    }
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
      <div className="blob blob1"></div>
      <div className="blob blob2"></div>
      <div className="blob blob3"></div>

      <div className="events-card">
        {/* Header */}
<div className="events-header-compact">
  <div className="events-header-main">
    <div className="events-header-top">
      <div className="events-title-section">
        <h1 className="events-title">Hackathons</h1>
        {isOrganizer && (
          <div className="organizer-status">
            <span className="status-dot"></span>
            <span>Organizer</span>
          </div>
        )}
      </div>
      
      <div className="events-header-actions">
        {!user ? (
          <button onClick={() => router.push('/login')} className="btn-outline">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            Sign In
          </button>
        ) : isOrganizer ? (
          <button onClick={handleCreateClick} className="btn-primary">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create Event
          </button>
        ) : (
          <div className="user-profile-mini">
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <span className="user-name">{user?.username}</span>
          </div>
        )}
      </div>
    </div>

    <p className="events-subtitle">
      {isOrganizer ? (
        <>
          Manage your hackathons, review submissions, and engage with 
          <span className="organizer-highlight"> {events.length} events</span> 
          {user?.profile?.organization_name && (
            <> · <span className="organization-name">{user.profile.organization_name}</span></>
          )}
        </>
      ) : (
        'Discover and join exciting hackathon events from around the world'
      )}
    </p>
  </div>

  {isOrganizer && (
    <div className="organizer-quick-stats">
      <div className="stat-item">
        <span className="stat-value">{events.length}</span>
        <span className="stat-label">Total Events</span>
      </div>
      <div className="stat-divider"></div>
      <div className="stat-item">
        <span className="stat-value">
          {events.filter(e => new Date(e.end_date) > new Date()).length}
        </span>
        <span className="stat-label">Active</span>
      </div>
      <div className="stat-divider"></div>
      <div className="stat-item">
        <span className="stat-value">
          {events.reduce((acc, e) => acc + (e.teams_count || 0), 0)}
        </span>
        <span className="stat-label">Total Teams</span>
      </div>
    </div>
  )}
</div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        {/* Search and Filter */}
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

        {/* Events Grid - Using your existing EventCard component */}
        {filteredEvents.length === 0 ? (
          <div className="events-empty">
            <svg className="events-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p className="events-empty-text">No hackathons found</p>
            {isOrganizer && (
              <button onClick={handleCreateClick} className="events-empty-create-btn">
                Create the First Event
              </button>
            )}
          </div>
        ) : (
          <div className="events-grid">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        
      </div>
    </div>
  );
}
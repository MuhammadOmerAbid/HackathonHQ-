"use client";

import React from "react";
import Link from "next/link";

export default function EventCard({ event }) {
  const getEventStatus = () => {
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);

    if (startDate > now) return { label: "Upcoming", color: "blue" };
    if (endDate < now) return { label: "Ended", color: "gray" };
    return { label: "Live", color: "green" };
  };

  const status = getEventStatus();

  // Truncate description to ~150 characters
  const truncateDescription = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, text.lastIndexOf(' ', maxLength)) + '...';
  };

  return (
    <Link href={`/events/${event.id}`} className="events-item-link">
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
            <p className="events-item-organizer">
              Organized by {event.organizer_username || event.organizer?.username || 'HackForge'}
              {event.organizer_details?.profile?.organization_name && 
                ` • ${event.organizer_details.profile.organization_name}`}
            </p>
          </div>
          <span className={`events-status-badge ${status.color}`}>
            {status.label}
          </span>
        </div>

        <p className="events-item-description">
          {truncateDescription(event.description)}
        </p>

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
}
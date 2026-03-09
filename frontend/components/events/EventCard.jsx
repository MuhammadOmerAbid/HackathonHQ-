"use client";
import React from "react";
import Link from "next/link";

export default function EventCard({ event }) {
  const now = new Date();
  const start = new Date(event.start_date);
  const end = new Date(event.end_date);

  const status =
    start > now ? { label: "Upcoming", cls: "ev-tag-soon" } :
    end >= now  ? { label: "Live",     cls: "ev-tag-live" } :
                 { label: "Ended",    cls: "ev-tag-closed" };

  const dotCls =
    status.label === "Live"     ? "ev-dot-live" :
    status.label === "Upcoming" ? "ev-dot-soon" : "ev-dot-closed";

  const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <Link href={`/events/${event.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div className="ev-card">
        <div className="ev-card-top">
          <div className={`ev-dot ${dotCls}`} />
          <span className={`ev-tag ${status.cls}`}>{status.label}</span>
          {event.is_premium && <span className="ev-premium">PRO</span>}
        </div>

        <h3 className="ev-name">{event.name}</h3>
        <p className="ev-organizer">
          by {event.organizer?.username || event.organizer_username || "HackForge"}
        </p>
        <p className="ev-desc">
          {event.description?.length > 120
            ? event.description.slice(0, 120) + "…"
            : event.description}
        </p>

        <div className="ev-footer">
          <span className="ev-date">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {fmtDate(event.start_date)} – {fmtDate(event.end_date)}
          </span>
          <span className="ev-teams">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {event.teams_count || 0} teams
          </span>
        </div>
      </div>
    </Link>
  );
}
"use client";

import React from "react";
import Link from "next/link";

export default function EventCard({ event }) {
  const now   = new Date();
  const start = new Date(event.start_date);
  const end   = new Date(event.end_date);

  const status =
    start > now ? { label: "Upcoming", tagCls: "ev-tag-soon",   dotCls: "ev-dot-soon"   } :
    end >= now  ? { label: "Live",     tagCls: "ev-tag-live",   dotCls: "ev-dot-live"   } :
                 { label: "Ended",    tagCls: "ev-tag-closed", dotCls: "ev-dot-closed" };

  const fmtDate = d => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  // Days remaining / elapsed
  const daysInfo = () => {
    if (status.label === "Live") {
      const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      return diff <= 0 ? "Ends today" : `${diff}d left`;
    }
    if (status.label === "Upcoming") {
      const diff = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
      return `Starts in ${diff}d`;
    }
    return "Ended";
  };

  return (
    <Link href={`/events/${event.id}`} className="ec-link">
      <div className="ec-card">

        {/* Top strip */}
        <div className="ec-top">
          <div className="ec-status-row">
            <div className={`ev-dot ${status.dotCls}`} />
            <span className={`ev-tag ${status.tagCls}`}>{status.label}</span>
            {event.is_premium && <span className="ev-premium">PRO</span>}
          </div>
          <span className="ec-days">{daysInfo()}</span>
        </div>

        {/* Title + organizer */}
        <h3 className="ec-name">{event.name}</h3>
        <p className="ec-organizer">
          by {event.organizer?.username || event.organizer_username || "HackForge"}
        </p>

        {/* Description */}
        <p className="ec-desc">
          {event.description?.length > 110
            ? event.description.slice(0, 110) + "…"
            : event.description}
        </p>

        {/* Footer */}
        <div className="ec-footer">
          <span className="ec-date">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {fmtDate(event.start_date)} – {fmtDate(event.end_date)}
          </span>
          {(event.teams_count > 0 || event.teams_count === 0) && (
            <span className="ec-teams">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              {event.teams_count || 0} teams
            </span>
          )}
        </div>
      </div>

      <style jsx>{`
        .ec-link {
          text-decoration: none;
          display: block;
          height: 100%;
        }
        .ec-card {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 14px;
          padding: 20px 22px;
          display: flex;
          flex-direction: column;
          height: 100%;
          transition: all 0.2s ease;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        /* Glowing top accent line on hover */
        .ec-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(110,231,183,0.5), transparent);
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .ec-card:hover {
          background: #17171b;
          border-color: #6EE7B7;
          transform: translateY(-3px);
          box-shadow: 0 12px 28px -8px rgba(110,231,183,0.18);
        }
        .ec-card:hover::before { opacity: 1; }

        /* Top strip */
        .ec-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .ec-status-row {
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .ec-days {
          font-size: 10.5px;
          font-weight: 600;
          color: #6EE7B7;
          background: rgba(110,231,183,0.08);
          border: 1px solid rgba(110,231,183,0.15);
          border-radius: 100px;
          padding: 2px 9px;
          white-space: nowrap;
          letter-spacing: 0.2px;
        }

        /* Title */
        .ec-name {
          font-family: 'Syne', sans-serif;
          font-size: 15.5px;
          font-weight: 700;
          color: #f0f0f3;
          margin: 0 0 4px;
          letter-spacing: -0.2px;
          line-height: 1.3;
        }
        .ec-organizer {
          font-size: 11.5px;
          color: #5c5c6e;
          margin: 0 0 12px;
        }

        /* Description */
        .ec-desc {
          font-size: 13px;
          color: #5c5c6e;
          line-height: 1.65;
          margin: 0 0 16px;
          flex: 1;
        }

        /* Footer */
        .ec-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 14px;
          border-top: 1px solid #1e1e24;
          margin-top: auto;
        }
        .ec-date, .ec-teams {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          color: #3a3a48;
        }
        .ec-date svg, .ec-teams svg {
          flex-shrink: 0;
          color: #5c5c6e;
        }
      `}</style>
    </Link>
  );
}
  "use client";

  import React from "react";
  import Link from "next/link";

  export default function SubmissionCard({ submission }) {
    const getStatus = () => {
      if (submission.is_winner) return { text: "Winner", icon: "🏆", cls: "winner" };
      if (submission.is_reviewed) return { text: "Reviewed", icon: "✓", cls: "reviewed" };
      return { text: "Pending", icon: "●", cls: "pending" };
    };
    
    const status = getStatus();

    // ✅ Use flat string fields from serializer, fallback to nested object
    const teamName = submission.team_name || submission.team?.name || "—";
    const teamMemberCount = submission.team_details?.members?.length ?? submission.team?.members?.length ?? null;
    const eventName = submission.event_name || submission.event?.name || "—";
    const submittedBy = submission.submitted_by_username || submission.submitted_by?.username || null;

    const formatDate = (dateString) => {
      const date = new Date(dateString || Date.now());
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const getEventDateRange = () => {
      const event = submission.event;
      if (!event) return null;
      const start = event.start_date ? new Date(event.start_date) : null;
      const end = event.end_date ? new Date(event.end_date) : null;
      if (start && end) {
        return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
      }
      return null;
    };

    const eventDateRange = getEventDateRange();

    return (
      <Link href={`/submissions/${submission.id}`} className="submissions-card-link">
        <div className={`submissions-card ${status.cls === "winner" ? "submissions-card-winner" : ""}`}>
          <div className="submissions-card-header">
            <h3 className="submissions-card-title">{submission.title || "Untitled Project"}</h3>
            <span className={`submissions-badge submissions-badge-${status.cls}`}>
              {status.icon} {status.text}
            </span>
          </div>
          
          <div className="submissions-card-team-info">
            <p className="submissions-card-team">
              <span className="submissions-card-team-label">Team:</span> {teamName}
              {teamMemberCount !== null && (
                <span className="submissions-card-member-count">
                  ({teamMemberCount} {teamMemberCount === 1 ? "member" : "members"})
                </span>
              )}
            </p>

            <p className="submissions-card-event">
              <span className="submissions-card-event-label">Event:</span> {eventName}
              {eventDateRange && (
                <span className="submissions-card-event-date">{eventDateRange}</span>
              )}
            </p>

            {submittedBy && (
              <p className="submissions-card-team">
                <span className="submissions-card-team-label">By:</span>
                <span style={{ color: "var(--accent)" }}>{submittedBy}</span>
              </p>
            )}
          </div>
          
          <p className="submissions-card-description">
            {submission.summary || (submission.description ? submission.description.substring(0, 120) + "..." : "No description provided.")}
          </p>

          {submission.technologies?.length > 0 && (
            <div className="submissions-card-techs">
              {submission.technologies.slice(0, 4).map((tech, i) => (
                <span key={i} className="submissions-tech-tag">{tech}</span>
              ))}
              {submission.technologies.length > 4 && (
                <span className="submissions-tech-tag">+{submission.technologies.length - 4}</span>
              )}
            </div>
          )}

          <div className="submissions-card-footer">
            <span className="submissions-card-date">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ width: "14px", height: "14px", display: "inline-block", marginRight: "4px" }}>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {formatDate(submission.created_at)}
            </span>
            <div className="submissions-card-links">
              {submission.demo_url && (
                <span className="submissions-link-icon" title="Live Demo" onClick={(e) => {
                  e.preventDefault();
                  window.open(submission.demo_url, "_blank");
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </span>
              )}
              {submission.repo_url && (
                <span className="submissions-link-icon" title="Repository" onClick={(e) => {
                  e.preventDefault();
                  window.open(submission.repo_url, "_blank");
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                </span>
              )}
            </div>
          </div>
        </div>

        <style jsx>{`
          .submissions-card-link {
            text-decoration: none;
            display: block;
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
            margin-bottom: 0.75rem;
          }
          .submissions-card-title {
            font-family: 'Syne', sans-serif;
            font-size: 1.1rem;
            font-weight: 600;
            color: #fff;
            margin: 0;
            flex: 1;
          }
          .submissions-badge {
            padding: 0.2rem 0.6rem;
            border-radius: 4px;
            font-size: 0.7rem;
            font-weight: 600;
            white-space: nowrap;
            margin-left: 0.5rem;
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
          .submissions-card-team-info {
            margin-bottom: 1rem;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }
          .submissions-card-team,
          .submissions-card-event {
            font-size: 0.85rem;
            color: rgba(255,255,255,0.7);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.25rem;
            flex-wrap: wrap;
          }
          .submissions-card-team-label,
          .submissions-card-event-label {
            color: rgba(255,255,255,0.4);
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .submissions-card-member-count {
            color: #6EE7B7;
            font-size: 0.7rem;
            margin-left: 0.25rem;
          }
          .submissions-card-event-date {
            color: #6EE7B7;
            font-size: 0.7rem;
            margin-left: 0.25rem;
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
            display: flex;
            align-items: center;
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
            cursor: pointer;
          }
          .submissions-link-icon:hover {
            color: #6EE7B7;
          }
          .submissions-link-icon svg {
            width: 16px;
            height: 16px;
          }
        `}</style>
      </Link>
    );
  }
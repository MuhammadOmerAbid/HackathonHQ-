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
    (async () => {
      try {
        const [eR, tR] = await Promise.all([
          axios.get(`/events/${id}/`),
          axios.get(`/events/${id}/teams/`),
        ]);
        setEvent(eR.data);
        setTeams(tR.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const now = new Date();
  const getStatus = () => {
    if (!event) return null;
    const s = new Date(event.start_date), e = new Date(event.end_date);
    if (s > now) return { label: "Upcoming", cls: "evd-pill-soon" };
    if (e < now) return { label: "Ended",    cls: "evd-pill-closed" };
    return { label: "Live Now", cls: "evd-pill-live" };
  };

  const fmt = (d) => new Date(d).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
  const fmtShort = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (loading) return (
    <>
      
      <div className="evd-loading">
        <div className="evd-spinner" />
        <span>Loading event…</span>
      </div>
    </>
  );

  if (!event) return (
    <>
      
      <div className="evd-error-page">
        <div className="evd-error-card">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h2>Event Not Found</h2>
          <p>This hackathon doesn't exist or has been removed.</p>
          <button className="evd-btn-primary" onClick={() => router.push("/events")}>
            Back to Events
          </button>
        </div>
      </div>
    </>
  );

  const status = getStatus();
  const totalParticipants = teams.reduce((a, t) => a + (t.members?.length || 0), 0);

  return (
    <>
      
      <div className="evd-page">

        {/* back */}
        <button className="evd-back" onClick={() => router.push("/events")}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Back to Events
        </button>

        {/* heading */}
        <div className="evd-head">
          <div>
            <div className="evd-eyebrow">
              <div className="evd-eyebrow-dot" />
              <span className="evd-eyebrow-label">Hackathon</span>
            </div>
            <h1 className="evd-title">
              {event.name}
              {event.is_premium && <span className="evd-premium">PRO</span>}
            </h1>
            <p className="evd-organizer">
              Organized by {event.organizer?.username || "HackForge"}
            </p>
          </div>
          <div className={`evd-status-pill ${status.cls}`}>
            <span className="evd-pill-dot" />
            {status.label}
          </div>
        </div>

        {/* info strip */}
        <div className="evd-info-strip">
          {[
            { label: "Starts",       value: fmt(event.start_date) },
            { label: "Ends",         value: fmt(event.end_date) },
            { label: "Teams",        value: `${teams.length} registered` },
            { label: "Participants", value: `${totalParticipants} hackers` },
          ].map((c, i) => (
            <div className="evd-info-cell" key={i}>
              <div className="evd-info-label">{c.label}</div>
              <div className="evd-info-val">{c.value}</div>
            </div>
          ))}
        </div>

        {/* tabs */}
        <div className="evd-tabs">
          {["overview", "teams", "submissions", "prizes"].map(t => (
            <button
              key={t}
              className={`evd-tab${activeTab === t ? " active" : ""}`}
              onClick={() => setActiveTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* panel */}
        <div className="evd-panel">

          {activeTab === "overview" && (
            <div className="evd-about">
              <h3>About this Hackathon</h3>
              <p>{event.description}</p>
              {status.label === "Live Now" && (
                <div className="evd-cta">
                  <Link href={`/events/${id}/register-team`} className="evd-btn-primary">
                    Register Team
                  </Link>
                  <Link href={`/events/${id}/submit`} className="evd-btn-ghost">
                    Submit Project
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === "teams" && (
            <>
              <div className="evd-teams-head">
                <h3>Registered Teams ({teams.length})</h3>
                {status.label === "Live Now" && (
                  <Link href={`/events/${id}/register-team`} className="evd-btn-primary" style={{ fontSize: 12, padding: "6px 14px" }}>
                    + Create Team
                  </Link>
                )}
              </div>
              {teams.length === 0 ? (
                <div className="evd-empty">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.25 }}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <span>No teams registered yet</span>
                  {status.label === "Live Now" && (
                    <Link href={`/events/${id}/register-team`} className="evd-btn-primary" style={{ marginTop: 8 }}>
                      Be the first
                    </Link>
                  )}
                </div>
              ) : (
                <div className="evd-team-list">
                  {teams.map(team => (
                    <Link href={`/teams/${team.id}`} key={team.id} className="evd-team-row">
                      <div className="evd-team-avatar">{team.name.charAt(0).toUpperCase()}</div>
                      <span className="evd-team-name">{team.name}</span>
                      <div className="evd-member-stack">
                        {team.members?.slice(0, 4).map((m, i) => (
                          <div key={i} className="evd-member-pip">{m.username?.charAt(0).toUpperCase()}</div>
                        ))}
                        {team.members?.length > 4 && (
                          <div className="evd-member-pip">+{team.members.length - 4}</div>
                        )}
                      </div>
                      <span className="evd-team-count">{team.members?.length || 0} members</span>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "submissions" && (
            <div className="evd-submissions-ph">
              Submissions will appear here once teams start submitting their projects.
            </div>
          )}

          {activeTab === "prizes" && (
            <div className="evd-prizes">
              {[
                { icon: "🥇", place: "First Place",  reward: "$5,000 + Mentorship" },
                { icon: "🥈", place: "Second Place", reward: "$3,000 + Swag Pack" },
                { icon: "🥉", place: "Third Place",  reward: "$1,500 + Swag Pack" },
              ].map((p, i) => (
                <div className="evd-prize" key={i}>
                  <div className="evd-prize-icon">{p.icon}</div>
                  <div className="evd-prize-place">{p.place}</div>
                  <div className="evd-prize-val">{p.reward}</div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
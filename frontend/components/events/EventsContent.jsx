"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "@/utils/axios";
import EventCard from "./EventCard";

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

  useEffect(() => {
    const msg = searchParams.get("error");
    if (msg) { setError(msg); setTimeout(() => setError(""), 5000); }
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      try {
        const evRes = await axios.get("/events/");
        setEvents(evRes.data.results || []);
        const token = localStorage.getItem("access");
        if (token) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          try {
            const uRes = await axios.get("/users/me/");
            setUser(uRes.data);
            setIsOrganizer(
              uRes.data.profile?.is_organizer === true ||
              uRes.data.is_staff || uRes.data.is_superuser
            );
          } catch {}
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const now = new Date();
  const filtered = events.filter(e => {
    const s = new Date(e.start_date), en = new Date(e.end_date);
    const matchSearch = !searchTerm ||
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter =
      filter === "all" ? true :
      filter === "upcoming" ? s > now :
      filter === "ongoing"  ? s <= now && en >= now :
      en < now;
    return matchSearch && matchFilter;
  });

  const handleCreate = () => {
    const token = localStorage.getItem("access");
    if (!token) {
      sessionStorage.setItem("redirectAfterLogin", "/events/create");
      router.push("/login?message=Please login to create an event");
    } else if (!isOrganizer) {
      setError("Only event organizers can create events.");
    } else {
      router.push("/events/create");
    }
  };

  const liveCount     = events.filter(e => new Date(e.start_date) <= now && new Date(e.end_date) >= now).length;
  const upcomingCount = events.filter(e => new Date(e.start_date) > now).length;

  if (loading) return (
    <div className="ev-loading">
      <div className="ev-spinner" />
      <span>Loading hackathons…</span>
    </div>
  );

  return (
    <div className="ev-page">
     

      {/* ── PAGE HEADER ── */}
      <div className="ev-header">
        <div>
          <div className="ev-eyebrow">
            <div className="ev-eyebrow-dot" />
            <span className="ev-eyebrow-label">Hackathons</span>
          </div>
          <h1 className="ev-title">
            {isOrganizer ? "Manage Events" : "Discover Events"}
          </h1>
          <p className="ev-subtitle">
            {isOrganizer
              ? `${events.length} events · ${liveCount} live · ${upcomingCount} upcoming`
              : "Find and join hackathon events from around the world"}
          </p>
        </div>
        <div className="ev-header-right">
          {user && isOrganizer && (
            <button onClick={handleCreate} className="ev-btn-primary-circle">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
  <span>New Event</span>
</button>
          )}
          {!user && (
            <Link href="/login" className="ev-btn-ghost">Sign In</Link>
          )}
        </div>
      </div>

      {isOrganizer && (
  <div className="ev-stats-cards">
    {[
      { 
        label: "Total Events",  
        value: events.length,
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
      },
      { 
        label: "Live Now",      
        value: liveCount,     
        accent: true,
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10 8 16 12 10 16 10 8"/>
              </svg>
      },
      { 
        label: "Upcoming",      
        value: upcomingCount,
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
      },
      { 
        label: "Total Teams",   
        value: events.reduce((a, e) => a + (e.teams_count || 0), 0),
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
      },
    ].map((s, i) => (
      <div className="ev-stat-card" key={i}>
        <div className="ev-stat-icon">{s.icon}</div>
        <div className="ev-stat-body">
          <div className={`ev-stat-value${s.accent ? " accent" : ""}`}>{s.value}</div>
          <div className="ev-stat-label">{s.label}</div>
        </div>
      </div>
    ))}
  </div>
)}

      {/* ── ERROR ── */}
      {error && (
        <div className="ev-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* ── TOOLBAR ── */}
      <div className="ev-toolbar">
        <div className="ev-search-wrap">
          <svg className="ev-search-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="ev-search"
            placeholder="Search hackathons…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="ev-filters">
          {["all","upcoming","ongoing","past"].map(f => (
            <button
              key={f}
              className={`ev-filter-btn${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── GRID ── */}
      {filtered.length === 0 ? (
        <div className="ev-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.25, marginBottom: 12 }}>
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p>No hackathons found</p>
          {isOrganizer && (
            <button onClick={handleCreate} className="ev-btn-primary" style={{ marginTop: 16 }}>
              Create First Event
            </button>
          )}
        </div>
      ) : (
        <div className="ev-grid">
          {filtered.map(ev => <EventCard key={ev.id} event={ev} />)}
        </div>
      )}
    </div>
  );
}


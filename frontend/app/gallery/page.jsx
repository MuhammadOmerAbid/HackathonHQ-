"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "@/utils/axios";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function GalleryPage() {
  const [events, setEvents] = useState([]);
  const [finishedEvents, setFinishedEvents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState("");
  const [sort, setSort] = useState("-score");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get("/events/");
        const all = res.data.results || res.data || [];
        setEvents(all);
        setFinishedEvents(all.filter(e => e.status === "finished"));
      } catch (e) {
        console.error("Failed to load events", e);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    const fetchSubs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (eventFilter) params.set("event", eventFilter);
        if (sort) params.set("ordering", sort);
        if (filter === "winners") params.set("filter", "winning");
        const res = await axios.get(`/submissions/?${params.toString()}`);
        const items = res.data.results || res.data || [];
        const finishedOnly = items.filter(s => (s.event?.status || s.event_status) === "finished");
        setSubmissions(finishedOnly);
      } catch (e) {
        console.error("Failed to load submissions", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSubs();
  }, [eventFilter, sort, filter]);

  if (loading) return <LoadingSpinner message="Loading gallery..." />;

  return (
    <div className="gallery-page">
      <div className="gallery-header">
        <div>
          <h1>Submission Gallery</h1>
          <p>Explore projects, winners, and top‑scored builds.</p>
        </div>
        <div className="gallery-filters">
          <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
            <option value="">All Events</option>
            {finishedEvents.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="winners">Winners</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="-score">Top Score</option>
            <option value="-created_at">Newest</option>
          </select>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="gallery-empty">No submissions found.</div>
      ) : (
        <div className="gallery-grid">
          {submissions.map((s) => (
            <Link href={`/submissions/${s.id}`} key={s.id} className="gallery-card">
              <div className="card-top">
                <div className="card-title">{s.title}</div>
                {s.is_winner && <span className="badge">Winner</span>}
              </div>
              <div className="card-meta">
                <span>{s.team_name || "Team"}</span>
                <span>·</span>
                <span>{s.event_name || "Event"}</span>
              </div>
              {s.is_winner && s.award_results?.length > 0 && (
                <div className="card-meta">
                  <span>{s.award_results[0].category_title || "Overall Winner"}</span>
                </div>
              )}
              <div className="card-score">
                Score: <strong>{s.score?.toFixed ? s.score.toFixed(1) : s.score || 0}</strong>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style jsx>{`
        .gallery-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px 64px;
          color: #f0f0f3;
          font-family: 'DM Sans', sans-serif;
        }
        .gallery-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          margin-bottom: 24px;
        }
        h1 {
          font-family: 'Syne', sans-serif;
          margin: 0 0 6px;
        }
        .gallery-filters {
          display: flex;
          gap: 8px;
        }
        select {
          background: #111114;
          border: 1px solid #1e1e24;
          color: #f0f0f3;
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 13px;
        }
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 14px;
        }
        .gallery-card {
          display: block;
          padding: 16px;
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 14px;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s ease;
        }
        .gallery-card:hover {
          border-color: rgba(110,231,183,0.3);
          transform: translateY(-2px);
        }
        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .card-title {
          font-size: 14px;
          font-weight: 600;
        }
        .badge {
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          background: rgba(251,191,36,0.15);
          color: #fbbf24;
          border: 1px solid rgba(251,191,36,0.3);
        }
        .card-meta {
          font-size: 11px;
          color: #888;
          display: flex;
          gap: 6px;
          margin-bottom: 10px;
        }
        .card-score {
          font-size: 12px;
          color: #6EE7B7;
        }
        .gallery-empty {
          padding: 48px;
          border: 1px solid #1e1e24;
          border-radius: 16px;
          background: #111114;
          text-align: center;
          color: #5c5c6e;
        }
      `}</style>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "@/utils/axios";
import LoadingSpinner from "@/components/LoadingSpinner";
import CustomSelect from "@/components/ui/CustomSelect";

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
          <CustomSelect
            className="gallery-select"
            value={eventFilter}
            onChange={(val) => setEventFilter(String(val))}
            options={[
              { value: "", label: "All Events" },
              ...finishedEvents.map((e) => ({ value: String(e.id), label: e.name })),
            ]}
            placeholder="All Events"
          />
          <CustomSelect
            className="gallery-select"
            value={filter}
            onChange={(val) => setFilter(String(val))}
            options={[
              { value: "all", label: "All" },
              { value: "winners", label: "Winners" },
            ]}
            placeholder="All"
          />
          <CustomSelect
            className="gallery-select"
            value={sort}
            onChange={(val) => setSort(String(val))}
            options={[
              { value: "-score", label: "Top Score" },
              { value: "-created_at", label: "Newest" },
            ]}
            placeholder="Top Score"
          />
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
        .gallery-select { min-width: 160px; }

        /* Custom select — match SubmissionForm dropdown style */
        .custom-dropdown { position: relative; }
        .custom-dropdown-trigger {
          background: #17171b;
          border: 1px solid #1e1e24;
          border-radius: 10px;
          color: #f0f0f3;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          padding: 8px 12px;
          width: 100%;
          box-sizing: border-box;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.2s ease;
          min-height: 38px;
        }
        .custom-dropdown-trigger:hover:not(.disabled) {
          border-color: #6EE7B7;
          background: #111114;
        }
        .custom-dropdown-trigger.open {
          border-color: #6EE7B7;
          box-shadow: 0 0 0 2px rgba(110, 231, 183, 0.2);
          background: #111114;
        }
        .custom-dropdown-trigger.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .custom-dropdown-value {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .custom-dropdown-value.placeholder { color: #5c5c6e; }
        .custom-dropdown-arrow {
          width: 16px;
          height: 16px;
          color: #6EE7B7;
          transition: transform 0.2s ease;
          flex-shrink: 0;
          margin-left: 8px;
        }
        .custom-dropdown-arrow.open { transform: rotate(180deg); }
        .custom-dropdown-menu {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          max-height: 280px;
          overflow-y: auto;
          background: #1a1a1f;
          border: 1px solid #1e1e24;
          border-radius: 10px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
          z-index: 50;
          animation: menuFadeIn 0.2s ease;
        }
        @keyframes menuFadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-dropdown-item {
          padding: 12px 16px;
          cursor: pointer;
          color: #f0f0f3;
          font-size: 13px;
          transition: all 0.15s ease;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .custom-dropdown-item:last-child { border-bottom: none; }
        .custom-dropdown-item:hover {
          background: rgba(110, 231, 183, 0.1);
          color: #6EE7B7;
          padding-left: 20px;
        }
        .custom-dropdown-item.selected {
          background: rgba(110, 231, 183, 0.15);
          color: #6EE7B7;
          font-weight: 500;
          border-left: 2px solid #6EE7B7;
          padding-left: calc(16px - 2px);
        }
        .custom-dropdown-item-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .custom-dropdown-sub {
          font-size: 11px;
          color: #5c5c6e;
        }
        .custom-dropdown-check { color: #6EE7B7; width: 14px; height: 14px; }
        .custom-dropdown-empty { padding: 12px 16px; font-size: 12px; color: #5c5c6e; }
        .custom-dropdown-menu::-webkit-scrollbar { width: 4px; }
        .custom-dropdown-menu::-webkit-scrollbar-track { background: #1e1e24; }
        .custom-dropdown-menu::-webkit-scrollbar-thumb { background: #3a3a48; border-radius: 4px; }
        .custom-dropdown-menu::-webkit-scrollbar-thumb:hover { background: #6EE7B7; }
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

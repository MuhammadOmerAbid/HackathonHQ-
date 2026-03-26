"use client";

import React, { useEffect, useState } from "react";
import axios from "@/utils/axios";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function LeaderboardPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await axios.get("/award-results/");
        setResults(res.data.results || res.data || []);
      } catch (e) {
        console.error("Failed to load leaderboard", e);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  if (loading) return <LoadingSpinner message="Loading leaderboard..." />;

  return (
    <div className="lb-page">
      <h1>Leaderboard</h1>
      {results.length === 0 ? (
        <div className="lb-empty">No results announced yet.</div>
      ) : (
        <div className="lb-list">
          {results.map((r) => (
            <div key={r.id} className="lb-row">
              <div className="lb-place">#{r.place || 1}</div>
              <div className="lb-title">{r.submission_title || "Submission"}</div>
              <div className="lb-cat">{r.category_title || "Overall"}</div>
              <div className="lb-score">{Number(r.score || 0).toFixed(1)}</div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .lb-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 32px 24px 64px;
          color: #f0f0f3;
          font-family: 'DM Sans', sans-serif;
        }
        h1 {
          font-family: 'Syne', sans-serif;
          margin: 0 0 20px;
        }
        .lb-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .lb-row {
          display: grid;
          grid-template-columns: 60px 1fr 180px 80px;
          gap: 12px;
          align-items: center;
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 12px;
          padding: 12px 16px;
        }
        .lb-place {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          color: #6EE7B7;
        }
        .lb-title {
          font-weight: 600;
        }
        .lb-cat {
          font-size: 12px;
          color: #888;
        }
        .lb-score {
          text-align: right;
          font-weight: 700;
          color: #fbbf24;
        }
        .lb-empty {
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

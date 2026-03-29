"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "@/utils/axios";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function EventSponsorsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(`/events/${id}/sponsors`)}`);
      return;
    }
    const load = async () => {
      try {
        const res = await axios.get(`/events/${id}/`);
        setEvent(res.data);
      } catch (e) {
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, user, id, router]);

  if (authLoading || loading) return <LoadingSpinner message="Loading sponsors..." />;

  if (!event) {
    return (
      <div className="sponsors-page">
        <div className="sponsors-card">
          <h1>Event Not Found</h1>
          <p>We couldnâ€™t load sponsors for this event.</p>
          <button onClick={() => router.push("/events")} className="sp-btn">
            Browse Events
          </button>
        </div>
        <style jsx>{`
          .sponsors-page{max-width:900px;margin:0 auto;padding:32px 24px 64px;color:#f0f0f3;font-family:'DM Sans',sans-serif}
          .sponsors-card{background:#111114;border:1px solid #1e1e24;border-radius:16px;padding:32px;text-align:center}
          .sp-btn{margin-top:16px;padding:10px 18px;border-radius:999px;border:1px solid #26262e;background:#0c0c0f;color:#6EE7B7;cursor:pointer}
        `}</style>
      </div>
    );
  }

  const sponsors = Array.isArray(event.sponsors) ? event.sponsors : [];

  return (
    <div className="sponsors-page">
      <div className="sp-header">
        <div>
          <div className="sp-eyebrow">
            <span className="sp-dot" />
            Sponsors
          </div>
          <h1>{event.name}</h1>
          <p className="sp-sub">Meet the partners powering this hackathon.</p>
        </div>
        <Link href={`/events/${id}`} className="sp-back">Back to Event â†’</Link>
      </div>

      {sponsors.length === 0 ? (
        <div className="sp-empty">
          No sponsors have been added yet.
        </div>
      ) : (
        <div className="sp-grid">
          {sponsors.map((s) => (
            <div key={s.id} className="sp-card">
              <div className="sp-logo">
                {s.logo_url ? (
                  <img src={s.logo_url} alt={s.name} />
                ) : (
                  <div className="sp-fallback">{s.name?.charAt(0)?.toUpperCase()}</div>
                )}
              </div>
              <div className="sp-name">{s.name}</div>
              {s.tier && <div className="sp-tier">{s.tier}</div>}
              {s.challenge_desc && <div className="sp-desc">{s.challenge_desc}</div>}
              {s.website && (
                <a href={s.website} target="_blank" rel="noreferrer" className="sp-link">
                  Visit website
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .sponsors-page {
          max-width: 1100px;
          margin: 0 auto;
          padding: 32px 24px 64px;
          color: #f0f0f3;
          font-family: 'DM Sans', sans-serif;
        }
        .sp-header{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:24px}
        h1{font-family:'Syne',sans-serif;margin:6px 0 4px}
        .sp-sub{color:#5c5c6e;font-size:13px;margin:0}
        .sp-eyebrow{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#6EE7B7}
        .sp-dot{width:6px;height:6px;border-radius:50%;background:#6EE7B7}
        .sp-back{font-size:12px;color:#6EE7B7;text-decoration:none}
        .sp-back:hover{text-decoration:underline}
        .sp-empty{padding:48px;border:1px solid #1e1e24;border-radius:16px;background:#111114;color:#5c5c6e;text-align:center}
        .sp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
        .sp-card{background:#111114;border:1px solid #1e1e24;border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:8px}
        .sp-logo{width:72px;height:72px;border-radius:14px;background:#0c0c0f;border:1px solid #1e1e24;display:flex;align-items:center;justify-content:center;overflow:hidden}
        .sp-logo img{width:100%;height:100%;object-fit:contain}
        .sp-fallback{font-family:'Syne',sans-serif;font-size:24px;font-weight:700;color:#6EE7B7}
        .sp-name{font-size:14px;font-weight:600}
        .sp-tier{font-size:11px;font-weight:700;color:#fbbf24;text-transform:uppercase;letter-spacing:.8px}
        .sp-desc{font-size:12px;color:#5c5c6e;line-height:1.6}
        .sp-link{margin-top:4px;font-size:12px;color:#6EE7B7;text-decoration:none}
        .sp-link:hover{text-decoration:underline}
      `}</style>
    </div>
  );
}

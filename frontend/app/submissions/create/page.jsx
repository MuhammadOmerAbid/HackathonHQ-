"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SubmissionForm from "../../../components/submissions/SubmissionForm";

export default function CreateSubmissionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectEventId = searchParams?.get("event") || "";
  const backHref = preselectEventId ? `/submissions?event=${preselectEventId}` : "/submissions";

  return (
    <div className="subc-page">

      {/* Back button */}
      <button onClick={() => router.push(backHref)} className="evd-back-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        Back to Submissions
      </button>

      {/* Eyebrow */}
      <div className="subc-eyebrow">
        <div className="subc-eyebrow-dot" />
        <span className="subc-eyebrow-label">New Project</span>
      </div>
      <h1 className="subc-title">Submit Your Project</h1>
      <p className="subc-subtitle">Share your hackathon creation with the world</p>

      {/* Form card */}
      <div className="subc-card">
        <div className="subc-card-body">
          <SubmissionForm
            cancelHref={backHref}
            initialData={preselectEventId ? { event: preselectEventId } : {}}
          />
        </div>
      </div>

      <style jsx>{`
        .subc-page {
          max-width: 720px;
          margin: 0 auto;
          padding: 36px 32px 64px;
          font-family: 'DM Sans', sans-serif;
          min-height: calc(100vh - 70px);
        }

        /* Eyebrow */
        .subc-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .subc-eyebrow-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #6EE7B7;
        }
        .subc-eyebrow-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #6EE7B7;
        }

        /* Title */
        .subc-title {
          font-family: 'Syne', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: #f0f0f3;
          letter-spacing: -0.4px;
          margin: 0 0 4px;
        }
        .subc-subtitle {
          font-size: 13.5px;
          color: #5c5c6e;
          margin: 0 0 32px;
          line-height: 1.6;
        }

        /* Card */
        .subc-card {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 16px;
          overflow: hidden;
        }
        .subc-card-body {
          padding: 28px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .subc-page { padding: 24px 20px 48px; }
        }
        @media (max-width: 480px) {
          .subc-page { padding: 20px 16px 48px; }
          .subc-card-body { padding: 20px 16px; }
        }
      `}</style>
    </div>
  );
}

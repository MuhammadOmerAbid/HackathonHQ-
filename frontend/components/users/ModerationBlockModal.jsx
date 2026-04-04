"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const EVENT_NAME = "auth:moderation";

function formatUntil(until) {
  if (!until) return "";
  const date = new Date(until);
  if (Number.isNaN(date.getTime())) return until;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function ModerationBlockModal() {
  const { logout } = useAuth();
  const [block, setBlock] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event) => {
      const detail = event?.detail || null;
      if (!detail) return;
      setBlock((prev) => prev || detail);
      logout();
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, [logout]);

  const view = useMemo(() => {
    if (!block) return null;
    const type = block.type === "ban" ? "ban" : "suspend";
    const untilLabel = block.until ? formatUntil(block.until) : "";
    const title = type === "ban" ? "Account Banned" : "Account Suspended";
    const subtitle =
      type === "ban"
        ? "Your account has been banned by a moderator."
        : "Your account has been suspended by a moderator.";
    const detail =
      block.message ||
      (type === "ban"
        ? "You cannot access your account during this ban."
        : "You cannot access your account during this suspension.");
    return {
      title,
      subtitle,
      untilLabel: type === "ban" && !untilLabel ? "Permanent" : untilLabel,
      reason: block.reason || "",
      detail,
      type,
    };
  }, [block]);

  if (!view) return null;

  const close = () => setBlock(null);

  return (
    <div className="mod-block-overlay" onClick={close}>
      <div className="mod-block-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mod-block-header">
          <div className="mod-block-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div>
            <h3>{view.title}</h3>
            <p className="mod-block-subtitle">{view.subtitle}</p>
          </div>
        </div>

        <div className="mod-block-body">
          {view.detail && <p>{view.detail}</p>}
          {(view.untilLabel || view.reason) && (
            <div className="mod-block-meta">
              {view.untilLabel && (
                <div className="mod-block-row">
                  <span className="mod-block-label">Until</span>
                  <span className="mod-block-value">{view.untilLabel}</span>
                </div>
              )}
              {view.reason && (
                <div className="mod-block-row">
                  <span className="mod-block-label">Reason</span>
                  <span className="mod-block-value">{view.reason}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mod-block-actions">
          <button className="mod-block-ack" onClick={close}>Okay</button>
        </div>
      </div>

      <style jsx>{`
        .mod-block-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1300;
          padding: 1rem;
          animation: overlayFadeIn 0.2s ease-out;
        }

        @keyframes overlayFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .mod-block-modal {
          width: 100%;
          max-width: 28rem;
          background: linear-gradient(135deg, #1a1a1f 0%, #0f0f12 100%);
          border-radius: 1.5rem;
          padding: 1.75rem;
          color: #f0f0f3;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(239, 68, 68, 0.1);
          animation: modalSlideIn 0.3s ease-out;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .mod-block-header {
          display: flex;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1.25rem;
        }

        .mod-block-icon {
          width: 3rem;
          height: 3rem;
          border-radius: 1rem;
          background: linear-gradient(135deg, rgba(248, 113, 113, 0.15) 0%, rgba(248, 113, 113, 0.05) 100%);
          border: 1px solid rgba(248, 113, 113, 0.3);
          color: #f87171;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 0 20px rgba(248, 113, 113, 0.1);
        }

        .mod-block-icon svg {
          width: 1.25rem;
          height: 1.25rem;
        }

        .mod-block-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          letter-spacing: -0.01em;
          background: linear-gradient(135deg, #f0f0f3 0%, #d1d1e5 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .mod-block-subtitle {
          margin: 0.25rem 0 0;
          font-size: 0.75rem;
          color: #a1a1b2;
          font-family: 'DM Sans', sans-serif;
        }

        .mod-block-body p {
          margin: 0 0 1rem;
          font-size: 0.875rem;
          color: #d1d1e5;
          line-height: 1.6;
          font-family: 'DM Sans', sans-serif;
        }

        .mod-block-meta {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 0.75rem;
          padding: 1rem;
          border-radius: 1rem;
          background: rgba(248, 113, 113, 0.05);
          border: 1px solid rgba(248, 113, 113, 0.15);
        }

        .mod-block-row {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .mod-block-label {
          display: block;
          font-size: 0.688rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #f87171;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
        }

        .mod-block-value {
          font-size: 0.813rem;
          color: #f9b3b3;
          line-height: 1.5;
          font-family: 'DM Sans', sans-serif;
        }

        .mod-block-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }

        .mod-block-ack {
          padding: 0.625rem 1.25rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(248, 113, 113, 0.35);
          background: rgba(248, 113, 113, 0.15);
          color: #f87171;
          font-size: 0.813rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .mod-block-ack:hover {
          background: rgba(248, 113, 113, 0.25);
          border-color: rgba(248, 113, 113, 0.6);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(248, 113, 113, 0.2);
        }

        .mod-block-ack:active {
          transform: translateY(0);
        }

        @media (max-width: 640px) {
          .mod-block-modal {
            padding: 1.25rem;
            max-width: 90%;
          }

          .mod-block-header h3 {
            font-size: 1.125rem;
          }

          .mod-block-icon {
            width: 2.5rem;
            height: 2.5rem;
          }
        }
      `}</style>
    </div>
  );
}

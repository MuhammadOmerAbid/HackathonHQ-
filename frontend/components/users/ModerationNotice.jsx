"use client";

import React, { useEffect, useState } from "react";
import axios from "@/utils/axios";
import { useAuth } from "@/context/AuthContext";

const MOD_TYPES = new Set(["moderation_warn", "moderation_suspend", "moderation_ban"]);
const ACK_KEY_PREFIX = "mod_notice_ack_";

export default function ModerationNotice() {
  const { user } = useAuth();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);

  const isAcknowledged = (id) => {
    if (!id || typeof window === "undefined") return false;
    try {
      return !!localStorage.getItem(`${ACK_KEY_PREFIX}${id}`);
    } catch {
      return false;
    }
  };

  const markAcknowledged = (id) => {
    if (!id || typeof window === "undefined") return;
    try {
      localStorage.setItem(`${ACK_KEY_PREFIX}${id}`, new Date().toISOString());
    } catch {
      // ignore storage errors
    }
  };

  const splitReason = (text) => {
    if (!text) return { main: "", reason: "" };
    const byNewline = text.lastIndexOf("\nReason:");
    const byInline = text.lastIndexOf("Reason:");
    let idx = -1;
    if (byNewline !== -1) idx = byNewline;
    else if (byInline !== -1) idx = byInline;
    if (idx === -1) return { main: text, reason: "" };
    const main = text.slice(0, idx).trim();
    const raw = text.slice(idx).replace(/^\n?Reason:\s*/i, "").trim();
    const firstLine = raw.split("\n")[0].trim();
    return { main, reason: firstLine };
  };

  const fetchModerationNotice = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await axios.get("/notifications/?page_size=20");
      const items = res.data?.results || res.data || [];
      const unread = items
        .filter((n) => MOD_TYPES.has(n.type) && !n.is_read)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const nextNotice = unread.find((n) => !isAcknowledged(n.id)) || null;
      setNotice(nextNotice);
    } catch (err) {
      setNotice(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchModerationNotice();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const handleFocus = () => fetchModerationNotice();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchModerationNotice();
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user?.id]);

  const acknowledge = async () => {
    if (!notice) return;
    markAcknowledged(notice.id);
    setNotice(null);
  };

  if (!notice || loading) return null;
  const { main, reason } = splitReason(notice.body || "");
  const displayText = main || (!reason ? (notice.body || "") : "Please review the violation details below.");

  return (
    <div className="mod-overlay" onClick={acknowledge}>
      <div className="mod-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mod-header">
          <div className="mod-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div>
            <h3>{notice.title || "Account Notice"}</h3>
            <p className="mod-subtitle">Please review this notice.</p>
          </div>
        </div>
        <div className="mod-body">
          <p>{displayText || "There is an important update on your account."}</p>
          {reason && (
            <div className="mod-reason">
              <span className="mod-reason-label">Reason</span>
              <div className="mod-reason-text">{reason}</div>
            </div>
          )}
        </div>
        <div className="mod-actions">
          <button className="mod-ack" onClick={acknowledge}>Acknowledge</button>
        </div>
      </div>

      <style jsx>{`
        .mod-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1200;
          padding: 16px;
        }
        .mod-modal {
          width: 100%;
          max-width: 460px;
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 16px;
          padding: 20px;
          color: #f0f0f3;
          font-family: 'DM Sans', sans-serif;
        }
        .mod-header {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 12px;
        }
        .mod-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(251,191,36,0.12);
          border: 1px solid rgba(251,191,36,0.3);
          color: #fbbf24;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .mod-icon svg {
          width: 18px;
          height: 18px;
        }
        .mod-header h3 {
          margin: 0;
          font-size: 18px;
          font-family: 'Syne', sans-serif;
        }
        .mod-subtitle {
          margin: 4px 0 0;
          font-size: 12px;
          color: #8a8aa0;
        }
        .mod-body p {
          margin: 0;
          font-size: 13.5px;
          color: #cbd5f5;
          line-height: 1.6;
        }
        .mod-reason {
          margin-top: 12px;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(251,191,36,0.12);
          border: 1px solid rgba(251,191,36,0.3);
        }
        .mod-reason-label {
          display: block;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: #fbbf24;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .mod-reason-text {
          font-size: 12.5px;
          color: #f6d98b;
          line-height: 1.5;
        }
        .mod-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 16px;
        }
        .mod-ack {
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid rgba(110,231,183,0.3);
          background: rgba(110,231,183,0.15);
          color: #6EE7B7;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .mod-ack:hover {
          background: rgba(110,231,183,0.25);
          border-color: rgba(110,231,183,0.5);
        }
      `}</style>
    </div>
  );
}

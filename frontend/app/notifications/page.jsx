"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "@/utils/axios";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get("/notifications/");
        setNotifications(res.data.results || res.data || []);
      } catch (e) {
        console.error("Failed to load notifications", e);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    setMarking(true);
    try {
      await axios.post("/notifications/read");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error("Failed to mark read", e);
    } finally {
      setMarking(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading notifications..." />;

  return (
    <div className="notif-page">
      <div className="notif-header">
        <h1>Notifications</h1>
        <button onClick={markAllRead} disabled={marking} className="notif-btn">
          {marking ? "Marking..." : "Mark all read"}
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="notif-empty">No notifications yet.</div>
      ) : (
        <div className="notif-list">
          {notifications.map((n) => (
            <div key={n.id} className={`notif-item ${n.is_read ? "read" : ""}`}>
              <div className="notif-title">{n.title}</div>
              {n.body && <div className="notif-body">{n.body}</div>}
              <div className="notif-meta">
                <span>{new Date(n.created_at).toLocaleString()}</span>
                {n.link && (
                  <button className="notif-link" onClick={() => router.push(n.link)}>
                    Open
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .notif-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 32px 24px 64px;
          color: #f0f0f3;
          font-family: 'DM Sans', sans-serif;
        }
        .notif-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .notif-header h1 {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          margin: 0;
        }
        .notif-btn {
          padding: 8px 16px;
          border-radius: 999px;
          border: 1px solid #1e1e24;
          background: transparent;
          color: #6EE7B7;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
        }
        .notif-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .notif-empty {
          padding: 48px;
          border: 1px solid #1e1e24;
          border-radius: 16px;
          background: #111114;
          text-align: center;
          color: #5c5c6e;
        }
        .notif-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .notif-item {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 14px;
          padding: 16px 18px;
        }
        .notif-item.read {
          opacity: 0.7;
        }
        .notif-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .notif-body {
          font-size: 13px;
          color: #b0b0ba;
          margin-bottom: 10px;
        }
        .notif-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: #5c5c6e;
        }
        .notif-link {
          border: 1px solid #26262e;
          background: transparent;
          color: #6EE7B7;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

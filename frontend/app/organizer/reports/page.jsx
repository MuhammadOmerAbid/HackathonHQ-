"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "@/utils/axios";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import ModerationModal from "@/components/users/ModerationModal";
import CustomSelect from "@/components/forms/CustomSelect";

export default function OrganizerReportsPage() {
  const router = useRouter();
  const { user, isOrganizer, loading: authLoading } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [notesById, setNotesById] = useState({});

  const [moderationOpen, setModerationOpen] = useState(false);
  const [moderationTarget, setModerationTarget] = useState(null);
  const [moderationAction, setModerationAction] = useState("warn");
  const [moderationError, setModerationError] = useState("");
  const [moderationSaving, setModerationSaving] = useState(false);

  const isAdmin = user?.is_staff || user?.is_superuser;

  useEffect(() => {
    if (authLoading) return;
    if (!isOrganizer && !isAdmin) {
      router.push("/");
      return;
    }
    fetchReports();
  }, [authLoading, isOrganizer, isAdmin, statusFilter, typeFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page_size", "50");
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("report_type", typeFilter);
      const res = await axios.get(`/reports/?${params.toString()}`);
      const list = res.data?.results || res.data || [];
      setReports(Array.isArray(list) ? list : []);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to load reports." });
    } finally {
      setLoading(false);
    }
  };

  const openModeration = (report) => {
    if (!report?.reported_user) return;
    setModerationTarget({
      id: report.reported_user,
      username: report.reported_user_username || report.reported_username || "User",
    });
    setModerationAction("warn");
    setModerationError("");
    setModerationOpen(true);
  };

  const closeModeration = () => {
    if (moderationSaving) return;
    setModerationOpen(false);
    setModerationTarget(null);
    setModerationError("");
  };

  const handleModerationSubmit = async ({ action, reason, message: note, durationDays, notifyUser }) => {
    if (!moderationTarget) return;
    setModerationSaving(true);
    setModerationError("");
    try {
      const payload = {
        reason,
        message: note || "",
        notify_user: !!notifyUser,
      };
      if (action === "suspend") {
        payload.duration_days = durationDays;
      }
      if (action === "ban" && durationDays) {
        payload.duration_days = durationDays;
      }
      await axios.post(`/users/${moderationTarget.id}/${action}/`, payload);
      setMessage({ type: "success", text: `User ${action}ed successfully.` });
      setModerationOpen(false);
      setModerationTarget(null);
    } catch (err) {
      setModerationError(err.response?.data?.error || "Failed to moderate user.");
    } finally {
      setModerationSaving(false);
    }
  };

  const handleStatusUpdate = async (reportId, status) => {
    setActionLoading((prev) => ({ ...prev, [reportId]: status }));
    try {
      const payload = { status };
      const note = notesById[reportId];
      if (note) payload.resolution_note = note;
      await axios.patch(`/reports/${reportId}/`, payload);
      setMessage({ type: "success", text: `Report marked ${status}.` });
      fetchReports();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update report." });
    } finally {
      setActionLoading((prev) => ({ ...prev, [reportId]: null }));
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    return isNaN(d) ? "-" : d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (authLoading || loading) {
    return <LoadingSpinner message="Loading reports..." />;
  }

  const statusOptions = [
    { value: "", label: "All statuses" },
    { value: "open", label: "Open" },
    { value: "reviewed", label: "Reviewed" },
    { value: "resolved", label: "Resolved" },
  ];
  const typeOptions = [
    { value: "", label: "All types" },
    { value: "issue", label: "Issue" },
    { value: "cheating", label: "Cheating" },
  ];

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h1>Organizer Reports</h1>
          <p>Review reports and take moderation actions.</p>
        </div>
        <div className="reports-filters">
          <div className="reports-filter">
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              placeholder="All statuses"
            />
          </div>
          <div className="reports-filter">
            <CustomSelect
              value={typeFilter}
              onChange={setTypeFilter}
              options={typeOptions}
              placeholder="All types"
            />
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`reports-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="reports-list">
        {reports.length === 0 ? (
          <div className="reports-empty">No reports yet.</div>
        ) : (
          reports.map((report) => {
            const canModerate = !!report.reported_user && (
              isAdmin || (!report.reported_user_is_admin && !report.reported_user_is_organizer)
            );
            return (
              <div key={report.id} className="report-card">
                <div className="report-top">
                  <div>
                    <div className="report-title">
                      <span className={`report-type ${report.report_type}`}>{report.report_type}</span>
                      <span className={`report-status ${report.status}`}>{report.status}</span>
                    </div>
                    <div className="report-meta">
                      <span>Event: {report.event ? (
                        <Link href={`/events/${report.event}`} className="report-link">{report.event_name || "Event"}</Link>
                      ) : "General"}</span>
                      <span>Reported: {report.reported_user ? (
                        <Link href={`/users/${report.reported_user}`} className="report-link">
                          {report.reported_user_username || "User"}
                        </Link>
                      ) : (report.reported_username || "Unknown")}</span>
                      <span>Reporter: {report.reporter_username || "User"}</span>
                      <span>{formatDate(report.created_at)}</span>
                    </div>
                  </div>
                  <div className="report-actions">
                    <button
                      className="report-btn"
                      onClick={() => openModeration(report)}
                      disabled={!canModerate || moderationSaving}
                      title={!canModerate ? "Cannot moderate this user" : "Moderate user"}
                    >
                      Moderate
                    </button>
                    <button
                      className="report-btn ghost"
                      onClick={() => handleStatusUpdate(report.id, "reviewed")}
                      disabled={actionLoading[report.id]}
                    >
                      Mark Reviewed
                    </button>
                    <button
                      className="report-btn ghost"
                      onClick={() => handleStatusUpdate(report.id, "resolved")}
                      disabled={actionLoading[report.id]}
                    >
                      Resolve
                    </button>
                  </div>
                </div>

                <div className="report-desc">{report.description}</div>

                <div className="report-note">
                  <label>Resolution note (optional)</label>
                  <textarea
                    rows={2}
                    value={notesById[report.id] || ""}
                    onChange={(e) => setNotesById((prev) => ({ ...prev, [report.id]: e.target.value }))}
                    placeholder="Add a note about how this report was handled"
                  />
                </div>

                {report.resolution_note && (
                  <div className="report-resolved">
                    <strong>Resolution:</strong> {report.resolution_note}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <ModerationModal
        isOpen={moderationOpen}
        onClose={closeModeration}
        onSubmit={handleModerationSubmit}
        targetUser={moderationTarget}
        allowedActions={isAdmin ? ["warn", "suspend", "ban"] : ["warn", "suspend"]}
        initialAction={moderationAction}
        loading={moderationSaving}
        error={moderationError}
      />

      <style jsx>{`
        .reports-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px 64px;
          color: #f0f0f3;
          background: #0a0a0a;
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
        }
        .reports-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 24px;
        }
        .reports-header h1 {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          margin: 0 0 6px 0;
        }
        .reports-header p {
          color: #8a8aa0;
          margin: 0;
        }
        .reports-filters {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .reports-filter {
          min-width: 180px;
        }
        .reports-message {
          margin-bottom: 16px;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 12px;
          background: #111114;
          border: 1px solid #1e1e24;
        }
        .reports-message.success { color: #6EE7B7; border-color: rgba(110,231,183,0.3); }
        .reports-message.error { color: #f87171; border-color: rgba(248,113,113,0.3); }
        .reports-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .report-card {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 16px;
          padding: 16px;
        }
        .report-top {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .report-title {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 8px;
        }
        .report-type, .report-status {
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }
        .report-type.issue { background: rgba(96,165,250,0.12); color: #60a5fa; border: 1px solid rgba(96,165,250,0.3); }
        .report-type.cheating { background: rgba(251,191,36,0.12); color: #fbbf24; border: 1px solid rgba(251,191,36,0.3); }
        .report-status.open { background: rgba(248,113,113,0.12); color: #f87171; border: 1px solid rgba(248,113,113,0.3); }
        .report-status.reviewed { background: rgba(110,231,183,0.12); color: #6EE7B7; border: 1px solid rgba(110,231,183,0.3); }
        .report-status.resolved { background: rgba(148,163,184,0.12); color: #94a3b8; border: 1px solid rgba(148,163,184,0.3); }
        .report-meta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          color: #8a8aa0;
          font-size: 11.5px;
        }
        .report-link {
          color: #6EE7B7;
          text-decoration: none;
        }
        .report-link:hover { text-decoration: underline; }
        .report-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .report-btn {
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px solid rgba(110,231,183,0.35);
          background: rgba(110,231,183,0.12);
          color: #6EE7B7;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
        }
        .report-btn.ghost {
          background: transparent;
          border: 1px solid #26262e;
          color: #b0b0ba;
        }
        .report-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .report-desc {
          margin-top: 12px;
          font-size: 13px;
          color: #cbd5f5;
          line-height: 1.6;
          white-space: pre-wrap;
        }
        .report-note {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .report-note label {
          font-size: 11px;
          color: #8a8aa0;
        }
        .report-note textarea {
          background: #0f0f12;
          border: 1px solid #1e1e24;
          border-radius: 10px;
          color: #f0f0f3;
          padding: 8px 10px;
          font-size: 12px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
        }
        .report-resolved {
          margin-top: 10px;
          font-size: 12px;
          color: #94a3b8;
        }
        .reports-empty {
          padding: 24px;
          text-align: center;
          color: #5c5c6e;
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 16px;
        }
        @media (max-width: 720px) {
          .reports-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

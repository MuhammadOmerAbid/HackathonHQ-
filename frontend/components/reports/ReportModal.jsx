"use client";

import React, { useEffect, useMemo, useState } from "react";
import CustomSelect from "@/components/forms/CustomSelect";

const REPORT_TYPES = [
  { value: "issue", label: "Issue" },
  { value: "cheating", label: "Cheating" },
];

export default function ReportModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  error = "",
  eventName = "",
  events = [],
  defaultType = "issue",
  defaultReportedUser = "",
  defaultEventId = "",
}) {
  const [reportType, setReportType] = useState(defaultType);
  const [description, setDescription] = useState("");
  const [reportedUser, setReportedUser] = useState(defaultReportedUser || "");
  const [eventId, setEventId] = useState(defaultEventId || "");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setReportType(defaultType || "issue");
    setDescription("");
    setReportedUser(defaultReportedUser || "");
    setEventId(defaultEventId || "");
    setLocalError("");
  }, [isOpen, defaultType, defaultReportedUser, defaultEventId]);

  const eventOptions = useMemo(() => {
    const base = [{ value: "", label: "General (no event)" }];
    const rest = (events || []).map((ev) => ({ value: String(ev.id), label: ev.name }));
    return [...base, ...rest];
  }, [events]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLocalError("");
    const trimmed = String(description || "").trim();
    if (!trimmed) {
      setLocalError("Description is required.");
      return;
    }
    if (reportType === "cheating" && !String(reportedUser || "").trim()) {
      setLocalError("Reported username is required for cheating.");
      return;
    }
    await onSubmit?.({
      reportType,
      description: trimmed,
      reportedUsername: String(reportedUser || "").trim(),
      eventId: eventId ? String(eventId) : "",
    });
  };

  return (
    <div className="report-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="report-header">
          <div>
            <h3>Report Issue</h3>
            <p className="report-subtitle">
              {eventName ? `Event: ${eventName}` : "Help us review this report."}
            </p>
          </div>
          <button className="report-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="report-field">
          <label>Type</label>
          <div className="report-type-tabs">
            {REPORT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`report-type-tab ${reportType === t.value ? "active" : ""}`}
                onClick={() => setReportType(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="report-field">
          <label>
            Reported user {reportType === "cheating" ? <span className="required">*</span> : "(optional)"}
          </label>
          <input
            type="text"
            value={reportedUser}
            onChange={(e) => setReportedUser(e.target.value)}
            placeholder="Username of the user involved"
          />
        </div>

        {events.length > 0 && (
          <div className="report-field">
            <label>Event (optional)</label>
            <CustomSelect
              value={eventId}
              onChange={setEventId}
              options={eventOptions}
              placeholder="General (no event)"
            />
          </div>
        )}

        <div className="report-field">
          <label>Description <span className="required">*</span></label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened and any evidence"
          />
        </div>

        {(localError || error) && (
          <div className="report-error">
            {localError || error}
          </div>
        )}

        <div className="report-actions">
          <button className="report-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="report-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .report-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          padding: 16px;
        }
        .report-modal {
          width: 100%;
          max-width: 520px;
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 16px;
          padding: 20px;
          color: #f0f0f3;
          font-family: 'DM Sans', sans-serif;
        }
        .report-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }
        .report-header h3 {
          margin: 0;
          font-size: 18px;
          font-family: 'Syne', sans-serif;
        }
        .report-subtitle {
          margin: 6px 0 0;
          font-size: 12px;
          color: #8a8aa0;
        }
        .report-close {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid #1e1e24;
          color: #888;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .report-close svg {
          width: 16px;
          height: 16px;
        }
        .report-close:hover {
          border-color: rgba(110,231,183,0.4);
          color: #6EE7B7;
        }
        .report-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 12px;
        }
        .report-field label {
          font-size: 12px;
          color: #b0b0ba;
        }
        .required {
          color: #f87171;
        }
        .report-field textarea,
        .report-field input {
          background: #0c0c0f;
          border: 1px solid #1e1e24;
          border-radius: 9px;
          color: #f0f0f3;
          padding: 10px 14px;
          font-size: 13.5px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
        }
        .report-field textarea:focus,
        .report-field input:focus,
        .report-field select:focus {
          border-color: rgba(110,231,183,0.4);
        }
        .report-type-tabs {
          display: flex;
          gap: 6px;
          background: #0f0f12;
          border: 1px solid #1e1e24;
          border-radius: 10px;
          padding: 4px;
        }
        .report-type-tab {
          flex: 1;
          padding: 8px 10px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: #5c5c6e;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .report-type-tab.active {
          background: #6EE7B7;
          color: #0c0c0f;
        }
        .report-error {
          font-size: 12px;
          color: #f87171;
          margin-bottom: 10px;
          padding: 8px 10px;
          border-radius: 8px;
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.2);
        }
        .report-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 8px;
        }
        .report-cancel,
        .report-submit {
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
        }
        .report-cancel {
          background: transparent;
          border: 1px solid #26262e;
          color: #5c5c6e;
        }
        .report-submit {
          background: #6EE7B7;
          border: 1px solid #4fb88b;
          color: #0c0c0f;
        }
        .report-cancel:disabled,
        .report-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

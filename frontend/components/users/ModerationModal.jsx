"use client";

import React, { useEffect, useMemo, useState } from "react";

const ACTIONS = {
  warn: {
    label: "Warn",
    description: "Send a formal warning to the user for rule violations.",
  },
  suspend: {
    label: "Suspend",
    description: "Temporarily suspend the account for a set number of days.",
  },
  ban: {
    label: "Ban",
    description: "Ban the account. Use this for severe or repeated violations.",
  },
};

export default function ModerationModal({
  isOpen,
  onClose,
  onSubmit,
  targetUser,
  allowedActions = ["warn", "suspend"],
  initialAction = "warn",
  loading = false,
  error = "",
}) {
  const [action, setAction] = useState(initialAction);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [notifyUser, setNotifyUser] = useState(true);
  const [localError, setLocalError] = useState("");

  const normalizedActions = useMemo(() => {
    const list = Array.isArray(allowedActions) && allowedActions.length > 0
      ? allowedActions
      : ["warn"];
    return list.filter((a) => ACTIONS[a]);
  }, [allowedActions]);

  useEffect(() => {
    if (!isOpen) return;
    const next = normalizedActions.includes(initialAction) ? initialAction : normalizedActions[0];
    setAction(next);
    setReason("");
    setMessage("");
    setDurationDays("");
    setNotifyUser(true);
    setLocalError("");
  }, [isOpen, initialAction, normalizedActions]);

  if (!isOpen) return null;

  const activeMeta = ACTIONS[action] || ACTIONS.warn;
  const requiresDuration = action === "suspend";
  const showDuration = action === "suspend" || action === "ban";

  const handleSubmit = async () => {
    setLocalError("");
    const trimmedReason = String(reason || "").trim();
    if (!trimmedReason) {
      setLocalError("Reason is required.");
      return;
    }
    if (requiresDuration) {
      const days = Number(durationDays);
      if (!days || Number.isNaN(days) || days <= 0) {
        setLocalError("Duration (days) is required for suspension.");
        return;
      }
    }
    await onSubmit?.({
      action,
      reason: trimmedReason,
      message: String(message || "").trim(),
      durationDays: durationDays ? Number(durationDays) : null,
      notifyUser,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Moderate User</h3>
            <p className="modal-subtitle">
              {targetUser?.username ? `User: ${targetUser.username}` : "Select an action"}
            </p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {normalizedActions.length > 1 && (
          <div className="action-tabs">
            {normalizedActions.map((key) => (
              <button
                key={key}
                type="button"
                className={`action-tab ${action === key ? "active" : ""}`}
                onClick={() => setAction(key)}
              >
                {ACTIONS[key]?.label || key}
              </button>
            ))}
          </div>
        )}

        <p className="action-description">{activeMeta.description}</p>

        <div className="modal-field">
          <label>Reason <span className="required">*</span></label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain the rule violation"
          />
        </div>

        <div className="modal-field">
          <label>Message (optional)</label>
          <textarea
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional message shown to the user"
          />
        </div>

        {showDuration && (
          <div className="modal-field">
            <label>
              Duration (days)
              {requiresDuration ? <span className="required"> *</span> : <span className="optional"> (optional)</span>}
            </label>
            <input
              type="number"
              min="1"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              placeholder={requiresDuration ? "e.g., 7" : "Default 30 if empty"}
            />
          </div>
        )}

        <label className="notify-toggle">
          <input
            type="checkbox"
            checked={notifyUser}
            onChange={(e) => setNotifyUser(e.target.checked)}
          />
          Notify user in-app
        </label>

        {(localError || error) && (
          <div className="modal-error">
            {localError || error}
          </div>
        )}

        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="modal-confirm" onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : `${ACTIONS[action]?.label || "Submit"} Action`}
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }
        .modal-content {
          width: 100%;
          max-width: 520px;
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 16px;
          padding: 20px;
          color: #f0f0f3;
          font-family: 'DM Sans', sans-serif;
        }
        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }
        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-family: 'Syne', sans-serif;
        }
        .modal-subtitle {
          margin: 6px 0 0;
          font-size: 12px;
          color: #8a8aa0;
        }
        .modal-close {
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
        .modal-close svg {
          width: 16px;
          height: 16px;
        }
        .modal-close:hover {
          border-color: rgba(110,231,183,0.4);
          color: #6EE7B7;
        }
        .action-tabs {
          display: flex;
          gap: 6px;
          background: #0f0f12;
          border: 1px solid #1e1e24;
          border-radius: 10px;
          padding: 4px;
          margin: 10px 0 12px;
        }
        .action-tab {
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
        .action-tab.active {
          background: #6EE7B7;
          color: #0c0c0f;
        }
        .action-description {
          font-size: 12.5px;
          color: #8a8aa0;
          margin: 0 0 14px;
        }
        .modal-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 12px;
        }
        .modal-field label {
          font-size: 12px;
          color: #b0b0ba;
        }
        .required {
          color: #f87171;
        }
        .optional {
          color: #5c5c6e;
          font-size: 11px;
        }
        .modal-field textarea,
        .modal-field input {
          background: #0f0f12;
          border: 1px solid #1e1e24;
          border-radius: 10px;
          color: #f0f0f3;
          padding: 10px 12px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
        }
        .modal-field textarea:focus,
        .modal-field input:focus {
          border-color: rgba(110,231,183,0.4);
        }
        .notify-toggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #8a8aa0;
          margin: 6px 0 12px;
        }
        .modal-error {
          font-size: 12px;
          color: #f87171;
          margin-bottom: 10px;
          padding: 8px 10px;
          border-radius: 8px;
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.2);
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 8px;
        }
        .modal-cancel,
        .modal-confirm {
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
        }
        .modal-cancel {
          background: transparent;
          border: 1px solid #26262e;
          color: #5c5c6e;
        }
        .modal-confirm {
          background: #6EE7B7;
          border: 1px solid #4fb88b;
          color: #0c0c0f;
        }
        .modal-cancel:disabled,
        .modal-confirm:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import axios from "@/utils/axios";
import ReportModal from "@/components/reports/ReportModal";

export default function SettingsCard({
  passwordData,
  onPasswordChange,
  onSubmitPassword,
  onDeleteAccount,
  saving
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState("");
  const [reportEvents, setReportEvents] = useState([]);

  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setDeletePassword("");
    setDeleteReason("");
    setDeleteError("");
  };

  const closeDeleteModal = () => {
    if (!saving) {
      setShowDeleteModal(false);
      setDeletePassword("");
      setDeleteReason("");
      setDeleteError("");
    }
  };

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await axios.get("/team-events/?mine=1&page_size=100");
        const list = res.data?.results || res.data || [];
        const map = new Map();
        list.forEach((item) => {
          if (item.event && item.event_name) {
            map.set(item.event, item.event_name);
          }
        });
        const events = Array.from(map.entries()).map(([id, name]) => ({ id, name }));
        setReportEvents(events);
      } catch {
        setReportEvents([]);
      }
    };
    loadEvents();
  }, []);

  const openReportModal = () => {
    setReportError("");
    setReportSuccess("");
    setReportOpen(true);
  };

  const closeReportModal = () => {
    if (!reportLoading) {
      setReportOpen(false);
      setReportError("");
    }
  };

  const handleReportSubmit = async ({ reportType, description, reportedUsername, eventId }) => {
    setReportLoading(true);
    setReportError("");
    setReportSuccess("");
    try {
      const payload = {
        report_type: reportType,
        description,
      };
      if (reportedUsername) payload.reported_username = reportedUsername;
      if (eventId) payload.event = eventId;
      await axios.post("/reports/", payload);
      setReportSuccess("Report submitted. Our team will review it soon.");
      setReportOpen(false);
    } catch (err) {
      setReportError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Failed to submit report."
      );
    } finally {
      setReportLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletePassword) {
      setDeleteError("Password is required");
      return;
    }

    // Call parent's delete handler with password
    const success = await onDeleteAccount(deletePassword, deleteReason, setDeleteError);
    
    if (success) {
      setShowDeleteModal(false);
      setDeletePassword("");
      setDeleteReason("");
      setDeleteError("");
    }
  };

  return (
    <>
      {/* Password Change Section */}
      <div className="profile-card">
        <h3 className="profile-card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Change Password
        </h3>
        <p className="settings-description">
          Update your password to keep your account secure
        </p>

        <form onSubmit={onSubmitPassword} className="profile-form">
          <div className="profile-form-group">
            <label htmlFor="current_password">Current Password</label>
            <input
              type="password"
              id="current_password"
              name="current_password"
              value={passwordData.current_password}
              onChange={onPasswordChange}
              placeholder="Enter your current password"
              className="profile-input"
              required
            />
          </div>

          <div className="profile-form-row">
            <div className="profile-form-group">
              <label htmlFor="new_password">New Password</label>
              <input
                type="password"
                id="new_password"
                name="new_password"
                value={passwordData.new_password}
                onChange={onPasswordChange}
                placeholder="Enter new password"
                className="profile-input"
                required
                minLength={6}
              />
            </div>

            <div className="profile-form-group">
              <label htmlFor="confirm_password">Confirm Password</label>
              <input
                type="password"
                id="confirm_password"
                name="confirm_password"
                value={passwordData.confirm_password}
                onChange={onPasswordChange}
                placeholder="Confirm new password"
                className="profile-input"
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="profile-form-actions">
            <button 
              type="submit" 
              className="profile-save-btn" 
              disabled={saving}
            >
              {saving ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="profile-card settings-card-danger">
        <h3 className="profile-card-title settings-title-danger">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Danger Zone
        </h3>
        <p className="settings-description settings-description-danger">
          Irreversible actions that will affect your account
        </p>

        <div className="settings-danger-item">
          <div className="settings-danger-info">
            <h4>Delete Account</h4>
            <p>Permanently delete your account and all associated data</p>
          </div>
          <button 
            onClick={openDeleteModal}
            className="settings-delete-btn"
            disabled={saving}
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Report Issue */}
      <div className="profile-card">
        <h3 className="profile-card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Report Issue or Cheating
        </h3>
        <p className="settings-description">
          Flag harassment, cheating, or other violations for organizer review.
        </p>
        {reportSuccess && <div className="report-success">{reportSuccess}</div>}
        <div className="report-action">
          <button
            onClick={openReportModal}
            className="report-btn"
            disabled={saving}
          >
            Submit Report
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h3>Delete Account</h3>
            </div>
            
            <p className="modal-text">
              Are you sure you want to delete your account? This action is <strong>permanent</strong> and cannot be undone. All your data, including teams, submissions, and activity will be permanently removed.
            </p>

            {/* Password Input for Verification */}
            <div className="modal-password-section">
              <label htmlFor="delete-password">Enter your password to confirm:</label>
              <input
                type="password"
                id="delete-password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your password"
                className="modal-password-input"
                autoFocus
              />
              {deleteError && <p className="modal-error">{deleteError}</p>}
            </div>

            <div className="modal-password-section">
              <label htmlFor="delete-reason">Reason for leaving (optional):</label>
              <textarea
                id="delete-reason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Tell us why you're leaving (optional)"
                className="modal-textarea"
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button 
                onClick={closeDeleteModal}
                className="modal-cancel-btn"
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete}
                className="modal-confirm-btn"
                disabled={saving}
              >
                {saving ? "Deleting..." : "Yes, Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ReportModal
        isOpen={reportOpen}
        onClose={closeReportModal}
        onSubmit={handleReportSubmit}
        loading={reportLoading}
        error={reportError}
        events={reportEvents}
      />

      <style jsx>{`
        .profile-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 1.5rem;
        }

        .settings-card-danger {
          border-color: rgba(248,113,113,0.2);
        }

        .profile-card-title {
          display: flex;
          align-items: center;
          font-family: 'Syne', sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 0.5rem 0;
        }

        .settings-title-danger {
          color: #f87171;
        }

        .settings-description {
          color: #888;
          font-size: 0.85rem;
          margin: 0 0 1.5rem 0;
        }

        .settings-description-danger {
          color: rgba(248,113,113,0.8);
        }

        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .profile-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .profile-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .profile-form-group label {
          font-size: 0.85rem;
          font-weight: 500;
          color: rgba(255,255,255,0.8);
        }

        .profile-input {
          width: 100%;
          padding: 0.6rem 1rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #fff;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.2s ease;
        }

        .profile-input:focus {
          border-color: #6EE7B7;
          background: rgba(255,255,255,0.08);
        }

        .profile-form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 1rem;
        }

        .profile-save-btn {
          padding: 0.6rem 1.5rem;
          background: #6EE7B7;
          border: none;
          border-radius: 8px;
          color: #0c0c0f;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .profile-save-btn:hover {
          background: #86efac;
          transform: translateY(-2px);
        }

        .profile-save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .settings-danger-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem;
          background: rgba(248,113,113,0.02);
          border: 1px solid rgba(248,113,113,0.1);
          border-radius: 8px;
        }

        .settings-danger-info h4 {
          font-size: 0.95rem;
          font-weight: 600;
          color: #f87171;
          margin: 0 0 0.25rem 0;
        }

        .settings-danger-info p {
          font-size: 0.8rem;
          color: #888;
          margin: 0;
        }

        .settings-delete-btn {
          padding: 0.5rem 1rem;
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.3);
          border-radius: 8px;
          color: #f87171;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .settings-delete-btn:hover {
          background: rgba(248,113,113,0.15);
          border-color: #f87171;
        }

        .settings-delete-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .report-action {
          display: flex;
          justify-content: flex-start;
        }

        .report-btn {
          padding: 0.6rem 1.5rem;
          background: rgba(110,231,183,0.12);
          border: 1px solid rgba(110,231,183,0.35);
          border-radius: 8px;
          color: #6EE7B7;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .report-btn:hover:not(:disabled) {
          background: rgba(110,231,183,0.2);
          border-color: rgba(110,231,183,0.6);
          transform: translateY(-1px);
        }

        .report-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .report-success {
          margin-bottom: 12px;
          padding: 8px 10px;
          border-radius: 8px;
          font-size: 12px;
          color: #6EE7B7;
          background: rgba(110,231,183,0.08);
          border: 1px solid rgba(110,231,183,0.2);
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          animation: fadeIn 0.2s ease;
        }

        .modal-content {
          background: #1a1a1f;
          border: 1px solid rgba(248,113,113,0.3);
          border-radius: 24px;
          padding: 2rem;
          max-width: 450px;
          width: 100%;
          animation: slideUp 0.3s ease;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .modal-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .modal-header h3 {
          font-family: 'Syne', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #f87171;
          margin: 0;
        }

        .modal-text {
          color: #ccc;
          font-size: 1rem;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .modal-text strong {
          color: #f87171;
        }

        .modal-password-section {
          margin-bottom: 1.5rem;
        }

        .modal-password-section label {
          display: block;
          font-size: 0.9rem;
          color: rgba(255,255,255,0.8);
          margin-bottom: 0.5rem;
        }

        .modal-password-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(248,113,113,0.3);
          border-radius: 8px;
          color: #fff;
          font-size: 1rem;
          outline: none;
          transition: all 0.2s ease;
        }

        .modal-password-input:focus {
          border-color: #f87171;
          background: rgba(255,255,255,0.08);
        }

        .modal-textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #fff;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s ease;
          resize: vertical;
        }

        .modal-textarea:focus {
          border-color: #6EE7B7;
          background: rgba(255,255,255,0.08);
        }

        .modal-error {
          color: #f87171;
          font-size: 0.85rem;
          margin-top: 0.5rem;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .modal-cancel-btn {
          padding: 0.75rem 1.5rem;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #888;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modal-cancel-btn:hover {
          background: rgba(255,255,255,0.05);
          color: #fff;
        }

        .modal-cancel-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-confirm-btn {
          padding: 0.75rem 1.5rem;
          background: #f87171;
          border: none;
          border-radius: 8px;
          color: #fff;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modal-confirm-btn:hover {
          background: #ef4444;
          transform: translateY(-2px);
        }

        .modal-confirm-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .profile-form-row {
            grid-template-columns: 1fr;
          }

          .settings-danger-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .settings-delete-btn {
            width: 100%;
          }

          .modal-content {
            padding: 1.5rem;
          }

          .modal-actions {
            flex-direction: column;
          }

          .modal-cancel-btn,
          .modal-confirm-btn {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}

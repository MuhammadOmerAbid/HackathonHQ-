"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "@/utils/axios";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import ModerationModal from "@/components/users/ModerationModal";

export default function OrganizerUsersPage() {
  const router = useRouter();
  const { user, isOrganizer } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });
  const [moderationOpen, setModerationOpen] = useState(false);
  const [moderationTarget, setModerationTarget] = useState(null);
  const [moderationAction, setModerationAction] = useState("warn");
  const [moderationError, setModerationError] = useState("");
  const [moderationSaving, setModerationSaving] = useState(false);

  useEffect(() => {
    // Redirect if not organizer
    if (!isOrganizer && !loading) {
      router.push("/");
      return;
    }
    fetchUsers();
  }, [isOrganizer]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/users/");
      setUsers(res.data.results || res.data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setMessage({ type: "error", text: "Failed to load users" });
    } finally {
      setLoading(false);
    }
  };

  const handleMakeJudge = async (userId, username) => {
    setActionLoading({ ...actionLoading, [userId]: "making" });
    setMessage({ type: "", text: "" });
    
    try {
      const res = await axios.post(`/users/${userId}/make_judge/`);
      setMessage({ type: "success", text: res.data.success || `${username} is now a judge` });
      fetchUsers(); // Refresh the list
    } catch (err) {
      console.error("Error making judge:", err);
      setMessage({ 
        type: "error", 
        text: err.response?.data?.error || "Failed to make user a judge" 
      });
    } finally {
      setActionLoading({ ...actionLoading, [userId]: null });
    }
  };

  const handleRemoveJudge = async (userId, username) => {
    setActionLoading({ ...actionLoading, [userId]: "removing" });
    setMessage({ type: "", text: "" });
    
    try {
      const res = await axios.post(`/users/${userId}/remove_judge/`);
      setMessage({ type: "success", text: res.data.success || `Judge role removed from ${username}` });
      fetchUsers(); // Refresh the list
    } catch (err) {
      console.error("Error removing judge:", err);
      setMessage({ 
        type: "error", 
        text: err.response?.data?.error || "Failed to remove judge role" 
      });
    } finally {
      setActionLoading({ ...actionLoading, [userId]: null });
    }
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAdmin = user?.is_staff || user?.is_superuser;

  const isSuspendedNow = (u) => {
    if (!u.suspended_until) return false;
    return new Date(u.suspended_until) > new Date();
  };

  const formatSuspendedUntil = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return isNaN(d) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const targetIsAdminOrOrganizer = (u) => {
    if (!u) return false;
    return !!(u.is_superuser || u.is_staff || u.is_organizer || u.profile?.is_organizer);
  };

  const canModerateTarget = (u) => {
    if (!user || !u) return false;
    if (u.id === user.id) return false;
    if (isAdmin) return true;
    if (isOrganizer) return !targetIsAdminOrOrganizer(u);
    return false;
  };

  const allowedActionsFor = (u) => {
    if (!canModerateTarget(u)) return [];
    return isAdmin ? ["warn", "suspend", "ban"] : ["warn", "suspend"];
  };

  const openModeration = (u, actionType) => {
    setModerationTarget(u);
    setModerationAction(actionType || "warn");
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
      const res = await axios.post(`/users/${moderationTarget.id}/${action}/`, payload);
      setMessage({ type: "success", text: res.data?.success || `User ${action}ed successfully.` });
      setModerationOpen(false);
      setModerationTarget(null);
      fetchUsers();
    } catch (err) {
      setModerationError(err.response?.data?.error || "Failed to moderate user.");
    } finally {
      setModerationSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading users..." />;
  }

  return (
    <div className="dashboard-container">
      <div className="blob blob1" />
      <div className="blob blob2" />
      <div className="blob blob3" />

      <div className="dashboard-content">
        {/* Header */}
        <div className="dashboard-welcome">
          <div>
            <h1 className="dashboard-welcome-title">Manage Users</h1>
            <p className="dashboard-welcome-subtitle">
              View all users and manage judge roles
            </p>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`register-message ${message.type}`} style={{ marginBottom: '1.5rem' }}>
            <svg className="register-message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {message.type === "success" ? (
                <path d="M20 6L9 17l-5-5" />
              ) : (
                <circle cx="12" cy="12" r="10" />
              )}
            </svg>
            {message.text}
          </div>
        )}

        {/* Search */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <svg
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '18px',
                height: '18px',
                color: 'rgba(255,255,255,0.4)'
              }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search users by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.75rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '30px',
                fontSize: '0.95rem',
                color: 'white',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>User</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Role</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Teams</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Submissions</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Actions</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Moderation</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isUserJudge = u.profile?.is_judge === true;
                  const isUserOrganizer = u.profile?.is_organizer === true || u.is_organizer || u.is_staff || u.is_superuser;
                  const isLoading = actionLoading[u.id];
                  const canModerate = canModerateTarget(u);
                  const allowedActions = allowedActionsFor(u);
                  const suspended = isSuspendedNow(u);
                  const suspendedUntilLabel = suspended ? formatSuspendedUntil(u.suspended_until) : "";
                  
                  return (
                    <tr key={u.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            overflow: 'hidden'
                          }}>
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt=""
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              u.username?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span style={{ color: 'white', fontWeight: 500 }}>{u.username}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.7)' }}>{u.email || '-'}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                          {u.is_superuser ? (
                            <span style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '999px',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              background: 'rgba(239,68,68,0.15)',
                              color: '#f87171',
                              border: '1px solid rgba(239,68,68,0.3)'
                            }}>ADMIN</span>
                          ) : isUserOrganizer ? (
                            <span style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '999px',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              background: 'rgba(110,231,183,0.15)',
                              color: '#6EE7B7',
                              border: '1px solid rgba(110,231,183,0.3)'
                            }}>ORGANIZER</span>
                          ) : isUserJudge ? (
                            <span style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '999px',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              background: 'rgba(251,191,36,0.15)',
                              color: '#fbbf24',
                              border: '1px solid rgba(251,191,36,0.3)'
                            }}>JUDGE</span>
                          ) : (
                            <span style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '999px',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              background: 'rgba(255,255,255,0.05)',
                              color: 'rgba(255,255,255,0.5)',
                              border: '1px solid rgba(255,255,255,0.1)'
                            }}>PARTICIPANT</span>
                          )}
                          {suspended && (
                            <span className="suspended-badge" title={`Suspended until ${suspendedUntilLabel}`}>
                              🔒 Suspended · {suspendedUntilLabel}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)' }}>{u.teams_count || 0}</td>
                      <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.5)' }}>{u.submissions_count || 0}</td>
                      <td style={{ padding: '1rem' }}>
                        {u.id === user?.id ? (
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>Current user</span>
                        ) : u.is_superuser ? (
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>Admin</span>
                        ) : isUserOrganizer ? (
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>Organizer</span>
                        ) : isUserJudge ? (
                          <button
                            onClick={() => handleRemoveJudge(u.id, u.username)}
                            disabled={isLoading}
                            style={{
                              padding: '0.4rem 0.8rem',
                              background: 'rgba(239,68,68,0.15)',
                              border: '1px solid rgba(239,68,68,0.3)',
                              borderRadius: '999px',
                              color: '#f87171',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                          >
                            {isLoading === "removing" ? "Removing..." : "Remove Judge"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMakeJudge(u.id, u.username)}
                            disabled={isLoading}
                            style={{
                              padding: '0.4rem 0.8rem',
                              background: 'rgba(110,231,183,0.15)',
                              border: '1px solid rgba(110,231,183,0.3)',
                              borderRadius: '999px',
                              color: '#6EE7B7',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(110,231,183,0.25)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(110,231,183,0.15)'}
                          >
                            {isLoading === "making" ? "Making..." : "Make Judge"}
                          </button>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {canModerate ? (
                          <div className="mod-actions">
                            {allowedActions.includes("warn") && (
                              <button
                                className="mod-btn mod-btn-warn"
                                onClick={() => openModeration(u, "warn")}
                                disabled={moderationSaving}
                              >
                                Warn
                              </button>
                            )}
                            {allowedActions.includes("suspend") && (
                              <button
                                className={`mod-btn ${suspended ? "mod-btn-resuspend" : "mod-btn-suspend"}`}
                                onClick={() => openModeration(u, "suspend")}
                                disabled={moderationSaving}
                                title={suspended ? `Already suspended until ${suspendedUntilLabel}` : "Suspend user"}
                              >
                                {suspended ? "Re-suspend" : "Suspend"}
                              </button>
                            )}
                            {allowedActions.includes("ban") && (
                              <button
                                className="mod-btn mod-btn-ban"
                                onClick={() => openModeration(u, "ban")}
                                disabled={moderationSaving}
                              >
                                Ban
                              </button>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <ModerationModal
          isOpen={moderationOpen}
          onClose={closeModeration}
          onSubmit={handleModerationSubmit}
          targetUser={moderationTarget}
          allowedActions={moderationTarget ? allowedActionsFor(moderationTarget) : []}
          initialAction={moderationAction}
          loading={moderationSaving}
          error={moderationError}
        />
      </div>

      <style jsx>{`
        .mod-actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .mod-btn {
          padding: 0.35rem 0.65rem;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 600;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .mod-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .mod-btn-warn {
          background: rgba(251,191,36,0.15);
          border-color: rgba(251,191,36,0.3);
          color: #fbbf24;
        }
        .mod-btn-warn:hover:not(:disabled) {
          background: rgba(251,191,36,0.25);
        }
        .mod-btn-suspend {
          background: rgba(96,165,250,0.15);
          border-color: rgba(96,165,250,0.3);
          color: #60a5fa;
        }
        .mod-btn-suspend:hover:not(:disabled) {
          background: rgba(96,165,250,0.25);
        }
        .mod-btn-resuspend {
          background: rgba(251,146,60,0.15);
          border-color: rgba(251,146,60,0.4);
          color: #fb923c;
        }
        .mod-btn-resuspend:hover:not(:disabled) {
          background: rgba(251,146,60,0.28);
        }
        .mod-btn-ban {
          background: rgba(248,113,113,0.15);
          border-color: rgba(248,113,113,0.3);
          color: #f87171;
        }
        .mod-btn-ban:hover:not(:disabled) {
          background: rgba(248,113,113,0.25);
        }
        .suspended-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 0.18rem 0.55rem;
          border-radius: 999px;
          font-size: 0.65rem;
          font-weight: 700;
          background: rgba(251,146,60,0.12);
          color: #fb923c;
          border: 1px solid rgba(251,146,60,0.35);
          letter-spacing: 0.01em;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}

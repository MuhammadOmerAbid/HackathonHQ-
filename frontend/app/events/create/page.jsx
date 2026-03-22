"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "../../../utils/axios";
import LoadingSpinner from "@/components/LoadingSpinner";


export default function CreateEventPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", description: "", start_date: "", end_date: "", is_premium: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [canCreate, setCanCreate] = useState(false);
  const [judgeSearch, setJudgeSearch] = useState("");
  const [availableJudges, setAvailableJudges] = useState([]);
  const [selectedJudgeIds, setSelectedJudgeIds] = useState([]);
  const [judgeLoading, setJudgeLoading] = useState(false);
  const [judgeError, setJudgeError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) {
          sessionStorage.setItem("redirectAfterLogin", "/events/create");
          router.push("/login?message=Please login to create an event");
          return;
        }
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const uRes = await axios.get("/users/me/");
        setUser(uRes.data);
        const ok = uRes.data.is_staff || uRes.data.is_superuser || uRes.data.profile?.is_organizer === true;
        setCanCreate(ok);
        if (!ok) router.push("/events?error=You do not have permission to create events");
      } catch (e) {
        if (e.response?.status === 401) {
          sessionStorage.setItem("redirectAfterLogin", "/events/create");
          router.push("/login?message=Session expired. Please login again");
        } else router.push("/events");
      } finally { setChecking(false); }
    })();
  }, [router]);

  useEffect(() => {
    if (!canCreate) return;
    let active = true;
    const fetchJudges = async () => {
      try {
        setJudgeLoading(true);
        setJudgeError("");
        const res = await axios.get(`/users/judges/?q=${encodeURIComponent(judgeSearch)}`);
        if (active) setAvailableJudges(res.data || []);
      } catch (e) {
        if (active) setJudgeError("Failed to load judges.");
      } finally {
        if (active) setJudgeLoading(false);
      }
    };
    fetchJudges();
    return () => { active = false; };
  }, [judgeSearch, canCreate]);

  const toggleJudge = (judgeId) => {
    setSelectedJudgeIds((prev) => (
      prev.includes(judgeId) ? prev.filter(id => id !== judgeId) : [...prev, judgeId]
    ));
  };

  const getMinDate = () => {
    const n = new Date();
    n.setMinutes(n.getMinutes() - n.getTimezoneOffset());
    return n.toISOString().slice(0, 16);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(p => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const s = new Date(formData.start_date), en = new Date(formData.end_date);
      if (en <= s) { setError("End date must be after start date"); setLoading(false); return; }
      const res = await axios.post("/events/", {
        name: formData.name, description: formData.description,
        start_date: s.toISOString(), end_date: en.toISOString(), is_premium: formData.is_premium,
      });
      if (selectedJudgeIds.length > 0) {
        try {
          await axios.put(`/events/${res.data.id}/judges/`, { judges: selectedJudgeIds });
        } catch (e) {
          console.error("Failed to assign judges:", e);
        }
      }
      router.push(`/events/${res.data.id}`);
    } catch (e) {
      if (e.response?.status === 403) setError("You don't have permission to create events.");
      else if (e.response?.status === 401) {
        setError("Session expired. Redirecting to login…");
        setTimeout(() => router.push("/login?redirect=/events/create"), 2000);
      } else setError(e.response?.data?.message || "Failed to create event. Please try again.");
    } finally { setLoading(false); }
  };

  if (checking) return <LoadingSpinner message="Checking permissions..." />;

  if (!canCreate) return null;

  return (
    <>
      
      <div className="evc-page">
        <button className="evc-back" onClick={() => router.back()}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Back
        </button>

        <div className="evc-eyebrow">
          <div className="evc-eyebrow-dot" />
          <span className="evc-eyebrow-label">New Event</span>
        </div>
        <h1 className="evc-title">Create Hackathon</h1>
        <p className="evc-subtitle">
          {user?.profile?.organization_name
            ? `Organizing as ${user.profile.organization_name}`
            : user?.is_staff ? "Creating as Admin" : "Set up your hackathon event"}
        </p>

        <div className="evc-card">
          <form onSubmit={handleSubmit}>
            <div className="evc-card-body">
              {error && (
                <div className="evc-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <div className="evc-group">
                <label className="evc-label">Event Name <span className="evc-required">*</span></label>
                <input
                  className="evc-input" type="text" name="name"
                  value={formData.name} onChange={handleChange}
                  placeholder="e.g., AI Hackathon 2025"
                  required minLength={3} maxLength={100} disabled={loading}
                />
              </div>

              <div className="evc-group">
                <label className="evc-label">Description <span className="evc-required">*</span></label>
                <textarea
                  className="evc-textarea" name="description"
                  value={formData.description} onChange={handleChange}
                  placeholder="Describe your hackathon — theme, rules, prizes, schedule…"
                  required minLength={20} maxLength={2000} disabled={loading}
                />
                <span className="evc-hint">{formData.description.length}/2000 characters</span>
              </div>

              <div className="evc-group">
                <label className="evc-label">Select Judges <span className="evc-optional">(optional)</span></label>
                <div className="evc-judge-search">
                  <input
                    className="evc-input" type="text"
                    placeholder="Search judges by name or email..."
                    value={judgeSearch}
                    onChange={(e) => setJudgeSearch(e.target.value)}
                    disabled={loading}
                  />
                </div>
                {judgeError && (
                  <div className="evc-error">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {judgeError}
                  </div>
                )}
                <div className="evc-judge-grid">
                  {judgeLoading ? (
                    <div className="evc-judge-empty">Loading judges...</div>
                  ) : availableJudges.length === 0 ? (
                    <div className="evc-judge-empty">No judges found</div>
                  ) : (
                    availableJudges.map(j => (
                      <button
                        type="button"
                        key={j.id}
                        className={`evc-judge-card ${selectedJudgeIds.includes(j.id) ? "selected" : ""}`}
                        onClick={() => toggleJudge(j.id)}
                        disabled={loading}
                      >
                        <div className="evc-judge-avatar">{j.username?.charAt(0).toUpperCase()}</div>
                        <div className="evc-judge-info">
                          <div className="evc-judge-name">{j.username}</div>
                          <div className="evc-judge-email">{j.email}</div>
                        </div>
                        <div className="evc-judge-status">
                          {selectedJudgeIds.includes(j.id) ? "Selected" : "Select"}
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <span className="evc-hint">{selectedJudgeIds.length} judge{selectedJudgeIds.length !== 1 ? "s" : ""} selected</span>
              </div>
              <div className="evc-row">
                <div className="evc-group">
                  <label className="evc-label">Start Date <span className="evc-required">*</span></label>
                  <input
                    className="evc-input" type="datetime-local" name="start_date"
                    value={formData.start_date} onChange={handleChange}
                    min={getMinDate()} required disabled={loading}
                  />
                </div>
                <div className="evc-group">
                  <label className="evc-label">End Date <span className="evc-required">*</span></label>
                  <input
                    className="evc-input" type="datetime-local" name="end_date"
                    value={formData.end_date} onChange={handleChange}
                    min={formData.start_date || getMinDate()} required disabled={loading}
                  />
                </div>
              </div>

              <div className="evc-check-row">
                <input type="checkbox" name="is_premium" checked={formData.is_premium} onChange={handleChange} disabled={loading} />
                <div>
                  <div className="evc-check-label">
                    Premium Event
                    <span className="evc-pro-badge">PRO</span>
                  </div>
                  <div className="evc-check-sub">Gets featured placement and additional promotional support</div>
                </div>
              </div>

              {user && (
                <div className="evc-organizer-strip">
                  <div className="evc-organizer-avatar">
                    {user.avatar ? <img src={user.avatar} alt="" /> : (user.username || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="evc-organizer-name">
                      {user.profile?.organization_name || user.username}
                      {user.is_staff && <span className="evc-admin-badge">Admin</span>}
                    </div>
                    <div className="evc-organizer-sub">Event Organizer</div>
                  </div>
                </div>
              )}
            </div>

            <div className="evc-card-footer">
              <Link href="/events" className="evc-btn-cancel">Cancel</Link>
              <button type="submit" className="evc-btn-submit" disabled={loading}>
                {loading ? (
                  <><div className="evc-btn-spinner" /> Creating…</>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Create Hackathon
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}



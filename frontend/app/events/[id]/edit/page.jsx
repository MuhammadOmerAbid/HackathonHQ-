"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "@/utils/axios";
import LoadingSpinner from "@/components/LoadingSpinner";

const toInputDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

export default function EditEventPage() {
  const { id } = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    registration_deadline: "",
    team_deadline: "",
    submission_open_at: "",
    submission_deadline: "",
    judging_start: "",
    judging_end: "",
    reviewers_per_submission: 3,
    max_participants: "",
    is_premium: false,
  });
  const [eventName, setEventName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) {
          sessionStorage.setItem("redirectAfterLogin", `/events/${id}/edit`);
          router.push("/login?message=Please login to edit this event");
          return;
        }
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const [uRes, eRes] = await Promise.all([
          axios.get("/users/me/"),
          axios.get(`/events/${id}/`),
        ]);
        setUser(uRes.data);
        setEventName(eRes.data?.name || "");
        const organizerId = typeof eRes.data?.organizer === "object"
          ? eRes.data.organizer?.id
          : eRes.data?.organizer;
        const hasRole =
          uRes.data?.is_staff ||
          uRes.data?.is_superuser ||
          uRes.data?.profile?.is_organizer === true;
        const ok =
          hasRole && (
            uRes.data?.is_staff ||
            uRes.data?.is_superuser ||
            organizerId === uRes.data?.id
          );
        setCanEdit(ok);
        if (!ok) {
          router.push(`/events/${id}?error=You do not have permission to edit this event`);
          return;
        }

        const e = eRes.data || {};
        setFormData({
          name: e.name || "",
          description: e.description || "",
          start_date: toInputDate(e.start_date),
          end_date: toInputDate(e.end_date),
          registration_deadline: toInputDate(e.registration_deadline),
          team_deadline: toInputDate(e.team_deadline),
          submission_open_at: toInputDate(e.submission_open_at),
          submission_deadline: toInputDate(e.submission_deadline),
          judging_start: toInputDate(e.judging_start),
          judging_end: toInputDate(e.judging_end),
          reviewers_per_submission: e.reviewers_per_submission ?? 3,
          max_participants: e.max_participants ?? "",
          is_premium: !!e.is_premium,
        });
      } catch (e) {
        if (e.response?.status === 401) {
          sessionStorage.setItem("redirectAfterLogin", `/events/${id}/edit`);
          router.push("/login?message=Session expired. Please login again");
          return;
        }
        if (e.response?.status === 404) {
          setError("Event not found.");
          return;
        }
        setError("Failed to load event details. Please try again.");
      } finally {
        setChecking(false);
      }
    })();
  }, [id, router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const s = new Date(formData.start_date);
      const en = new Date(formData.end_date);
      if (Number.isNaN(s.getTime()) || Number.isNaN(en.getTime())) {
        setError("Start and end dates are required.");
        setLoading(false);
        return;
      }
      if (en <= s) {
        setError("End date must be after start date.");
        setLoading(false);
        return;
      }
      const timeOrder = [
        { label: "Registration deadline", value: formData.registration_deadline },
        { label: "Submission opens", value: formData.submission_open_at },
        { label: "Submission deadline", value: formData.submission_deadline },
        { label: "Judging start", value: formData.judging_start },
        { label: "Judging end", value: formData.judging_end },
      ];
      for (let i = 0; i < timeOrder.length - 1; i += 1) {
        const a = timeOrder[i];
        const b = timeOrder[i + 1];
        if (a.value && b.value) {
          const aDate = new Date(a.value);
          const bDate = new Date(b.value);
          if (bDate < aDate) {
            setError(`${b.label} must be after ${a.label}.`);
            setLoading(false);
            return;
          }
        }
      }

      await axios.put(`/events/${id}/`, {
        name: formData.name,
        description: formData.description,
        start_date: s.toISOString(),
        end_date: en.toISOString(),
        registration_deadline: formData.registration_deadline ? new Date(formData.registration_deadline).toISOString() : null,
        team_deadline: formData.team_deadline ? new Date(formData.team_deadline).toISOString() : null,
        submission_open_at: formData.submission_open_at ? new Date(formData.submission_open_at).toISOString() : null,
        submission_deadline: formData.submission_deadline ? new Date(formData.submission_deadline).toISOString() : null,
        judging_start: formData.judging_start ? new Date(formData.judging_start).toISOString() : null,
        judging_end: formData.judging_end ? new Date(formData.judging_end).toISOString() : null,
        reviewers_per_submission: Number(formData.reviewers_per_submission) || 3,
        max_participants: formData.max_participants ? Number(formData.max_participants) : null,
        is_premium: formData.is_premium,
      });
      router.push(`/events/${id}?refresh=1`);
    } catch (e) {
      if (e.response?.status === 403) setError("You don't have permission to edit this event.");
      else if (e.response?.status === 401) {
        setError("Session expired. Redirecting to login...");
        setTimeout(() => router.push(`/login?redirect=/events/${id}/edit`), 2000);
      } else setError(e.response?.data?.message || "Failed to update event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) return <LoadingSpinner message="Loading event..." />;
  if (error && !canEdit) {
    return (
      <div className="evc-page">
        <div className="evc-card">
          <div className="evc-card-body">
            <div className="evc-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          </div>
          <div className="evc-card-footer">
            <Link href={`/events/${id}`} className="evc-btn-cancel">Back to Event</Link>
          </div>
        </div>
      </div>
    );
  }
  if (!canEdit) return null;

  return (
    <div className="evc-page">
      <button className="evc-back-btn" onClick={() => router.push(`/events/${id}`)}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Event
      </button>

      <div className="evc-eyebrow">
        <div className="evc-eyebrow-dot" />
        <span className="evc-eyebrow-label">Edit Event</span>
      </div>
      <h1 className="evc-title">{eventName || "Update Event"}</h1>
      <p className="evc-subtitle">
        {user?.profile?.organization_name
          ? `Organizing as ${user.profile.organization_name}`
          : user?.is_staff ? "Editing as Admin" : "Update your hackathon details"}
      </p>

      <div className="evc-card">
        <form onSubmit={handleSubmit}>
          <div className="evc-card-body">
            {error && (
              <div className="evc-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
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
                placeholder="Describe your hackathon - theme, rules, prizes, schedule..."
                required minLength={20} maxLength={2000} disabled={loading}
              />
              <span className="evc-hint">{formData.description.length}/2000 characters</span>
            </div>

            <div className="evc-row">
              <div className="evc-group">
                <label className="evc-label">Start Date <span className="evc-required">*</span></label>
                <input
                  className="evc-input" type="datetime-local" name="start_date"
                  value={formData.start_date} onChange={handleChange}
                  required disabled={loading}
                />
              </div>
              <div className="evc-group">
                <label className="evc-label">End Date <span className="evc-required">*</span></label>
                <input
                  className="evc-input" type="datetime-local" name="end_date"
                  value={formData.end_date} onChange={handleChange}
                  required disabled={loading}
                />
              </div>
            </div>
            <div className="evc-row">
              <div className="evc-group">
                <label className="evc-label">Registration Deadline</label>
                <input
                  className="evc-input" type="datetime-local" name="registration_deadline"
                  value={formData.registration_deadline} onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div className="evc-group">
                <label className="evc-label">Team Formation Deadline</label>
                <input
                  className="evc-input" type="datetime-local" name="team_deadline"
                  value={formData.team_deadline} onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="evc-row">
              <div className="evc-group">
                <label className="evc-label">Submission Opens</label>
                <input
                  className="evc-input" type="datetime-local" name="submission_open_at"
                  value={formData.submission_open_at} onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div className="evc-group">
                <label className="evc-label">Submission Deadline</label>
                <input
                  className="evc-input" type="datetime-local" name="submission_deadline"
                  value={formData.submission_deadline} onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="evc-row">
              <div className="evc-group">
                <label className="evc-label">Judging Start</label>
                <input
                  className="evc-input" type="datetime-local" name="judging_start"
                  value={formData.judging_start} onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div className="evc-group">
                <label className="evc-label">Judging End</label>
                <input
                  className="evc-input" type="datetime-local" name="judging_end"
                  value={formData.judging_end} onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="evc-row">
              <div className="evc-group">
                <label className="evc-label">Judges per Submission</label>
                <input
                  className="evc-input" type="number" name="reviewers_per_submission"
                  value={formData.reviewers_per_submission} onChange={handleChange}
                  min={1} max={10} disabled={loading}
                />
                <span className="evc-hint">Recommended: 3</span>
              </div>
              <div className="evc-group">
                <label className="evc-label">Max Participants</label>
                <input
                  className="evc-input" type="number" name="max_participants"
                  value={formData.max_participants} onChange={handleChange}
                  min={1} disabled={loading}
                />
                <span className="evc-hint">Leave blank for no cap</span>
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
          </div>

          <div className="evc-card-footer">
            <Link href={`/events/${id}`} className="evc-btn-cancel">Cancel</Link>
            <button type="submit" className="evc-btn-submit" disabled={loading}>
              {loading ? (
                <><div className="evc-btn-spinner" /> Updating...</>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Update Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

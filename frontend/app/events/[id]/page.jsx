"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "../../../utils/axios";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";

// Professional SVG Icons
const Icons = {
  calendar: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  clock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  team: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  judge: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
    </svg>
  ),
  submission: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  ),
  trophy: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
      <path d="M4 22h16"></path>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21 1.18.54 2.03 2.03 2.03 3.79"></path>
      <path d="M8 2h8v7a4 4 0 1 1-8 0V2z"></path>
    </svg>
  ),
  arrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  ),
  arrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  ),
  search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
};

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isOrganizer } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [assignedJudges, setAssignedJudges] = useState([]);
  const [allJudges, setAllJudges] = useState([]);
  const [judgeSearch, setJudgeSearch] = useState("");
  const [judgeSaving, setJudgeSaving] = useState(false);
  const [judgeError, setJudgeError] = useState("");
  const [myTeams, setMyTeams] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [enrollTeamId, setEnrollTeamId] = useState("");
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState("");
  const [enrollSuccess, setEnrollSuccess] = useState("");
  const [sponsorForm, setSponsorForm] = useState({
    name: "",
    tier: "",
    logo_url: "",
    website: "",
    challenge_desc: "",
  });
  const [sponsorSaving, setSponsorSaving] = useState(false);
  const [sponsorMessage, setSponsorMessage] = useState({ type: "", text: "" });
  const [editingSponsorId, setEditingSponsorId] = useState(null);

  const loadEventData = useCallback(async (withLoading = true) => {
    if (!id) return;
    if (withLoading) setLoading(true);
    try {
      const eR = await axios.get(`/events/${id}/`);
      setEvent(eR.data);
    } catch (e) { console.error(e); }
    finally {
      if (withLoading) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEventData(true);
  }, [loadEventData]);

  useEffect(() => {
    if (!event || !user) return;
    const fetchMyTeams = async () => {
      try {
        const res = await axios.get("/teams/?mine=1");
        setMyTeams(res.data.results || res.data || []);
      } catch (e) {
        setMyTeams([]);
      }
    };
    const fetchEnrollments = async () => {
      try {
        const res = await axios.get(`/team-events/?event=${id}&mine=1`);
        setMyEnrollments(res.data.results || res.data || []);
      } catch (e) {
        setMyEnrollments([]);
      }
    };
    fetchMyTeams();
    fetchEnrollments();
  }, [event, user, id]);

  useEffect(() => {
    if (!id) return;
    if (searchParams?.get("refresh") === "1") {
      loadEventData(false);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("refresh");
      const qs = params.toString();
      router.replace(qs ? `/events/${id}?${qs}` : `/events/${id}`);
    }
  }, [searchParams, id, loadEventData, router]);

  const canManageJudges = useMemo(() => {
    if (!event || !user) return false;
    if (!isOrganizer) return false;
    return user.is_staff || user.is_superuser || event.organizer === user.id;
  }, [event, user, isOrganizer]);

  const canManageSponsors = canManageJudges;

  useEffect(() => {
    if (!event) return;
    setSponsorForm({
      name: "",
      tier: "",
      logo_url: "",
      website: "",
      challenge_desc: "",
    });
    setEditingSponsorId(null);
    setSponsorMessage({ type: "", text: "" });
  }, [event?.id]);

  useEffect(() => {
    if (!event || !canManageJudges) return;
    const fetchJudges = async () => {
      try {
        const res = await axios.get(`/events/${id}/judges/`);
        setAssignedJudges(res.data.judges || []);
      } catch (e) {
        console.error("Failed to fetch assigned judges", e);
      }
    };
    fetchJudges();
  }, [event, canManageJudges, id]);

  useEffect(() => {
    if (!canManageJudges) return;
    const fetchAll = async () => {
      try {
        const res = await axios.get(`/users/judges/?q=${encodeURIComponent(judgeSearch)}`);
        setAllJudges(res.data || []);
      } catch (e) {
        console.error("Failed to fetch judges list", e);
      }
    };
    fetchAll();
  }, [canManageJudges, judgeSearch]);

  const assignedIds = useMemo(() => new Set(assignedJudges.map((j) => j.id)), [assignedJudges]);

  const toggleJudge = async (judgeId) => {
    if (!canManageJudges) return;
    const nextIds = new Set(assignedIds);
    if (nextIds.has(judgeId)) nextIds.delete(judgeId);
    else nextIds.add(judgeId);
    const nextList = Array.from(nextIds);
    setJudgeSaving(true);
    setJudgeError("");
    try {
      const res = await axios.put(`/events/${id}/judges/`, { judges: nextList });
      setAssignedJudges(res.data.judges || []);
    } catch (e) {
      console.error("Failed to update judges", e);
      setJudgeError("Failed to update judges. Try again.");
    } finally {
      setJudgeSaving(false);
    }
  };

  const handleEnrollTeam = async () => {
    if (!enrollTeamId) return;
    setEnrollLoading(true);
    setEnrollError("");
    setEnrollSuccess("");
    try {
      const res = await axios.post(`/events/${id}/enroll-team/`, { team: enrollTeamId });
      setEnrollSuccess("Team enrolled successfully.");
      setEnrollTeamId("");
      try {
        const refresh = await axios.get(`/team-events/?event=${id}&mine=1`);
        setMyEnrollments(refresh.data.results || refresh.data || []);
      } catch (e) {
        // ignore
      }
      return res;
    } catch (e) {
      const msg = e.response?.data?.error || "Enrollment failed.";
      setEnrollError(msg);
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleSponsorChange = (e) => {
    const { name, value } = e.target;
    setSponsorForm((prev) => ({ ...prev, [name]: value }));
  };

  const startEditSponsor = (s) => {
    setEditingSponsorId(s.id);
    setSponsorForm({
      name: s.name || "",
      tier: s.tier || "",
      logo_url: s.logo_url || "",
      website: s.website || "",
      challenge_desc: s.challenge_desc || "",
    });
    setSponsorMessage({ type: "", text: "" });
  };

  const cancelEditSponsor = () => {
    setEditingSponsorId(null);
    setSponsorForm({
      name: "",
      tier: "",
      logo_url: "",
      website: "",
      challenge_desc: "",
    });
  };

  const extractSponsorError = (err) => {
    const data = err?.response?.data;
    if (!data) return "Failed to save sponsor.";
    if (typeof data === "string") return data;
    if (data.error) return data.error;
    if (data.detail) return data.detail;
    const keys = Object.keys(data);
    if (keys.length > 0) {
      const key = keys[0];
      const val = data[key];
      if (Array.isArray(val) && val.length > 0) return `${key}: ${val[0]}`;
      if (typeof val === "string") return `${key}: ${val}`;
    }
    return "Failed to save sponsor.";
  };

  const saveSponsor = async (e) => {
    e.preventDefault();
    if (!sponsorForm.name?.trim()) {
      setSponsorMessage({ type: "error", text: "Sponsor name is required." });
      return;
    }
    setSponsorSaving(true);
    setSponsorMessage({ type: "", text: "" });
    const payload = {
      event: id,
      name: sponsorForm.name.trim(),
      tier: sponsorForm.tier?.trim() || null,
      logo_url: sponsorForm.logo_url?.trim() || null,
      website: sponsorForm.website?.trim() || null,
      challenge_desc: sponsorForm.challenge_desc?.trim() || null,
    };
    try {
      if (editingSponsorId) {
        await axios.put(`/sponsors/${editingSponsorId}/`, payload);
        setSponsorMessage({ type: "success", text: "Sponsor updated." });
      } else {
        await axios.post("/sponsors/", payload);
        setSponsorMessage({ type: "success", text: "Sponsor added." });
      }
      cancelEditSponsor();
      await loadEventData(false);
    } catch (err) {
      const msg = extractSponsorError(err);
      setSponsorMessage({ type: "error", text: msg });
    } finally {
      setSponsorSaving(false);
    }
  };

  const deleteSponsor = async (s) => {
    if (!confirm(`Remove sponsor "${s.name}"?`)) return;
    setSponsorSaving(true);
    setSponsorMessage({ type: "", text: "" });
    try {
      await axios.delete(`/sponsors/${s.id}/`);
      setSponsorMessage({ type: "success", text: "Sponsor removed." });
      await loadEventData(false);
    } catch (err) {
      const msg = extractSponsorError(err).replace("save", "remove");
      setSponsorMessage({ type: "error", text: msg });
    } finally {
      setSponsorSaving(false);
    }
  };

  const now = new Date();
  const getStatus = () => {
    if (!event) return null;
    if (event.status) {
      const map = {
        upcoming: { label: "Upcoming", cls: "upcoming" },
        registration: { label: "Registration Open", cls: "live" },
        active: { label: "Build Period", cls: "live" },
        submission_open: { label: "Submission Open", cls: "live" },
        submission_closed: { label: "Submission Closed", cls: "upcoming" },
        judging: { label: "Judging", cls: "live" },
        finished: { label: "Finished", cls: "ended" },
      };
      return map[event.status] || { label: "Live Now", cls: "live" };
    }
    const s = new Date(event.start_date), e = new Date(event.end_date);
    if (s > now) return { label: "Upcoming", cls: "upcoming" };
    if (e < now) return { label: "Ended", cls: "ended" };
    return { label: "Live Now", cls: "live" };
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
  const fmtDateTime = (d) => {
    if (!d) return "â€”";
    const dd = new Date(d);
    if (Number.isNaN(dd.getTime())) return "â€”";
    return dd.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const daysLeft = (date) => {
    const diff = Math.ceil((new Date(date) - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff} days left` : "Ended";
  };

  if (loading) return <LoadingSpinner message="Loading event…" />;

  if (!event) return (
    <div className="not-found">
      <div className="not-found-content">
        <div className="not-found-icon">⚠️</div>
        <h2>Event Not Found</h2>
        <p>The hackathon you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => router.push("/events")} className="btn-primary">
          Browse Events
        </button>
      </div>
    </div>
  );

  const status = getStatus();
  const totalParticipants = event?.participants_count || 0;
  const teamCapacity = Math.min(100, Math.round(((event?.teams_count || 0) / 20) * 100));
  const teamsHref = `/teams?event=${id}`;
  const submissionsHref = `/submissions?event=${id}`;
  const createTeamHref = `/teams/create?event=${id}`;
  const submitHref = `/submissions/create?event=${id}`;
  const submissionOpenAt = event?.submission_open_at || event?.team_deadline || event?.start_date;
  const submissionDeadline = event?.submission_deadline || event?.end_date;
  const judgingStart = event?.judging_start || submissionDeadline;
  const judgingEnd = event?.judging_end
    ? event.judging_end
    : new Date(new Date(event?.end_date).getTime() + 48 * 60 * 60 * 1000).toISOString();
  const timelineItems = [
    { key: "registration_deadline", label: "Registration Deadline", value: event?.registration_deadline || event?.start_date },
    { key: "team_deadline", label: "Team Registration Deadline", value: event?.team_deadline },
    { key: "submission_open_at", label: "Submission Opens", value: submissionOpenAt },
    { key: "submission_deadline", label: "Submission Deadline", value: submissionDeadline },
    { key: "judging_start", label: "Judging Start", value: judgingStart },
    { key: "judging_end", label: "Judging End", value: judgingEnd },
  ].filter(i => i.value);
  const nextDeadline = timelineItems
    .map(i => ({ ...i, date: new Date(i.value) }))
    .filter(i => !Number.isNaN(i.date.getTime()) && i.date > now)
    .sort((a, b) => a.date - b.date)[0];
  const enrolledTeamIds = new Set(
    (myEnrollments || [])
      .filter((en) => en.status === "enrolled")
      .map((en) => en.team)
  );
  const availableTeamsToEnroll = (myTeams || []).filter((t) => !enrolledTeamIds.has(t.id));
  const enrollOpen = event?.status
    ? ["registration", "active"].includes(event.status) && (!submissionOpenAt || new Date() < new Date(submissionOpenAt))
    : true;

  return (
    <div className="event-page">
      {/* Header with back button */}
      <div className="header">
        <button onClick={() => router.push("/events")} className="back-btn">
          <Icons.arrowLeft />
          <span>Back to Events</span>
        </button>
      </div>

      {/* Hero Section */}
      <div className="hero">
        <div className="hero-content">
          <div className="hero-main">
            <div className="hero-tag">
              <span className="hero-tag-dot" />
              <span className="hero-tag-label">Hackathon</span>
            </div>
            <div className="hero-title-wrapper">
              <h1 className="hero-title">{event.name}</h1>
              {event.is_premium && <span className="premium-badge">PRO</span>}
            </div>
            <p className="hero-organizer">by {event.organizer?.username || "HackathonHQ"}</p>
          </div>
          <div className={`status-badge ${status.cls}`}>
            <span className="status-dot" />
            <span>{status.label}</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      {/* Metrics Grid - Clean & Elegant */}
<div className="metrics-grid">
  <div className="metric-card">
    <div className="metric-icon">
      <Icons.calendar />
    </div>
    <div className="metric-content">
      <div className="metric-label">Start Date</div>
      <div className="metric-value">{fmtDate(event.start_date)}</div>
      <div className="metric-trend positive">{daysLeft(event.start_date)}</div>
    </div>
  </div>

  <div className="metric-card">
    <div className="metric-icon">
      <Icons.clock />
    </div>
    <div className="metric-content">
      <div className="metric-label">End Date</div>
      <div className="metric-value">{fmtDate(event.end_date)}</div>
      <div className="metric-trend">{daysLeft(event.end_date)}</div>
    </div>
  </div>

  <div className="metric-card">
    <div className="metric-icon">
      <Icons.team />
    </div>
    <div className="metric-content">
      <div className="metric-label">Teams</div>
      <div className="metric-value">{event.teams_count || 0}</div>
      <div className="metric-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${teamCapacity}%` }} />
        </div>
        <span className="progress-text">{teamCapacity}%</span>
      </div>
    </div>
  </div>

  <div className="metric-card">
    <div className="metric-icon">
      <Icons.users />
    </div>
    <div className="metric-content">
      <div className="metric-label">Participants</div>
      <div className="metric-value">{totalParticipants}</div>
      <div className="metric-trend">
        {totalParticipants > 0 ? 'active' : 'none'}
      </div>
    </div>
  </div>

  <div className="metric-card">
    <div className="metric-icon">
      <Icons.judge />
    </div>
    <div className="metric-content">
      <div className="metric-label">Judges</div>
      <div className="metric-value">{event.judges_count || 0}</div>
      <div className="metric-trend">
        {event.judges_count === 1 ? 'assigned' : `${event.judges_count || 0} total`}
      </div>
    </div>
  </div>
</div>

      {/* Navigation Tabs */}
      <div className="tabs">
        {["overview", "judges", "prizes"].map(tab => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="content">
        {activeTab === "overview" && (
          <div className="overview">
            <div className="description-card">
              <h2 className="section-title">About this Hackathon</h2>
              <p className="description">{event.description}</p>
            </div>
            <div className="description-card timeline-card">
              <h2 className="section-title">Timeline</h2>
              {nextDeadline && (
                <div className="timeline-next">
                  <span className="timeline-next-label">Next deadline</span>
                  <span className="timeline-next-value">{nextDeadline.label}</span>
                  <span className="timeline-next-meta">
                    {fmtDateTime(nextDeadline.value)}
                  </span>
                </div>
              )}
              <div className="timeline-grid">
                {timelineItems.map(item => (
                  <div key={item.key} className={`timeline-item ${nextDeadline?.key === item.key ? "next" : ""}`}>
                    <span className="timeline-label">{item.label}</span>
                    <span className="timeline-value">
                      {fmtDateTime(item.value)}
                      {item.key === "judging_end" && !event?.judging_end && (
                        <em className="timeline-note"> (default +48h)</em>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {user && (
              <div className="description-card enroll-card">
                <h2 className="section-title">Team Enrollment</h2>
                {!enrollOpen && (
                  <div className="enroll-note">
                    Enrollment is closed for this event.
                  </div>
                )}
                {enrollOpen && (
                  <>
                    {myTeams.length === 0 && (
                      <div className="enroll-note">
                        You are not in any team yet.{" "}
                        <Link href={createTeamHref} className="enroll-link">Create a team</Link>{" "}
                        to enroll.
                      </div>
                    )}
                    {myTeams.length > 0 && (
                      <div className="enroll-row">
                        <select
                          className="enroll-select"
                          value={enrollTeamId}
                          onChange={(e) => setEnrollTeamId(e.target.value)}
                        >
                          <option value="">Select a team to enroll</option>
                          {availableTeamsToEnroll.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="enroll-btn"
                          onClick={handleEnrollTeam}
                          disabled={!enrollTeamId || enrollLoading}
                        >
                          {enrollLoading ? "Enrolling..." : "Enroll Team"}
                        </button>
                      </div>
                    )}
                    {enrollError && <div className="enroll-msg error">{enrollError}</div>}
                    {enrollSuccess && <div className="enroll-msg success">{enrollSuccess}</div>}
                    {myEnrollments.length > 0 && (
                      <div className="enroll-status">
                        {myEnrollments.map((en) => (
                          <div key={en.id} className="enroll-status-row">
                            <span className="enroll-team-name">{en.team_name || "Team"}</span>
                            <span className={`enroll-pill ${en.status}`}>{en.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            {Array.isArray(event.resources) && event.resources.length > 0 && (
              <div className="description-card">
                <h2 className="section-title">Resources</h2>
                <div className="resource-list">
                  {event.resources.map((r) => (
                    <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="resource-item">
                      <div className="resource-title">{r.title}</div>
                      {r.description && <div className="resource-desc">{r.description}</div>}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {Array.isArray(event.sponsors) && event.sponsors.length > 0 && (
              <div className="description-card">
                <div className="sponsor-head">
                  <h2 className="section-title">Sponsors</h2>
                  <Link href={`/events/${id}/sponsors`} className="sponsor-cta">
                    View all sponsors â†’
                  </Link>
                </div>
                <div className="sponsor-grid">
                  {event.sponsors.map((s) => (
                    <a key={s.id} href={s.website || "#"} target="_blank" rel="noreferrer" className="sponsor-card">
                      {s.logo_url ? (
                        <img src={s.logo_url} alt={s.name} />
                      ) : (
                        <div className="sponsor-fallback">{s.name?.charAt(0)?.toUpperCase()}</div>
                      )}
                      <div className="sponsor-name">{s.name}</div>
                      {s.tier && <div className="sponsor-tier">{s.tier}</div>}
                      {s.challenge_desc && <div className="sponsor-desc">{s.challenge_desc}</div>}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {canManageSponsors && (
              <div className="description-card" id="sponsor-manage">
                <div className="sponsor-manage-head">
                  <h2 className="section-title">Manage Sponsors</h2>
                  {Array.isArray(event.sponsors) && event.sponsors.length > 0 && (
                    <Link href={`/events/${id}/sponsors`} className="sponsor-cta">
                      Preview Sponsors Page â†’
                    </Link>
                  )}
                </div>

                {sponsorMessage.text && (
                  <div className={`sponsor-msg ${sponsorMessage.type}`}>
                    {sponsorMessage.text}
                  </div>
                )}

                <form onSubmit={saveSponsor} className="sponsor-form">
                  <div className="sponsor-row">
                    <input
                      name="name"
                      value={sponsorForm.name}
                      onChange={handleSponsorChange}
                      placeholder="Sponsor name *"
                      className="sponsor-input"
                    />
                    <input
                      name="tier"
                      value={sponsorForm.tier}
                      onChange={handleSponsorChange}
                      placeholder="Tier (e.g., Gold)"
                      className="sponsor-input"
                    />
                  </div>
                  <div className="sponsor-row">
                    <input
                      name="logo_url"
                      value={sponsorForm.logo_url}
                      onChange={handleSponsorChange}
                      placeholder="Logo URL"
                      className="sponsor-input"
                    />
                    <input
                      name="website"
                      value={sponsorForm.website}
                      onChange={handleSponsorChange}
                      placeholder="Website"
                      className="sponsor-input"
                    />
                  </div>
                  <textarea
                    name="challenge_desc"
                    value={sponsorForm.challenge_desc}
                    onChange={handleSponsorChange}
                    placeholder="Description or sponsor challenge (optional)"
                    className="sponsor-input sponsor-textarea"
                    rows="3"
                  />
                  <div className="sponsor-actions">
                    <button type="submit" className="sponsor-btn" disabled={sponsorSaving}>
                      {sponsorSaving ? "Saving..." : editingSponsorId ? "Update Sponsor" : "Add Sponsor"}
                    </button>
                    {editingSponsorId && (
                      <button type="button" className="sponsor-btn ghost" onClick={cancelEditSponsor}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

                <div className="sponsor-manage-list">
                  {(event.sponsors || []).length === 0 ? (
                    <div className="empty-state small">
                      <p>No sponsors yet. Add the first one above.</p>
                    </div>
                  ) : (
                    event.sponsors.map((s) => (
                      <div key={s.id} className="sponsor-manage-row">
                        <div className="sponsor-manage-info">
                          <span className="sponsor-manage-name">{s.name}</span>
                          {s.tier && <span className="sponsor-manage-tier">{s.tier}</span>}
                        </div>
                        <div className="sponsor-manage-actions">
                          <button type="button" className="sponsor-manage-btn" onClick={() => startEditSponsor(s)}>
                            Edit
                          </button>
                          <button type="button" className="sponsor-manage-btn danger" onClick={() => deleteSponsor(s)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "judges" && (
          <div className="judges-section">
            <div className="judges-header">
              <h2 className="section-title">Judges · {event.judges_count || assignedJudges.length || 0}</h2>
            </div>

            {!canManageJudges && (
              <div className="judges-list">
                {(event.judges_details || []).length === 0 ? (
                  <div className="empty-state small">
                    <p>No judges assigned yet.</p>
                  </div>
                ) : (
                  event.judges_details.map((j) => (
                    <div className="judge-card" key={j.id}>
                      <div className="judge-avatar">{j.username?.charAt(0).toUpperCase()}</div>
                      <div className="judge-info">
                        <div className="judge-name">{j.username}</div>
                        <div className="judge-email">{j.email}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {canManageJudges && (
              <div className="judge-management">
                <div className="search-box">
                  <Icons.search />
                  <input
                    type="text"
                    placeholder="Search judges..."
                    value={judgeSearch}
                    onChange={(e) => setJudgeSearch(e.target.value)}
                  />
                </div>
                
                {judgeError && <div className="error-message">{judgeError}</div>}
                
                <div className="judges-grid">
                  {allJudges.length === 0 ? (
                    <div className="empty-state small">
                      <p>No judges found</p>
                    </div>
                  ) : (
                    allJudges.map((j) => (
                      <button
                        key={j.id}
                        className={`judge-select-card ${assignedIds.has(j.id) ? "selected" : ""}`}
                        onClick={() => toggleJudge(j.id)}
                        disabled={judgeSaving}
                      >
                        <div className="judge-select-avatar">{j.username?.charAt(0).toUpperCase()}</div>
                        <div className="judge-select-info">
                          <div className="judge-select-name">{j.username}</div>
                          <div className="judge-select-email">{j.email}</div>
                        </div>
                        <div className="judge-select-status">
                          {assignedIds.has(j.id) ? <Icons.check /> : <Icons.plus />}
                        </div>
                      </button>
                    ))
                  )}
                </div>
                
                {judgeSaving && (
                  <div className="saving-indicator">
                    <div className="spinner" />
                    <span>Saving changes...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "prizes" && (
          <div className="prizes-section">
            <h2 className="section-title">Prizes</h2>
            <div className="prizes-grid">
              {[
                { place: "1st Place", reward: "$5,000 + Mentorship", color: "#ffd700", icon: "🥇" },
                { place: "2nd Place", reward: "$3,000 + Swag Pack", color: "#c0c0c0", icon: "🥈" },
                { place: "3rd Place", reward: "$1,500 + Swag Pack", color: "#cd7f32", icon: "🥉" },
              ].map((prize, i) => (
                <div className="prize-card" key={i}>
                  <div className="prize-icon" style={{ background: `${prize.color}15`, color: prize.color }}>
                    {prize.icon}
                  </div>
                  <div>
                    <h4 className="prize-place">{prize.place}</h4>
                    <p className="prize-reward">{prize.reward}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .event-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px 64px;
          background: #0a0a0a;
          color: #f0f0f3;
          font-family: 'DM Sans', sans-serif;
        }

        /* Header */
        .header {
          margin-bottom: 32px;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: transparent;
          border: 1px solid #1e1e24;
          border-radius: 100px;
          color: #888;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .back-btn:hover {
          border-color: #6EE7B7;
          color: #6EE7B7;
          transform: translateX(-4px);
        }

        .back-btn svg {
          width: 16px;
          height: 16px;
        }

        /* Hero Section */
        .hero {
          background: linear-gradient(135deg, #111114 0%, #0a0a0f 100%);
          border: 1px solid #1e1e24;
          border-radius: 24px;
          padding: 32px;
          margin-bottom: 32px;
          position: relative;
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #6EE7B7, transparent);
        }

        .hero-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
        }

        .hero-tag {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .hero-tag-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6EE7B7;
          box-shadow: 0 0 12px rgba(110,231,183,0.6);
        }

        .hero-tag-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #6EE7B7;
        }

        .hero-title-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .hero-title {
          font-family: 'Syne', sans-serif;
          font-size: 36px;
          font-weight: 700;
          color: #f0f0f3;
          letter-spacing: -0.5px;
          margin: 0;
        }

        .premium-badge {
          padding: 4px 12px;
          background: linear-gradient(135deg, #6EE7B7, #4fb88b);
          border-radius: 100px;
          color: #0c0c0f;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .hero-organizer {
          font-size: 15px;
          color: #888;
          margin: 0;
        }

        /* Status Badge */
        .status-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 600;
        }

        .status-badge.live {
          background: rgba(110,231,183,0.1);
          border: 1px solid rgba(110,231,183,0.3);
          color: #6EE7B7;
        }

        .status-badge.upcoming {
          background: rgba(251,191,36,0.1);
          border: 1px solid rgba(251,191,36,0.3);
          color: #fbbf24;
        }

        .status-badge.ended {
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.3);
          color: #f87171;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-badge.live .status-dot {
          background: #6EE7B7;
          box-shadow: 0 0 12px rgba(110,231,183,0.6);
          animation: pulse 2s infinite;
        }

        .status-badge.upcoming .status-dot {
          background: #fbbf24;
        }

        .status-badge.ended .status-dot {
          background: #f87171;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        

        /* Tabs */
        .tabs {
          display: flex;
          gap: 4px;
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 100px;
          padding: 4px;
          margin-bottom: 32px;
          overflow-x: auto;
        }

        .tab {
          padding: 10px 24px;
          border: none;
          border-radius: 100px;
          background: transparent;
          color: #888;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .tab:hover {
          color: #f0f0f3;
          background: rgba(255,255,255,0.03);
        }

        .tab.active {
          background: #6EE7B7;
          color: #0c0c0f;
          font-weight: 600;
        }

        /* Content Area */
        .content {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 24px;
          padding: 32px;
        }

        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #f0f0f3;
          margin: 0 0 20px 0;
        }

        /* Overview Tab */
        .description-card {
          background: #17171b;
          border: 1px solid #1e1e24;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .timeline-card {
          background: linear-gradient(135deg, rgba(110,231,183,0.06), rgba(96,165,250,0.04));
        }
        .timeline-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-top: 12px;
        }
        .timeline-next {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(110,231,183,0.25);
          background: rgba(110,231,183,0.08);
          margin-bottom: 12px;
        }
        .timeline-next-label {
          font-size: 11px;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          color: #6EE7B7;
          font-weight: 700;
        }
        .timeline-next-value {
          font-size: 14px;
          font-weight: 700;
          color: #f0f0f3;
        }
        .timeline-next-meta {
          font-size: 12px;
          color: #8a8aa0;
        }
        .timeline-item {
          background: rgba(17,17,20,0.6);
          border: 1px solid #1e1e24;
          border-radius: 12px;
          padding: 14px 16px;
        }
        .timeline-item.next {
          border-color: rgba(110,231,183,0.4);
          box-shadow: 0 0 0 1px rgba(110,231,183,0.15);
        }
        .timeline-label {
          display: block;
          font-size: 12px;
          color: #8a8aa0;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }
        .timeline-value {
          font-size: 14px;
          font-weight: 600;
          color: #f0f0f3;
        }
        .timeline-note {
          font-size: 12px;
          font-style: normal;
          color: #6EE7B7;
          margin-left: 6px;
        }

        .enroll-card {
          border-color: rgba(110,231,183,0.25);
        }
        .enroll-row {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }
        .enroll-select {
          flex: 1;
          min-width: 220px;
          background: #0f0f12;
          border: 1px solid #1e1e24;
          color: #f0f0f3;
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          cursor: pointer;
        }
        .enroll-select:focus {
          border-color: rgba(110,231,183,0.35);
        }
        .enroll-select option {
          background: #111114;
          color: #f0f0f3;
        }
        .enroll-btn {
          padding: 8px 14px;
          background: rgba(110,231,183,0.12);
          border: 1px solid rgba(110,231,183,0.3);
          color: #6EE7B7;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .enroll-btn:hover:not(:disabled) {
          background: rgba(110,231,183,0.2);
          border-color: rgba(110,231,183,0.5);
        }
        .enroll-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .enroll-note {
          font-size: 13px;
          color: #8a8aa0;
        }
        .enroll-link {
          color: #6EE7B7;
          text-decoration: none;
        }
        .enroll-link:hover {
          text-decoration: underline;
        }
        .enroll-msg {
          margin-top: 10px;
          font-size: 12px;
        }
        .enroll-msg.error {
          color: #f87171;
        }
        .enroll-msg.success {
          color: #6EE7B7;
        }
        .enroll-status {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .enroll-status-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border: 1px solid #1e1e24;
          border-radius: 12px;
          background: #111114;
        }
        .enroll-team-name {
          font-size: 13px;
          color: #f0f0f3;
          font-weight: 600;
        }
        .enroll-pill {
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          text-transform: capitalize;
          border: 1px solid transparent;
        }
        .enroll-pill.enrolled {
          color: #6EE7B7;
          border-color: rgba(110,231,183,0.3);
          background: rgba(110,231,183,0.12);
        }
        .enroll-pill.withdrawn {
          color: #fbbf24;
          border-color: rgba(251,191,36,0.3);
          background: rgba(251,191,36,0.12);
        }
        .enroll-pill.disqualified {
          color: #f87171;
          border-color: rgba(248,113,113,0.3);
          background: rgba(248,113,113,0.12);
        }

        .description {
          font-size: 15px;
          color: #b0b0ba;
          line-height: 1.7;
          margin: 0;
        }

        .resource-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .resource-item {
          display: block;
          padding: 12px 14px;
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 12px;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s ease;
        }

        .resource-item:hover {
          border-color: rgba(110,231,183,0.3);
          background: #151519;
        }

        .resource-title {
          font-size: 14px;
          font-weight: 600;
          color: #f0f0f3;
          margin-bottom: 4px;
        }

        .resource-desc {
          font-size: 12px;
          color: #888;
        }

          .sponsor-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
          }
          .sponsor-head{
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:16px;
            margin-bottom:12px;
          }
          .sponsor-cta{
            font-size:12px;
            font-weight:600;
            color:#6EE7B7;
            text-decoration:none;
          }
          .sponsor-cta:hover{ text-decoration:underline; }

        .sponsor-card {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 14px;
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 14px;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s ease;
        }

        .sponsor-card:hover {
          border-color: rgba(110,231,183,0.3);
          background: #151519;
        }

        .sponsor-card img {
          width: 100%;
          height: 60px;
          object-fit: contain;
          background: #0f0f12;
          border-radius: 10px;
          border: 1px solid #1e1e24;
        }

        .sponsor-fallback {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          background: rgba(110,231,183,0.12);
          border: 1px solid rgba(110,231,183,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #6EE7B7;
        }

          .sponsor-name {
            font-size: 13px;
            font-weight: 600;
            color: #f0f0f3;
          }
          .sponsor-tier{
            font-size:10px;
            font-weight:700;
            color:#fbbf24;
            text-transform:uppercase;
            letter-spacing:.6px;
          }

          .sponsor-desc {
            font-size: 11px;
            color: #888;
          }

          .sponsor-manage-head{
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:16px;
            margin-bottom:12px;
          }
          .sponsor-form{display:flex;flex-direction:column;gap:10px;margin-bottom:14px}
          .sponsor-row{display:flex;gap:10px;flex-wrap:wrap}
          .sponsor-input{
            flex:1;
            min-width:180px;
            background:#0f0f12;
            border:1px solid #1e1e24;
            border-radius:10px;
            padding:8px 12px;
            color:#f0f0f3;
            font-size:13px;
            font-family:'DM Sans',sans-serif;
            outline:none;
          }
          .sponsor-input:focus{border-color:rgba(110,231,183,0.35)}
          .sponsor-textarea{min-height:80px;resize:vertical}
          .sponsor-actions{display:flex;gap:8px;align-items:center}
          .sponsor-btn{
            padding:8px 14px;
            background:rgba(110,231,183,0.12);
            border:1px solid rgba(110,231,183,0.3);
            color:#6EE7B7;
            border-radius:999px;
            font-size:12px;
            font-weight:600;
            cursor:pointer;
            transition:all .2s ease;
          }
          .sponsor-btn:hover:not(:disabled){background:rgba(110,231,183,0.2);border-color:rgba(110,231,183,0.5)}
          .sponsor-btn:disabled{opacity:.6;cursor:not-allowed}
          .sponsor-btn.ghost{background:transparent;border:1px solid #26262e;color:#b0b0ba}
          .sponsor-msg{
            margin-bottom:10px;
            font-size:12px;
            padding:8px 10px;
            border-radius:8px;
            background:#111114;
            border:1px solid #1e1e24;
          }
          .sponsor-msg.success{color:#6EE7B7;border-color:rgba(110,231,183,0.3)}
          .sponsor-msg.error{color:#f87171;border-color:rgba(248,113,113,0.3)}
          .sponsor-manage-list{display:flex;flex-direction:column;gap:8px}
          .sponsor-manage-row{
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:10px;
            padding:10px 12px;
            border:1px solid #1e1e24;
            border-radius:12px;
            background:#111114;
          }
          .sponsor-manage-info{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
          .sponsor-manage-name{font-size:13px;font-weight:600}
          .sponsor-manage-tier{font-size:10px;font-weight:700;color:#fbbf24;text-transform:uppercase;letter-spacing:.6px}
          .sponsor-manage-actions{display:flex;gap:8px}
          .sponsor-manage-btn{
            padding:6px 10px;
            border-radius:999px;
            border:1px solid #26262e;
            background:transparent;
            color:#b0b0ba;
            font-size:11px;
            cursor:pointer;
          }
          .sponsor-manage-btn:hover{color:#6EE7B7;border-color:rgba(110,231,183,0.35)}
          .sponsor-manage-btn.danger{color:#f87171;border-color:rgba(248,113,113,0.35)}

        /* Teams Tab */
        .teams-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #6EE7B7;
          border: 1px solid #4fb88b;
          border-radius: 100px;
          color: #0c0c0f;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary:hover {
          background: #86efac;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(110,231,183,0.3);
        }

        .teams-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .team-card {
          background: #17171b;
          border: 1px solid #1e1e24;
          border-radius: 16px;
          padding: 20px;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s ease;
        }

        .team-card:hover {
          border-color: rgba(110,231,183,0.3);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        }

        .team-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .team-avatar {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: rgba(110,231,183,0.1);
          border: 1px solid rgba(110,231,183,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #6EE7B7;
        }

        .team-name {
          font-size: 16px;
          font-weight: 600;
          color: #f0f0f3;
          margin: 0 0 4px;
        }

        .team-meta {
          font-size: 11px;
          color: #888;
        }

        .team-members {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
        }

        .member-avatar {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: rgba(110,231,183,0.08);
          border: 1px solid rgba(110,231,183,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: #6EE7B7;
          overflow: hidden;
        }

        .member-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .member-avatar.more {
          background: #1e1e24;
          color: #888;
          font-size: 10px;
        }

        .team-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid #1e1e24;
        }

        .team-submissions {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #888;
        }

        .team-submissions svg {
          width: 14px;
          height: 14px;
        }

        .team-arrow {
          color: #6EE7B7;
          transition: transform 0.2s ease;
        }

        .team-card:hover .team-arrow {
          transform: translateX(4px);
        }

        /* Submissions Section */
        .submissions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .submissions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .submission-card {
          background: #17171b;
          border: 1px solid #1e1e24;
          border-radius: 16px;
          padding: 18px;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s ease;
        }

        .submission-card:hover {
          border-color: rgba(110,231,183,0.3);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        }

        .submission-card-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 14px;
        }

        .submission-title {
          font-size: 15px;
          font-weight: 600;
          margin: 0 0 4px;
          color: #f0f0f3;
        }

        .submission-meta {
          font-size: 12px;
          color: #888;
        }

        .submission-badge {
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid transparent;
          white-space: nowrap;
        }

        .submission-badge.winner {
          background: rgba(251,191,36,0.12);
          color: #fbbf24;
          border-color: rgba(251,191,36,0.25);
        }

        .submission-badge.reviewed {
          background: rgba(96,165,250,0.12);
          color: #60a5fa;
          border-color: rgba(96,165,250,0.25);
        }

        .submission-badge.pending {
          background: rgba(148,163,184,0.12);
          color: #94a3b8;
          border-color: rgba(148,163,184,0.25);
        }

        .submission-stats {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding-top: 12px;
          border-top: 1px solid #1e1e24;
        }

        .submission-stat {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
          color: #888;
        }

        .submission-stat strong {
          font-size: 14px;
          color: #f0f0f3;
        }

        /* Judges Section */
        .judges-header {
          margin-bottom: 24px;
        }

        .judges-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .judge-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #17171b;
          border: 1px solid #1e1e24;
          border-radius: 14px;
        }

        .judge-avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(110,231,183,0.1);
          border: 1px solid rgba(110,231,183,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #6EE7B7;
        }

        .judge-info {
          flex: 1;
        }

        .judge-name {
          font-size: 15px;
          font-weight: 600;
          color: #f0f0f3;
          margin-bottom: 4px;
        }

        .judge-email {
          font-size: 12px;
          color: #888;
        }

        .judge-management {
          margin-top: 24px;
        }

        .search-box {
          position: relative;
          margin-bottom: 24px;
        }

        .search-box svg {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #5c5c6e;
        }

        .search-box input {
          width: 100%;
          padding: 14px 16px 14px 48px;
          background: #17171b;
          border: 1px solid #1e1e24;
          border-radius: 100px;
          color: #f0f0f3;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
        }

        .search-box input:focus {
          border-color: rgba(110,231,183,0.4);
          box-shadow: 0 0 0 2px rgba(110,231,183,0.1);
        }

        .judges-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }

        .judge-select-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #17171b;
          border: 1px solid #1e1e24;
          border-radius: 14px;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: all 0.2s ease;
        }

        .judge-select-card:hover {
          border-color: rgba(110,231,183,0.3);
          background: #1a1a1f;
        }

        .judge-select-card.selected {
          background: rgba(110,231,183,0.08);
          border-color: rgba(110,231,183,0.3);
        }

        .judge-select-card:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .judge-select-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(110,231,183,0.1);
          border: 1px solid rgba(110,231,183,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #6EE7B7;
          flex-shrink: 0;
        }

        .judge-select-info {
          flex: 1;
        }

        .judge-select-name {
          font-size: 14px;
          font-weight: 600;
          color: #f0f0f3;
          margin-bottom: 2px;
        }

        .judge-select-email {
          font-size: 11px;
          color: #888;
        }

        .judge-select-status {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(110,231,183,0.1);
          color: #6EE7B7;
        }

        .judge-select-card.selected .judge-select-status {
          background: #6EE7B7;
          color: #0c0c0f;
        }

        /* Prizes Grid */
        .prizes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }

        .prize-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px;
          background: #17171b;
          border: 1px solid #1e1e24;
          border-radius: 16px;
          transition: all 0.2s ease;
        }

        .prize-card:hover {
          border-color: rgba(110,231,183,0.3);
          transform: translateY(-2px);
        }

        .prize-icon {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          flex-shrink: 0;
        }

        .prize-place {
          font-size: 16px;
          font-weight: 600;
          color: #f0f0f3;
          margin: 0 0 4px;
        }

        .prize-reward {
          font-size: 13px;
          color: #888;
          margin: 0;
        }

        /* Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px 32px;
          text-align: center;
          background: #17171b;
          border: 1px solid #1e1e24;
          border-radius: 20px;
        }

        .empty-state.small {
          padding: 48px 24px;
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(110,231,183,0.05);
          border: 1px solid rgba(110,231,183,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          color: #6EE7B7;
        }

        .empty-icon svg {
          width: 40px;
          height: 40px;
        }

        .empty-state h3 {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: #f0f0f3;
          margin: 0 0 8px;
        }

        .empty-state p {
          font-size: 14px;
          color: #888;
          margin: 0 0 24px;
          max-width: 320px;
        }

        /* Not Found */
        .not-found {
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
        }

        .not-found-content {
          text-align: center;
          max-width: 400px;
        }

        .not-found-icon {
          font-size: 48px;
          margin-bottom: 24px;
          opacity: 0.5;
        }

        .not-found h2 {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          color: #f0f0f3;
          margin: 0 0 12px;
        }

        .not-found p {
          color: #888;
          margin-bottom: 32px;
        }

        /* Loading Indicator */
        .saving-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 24px;
          padding: 16px;
          background: #17171b;
          border-radius: 100px;
          color: #888;
          font-size: 13px;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(110,231,183,0.2);
          border-top-color: #6EE7B7;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        .error-message {
          padding: 12px 16px;
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.2);
          border-radius: 100px;
          color: #f87171;
          font-size: 13px;
          margin-bottom: 20px;
        }

        /* Metrics Grid - Clean & Elegant */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 32px;
}

.metric-card {
  background: #111114;
  border: 1px solid #1e1e24;
  border-radius: 16px;
  padding: 16px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
}

.metric-card:hover {
  border-color: rgba(110,231,183,0.2);
  background: #151519;
}

.metric-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #6EE7B7;
  background: rgba(110,231,183,0.08);
}

.metric-icon svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
}

.metric-content {
  flex: 1;
  min-width: 0;
}

.metric-label {
  font-size: 11px;
  font-weight: 500;
  color: #5c5c6e;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 2px;
}

.metric-value {
  font-family: 'Syne', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #f0f0f3;
  line-height: 1.2;
  margin-bottom: 2px;
}

.metric-trend {
  font-size: 11px;
  color: #6EE7B7;
}

.metric-trend.positive {
  color: #4ade80;
}

.metric-progress {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.progress-bar {
  flex: 1;
  height: 3px;
  background: #1e1e24;
  border-radius: 100px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #6EE7B7;
  border-radius: 100px;
}

.progress-text {
  font-size: 10px;
  color: #5c5c6e;
  white-space: nowrap;
}

/* Responsive */
@media (max-width: 1024px) {
  .metrics-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}



        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
      
        @media (max-width: 768px) {
          .hero-content {
            flex-direction: column;
          }
          
          .hero-title {
            font-size: 28px;
          }
          
          .content {
            padding: 20px;
          }
        }

        @media (max-width: 480px) {
          
          .event-page {
            padding: 20px 16px;
          }
          
          .hero {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}





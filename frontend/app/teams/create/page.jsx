"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "../../../utils/axios";
import TeamForm from "../../../components/teams/TeamForm";

const tmcPageCss = `
.tmc-page { max-width: 640px; margin: 0 auto; padding: 36px 32px 64px; font-family: 'DM Sans', sans-serif; min-height: calc(100vh - 70px); }
.tmc-back { display: inline-flex; align-items: center; gap: 7px; padding: 7px 14px; border-radius: 8px; background: transparent; border: 1px solid #26262e; color: #5c5c6e; font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all .15s; margin-bottom: 28px; }
.tmc-back:hover { color: #f0f0f3; background: #17171b; }
.tmc-back svg { width: 15px; height: 15px; }
.tmc-eyebrow { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.tmc-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #6EE7B7; }
.tmc-eyebrow-label { font-size: 11px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; color: #6EE7B7; }
.tmc-title { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 700; color: #f0f0f3; letter-spacing: -0.4px; margin: 0 0 4px; }
.tmc-subtitle { font-size: 13.5px; color: #5c5c6e; margin: 0 0 32px; }
.tmc-card { background: #111114; border: 1px solid #1e1e24; border-radius: 16px; overflow: hidden; }
.tmc-card-body { padding: 28px; display: flex; flex-direction: column; gap: 20px; }
.tmc-group { display: flex; flex-direction: column; gap: 7px; }
.tmc-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.tmc-label { font-size: 12.5px; font-weight: 500; color: #5c5c6e; letter-spacing: 0.2px; }
.tmc-required { color: #f87171; margin-left: 2px; }
.tmc-input, .tmc-select, .tmc-textarea { width: 100%; padding: 10px 14px; background: #0c0c0f; border: 1px solid #1e1e24; border-radius: 9px; font-size: 13.5px; color: #f0f0f3; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color .15s; }
.tmc-input:focus, .tmc-select:focus, .tmc-textarea:focus { border-color: #6EE7B740; }
.tmc-input:disabled, .tmc-select:disabled, .tmc-textarea:disabled { opacity: 0.45; cursor: not-allowed; }
.tmc-input::placeholder, .tmc-textarea::placeholder { color: #3a3a48; }
.tmc-select { cursor: pointer; }
.tmc-select option { background: #111114; color: #f0f0f3; }
.tmc-textarea { resize: vertical; min-height: 110px; line-height: 1.6; }
.tmc-hint { font-size: 11.5px; color: #3a3a48; }
.tmc-error { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 9px; background: rgba(248,113,113,.08); border: 1px solid rgba(248,113,113,.2); color: #f87171; font-size: 13px; }
.tmc-error svg { width: 16px; height: 16px; flex-shrink: 0; }
.tmc-leader-strip { display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: #0c0c0f; border: 1px solid #1e1e24; border-radius: 9px; }
.tmc-leader-avatar { width: 34px; height: 34px; border-radius: 9px; background: rgba(110,231,183,.1); border: 1px solid rgba(110,231,183,.2); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #6EE7B7; flex-shrink: 0; }
.tmc-leader-info { flex: 1; }
.tmc-leader-name { font-size: 13px; font-weight: 500; color: #f0f0f3; display: flex; align-items: center; gap: 8px; }
.tmc-leader-badge { padding: 1px 7px; border-radius: 100px; font-size: 10px; font-weight: 600; background: rgba(110,231,183,.1); color: #6EE7B7; border: 1px solid rgba(110,231,183,.2); }
.tmc-leader-sub { font-size: 11.5px; color: #5c5c6e; margin-top: 2px; }
.tmc-card-footer { display: flex; align-items: center; gap: 10px; padding: 20px 28px; border-top: 1px solid #1e1e24; }
.tmc-btn-cancel { flex: 1; padding: 10px; border-radius: 9px; background: transparent; border: 1px solid #26262e; color: #5c5c6e; font-size: 13.5px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; text-align: center; text-decoration: none; display: flex; align-items: center; justify-content: center; transition: all .15s; }
.tmc-btn-cancel:hover { color: #f0f0f3; background: #17171b; }
.tmc-btn-submit { flex: 2; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border-radius: 9px; background: #6EE7B7; color: #0c0c0f; font-size: 13.5px; font-weight: 600; font-family: 'DM Sans', sans-serif; border: none; cursor: pointer; transition: background .15s; }
.tmc-btn-submit:hover:not(:disabled) { background: #86efac; }
.tmc-btn-submit:disabled { opacity: 0.45; cursor: not-allowed; }
.tmc-btn-spinner { width: 16px; height: 16px; border: 2px solid rgba(12,12,15,.3); border-top-color: #0c0c0f; border-radius: 50%; animation: spin .7s linear infinite; }
@media (max-width: 600px) {
  .tmc-page { padding: 20px 16px 48px; }
  .tmc-row { grid-template-columns: 1fr; }
  .tmc-card-footer { flex-direction: column; }
  .tmc-btn-cancel, .tmc-btn-submit { width: 100%; flex: none; }
}
`;

export default function CreateTeamPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    max_members: 4,
    event: "",
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) {
          router.push("/login?redirect=/teams/create&message=Please login to create a team");
          return;
        }
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        try {
          const userRes = await axios.get("/users/me/");
          setUser(userRes.data);
        } catch {
          setUser({ username: "User" });
        }
        const eventsRes = await axios.get("/events/");
        setEvents(eventsRes.data.results || []);
        if ((eventsRes.data.results || []).length === 0) {
          setError("No events available to create a team. Please check back later.");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [router]);

  // Passed down to TeamForm as the onChange handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("/teams/", {
        ...formData,
        event: parseInt(formData.event),
      });
      router.push(`/teams/${res.data.id}`);
    } catch (err) {
      console.error("Error creating team:", err);
      setError(err.response?.data?.message || "Failed to create team. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/*
        The <style> tag injects tmc-* CSS into the page.
        TeamForm reads these classes — it has no CSS of its own,
        relying entirely on the parent page's injected styles.
        This is intentional: one CSS block, shared by page + component.
      */}
      <style>{tmcPageCss}</style>

      <div className="tmc-page">

        {/* ── Back button ── */}
        <button onClick={() => router.back()} className="tmc-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Teams
        </button>

        {/* ── Page heading ── */}
        <div className="tmc-eyebrow">
          <span className="tmc-eyebrow-dot" />
          <span className="tmc-eyebrow-label">New Team</span>
        </div>
        <h1 className="tmc-title">Create a Team</h1>
        <p className="tmc-subtitle">Fill in the details to form your hackathon squad.</p>

        {/* ── Card ── */}
        <div className="tmc-card">
          <div className="tmc-card-body">
            {/*
              TeamForm renders all the form fields.
              Props:
                formData  — controlled form state from this page
                onChange  — handleChange keeps formData in sync
                events    — list of events for the dropdown
                user      — logged-in user, shown in the leader strip
                error     — error string displayed inside the form
            */}
            <TeamForm
              formData={formData}
              onChange={handleChange}
              events={events}
              user={user}
              error={error}
            />
          </div>

          {/* ── Footer with action buttons ── */}
          <div className="tmc-card-footer">
            <Link href="/teams" className="tmc-btn-cancel">
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              className="tmc-btn-submit"
              disabled={loading || events.length === 0}
            >
              {loading ? (
                <>
                  <span className="tmc-btn-spinner" />
                  Creating…
                </>
              ) : (
                "Create Team"
              )}
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
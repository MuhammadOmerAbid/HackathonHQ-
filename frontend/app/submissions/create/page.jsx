"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "../../../utils/axios";

export default function CreateSubmissionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "", description: "", summary: "",
    demo_url: "", repo_url: "", technologies: "",
    event: "", team: ""
  });
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, teamsRes] = await Promise.all([
          axios.get("/events/"),
          axios.get("/teams/")
        ]);
        setEvents(eventsRes.data.results || []);
        setTeams(teamsRes.data.results || teamsRes.data || []);
      } catch (err) { console.error("Error fetching data:", err); }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const submissionData = {
        ...formData,
        technologies: formData.technologies.split(',').map(t => t.trim()).filter(t => t)
      };
      const res = await axios.post("/submissions/", submissionData);
      router.push(`/submissions/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create submission");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="evc-page">
      <div className="blob blob1" /><div className="blob blob2" /><div className="blob blob3" />
      
      <Link href="/submissions" className="evc-back-btn">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
  <span>Back to Submissions</span>
</Link>

      <div className="evc-eyebrow">
        <div className="evc-eyebrow-dot" />
        <span className="evc-eyebrow-label">New Project</span>
      </div>
      <h1 className="evc-title">Submit Your Project</h1>
      <p className="evc-subtitle">Share your hackathon creation with the world</p>

      <div className="evc-card">
        <form onSubmit={handleSubmit}>
          <div className="evc-card-body">
            {error && (
              <div className="evc-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <div className="evc-group">
              <label className="evc-label">Project Title <span className="evc-required">*</span></label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="evc-input"
                placeholder="e.g., AI-Powered Task Manager"
                required
              />
            </div>

            <div className="evc-row">
              <div className="evc-group">
                <label className="evc-label">Event <span className="evc-required">*</span></label>
                <select name="event" value={formData.event} onChange={handleChange} className="evc-input" required>
                  <option value="">Choose an event</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
              </div>
              <div className="evc-group">
                <label className="evc-label">Team <span className="evc-required">*</span></label>
                <select name="team" value={formData.team} onChange={handleChange} className="evc-input" required>
                  <option value="">Choose your team</option>
                  {teams.map(tm => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
                </select>
              </div>
            </div>

            <div className="evc-group">
              <label className="evc-label">Short Summary</label>
              <input
                type="text"
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                className="evc-input"
                placeholder="One-line description of your project"
              />
            </div>

            <div className="evc-group">
              <label className="evc-label">Full Description <span className="evc-required">*</span></label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="evc-textarea"
                placeholder="Describe your project — how it works, what problem it solves, features..."
                rows="5"
                required
              />
            </div>

            <div className="evc-group">
              <label className="evc-label">Technologies Used</label>
              <input
                type="text"
                name="technologies"
                value={formData.technologies}
                onChange={handleChange}
                className="evc-input"
                placeholder="React, Python, TensorFlow... (comma separated)"
              />
              <span className="evc-hint">Separate technologies with commas</span>
            </div>

            <div className="evc-row">
              <div className="evc-group">
                <label className="evc-label">Live Demo URL</label>
                <input
                  type="url"
                  name="demo_url"
                  value={formData.demo_url}
                  onChange={handleChange}
                  className="evc-input"
                  placeholder="https://your-project-demo.com"
                />
              </div>
              <div className="evc-group">
                <label className="evc-label">Repository URL</label>
                <input
                  type="url"
                  name="repo_url"
                  value={formData.repo_url}
                  onChange={handleChange}
                  className="evc-input"
                  placeholder="https://github.com/username/project"
                />
              </div>
            </div>
          </div>

          <div className="evc-card-footer">
            <Link href="/submissions" className="evc-btn-cancel">Cancel</Link>
            <button type="submit" className="evc-btn-submit" disabled={loading}>
              {loading ? (
                <><span className="evc-btn-spinner" /> Submitting...</>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Submit Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
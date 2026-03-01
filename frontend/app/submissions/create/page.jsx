"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "../../../utils/axios";

export default function CreateSubmissionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    summary: "",
    demo_url: "",
    repo_url: "",
    technologies: "",
    event: "",
    team: ""
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
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Convert technologies string to array
      const submissionData = {
        ...formData,
        technologies: formData.technologies.split(',').map(t => t.trim()).filter(t => t)
      };

      const res = await axios.post("/submissions/", submissionData);
      router.push(`/submissions/${res.data.id}`);
    } catch (err) {
      console.error("Error creating submission:", err);
      setError(err.response?.data?.message || "Failed to create submission");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container" style={{ background: '#0a0a0a' }}>
      {/* Animated background blobs */}
      <div className="blob blob1"></div>
      <div className="blob blob2"></div>
      <div className="blob blob3"></div>

      <div className="register-card" style={{ maxWidth: '600px' }}>
        <div className="register-header">
          <h1 className="register-title">Submit Your Project</h1>
          <p className="register-subtitle">Share your hackathon creation with the world</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {error && (
            <div className="register-message error">
              <svg className="register-message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <div className="register-input-group">
            <label htmlFor="title" className="register-label">
              Project Title <span style={{ color: '#f87171' }}>*</span>
            </label>
            <div className="register-input-wrapper">
              <svg className="register-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="register-input"
                placeholder="e.g., AI-Powered Task Manager"
                required
              />
            </div>
          </div>

          <div className="register-input-group">
            <label htmlFor="event" className="register-label">
              Select Event <span style={{ color: '#f87171' }}>*</span>
            </label>
            <div className="register-input-wrapper">
              <svg className="register-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <select
                id="event"
                name="event"
                value={formData.event}
                onChange={handleChange}
                className="register-input"
                required
                style={{ appearance: 'none' }}
              >
                <option value="" style={{ background: '#1a1a1a' }}>Choose an event</option>
                {events.map(event => (
                  <option key={event.id} value={event.id} style={{ background: '#1a1a1a' }}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="register-input-group">
            <label htmlFor="team" className="register-label">
              Select Team <span style={{ color: '#f87171' }}>*</span>
            </label>
            <div className="register-input-wrapper">
              <svg className="register-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <select
                id="team"
                name="team"
                value={formData.team}
                onChange={handleChange}
                className="register-input"
                required
                style={{ appearance: 'none' }}
              >
                <option value="" style={{ background: '#1a1a1a' }}>Choose your team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id} style={{ background: '#1a1a1a' }}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="register-input-group">
            <label htmlFor="summary" className="register-label">
              Short Summary
            </label>
            <div className="register-input-wrapper">
              <svg className="register-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input
                type="text"
                id="summary"
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                className="register-input"
                placeholder="Brief one-line summary of your project"
              />
            </div>
          </div>

          <div className="register-input-group">
            <label htmlFor="description" className="register-label">
              Full Description <span style={{ color: '#f87171' }}>*</span>
            </label>
            <div className="register-input-wrapper">
              <svg className="register-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="register-input"
                placeholder="Describe your project, how it works, features, etc."
                rows="5"
                style={{ paddingTop: '1rem', paddingBottom: '1rem', height: 'auto' }}
                required
              />
            </div>
          </div>

          <div className="register-input-group">
            <label htmlFor="technologies" className="register-label">
              Technologies Used
            </label>
            <div className="register-input-wrapper">
              <svg className="register-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
              <input
                type="text"
                id="technologies"
                name="technologies"
                value={formData.technologies}
                onChange={handleChange}
                className="register-input"
                placeholder="React, Python, TensorFlow, etc. (comma separated)"
              />
            </div>
            <p className="register-hint">Separate technologies with commas</p>
          </div>

          <div className="register-input-group">
            <label htmlFor="demo_url" className="register-label">
              Live Demo URL
            </label>
            <div className="register-input-wrapper">
              <svg className="register-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <input
                type="url"
                id="demo_url"
                name="demo_url"
                value={formData.demo_url}
                onChange={handleChange}
                className="register-input"
                placeholder="https://your-project-demo.com"
              />
            </div>
          </div>

          <div className="register-input-group">
            <label htmlFor="repo_url" className="register-label">
              Repository URL
            </label>
            <div className="register-input-wrapper">
              <svg className="register-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
              <input
                type="url"
                id="repo_url"
                name="repo_url"
                value={formData.repo_url}
                onChange={handleChange}
                className="register-input"
                placeholder="https://github.com/username/project"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Link href="/submissions" className="register-button" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', flex: 1 }}>
              Cancel
            </Link>
            <button 
              type="submit" 
              className="register-button"
              disabled={loading}
              style={{ flex: 2 }}
            >
              {loading ? (
                <>
                  <span className="register-loader"></span>
                  Submitting...
                </>
              ) : (
                "Submit Project"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
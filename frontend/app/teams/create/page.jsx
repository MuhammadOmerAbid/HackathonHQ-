"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "../../../utils/axios";

export default function CreateTeamPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    max_members: 4,
    event: ""
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if user is logged in
        const token = localStorage.getItem('access');
        if (!token) {
          router.push('/login?redirect=/teams/create&message=Please login to create a team');
          return;
        }

        // Set token in headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Try to get user info
        try {
          const userRes = await axios.get("/users/me/");
          setUser(userRes.data);
        } catch {
          setUser({ username: 'User' }); // Fallback
        }

        // Fetch events for dropdown
        const eventsRes = await axios.get("/events/");
        setEvents(eventsRes.data.results || []);
        
        // Check if there are any events
        if (eventsRes.data.results?.length === 0) {
          setError("No events available to create a team. Please check back later.");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [router]);

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
      const res = await axios.post("/teams/", {
        ...formData,
        event: parseInt(formData.event)
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
    <div className="create-team-container">
      {/* Animated background blobs */}
      <div className="blob blob1"></div>
      <div className="blob blob2"></div>
      <div className="blob blob3"></div>

      <div className="create-team-card">
        {/* Back button */}
        <div style={{ marginBottom: '1rem' }}>
          <button 
            onClick={() => router.back()} 
            className="back-button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Teams
          </button>
        </div>

        <div className="create-team-header">
          <h1 className="create-team-title">Create a New Team</h1>
          <p className="create-team-subtitle">Fill in the details to form your hackathon team</p>
        </div>

        <form onSubmit={handleSubmit} className="create-team-form">
          {error && (
            <div className="form-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Team Name */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Team Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., Code Warriors, AI Avengers"
              required
              minLength={3}
              maxLength={50}
            />
          </div>

          {/* Event Selection */}
          <div className="form-group">
            <label htmlFor="event" className="form-label">
              Select Event <span className="required">*</span>
            </label>
            <select
              id="event"
              name="event"
              value={formData.event}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Select a hackathon event</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name} ({new Date(event.start_date).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          {/* Team Size */}
          <div className="form-group">
            <label htmlFor="max_members" className="form-label">
              Team Size
            </label>
            <select
              id="max_members"
              name="max_members"
              value={formData.max_members}
              onChange={handleChange}
              className="form-select"
            >
              {[2, 3, 4, 5, 6].map(num => (
                <option key={num} value={num}>
                  {num} members
                </option>
              ))}
            </select>
          </div>

          {/* Team Leader (read-only) */}
          <div className="form-group">
            <label className="form-label">Team Leader</label>
            <div className="leader-info">
              <div className="leader-avatar">
                {user?.username?.charAt(0).toUpperCase() || 'Y'}
              </div>
              <div className="leader-details">
                <div className="leader-name">{user?.username || 'You'}</div>
                <span className="team-card-badge">Leader</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Team Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Describe your team's focus, what skills you're looking for, and your project idea..."
              rows="5"
            />
            <p className="form-hint">Help others understand what your team is about</p>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <Link href="/teams" className="cancel-btn">
              Cancel
            </Link>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading || events.length === 0}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Creating...
                </>
              ) : (
                'Create Team'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
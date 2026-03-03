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
        // Check authentication
        const userRes = await axios.get("/users/me/").catch(() => null);
        if (!userRes) {
          // Not logged in, redirect to login
          sessionStorage.setItem('redirectAfterLogin', '/teams/create');
          router.push('/login?message=Please login to create a team');
          return;
        }
        setUser(userRes.data);

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
    <div className="register-container" style={{ background: '#0a0a0a' }}>
      {/* Animated background blobs */}
      <div className="blob blob1"></div>
      <div className="blob blob2"></div>
      <div className="blob blob3"></div>

      <div className="register-card" style={{ maxWidth: '600px' }}>
        {/* Header with back button */}
        <div style={{ marginBottom: '1rem' }}>
          <button 
            onClick={() => router.back()} 
            className="event-detail-back"
            style={{ marginBottom: '1rem' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Teams
          </button>
        </div>

        <div className="register-header">
          <h1 className="register-title">Create a New Team</h1>
          <p className="register-subtitle">Fill in the details to form your hackathon team</p>
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

          {/* Team Name */}
          <div className="register-input-group">
            <label htmlFor="name" className="register-label">
              Team Name <span style={{ color: '#f87171' }}>*</span>
            </label>
            <div className="register-input-wrapper">
              <svg className="register-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M5.5 20v-2a5 5 0 0 1 10 0v2" />
              </svg>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="register-input"
                placeholder="e.g., Code Warriors, AI Avengers"
                required
                minLength={3}
                maxLength={50}
              />
            </div>
          </div>

          {/* Event Selection */}
          <div className="register-input-group">
            <label htmlFor="event" className="register-label">
              Select Event <span style={{ color: '#f87171' }}>*</span>
            </label>
            <div className="register-input-wrapper">
              <svg className="register-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
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
                <option value="" style={{ background: '#1a1a1a' }}>Select a hackathon event</option>
                {events.map(event => (
                  <option key={event.id} value={event.id} style={{ background: '#1a1a1a' }}>
                    {event.name} ({new Date(event.start_date).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Team Size and Leader Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="register-input-group">
              <label htmlFor="max_members" className="register-label">
                Team Size
              </label>
              <div className="register-input-wrapper">
                <svg className="register-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <select
                  id="max_members"
                  name="max_members"
                  value={formData.max_members}
                  onChange={handleChange}
                  className="register-input"
                  style={{ appearance: 'none' }}
                >
                  {[2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num} style={{ background: '#1a1a1a' }}>
                      {num} members
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="register-input-group">
              <label className="register-label">Team Leader</label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 1rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  color: 'white'
                }}>
                  {user?.username?.charAt(0).toUpperCase() || 'Y'}
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: '500', color: 'white' }}>
                    {user?.username || 'You'}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#667eea',
                    background: 'rgba(102, 126, 234, 0.1)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '12px',
                    display: 'inline-block'
                  }}>
                    You will be the leader
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="register-input-group">
            <label htmlFor="description" className="register-label">
              Team Description
            </label>
            <div className="register-input-wrapper">
              <svg className="register-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="register-input"
                placeholder="Describe your team's focus, what skills you're looking for, and your project idea..."
                rows="5"
                style={{ paddingTop: '1rem', paddingBottom: '1rem', height: 'auto' }}
              />
            </div>
            <p className="register-hint">Help others understand what your team is about</p>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Link 
              href="/teams" 
              className="register-button" 
              style={{ 
                background: 'transparent', 
                border: '1px solid rgba(255,255,255,0.1)', 
                flex: 1,
                textDecoration: 'none',
                textAlign: 'center'
              }}
            >
              Cancel
            </Link>
            <button 
              type="submit" 
              className="register-button"
              disabled={loading || events.length === 0}
              style={{ flex: 2 }}
            >
              {loading ? (
                <>
                  <span className="register-loader"></span>
                  Creating Team...
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
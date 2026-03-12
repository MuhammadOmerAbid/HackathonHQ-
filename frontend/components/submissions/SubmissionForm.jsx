"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "../../utils/axios";

/**
 * Reusable SubmissionForm component.
 * Props:
 *   - initialData: object (for edit mode)
 *   - onSuccess: function (called with the saved submission)
 *   - submitLabel: string (button text)
 *   - cancelHref: string (back link)
 */
export default function SubmissionForm({
  initialData = {},
  onSuccess,
  submitLabel = "Submit Project",
  cancelHref = "/submissions"
}) {
  const router = useRouter();
  const formRef = useRef(null);
  const [formData, setFormData] = useState({
    title: "", 
    description: "", 
    summary: "",
    demo_url: "", 
    repo_url: "",
    technologies: "",
    event: "", 
    team: "",
    ...initialData,
    technologies: Array.isArray(initialData.technologies)
      ? initialData.technologies.join(", ")
      : initialData.technologies || ""
  });
  
  const [events, setEvents] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [userTeams, setUserTeams] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null); // 'event', 'team', or null

  // Refs for dropdown click outside detection
  const eventDropdownRef = useRef(null);
  const teamDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown === 'event' && eventDropdownRef.current && !eventDropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
      if (openDropdown === 'team' && teamDropdownRef.current && !teamDropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setInitialLoading(true);
      try {
        // Get current user
        const userRes = await axios.get("/users/me/").catch(() => null);
        const currentUser = userRes?.data;
        setUser(currentUser);

        // Get current date for filtering events
        const now = new Date().toISOString();

        // Fetch events and filter for future/current events
        const eventsRes = await axios.get("/events/");
        const allEvents = eventsRes.data.results || eventsRes.data || [];
        
        // Filter events that haven't ended yet
        const activeEvents = allEvents.filter(event => {
          const endDate = new Date(event.end_date || event.endDate || event.end);
          return endDate >= new Date();
        });
        setEvents(activeEvents);

        // Fetch all teams with members expanded
        const teamsRes = await axios.get("/teams/?expand=members,leader");
        const teams = teamsRes.data.results || teamsRes.data || [];
        setAllTeams(teams);

        // Filter teams where current user is a member
        if (currentUser) {
          const userTeamList = teams.filter(team => {
            // Check if user is the team leader
            const isLeader = team.leader?.id === currentUser.id || team.leader === currentUser.id;
            
            // Check if user is in members array
            const isMember = team.members?.some(member => {
              if (typeof member === 'object') {
                return member.id === currentUser.id;
              }
              return member === currentUser.id;
            });

            return isLeader || isMember;
          });
          setUserTeams(userTeamList);
        }

      } catch (err) { 
        console.error("Error fetching data:", err);
        setError("Failed to load form data");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, []);

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = "Project title is required";
    } else if (formData.title.length < 3) {
      errors.title = "Title must be at least 3 characters";
    } else if (formData.title.length > 100) {
      errors.title = "Title must be less than 100 characters";
    }

    if (!formData.event) {
      errors.event = "Please select an event";
    }

    if (!formData.team) {
      errors.team = "Please select a team";
    }

    if (!formData.description.trim()) {
      errors.description = "Description is required";
    } else if (formData.description.length < 50) {
      errors.description = "Description should be at least 50 characters";
    } else if (formData.description.length > 5000) {
      errors.description = "Description must be less than 5000 characters";
    }

    if (formData.demo_url && !isValidUrl(formData.demo_url)) {
      errors.demo_url = "Please enter a valid URL (include https://)";
    }

    if (formData.repo_url && !isValidUrl(formData.repo_url)) {
      errors.repo_url = "Please enter a valid URL (include https://)";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    const firstError = document.querySelector('[data-error="true"]');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  setLoading(true);
  setError("");
  
  try {
    const payload = {
      title: formData.title,
      description: formData.description,
      summary: formData.summary,
      demo_url: formData.demo_url,
      repo_url: formData.repo_url,
      event: parseInt(formData.event),
      team: parseInt(formData.team),
      technologies: formData.technologies
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
    };
    
    console.log("Submitting payload:", payload);

    let res;
    if (initialData.id) {
      res = await axios.patch(`/submissions/${initialData.id}/`, payload);
    } else {
      res = await axios.post("/submissions/", payload);
    }
    
    // 🔥 FIX: Fetch the complete submission with expanded event and team data
    console.log("Submission created, fetching full data with expand...");
    const fullSubmissionRes = await axios.get(`/submissions/${res.data.id}/?expand=event,team,team.members,team.leader`);
    console.log("Full submission data:", fullSubmissionRes.data);
    
    if (onSuccess) {
      onSuccess(fullSubmissionRes.data);
    } else {
      router.push(`/submissions/${fullSubmissionRes.data.id}`);
    }
  } catch (err) {
    console.error("Submission error:", err);
    setError(err.response?.data?.message || err.response?.data?.detail || "Failed to save submission");
  } finally {
    setLoading(false);
  }
};

  const hasTeams = userTeams.length > 0;
  const hasEvents = events.length > 0;
  const canSubmit = hasTeams && hasEvents;

  if (initialLoading) {
    return (
      <div className="sf-loading">
        <div className="sf-spinner" />
        <p>Loading form data...</p>
        <style jsx>{sfStyles}</style>
      </div>
    );
  }

  // Get selected event and team names
  const selectedEvent = events.find(ev => ev.id == formData.event);
  const selectedTeam = userTeams.find(tm => tm.id == formData.team);

  return (
    <>
      <style jsx>{sfStyles}</style>
      
      {!user && (
        <div className="sf-error" style={{ background: 'rgba(251, 191, 36, 0.1)', borderColor: '#fbbf24', color: '#fbbf24' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          You must be logged in to submit a project.
        </div>
      )}

      {user && !hasTeams && (
        <div className="sf-error" style={{ background: 'rgba(251, 191, 36, 0.1)', borderColor: '#fbbf24', color: '#fbbf24' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          You're not in any team yet. <Link href="/teams/create" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Create a team</Link> to submit a project.
        </div>
      )}

      {user && !hasEvents && (
        <div className="sf-error" style={{ background: 'rgba(251, 191, 36, 0.1)', borderColor: '#fbbf24', color: '#fbbf24' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          There are no active events to submit to at the moment.
        </div>
      )}

      {error && (
        <div className="sf-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="sf-form" ref={formRef}>
        <div className="sf-section-label">Basic Info</div>

        <div className="sf-field">
          <label className="sf-label">
            Project Title <span className="sf-req">*</span>
          </label>
          <input 
            type="text" 
            name="title" 
            value={formData.title} 
            onChange={handleChange} 
            className={`sf-input ${validationErrors.title ? 'error' : ''}`} 
            placeholder="e.g., AI-Powered Task Manager" 
            required 
            maxLength={100}
            data-error={validationErrors.title ? "true" : "false"}
          />
          {validationErrors.title && (
            <span className="sf-hint" style={{ color: '#f87171' }}>{validationErrors.title}</span>
          )}
          <span className="sf-hint" style={{ textAlign: 'right', display: 'block' }}>
            {formData.title.length}/100
          </span>
        </div>

        <div className="sf-row">
          {/* Event Dropdown */}
          <div className="sf-field" ref={eventDropdownRef}>
            <label className="sf-label">
              Event <span className="sf-req">*</span>
            </label>
            <div className="sf-select-wrapper">
              <div 
                className={`sf-select-trigger ${validationErrors.event ? 'error' : ''} ${!hasEvents ? 'disabled' : ''} ${openDropdown === 'event' ? 'open' : ''}`}
                onClick={() => hasEvents && setOpenDropdown(openDropdown === 'event' ? null : 'event')}
              >
                <span className={`sf-select-value ${!selectedEvent ? 'placeholder' : ''}`}>
                  {selectedEvent ? selectedEvent.name : (hasEvents ? "Choose an active event" : "No active events available")}
                </span>
                <svg 
                  className={`sf-select-arrow ${openDropdown === 'event' ? 'open' : ''}`}
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {/* Event Dropdown Menu */}
              {openDropdown === 'event' && hasEvents && (
                <div className="sf-select-menu">
                  {events.length > 0 ? (
                    events.map(ev => {
                      const isSelected = formData.event == ev.id;
                      return (
                        <div
                          key={ev.id}
                          className={`sf-select-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            handleChange({ target: { name: 'event', value: ev.id.toString() } });
                            setOpenDropdown(null);
                          }}
                        >
                          <div className="sf-select-item-content">
                            <span className="sf-select-item-title">{ev.name}</span>
                            <span className="sf-select-item-sub">
                              Ends: {new Date(ev.end_date || ev.endDate || ev.end).toLocaleDateString()}
                            </span>
                          </div>
                          {isSelected && (
                            <svg className="sf-select-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="sf-select-empty">No events available</div>
                  )}
                </div>
              )}
            </div>
            {validationErrors.event && (
              <span className="sf-hint" style={{ color: '#f87171' }}>{validationErrors.event}</span>
            )}
          </div>
          
          {/* Team Dropdown */}
          <div className="sf-field" ref={teamDropdownRef}>
            <label className="sf-label">
              Team <span className="sf-req">*</span>
            </label>
            <div className="sf-select-wrapper">
              <div 
                className={`sf-select-trigger ${validationErrors.team ? 'error' : ''} ${!hasTeams ? 'disabled' : ''} ${openDropdown === 'team' ? 'open' : ''}`}
                onClick={() => hasTeams && setOpenDropdown(openDropdown === 'team' ? null : 'team')}
              >
                <span className={`sf-select-value ${!selectedTeam ? 'placeholder' : ''}`}>
                  {selectedTeam ? selectedTeam.name : (hasTeams ? "Choose your team" : "You're not in any team")}
                </span>
                <svg 
                  className={`sf-select-arrow ${openDropdown === 'team' ? 'open' : ''}`}
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {/* Team Dropdown Menu */}
              {openDropdown === 'team' && hasTeams && (
                <div className="sf-select-menu">
                  {userTeams.length > 0 ? (
                    userTeams.map(tm => {
                      const isSelected = formData.team == tm.id;
                      const isLeader = tm.leader?.id === user?.id || tm.leader === user?.id;
                      const memberCount = tm.members?.length || 0;
                      
                      return (
                        <div
                          key={tm.id}
                          className={`sf-select-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            handleChange({ target: { name: 'team', value: tm.id.toString() } });
                            setOpenDropdown(null);
                          }}
                        >
                          <div className="sf-select-item-content">
                            <div className="sf-select-item-title-row">
                              <span className="sf-select-item-title">{tm.name}</span>
                              {isLeader && (
                                <span className="sf-select-item-badge">Leader</span>
                              )}
                            </div>
                            <span className="sf-select-item-sub">
                              {memberCount} {memberCount === 1 ? 'member' : 'members'}
                            </span>
                          </div>
                          {isSelected && (
                            <svg className="sf-select-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="sf-select-empty">No teams available</div>
                  )}
                </div>
              )}
            </div>
            {validationErrors.team && (
              <span className="sf-hint" style={{ color: '#f87171' }}>{validationErrors.team}</span>
            )}
            {user && hasTeams && (
              <span className="sf-hint">
                Showing {userTeams.length} team{userTeams.length !== 1 ? 's' : ''} you belong to
              </span>
            )}
          </div>
        </div>

        <div className="sf-field">
          <label className="sf-label">Short Summary</label>
          <input 
            type="text" 
            name="summary" 
            value={formData.summary} 
            onChange={handleChange} 
            className="sf-input" 
            placeholder="One-line description of your project" 
            maxLength={200}
          />
          <span className="sf-hint" style={{ textAlign: 'right', display: 'block' }}>
            {formData.summary.length}/200
          </span>
        </div>

        <div className="sf-section-label">Details</div>

        <div className="sf-field">
          <label className="sf-label">
            Full Description <span className="sf-req">*</span>
          </label>
          <textarea 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            className={`sf-input sf-textarea ${validationErrors.description ? 'error' : ''}`} 
            placeholder="How does your project work? What problem does it solve? What features does it have?" 
            rows="5" 
            required
            maxLength={5000}
            data-error={validationErrors.description ? "true" : "false"}
          />
          {validationErrors.description && (
            <span className="sf-hint" style={{ color: '#f87171' }}>{validationErrors.description}</span>
          )}
          <span className="sf-hint">
            Minimum 50 characters. Currently: {formData.description.length} characters
          </span>
        </div>

        <div className="sf-field">
          <label className="sf-label">Technologies Used</label>
          <input 
            type="text" 
            name="technologies" 
            value={formData.technologies} 
            onChange={handleChange} 
            className="sf-input" 
            placeholder="React, Python, TensorFlow... (comma separated)" 
          />
          <p className="sf-hint">Separate with commas</p>
        </div>

        <div className="sf-section-label">Links</div>

        <div className="sf-row">
          <div className="sf-field">
            <label className="sf-label">Live Demo URL</label>
            <input 
              type="url" 
              name="demo_url" 
              value={formData.demo_url} 
              onChange={handleChange} 
              className={`sf-input ${validationErrors.demo_url ? 'error' : ''}`} 
              placeholder="https://demo.example.com" 
              data-error={validationErrors.demo_url ? "true" : "false"}
            />
            {validationErrors.demo_url && (
              <span className="sf-hint" style={{ color: '#f87171' }}>{validationErrors.demo_url}</span>
            )}
          </div>
          <div className="sf-field">
            <label className="sf-label">Repository URL</label>
            <input 
              type="url" 
              name="repo_url" 
              value={formData.repo_url} 
              onChange={handleChange} 
              className={`sf-input ${validationErrors.repo_url ? 'error' : ''}`} 
              placeholder="https://github.com/..." 
              data-error={validationErrors.repo_url ? "true" : "false"}
            />
            {validationErrors.repo_url && (
              <span className="sf-hint" style={{ color: '#f87171' }}>{validationErrors.repo_url}</span>
            )}
          </div>
        </div>

        <div className="sf-actions">
          <Link href={cancelHref} className="sf-btn-cancel">Cancel</Link>
          <button 
            type="submit" 
            className="sf-btn-submit" 
            disabled={loading || !canSubmit || !user}
          >
            {loading ? (
              <><span className="sf-spinner" /> Saving...</>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </form>
    </>
  );
}

const sfStyles = `
  /* Loading State */
  .sf-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    gap: 1rem;
    color: #5c5c6e;
    font-family: 'DM Sans', sans-serif;
  }
  
  /* Error Message */
  .sf-error {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: rgba(248,113,113,0.1);
    border: 1px solid rgba(248,113,113,0.2);
    color: #f87171;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    padding: 0.85rem 1rem;
    border-radius: 10px;
    margin-bottom: 1.5rem;
  }
  .sf-error svg {
    width: 17px;
    height: 17px;
    flex-shrink: 0;
  }
  
  /* Form Container */
  .sf-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    position: relative;
    z-index: 1;
  }
  
  /* Section Label */
  .sf-section-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #6EE7B7;
    padding-top: 0.25rem;
  }
  
  /* Row Layout */
  .sf-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    position: relative;
  }
  
  @media (max-width: 540px) {
    .sf-row {
      grid-template-columns: 1fr;
    }
  }
  
  /* Field Container */
  .sf-field {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    position: relative;
  }
  
  /* Label */
  .sf-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.85rem;
    font-weight: 500;
    color: rgba(240,240,243,0.8);
  }
  
  /* Required Star */
  .sf-req {
    color: #f87171;
  }
  
  /* Hint Text */
  .sf-hint {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem;
    color: #5c5c6e;
    margin: 0.15rem 0 0;
  }
  
  /* Input Fields */
  .sf-input {
    background: #17171b;
    border: 1px solid #1e1e24;
    border-radius: 10px;
    color: #f0f0f3;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    padding: 0.7rem 1rem;
    outline: none;
    transition: border-color 0.2s;
    width: 100%;
    box-sizing: border-box;
  }
  
  .sf-input.error {
    border-color: #f87171;
  }
  
  .sf-input::placeholder {
    color: #5c5c6e;
  }
  
  .sf-input:focus {
    border-color: #6EE7B7;
  }
  
  /* Textarea */
  .sf-textarea {
    resize: vertical;
    min-height: 120px;
    line-height: 1.6;
  }
  
  /* Select Wrapper */
  .sf-select-wrapper {
    position: relative;
    width: 100%;
  }
  
  /* Custom Select Trigger */
  .sf-select-trigger {
    background: #17171b;
    border: 1px solid #1e1e24;
    border-radius: 10px;
    color: #f0f0f3;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    padding: 0.7rem 1rem;
    width: 100%;
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.2s ease;
    min-height: 42px;
  }
  
  .sf-select-trigger:hover:not(.disabled) {
    border-color: #6EE7B7;
    background: #111114;
  }
  
  .sf-select-trigger.open {
    border-color: #6EE7B7;
    box-shadow: 0 0 0 2px rgba(110, 231, 183, 0.2);
    background: #111114;
  }
  
  .sf-select-trigger.error {
    border-color: #f87171;
  }
  
  .sf-select-trigger.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* Select Value */
  .sf-select-value {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .sf-select-value.placeholder {
    color: #5c5c6e;
  }
  
  /* Select Arrow */
  .sf-select-arrow {
    width: 16px;
    height: 16px;
    color: #6EE7B7;
    transition: transform 0.2s ease;
    flex-shrink: 0;
    margin-left: 0.5rem;
  }
  
  .sf-select-arrow.open {
    transform: rotate(180deg);
  }
  
  /* Dropdown Menu */
  .sf-select-menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    max-height: 280px;
    overflow-y: auto;
    background: #1a1a1f;
    border: 1px solid #1e1e24;
    border-radius: 10px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    z-index: 100;
    animation: menuFadeIn 0.2s ease;
  }
  
  @keyframes menuFadeIn {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Dropdown Items */
  .sf-select-item {
    padding: 0.75rem 1rem;
    cursor: pointer;
    color: #f0f0f3;
    font-size: 0.9rem;
    transition: all 0.15s ease;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .sf-select-item:last-child {
    border-bottom: none;
  }
  
  .sf-select-item:hover {
    background: rgba(110, 231, 183, 0.1);
    color: #6EE7B7;
    padding-left: 1.25rem;
  }
  
  .sf-select-item.selected {
    background: rgba(110, 231, 183, 0.15);
    color: #6EE7B7;
    font-weight: 500;
    border-left: 2px solid #6EE7B7;
    padding-left: calc(1rem - 2px);
  }
  
  /* Item Content */
  .sf-select-item-content {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    flex: 1;
  }
  
  .sf-select-item-title {
    font-weight: 500;
  }
  
  .sf-select-item-title-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .sf-select-item-sub {
    font-size: 0.7rem;
    color: #5c5c6e;
  }
  
  .sf-select-item-badge {
    font-size: 0.65rem;
    padding: 0.1rem 0.4rem;
    background: rgba(110, 231, 183, 0.15);
    border-radius: 4px;
    color: #6EE7B7;
    white-space: nowrap;
  }
  
  /* Check Icon */
  .sf-select-check {
    width: 16px;
    height: 16px;
    color: #6EE7B7;
    flex-shrink: 0;
    margin-left: 0.5rem;
  }
  
  /* Empty State */
  .sf-select-empty {
    padding: 1.5rem;
    text-align: center;
    color: #5c5c6e;
    font-size: 0.9rem;
  }
  
  /* Scrollbar */
  .sf-select-menu::-webkit-scrollbar {
    width: 4px;
  }
  
  .sf-select-menu::-webkit-scrollbar-track {
    background: #1e1e24;
  }
  
  .sf-select-menu::-webkit-scrollbar-thumb {
    background: #3a3a48;
    border-radius: 4px;
  }
  
  .sf-select-menu::-webkit-scrollbar-thumb:hover {
    background: #6EE7B7;
  }
  
  /* Action Buttons */
  .sf-actions {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
    position: relative;
    z-index: 1;
  }
  
  .sf-btn-cancel {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid #1e1e24;
    color: #5c5c6e;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    font-size: 0.9rem;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    text-decoration: none;
    transition: all 0.2s;
    cursor: pointer;
  }
  
  .sf-btn-cancel:hover {
    border-color: #26262e;
    color: #f0f0f3;
  }
  
  .sf-btn-submit {
    flex: 2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: #6EE7B7;
    color: #0c0c0f;
    font-family: 'DM Sans', sans-serif;
    font-weight: 700;
    font-size: 0.9rem;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.2s;
  }
  
  .sf-btn-submit:hover:not(:disabled) {
    opacity: 0.88;
    transform: translateY(-1px);
  }
  
  .sf-btn-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* Spinner */
  .sf-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(0,0,0,0.2);
    border-top-color: #0c0c0f;
    border-radius: 50%;
    animation: sf-spin 0.7s linear infinite;
    display: inline-block;
  }
  
  @keyframes sf-spin {
    to { transform: rotate(360deg); }
  }
`;
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "../../../utils/axios";

export default function CreateEventPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    is_premium: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [user, setUser] = useState(null);
  const [canCreate, setCanCreate] = useState(false);

  // Check if user has permission to create events
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const token = localStorage.getItem('access');
        
        // If no token, redirect to login
        if (!token) {
          console.log("No token found, redirecting to login");
          sessionStorage.setItem('redirectAfterLogin', '/events/create');
          router.push('/login?message=Please login to create an event');
          return;
        }

        // Set token in axios headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Get current user info
        const userRes = await axios.get("/users/me/");
        console.log("User data:", userRes.data);
        setUser(userRes.data);

        // Check if user can create events (admin, staff, or organizer)
        const hasPermission = 
          userRes.data.is_staff || 
          userRes.data.is_superuser || 
          (userRes.data.profile?.is_organizer === true);
        
        console.log("Can create event?", hasPermission);
        setCanCreate(hasPermission);

        // If user doesn't have permission, redirect to events page with error
        if (!hasPermission) {
          router.push('/events?error=You do not have permission to create events');
        }

      } catch (err) {
        console.error("Error checking permission:", err);
        
        // If token is invalid, redirect to login
        if (err.response?.status === 401) {
          sessionStorage.setItem('redirectAfterLogin', '/events/create');
          router.push('/login?message=Session expired. Please login again');
        } else {
          router.push('/events');
        }
      } finally {
        setCheckingPermission(false);
      }
    };

    checkPermission();
  }, [router]);

  // Set minimum date for datetime-local input (today)
  const getMinDate = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate dates
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      
      if (endDate <= startDate) {
        setError("End date must be after start date");
        setLoading(false);
        return;
      }

      // Convert dates to ISO format for API
      const eventData = {
        name: formData.name,
        description: formData.description,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_premium: formData.is_premium
      };

      console.log("Creating event:", eventData);

      const res = await axios.post("/events/", eventData);
      console.log("Event created:", res.data);
      
      // Redirect to the new event page
      router.push(`/events/${res.data.id}`);
      
    } catch (err) {
      console.error("Error creating event:", err);
      
      if (err.response?.status === 403) {
        setError("You don't have permission to create events. Only organizers and admins can create events.");
      } else if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
        setTimeout(() => {
          router.push('/login?redirect=/events/create');
        }, 2000);
      } else {
        setError(err.response?.data?.message || "Failed to create event. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking permissions
  if (checkingPermission) {
    return (
      <div className="create-event-loading">
        <div className="blob blob1"></div>
        <div className="blob blob2"></div>
        <div className="blob blob3"></div>
        <div className="loading-spinner"></div>
        <p>Checking permissions...</p>
      </div>
    );
  }

  // If user doesn't have permission, don't render the form
  if (!canCreate) {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="create-event-page">
      {/* Animated background blobs */}
      <div className="blob blob1"></div>
      <div className="blob blob2"></div>
      <div className="blob blob3"></div>

      <div className="create-event-container">
        {/* Back button */}
        <div className="create-event-header">
          <button onClick={() => router.back()} className="back-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Events
          </button>
        </div>

        {/* Main Form Card */}
        <div className="create-event-card">
          <div className="card-header">
            <h1 className="card-title">Create New Hackathon</h1>
            <p className="card-subtitle">
              {user?.profile?.organization_name 
                ? `Organizing as ${user.profile.organization_name}`
                : user?.is_staff 
                ? 'Creating as Admin' 
                : 'Create a new hackathon event'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="event-form">
            {error && (
              <div className="form-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Event Name */}
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Event Name <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., AI Hackathon 2024, Web3 Summit"
                  required
                  minLength={3}
                  maxLength={100}
                  disabled={loading}
                />
              </div>
              <p className="input-hint">Choose a clear, descriptive name for your hackathon</p>
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Description <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Describe your hackathon: theme, rules, prizes, schedule, etc."
                  rows="6"
                  required
                  minLength={20}
                  maxLength={2000}
                  disabled={loading}
                />
              </div>
              <p className="input-hint">
                {formData.description.length}/2000 characters - Be detailed to attract participants
              </p>
            </div>

            {/* Date Fields */}
            <div className="form-row">
              <div className="form-group half">
                <label htmlFor="start_date" className="form-label">
                  Start Date & Time <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <input
                    type="datetime-local"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className="form-input"
                    min={getMinDate()}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group half">
                <label htmlFor="end_date" className="form-label">
                  End Date & Time <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <input
                    type="datetime-local"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    className="form-input"
                    min={formData.start_date || getMinDate()}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Premium Checkbox */}
            <div className="form-group checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_premium"
                  checked={formData.is_premium}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span className="checkbox-text">
                  Premium Event <span className="premium-badge">PRO</span>
                </span>
              </label>
              <p className="input-hint checkbox-hint">
                Premium events get featured placement and additional promotional support
              </p>
            </div>

            {/* Organizer Info */}
            {user && (
              <div className="organizer-info">
                <div className="organizer-avatar">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
                <div className="organizer-details">
                  <span className="organizer-label">You are organizing as</span>
                  <span className="organizer-name">
                    {user.profile?.organization_name || user.username}
                    {user.is_staff && <span className="admin-badge">Admin</span>}
                  </span>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="form-actions">
              <Link href="/events" className="cancel-button">
                Cancel
              </Link>
              <button 
                type="submit" 
                className="submit-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="button-spinner"></span>
                    Creating Event...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Create Hackathon
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
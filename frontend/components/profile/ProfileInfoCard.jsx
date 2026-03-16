"use client";

import React from "react";

export default function ProfileInfoCard({ 
  profileData, 
  onInputChange, 
  onAvatarChange,
  onCoverChange,
  onSubmit, 
  saving 
}) {
  return (
    <div className="profile-card">
      <h3 className="profile-card-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        Personal Information
      </h3>
      <form onSubmit={onSubmit} className="profile-form">
        <div className="profile-media">
          <div className="profile-media-block">
            <div className="profile-media-label">Cover Photo</div>
            <div className="profile-cover-preview">
              {profileData.cover_image ? (
                <img src={profileData.cover_image} alt="" />
              ) : (
                <span>No cover uploaded</span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={onCoverChange}
              className="profile-file-input"
            />
          </div>
          <div className="profile-media-block">
            <div className="profile-media-label">Avatar</div>
            <div className="profile-avatar-preview">
              {profileData.avatar ? (
                <img src={profileData.avatar} alt="" />
              ) : (
                <span>{profileData.username?.[0]?.toUpperCase() || "U"}</span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={onAvatarChange}
              className="profile-file-input"
            />
          </div>
        </div>

        <div className="profile-form-row">
          <div className="profile-form-group">
            <label htmlFor="first_name">First Name</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={profileData.first_name}
              onChange={onInputChange}
              placeholder="Enter your first name"
              className="profile-input"
            />
          </div>
          <div className="profile-form-group">
            <label htmlFor="last_name">Last Name</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={profileData.last_name}
              onChange={onInputChange}
              placeholder="Enter your last name"
              className="profile-input"
            />
          </div>
        </div>

        <div className="profile-form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={profileData.username}
            disabled
            className="profile-input profile-input-disabled"
          />
          <p className="profile-input-hint">Username cannot be changed</p>
        </div>

        <div className="profile-form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={profileData.email}
            onChange={onInputChange}
            placeholder="Enter your email"
            className="profile-input"
            required
          />
        </div>

        <div className="profile-form-group">
          <label htmlFor="organization_name">Organization</label>
          <input
            type="text"
            id="organization_name"
            name="organization_name"
            value={profileData.organization_name}
            onChange={onInputChange}
            placeholder="Enter your organization name"
            className="profile-input"
          />
        </div>

        <div className="profile-form-row">
          <div className="profile-form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={profileData.location}
              onChange={onInputChange}
              placeholder="City, Country"
              className="profile-input"
            />
          </div>
          <div className="profile-form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={profileData.bio}
              onChange={onInputChange}
              placeholder="Tell us a bit about yourself"
              className="profile-textarea"
              rows={3}
            />
          </div>
        </div>

        <div className="profile-form-row">
          <div className="profile-form-group">
            <label htmlFor="github_url">GitHub</label>
            <input
              type="url"
              id="github_url"
              name="github_url"
              value={profileData.github_url}
              onChange={onInputChange}
              placeholder="https://github.com/username"
              className="profile-input"
            />
          </div>
          <div className="profile-form-group">
            <label htmlFor="linkedin_url">LinkedIn</label>
            <input
              type="url"
              id="linkedin_url"
              name="linkedin_url"
              value={profileData.linkedin_url}
              onChange={onInputChange}
              placeholder="https://linkedin.com/in/username"
              className="profile-input"
            />
          </div>
        </div>

        <div className="profile-form-row">
          <div className="profile-form-group">
            <label htmlFor="twitter_url">Twitter / X</label>
            <input
              type="url"
              id="twitter_url"
              name="twitter_url"
              value={profileData.twitter_url}
              onChange={onInputChange}
              placeholder="https://x.com/username"
              className="profile-input"
            />
          </div>
          <div className="profile-form-group">
            <label htmlFor="website_url">Website</label>
            <input
              type="url"
              id="website_url"
              name="website_url"
              value={profileData.website_url}
              onChange={onInputChange}
              placeholder="https://your-site.com"
              className="profile-input"
            />
          </div>
        </div>

        <div className="profile-form-actions">
          <button type="submit" className="profile-save-btn" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      <style jsx>{`
        .profile-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 1.5rem;
        }

        .profile-card-title {
          display: flex;
          align-items: center;
          font-family: 'Syne', sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 1.5rem 0;
        }

        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .profile-media {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 1rem;
          padding: 0.5rem 0;
        }

        .profile-media-block {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .profile-media-label {
          font-size: 0.85rem;
          font-weight: 500;
          color: rgba(255,255,255,0.8);
        }

        .profile-cover-preview {
          height: 120px;
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #888;
          overflow: hidden;
        }

        .profile-cover-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-avatar-preview {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #888;
          overflow: hidden;
        }

        .profile-avatar-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-file-input {
          color: #888;
          font-size: 0.8rem;
        }

        .profile-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .profile-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .profile-form-group label {
          font-size: 0.85rem;
          font-weight: 500;
          color: rgba(255,255,255,0.8);
        }

        .profile-input {
          width: 100%;
          padding: 0.6rem 1rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #fff;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.2s ease;
        }

        .profile-textarea {
          width: 100%;
          padding: 0.6rem 1rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #fff;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.2s ease;
          resize: vertical;
        }

        .profile-input:focus {
          border-color: #6EE7B7;
          background: rgba(255,255,255,0.08);
        }

        .profile-textarea:focus {
          border-color: #6EE7B7;
          background: rgba(255,255,255,0.08);
        }

        .profile-input-disabled {
          background: rgba(255,255,255,0.02);
          color: #888;
          cursor: not-allowed;
        }

        .profile-input-hint {
          font-size: 0.7rem;
          color: #888;
          margin: 0.25rem 0 0 0;
        }

        .profile-form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 1rem;
        }

        .profile-save-btn {
          padding: 0.6rem 1.5rem;
          background: #6EE7B7;
          border: none;
          border-radius: 8px;
          color: #0c0c0f;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .profile-save-btn:hover {
          background: #86efac;
          transform: translateY(-2px);
        }

        .profile-save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 768px) {
          .profile-media {
            grid-template-columns: 1fr;
          }
          .profile-form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

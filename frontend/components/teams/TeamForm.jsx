// components/teams/TeamForm.jsx
// Reusable form body — uses tmc-* classes injected by the parent page.
// Handles the fields only; submit logic lives in the parent.

export default function TeamForm({ formData, onChange, events, user, error }) {
  return (
    <>
      {error && (
        <div className="tmc-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Team Name */}
      <div className="tmc-group">
        <label className="tmc-label">
          Team Name <span className="tmc-required">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={onChange}
          className="tmc-input"
          placeholder="e.g., Code Warriors, AI Avengers"
          required
          minLength={3}
          maxLength={50}
        />
      </div>

      {/* Event + Size */}
      <div className="tmc-row">
        <div className="tmc-group">
          <label className="tmc-label">
            Select Event <span className="tmc-required">*</span>
          </label>
          <select
            name="event"
            value={formData.event}
            onChange={onChange}
            className="tmc-select"
            required
          >
            <option value="">Choose an event</option>
            {(events || []).map((event) => (
              <option key={event.id} value={event.id}>
                {event.name} ({new Date(event.start_date).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        <div className="tmc-group">
          <label className="tmc-label">Team Size</label>
          <select
            name="max_members"
            value={formData.max_members}
            onChange={onChange}
            className="tmc-select"
          >
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} members
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leader (read-only) */}
      <div className="tmc-group">
        <label className="tmc-label">Team Leader</label>
        <div className="tmc-leader-strip">
          <div className="tmc-leader-avatar">
            {user?.avatar ? <img src={user.avatar} alt="" /> : user?.username?.charAt(0).toUpperCase() || "Y"}
          </div>
          <div className="tmc-leader-info">
            <div className="tmc-leader-name">
              {user?.username || "You"}
              <span className="tmc-leader-badge">Leader</span>
            </div>
            <div className="tmc-leader-sub">Automatically assigned as team leader</div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="tmc-group">
        <label className="tmc-label">Team Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={onChange}
          className="tmc-textarea"
          placeholder="Describe your team's focus, skills you're looking for, and your project idea…"
          rows="5"
        />
        <span className="tmc-hint">Help others understand what your team is about.</span>
      </div>
    </>
  );
}

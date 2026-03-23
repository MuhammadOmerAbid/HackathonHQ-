// components/teams/TeamForm.jsx
// Reusable form body — uses tmc-* classes injected by the parent page.
// Handles the fields only; submit logic lives in the parent.

import CustomSelect from "../ui/CustomSelect";

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
          <CustomSelect
            value={formData.event}
            onChange={(val) =>
              onChange({ target: { name: "event", value: String(val) } })
            }
            options={events || []}
            placeholder="Choose an event"
            emptyLabel="No events available"
            disabled={(events || []).length === 0}
            getValue={(event) => String(event.id)}
            getLabel={(event) => event.name}
            getSubLabel={(event) =>
              new Date(event.start_date).toLocaleDateString()
            }
          />
        </div>

        <div className="tmc-group">
          <label className="tmc-label">Team Size</label>
          <CustomSelect
            value={formData.max_members}
            onChange={(val) =>
              onChange({ target: { name: "max_members", value: String(val) } })
            }
            options={[2, 3, 4, 5, 6]}
            placeholder="Choose team size"
            getValue={(n) => String(n)}
            getLabel={(n) => `${n} members`}
          />
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

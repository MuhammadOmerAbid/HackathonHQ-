"use client";

import React, { useState, useEffect } from "react";
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
  const [formData, setFormData] = useState({
    title: "", description: "", summary: "",
    demo_url: "", repo_url: "",
    technologies: "",
    event: "", team: "",
    ...initialData,
    technologies: Array.isArray(initialData.technologies)
      ? initialData.technologies.join(", ")
      : initialData.technologies || ""
  });
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, teamsRes] = await Promise.all([axios.get("/events/"), axios.get("/teams/")]);
        setEvents(eventsRes.data.results || []);
        setTeams(teamsRes.data.results || teamsRes.data || []);
      } catch (err) { console.error(err); }
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
      const payload = {
        ...formData,
        technologies: formData.technologies.split(',').map(t => t.trim()).filter(Boolean)
      };
      let res;
      if (initialData.id) {
        res = await axios.patch(`/submissions/${initialData.id}/`, payload);
      } else {
        res = await axios.post("/submissions/", payload);
      }
      if (onSuccess) onSuccess(res.data);
      else router.push(`/submissions/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save submission");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{sfStyles}</style>
      {error && (
        <div className="sf-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="sf-form">
        <div className="sf-section-label">Basic Info</div>

        <div className="sf-field">
          <label className="sf-label">Project Title <span className="sf-req">*</span></label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} className="sf-input" placeholder="e.g., AI-Powered Task Manager" required />
        </div>

        <div className="sf-row">
          <div className="sf-field">
            <label className="sf-label">Event <span className="sf-req">*</span></label>
            <div className="sf-select-wrapper">
              <select name="event" value={formData.event} onChange={handleChange} className="sf-input sf-select" required>
                <option value="">Choose an event</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
              <svg className="sf-select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
          <div className="sf-field">
            <label className="sf-label">Team <span className="sf-req">*</span></label>
            <div className="sf-select-wrapper">
              <select name="team" value={formData.team} onChange={handleChange} className="sf-input sf-select" required>
                <option value="">Choose your team</option>
                {teams.map(tm => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
              </select>
              <svg className="sf-select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
        </div>

        <div className="sf-field">
          <label className="sf-label">Short Summary</label>
          <input type="text" name="summary" value={formData.summary} onChange={handleChange} className="sf-input" placeholder="One-line description" />
        </div>

        <div className="sf-section-label">Details</div>

        <div className="sf-field">
          <label className="sf-label">Full Description <span className="sf-req">*</span></label>
          <textarea name="description" value={formData.description} onChange={handleChange} className="sf-input sf-textarea" placeholder="How does your project work? What problem does it solve?" rows="5" required />
        </div>

        <div className="sf-field">
          <label className="sf-label">Technologies Used</label>
          <input type="text" name="technologies" value={formData.technologies} onChange={handleChange} className="sf-input" placeholder="React, Python, TensorFlow... (comma separated)" />
          <p className="sf-hint">Separate with commas</p>
        </div>

        <div className="sf-section-label">Links</div>

        <div className="sf-row">
          <div className="sf-field">
            <label className="sf-label">Live Demo URL</label>
            <input type="url" name="demo_url" value={formData.demo_url} onChange={handleChange} className="sf-input" placeholder="https://demo.example.com" />
          </div>
          <div className="sf-field">
            <label className="sf-label">Repository URL</label>
            <input type="url" name="repo_url" value={formData.repo_url} onChange={handleChange} className="sf-input" placeholder="https://github.com/..." />
          </div>
        </div>

        <div className="sf-actions">
          <Link href={cancelHref} className="sf-btn-cancel">Cancel</Link>
          <button type="submit" className="sf-btn-submit" disabled={loading}>
            {loading ? <><span className="sf-spinner" /> Saving...</> : submitLabel}
          </button>
        </div>
      </form>
    </>
  );
}

const sfStyles = `
  .sf-error{display:flex;align-items:center;gap:.75rem;background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.2);color:#f87171;font-family:'DM Sans',sans-serif;font-size:.88rem;padding:.85rem 1rem;border-radius:10px;margin-bottom:1.5rem}
  .sf-error svg{width:17px;height:17px;flex-shrink:0}
  .sf-form{display:flex;flex-direction:column;gap:1.25rem}
  .sf-section-label{font-family:'DM Sans',sans-serif;font-size:.72rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--accent,#6EE7B7);padding-top:.25rem}
  .sf-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
  @media(max-width:540px){.sf-row{grid-template-columns:1fr}}
  .sf-field{display:flex;flex-direction:column;gap:.45rem}
  .sf-label{font-family:'DM Sans',sans-serif;font-size:.85rem;font-weight:500;color:rgba(240,240,243,.8)}
  .sf-req{color:#f87171}
  .sf-hint{font-family:'DM Sans',sans-serif;font-size:.78rem;color:var(--muted,#5c5c6e);margin:.15rem 0 0}
  .sf-input{background:var(--surface2,#17171b);border:1px solid var(--border,#1e1e24);border-radius:10px;color:var(--text,#f0f0f3);font-family:'DM Sans',sans-serif;font-size:.9rem;padding:.7rem 1rem;outline:none;transition:border-color .2s;width:100%;box-sizing:border-box}
  .sf-input::placeholder{color:var(--muted,#5c5c6e)}
  .sf-input:focus{border-color:var(--accent,#6EE7B7)}
  .sf-textarea{resize:vertical;min-height:120px;line-height:1.6}
  .sf-select-wrapper{position:relative}
  .sf-select{appearance:none;cursor:pointer;padding-right:2.5rem}
  .sf-select option{background:#17171b}
  .sf-select-arrow{position:absolute;right:.9rem;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--muted,#5c5c6e);pointer-events:none}
  .sf-actions{display:flex;gap:1rem;margin-top:.5rem}
  .sf-btn-cancel{flex:1;display:inline-flex;align-items:center;justify-content:center;background:transparent;border:1px solid var(--border,#1e1e24);color:var(--muted,#5c5c6e);font-family:'DM Sans',sans-serif;font-weight:500;font-size:.9rem;padding:.75rem 1rem;border-radius:10px;text-decoration:none;transition:all .2s}
  .sf-btn-cancel:hover{border-color:var(--border2,#26262e);color:var(--text,#f0f0f3)}
  .sf-btn-submit{flex:2;display:inline-flex;align-items:center;justify-content:center;gap:.5rem;background:var(--accent,#6EE7B7);color:#0c0c0f;font-family:'DM Sans',sans-serif;font-weight:700;font-size:.9rem;padding:.75rem 1rem;border-radius:10px;border:none;cursor:pointer;transition:opacity .2s,transform .2s}
  .sf-btn-submit:hover:not(:disabled){opacity:.88;transform:translateY(-1px)}
  .sf-btn-submit:disabled{opacity:.5;cursor:not-allowed}
  .sf-spinner{width:16px;height:16px;border:2px solid rgba(0,0,0,.2);border-top-color:#0c0c0f;border-radius:50%;animation:sf-spin .7s linear infinite}
  @keyframes sf-spin{to{transform:rotate(360deg)}}
`;
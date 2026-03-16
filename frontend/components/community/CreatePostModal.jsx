"use client";

import { useState, useRef, useEffect } from "react";
import axios from "../../utils/axios";

export default function CreatePostModal({ user, onClose, onPost }) {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [postType, setPostType] = useState("post");
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState("");
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const modalRef = useRef(null);
  const textareaRef = useRef(null);

  const MAX_CHARS = 1000;
  const remainingChars = MAX_CHARS - content.length;
  const isOverLimit = remainingChars < 0;
  const progressPercentage = (content.length / MAX_CHARS) * 100;

  const isAdmin = user?.is_staff || user?.is_superuser;
  const isOrganizer = user?.is_organizer;
  const canPostSpecial = isAdmin || isOrganizer;

  useEffect(() => {
    // Fetch events for dropdown
    const fetchEvents = async () => {
      try {
        const response = await axios.get("/events/?limit=10");
        setEvents(response.data.results || response.data || []);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    fetchEvents();

    // Focus textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);

    // Handle click outside
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError("Please write something before posting.");
      return;
    }

    if (isOverLimit) {
      setError(`Post is too long by ${Math.abs(remainingChars)} characters.`);
      return;
    }

    setIsPosting(true);
    setError("");

    try {
      await onPost({
        content: content.trim(),
        title: title.trim() || undefined,
        post_type: postType,
        tags: tags.trim() ? tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
        event: selectedEvent ? parseInt(selectedEvent) : undefined,
      });
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Failed to create post.");
      setIsPosting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={styles.overlay}>
      <div ref={modalRef} style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Create Post</h2>
          <button style={styles.closeButton} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Post Type Selector */}
        <div style={styles.postTypeSelector}>
          <button
            style={{
              ...styles.postTypeButton,
              ...(postType === "post" && styles.activePostType),
            }}
            onClick={() => setPostType("post")}
          >
            📝 Post
          </button>
          {canPostSpecial && (
            <button
              style={{
                ...styles.postTypeButton,
                ...(postType === "announcement" && styles.activePostType),
              }}
              onClick={() => setPostType("announcement")}
            >
              📢 Announcement
            </button>
          )}
          {canPostSpecial && (
            <button
              style={{
                ...styles.postTypeButton,
                ...(postType === "result" && styles.activePostType),
              }}
              onClick={() => setPostType("result")}
            >
              🏆 Results
            </button>
          )}
        </div>

        {/* User Info */}
        <div style={styles.userInfo}>
          <div style={styles.userAvatar}>
            {user?.avatar ? (
              <img src={user.avatar} alt="" style={styles.userAvatarImg} />
            ) : (
              user?.username?.[0]?.toUpperCase()
            )}
          </div>
          <div>
            <div style={styles.userName}>{user?.username}</div>
            <div style={styles.userHandle}>@{user?.username}</div>
          </div>
        </div>

        {/* Title Input */}
        <input
          style={styles.titleInput}
          type="text"
          placeholder="Post title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={150}
        />

        {/* Content Textarea */}
        <textarea
          ref={textareaRef}
          style={styles.textarea}
          placeholder={
            postType === "announcement"
              ? "Share an important announcement with the community..."
              : postType === "result"
              ? "Announce the hackathon winners and results..."
              : "What's happening in the hackathon world? Share your progress, ask questions, or start a discussion..."
          }
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={6}
        />

        {/* Character Counter */}
        <div style={styles.counter}>
          <svg width="40" height="40" viewBox="0 0 40 40">
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke="#1e1e24"
              strokeWidth="3"
            />
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke={isOverLimit ? "#f87171" : "#6EE7B7"}
              strokeWidth="3"
              strokeDasharray={`${(progressPercentage / 100) * 113.1} 113.1`}
              strokeLinecap="round"
              transform="rotate(-90 20 20)"
            />
            <text
              x="20"
              y="25"
              textAnchor="middle"
              fontSize="10"
              fill={isOverLimit ? "#f87171" : "#f0f0f3"}
              fontFamily="DM Sans"
              fontWeight="600"
            >
              {remainingChars}
            </text>
          </svg>
        </div>

        {/* Advanced Options Toggle */}
        <button style={styles.advancedToggle} onClick={() => setShowAdvanced(!showAdvanced)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span>{showAdvanced ? "Hide" : "Show"} advanced options</span>
        </button>

        {/* Advanced Options */}
        {showAdvanced && (
          <div style={styles.advancedOptions}>
            <input
              style={styles.advancedInput}
              type="text"
              placeholder="Tags (comma separated: python, ai, web3)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            
            <select
              style={styles.advancedSelect}
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
            >
              <option value="">Link to an event (optional)</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={styles.error}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.footerLeft}>
            <span style={styles.shortcutHint}>
              <kbd style={styles.kbd}>⌘</kbd> + <kbd style={styles.kbd}>Enter</kbd> to post
            </span>
          </div>
          <div style={styles.footerRight}>
            <button style={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button
              style={{
                ...styles.submitButton,
                ...(isPosting || isOverLimit || !content.trim() ? styles.submitButtonDisabled : {}),
              }}
              onClick={handleSubmit}
              disabled={isPosting || isOverLimit || !content.trim()}
            >
              {isPosting ? (
                <>
                  <span style={styles.spinner} />
                  Posting...
                </>
              ) : (
                "Post"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    width: '600px',
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflowY: 'auto',
    background: '#111114',
    border: '1px solid #1e1e24',
    borderRadius: '24px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
    animation: 'slideUp 0.3s ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid #1e1e24',
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontSize: '20px',
    fontWeight: 700,
    color: '#f0f0f3',
    margin: 0,
  },
  closeButton: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: '1px solid #1e1e24',
    borderRadius: '10px',
    color: '#5c5c6e',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      color: '#f87171',
      borderColor: '#f87171',
    },
  },
  postTypeSelector: {
    display: 'flex',
    gap: '8px',
    padding: '16px 24px',
    borderBottom: '1px solid #1e1e24',
  },
  postTypeButton: {
    padding: '8px 16px',
    background: '#17171b',
    border: '1px solid #1e1e24',
    borderRadius: '100px',
    color: '#5c5c6e',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      background: '#1e1e24',
    },
  },
  activePostType: {
    background: '#6EE7B7',
    borderColor: '#4fb88b',
    color: '#0c0c0f',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 24px',
  },
  userAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'rgba(110,231,183,0.1)',
    border: '2px solid rgba(110,231,183,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Syne', sans-serif",
    fontSize: '18px',
    fontWeight: 700,
    color: '#6EE7B7',
    overflow: 'hidden',
  },
  userAvatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  userName: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#f0f0f3',
  },
  userHandle: {
    fontSize: '13px',
    color: '#5c5c6e',
  },
  titleInput: {
    width: 'calc(100% - 48px)',
    margin: '0 24px 16px',
    padding: '12px 16px',
    background: '#17171b',
    border: '1px solid #1e1e24',
    borderRadius: '12px',
    color: '#f0f0f3',
    fontFamily: "'Syne', sans-serif",
    fontSize: '16px',
    fontWeight: 600,
    outline: 'none',
    transition: 'border-color 0.2s ease',
    ':focus': {
      borderColor: 'rgba(110,231,183,0.3)',
    },
  },
  textarea: {
    width: 'calc(100% - 48px)',
    margin: '0 24px',
    padding: '12px 16px',
    background: '#17171b',
    border: '1px solid #1e1e24',
    borderRadius: '12px',
    color: '#f0f0f3',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '15px',
    lineHeight: '1.6',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    ':focus': {
      borderColor: 'rgba(110,231,183,0.3)',
    },
  },
  counter: {
    display: 'flex',
    justifyContent: 'flex-end',
    margin: '12px 24px 0',
  },
  advancedToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '16px 24px',
    padding: '8px 12px',
    background: 'transparent',
    border: '1px solid #1e1e24',
    borderRadius: '8px',
    color: '#5c5c6e',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      color: '#6EE7B7',
      borderColor: 'rgba(110,231,183,0.3)',
    },
  },
  advancedOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    margin: '0 24px 16px',
  },
  advancedInput: {
    padding: '12px 16px',
    background: '#17171b',
    border: '1px solid #1e1e24',
    borderRadius: '10px',
    color: '#f0f0f3',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '14px',
    outline: 'none',
  },
  advancedSelect: {
    padding: '12px 16px',
    background: '#17171b',
    border: '1px solid #1e1e24',
    borderRadius: '10px',
    color: '#f0f0f3',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '14px',
    outline: 'none',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '0 24px 16px',
    padding: '12px 16px',
    background: 'rgba(248,113,113,0.1)',
    border: '1px solid rgba(248,113,113,0.2)',
    borderRadius: '10px',
    color: '#f87171',
    fontSize: '13px',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px 24px',
    borderTop: '1px solid #1e1e24',
  },
  footerLeft: {
    color: '#5c5c6e',
    fontSize: '13px',
  },
  shortcutHint: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  kbd: {
    padding: '2px 6px',
    background: '#1e1e24',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#f0f0f3',
  },
  footerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  cancelButton: {
    padding: '10px 20px',
    background: 'transparent',
    border: '1px solid #1e1e24',
    borderRadius: '100px',
    color: '#5c5c6e',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      background: '#17171b',
      color: '#f0f0f3',
    },
  },
  submitButton: {
    display: 'inlineFlex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 28px',
    background: '#6EE7B7',
    border: '1px solid #4fb88b',
    borderRadius: '100px',
    color: '#0c0c0f',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      background: '#86efac',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 20px rgba(110,231,183,0.3)',
    },
  },
  submitButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    pointerEvents: 'none',
    ':hover': {
      transform: 'none',
      boxShadow: 'none',
    },
  },
  spinner: {
    display: 'inlineBlock',
    width: '14px',
    height: '14px',
    border: '2px solid rgba(12,12,15,0.2)',
    borderTopColor: '#0c0c0f',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
  },
};

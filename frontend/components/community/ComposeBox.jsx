"use client";

import { useState, useRef, useEffect } from "react";

export default function ComposeBox({ user, events = [], onPost, onCancel, replyTo = null, postType = "post" }) {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [actualPostType, setActualPostType] = useState(postType);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef(null);

  const MAX_CHARS = 1000;
  const remainingChars = MAX_CHARS - content.length;
  const isOverLimit = remainingChars < 0;
  const isNearLimit = remainingChars < 100 && remainingChars >= 0;
  const progressPercentage = (content.length / MAX_CHARS) * 100;

  // FIXED: Check for is_organizer in profile
  const isAdmin = user?.is_staff || user?.is_superuser;
  const isOrganizer = user?.profile?.is_organizer || user?.is_organizer;
  const canPostAnnouncement = isAdmin || isOrganizer;
  const canPostResult = isAdmin || isOrganizer;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [content]);

  useEffect(() => {
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  }, []);

  const resetForm = () => {
    setContent("");
    setTitle("");
    setTags("");
    setSelectedEvent("");
    setError("");
  };

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
      const postData = {
        content: content.trim(),
        post_type: replyTo ? "post" : actualPostType,
        ...(title.trim() && { title: title.trim() }),
        ...(tags.trim() && {
          tags: tags.split(",").map(t => t.trim()).filter(Boolean)
        }),
        ...(selectedEvent && { event: parseInt(selectedEvent) }),
        ...(replyTo && { parent: replyTo.id }),
      };

      await onPost(postData);
      resetForm();
      onCancel?.();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Failed to post. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={styles.container}>
      {/* Reply Context */}
      {replyTo && (
        <div style={styles.replyContext}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
            <polyline points="9 14 4 9 9 4" />
            <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
          </svg>
          Replying to <span style={styles.replyUsername}>@{replyTo.author?.username}</span>
        </div>
      )}

      <div style={styles.composeArea}>
        {/* Avatar */}
        <div style={styles.avatar}>
          {user?.avatar ? (
            <img src={user.avatar} alt="" style={styles.avatarImg} />
          ) : (
            user?.username?.[0]?.toUpperCase() || "?"
          )}
        </div>

        {/* Editor */}
        <div style={styles.editor}>
          {/* Post Type Selector (for new posts only) */}
          {!replyTo && (
            <div style={styles.postTypeSelector}>
              <button
                style={{
                  ...styles.postTypeButton,
                  ...(actualPostType === "post" && styles.activePostType),
                }}
                onClick={() => setActualPostType("post")}
              >
                Post
              </button>
              
              {canPostAnnouncement && (
                <button
                  style={{
                    ...styles.postTypeButton,
                    ...(actualPostType === "announcement" && styles.activePostType),
                  }}
                  onClick={() => setActualPostType("announcement")}
                >
                  Announcement
                </button>
              )}
              
              {canPostResult && (
                <button
                  style={{
                    ...styles.postTypeButton,
                    ...(actualPostType === "result" && styles.activePostType),
                  }}
                  onClick={() => setActualPostType("result")}
                >
                  Results
                </button>
              )}
            </div>
          )}

          {/* Title Input (when advanced is open) */}
          {showAdvanced && (
            <input
              style={styles.titleInput}
              type="text"
              placeholder="Add a title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
            />
          )}

          {/* Main Textarea */}
          <textarea
            ref={textareaRef}
            style={styles.textarea}
            placeholder={
              replyTo
                ? `Write your reply to @${replyTo.author?.username}...`
                : actualPostType === "announcement"
                ? "Share an important announcement with the community..."
                : actualPostType === "result"
                ? "Announce the hackathon winners and results..."
                : "What's happening in the hackathon world?"
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={replyTo ? 2 : 3}
          />

          {/* Advanced Fields */}
          {showAdvanced && (
            <div style={styles.advancedFields}>
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
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
              {/* Advanced Toggle */}
              <button
                style={{
                  ...styles.advancedToggle,
                  ...(showAdvanced && styles.advancedToggleActive),
                }}
                onClick={() => setShowAdvanced(!showAdvanced)}
                title="Add title, tags, or link event"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>

              {/* Character Counter */}
              {content.length > 0 && (
                <div style={styles.counter}>
                  <svg width="30" height="30" viewBox="0 0 30 30">
                    <circle
                      cx="15"
                      cy="15"
                      r="13"
                      fill="none"
                      stroke="#1e1e24"
                      strokeWidth="2.5"
                    />
                    <circle
                      cx="15"
                      cy="15"
                      r="13"
                      fill="none"
                      stroke={
                        isOverLimit
                          ? "#f87171"
                          : isNearLimit
                          ? "#fbbf24"
                          : "#6EE7B7"
                      }
                      strokeWidth="2.5"
                      strokeDasharray={`${(progressPercentage / 100) * 81.68} 81.68`}
                      strokeLinecap="round"
                      transform="rotate(-90 15 15)"
                    />
                    {(isNearLimit || isOverLimit) && (
                      <text
                        x="15"
                        y="19"
                        textAnchor="middle"
                        fontSize="8"
                        fill={isOverLimit ? "#f87171" : "#fbbf24"}
                        fontFamily="DM Sans"
                      >
                        {remainingChars}
                      </text>
                    )}
                  </svg>
                </div>
              )}
            </div>

            <div style={styles.footerRight}>
              {onCancel && (
                <button style={styles.cancelButton} onClick={onCancel}>
                  Cancel
                </button>
              )}
              
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
                  replyTo ? "Reply" : "Post"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '16px 20px',
    borderBottom: '1px solid #1e1e24',
    background: '#111114',
  },
  replyContext: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '12px',
    paddingLeft: '52px',
    fontSize: '13px',
    color: '#5c5c6e',
  },
  replyUsername: {
    color: '#6EE7B7',
    fontWeight: 600,
  },
  composeArea: {
    display: 'flex',
    gap: '12px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(110,231,183,0.1)',
    border: '1.5px solid rgba(110,231,183,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Syne', sans-serif",
    fontSize: '14px',
    fontWeight: 700,
    color: '#6EE7B7',
    flexShrink: 0,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  editor: {
    flex: 1,
    minWidth: 0,
  },
  postTypeSelector: {
    display: 'flex',
    gap: '6px',
    marginBottom: '12px',
  },
  postTypeButton: {
    padding: '6px 14px',
    background: '#17171b',
    // FIXED: Use separate border properties instead of shorthand
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#1e1e24',
    borderRadius: '100px',
    color: '#5c5c6e',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  activePostType: {
    background: '#6EE7B7',
    // FIXED: Only override borderColor, not the whole border
    borderColor: '#4fb88b',
    color: '#0c0c0f',
  },
  titleInput: {
    width: '100%',
    padding: '8px 0',
    marginBottom: '8px',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #1e1e24',
    color: '#f0f0f3',
    fontFamily: "'Syne', sans-serif",
    fontSize: '16px',
    fontWeight: 600,
    outline: 'none',
  },
  textarea: {
    width: '100%',
    padding: '8px 0',
    background: 'transparent',
    border: 'none',
    color: '#f0f0f3',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '15px',
    lineHeight: '1.6',
    resize: 'none',
    outline: 'none',
  },
  advancedFields: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #1e1e24',
  },
  advancedInput: {
    padding: '8px 12px',
    background: '#17171b',
    border: '1px solid #1e1e24',
    borderRadius: '8px',
    color: '#f0f0f3',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '13px',
    outline: 'none',
  },
  advancedSelect: {
    padding: '8px 12px',
    background: '#17171b',
    border: '1px solid #1e1e24',
    borderRadius: '8px',
    color: '#f0f0f3',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '13px',
    outline: 'none',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '10px',
    padding: '8px 12px',
    background: 'rgba(248,113,113,0.1)',
    border: '1px solid rgba(248,113,113,0.2)',
    borderRadius: '8px',
    color: '#f87171',
    fontSize: '13px',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #1e1e24',
  },
  footerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  advancedToggle: {
    width: '34px',
    height: '34px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#1e1e24',
    borderRadius: '8px',
    color: '#5c5c6e',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  advancedToggleActive: {
    color: '#6EE7B7',
    borderColor: 'rgba(110,231,183,0.3)',
    background: 'rgba(110,231,183,0.05)',
  },
  counter: {
    position: 'relative',
    width: '30px',
    height: '30px',
  },
  footerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  cancelButton: {
    padding: '8px 18px',
    background: 'transparent',
    border: '1px solid #1e1e24',
    borderRadius: '100px',
    color: '#5c5c6e',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  submitButton: {
    display: 'inlineFlex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 24px',
    background: '#6EE7B7',
    border: '1px solid #4fb88b',
    borderRadius: '100px',
    color: '#0c0c0f',
    fontSize: '13.5px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  submitButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    pointerEvents: 'none',
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

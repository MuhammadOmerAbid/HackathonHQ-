"use client";

export default function CommunitySidebar({
  user,
  trendingTags = [],
  suggestedUsers = [],
  liveEvents = [],
  upcomingEvents = [],
  onTagClick,
  onUserClick,
}) {
  return (
    <div style={styles.sidebar}>
      {/* Live Events */}
      {liveEvents.length > 0 && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.liveDot} />
            <h3 style={styles.cardTitle}>Live Now</h3>
          </div>
          <div style={styles.eventList}>
            {liveEvents.map((event) => (
              <div key={event.id} style={styles.eventItem}>
                <div style={styles.eventName}>{event.name}</div>
                <div style={styles.eventMeta}>
                  Ends {new Date(event.end_date || event.end).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Tags */}
      {trendingTags.length > 0 && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Trending Tags</h3>
          <div style={styles.tagsList}>
            {trendingTags.map((tag, index) => (
              <button
                key={tag.tag || tag}
                style={styles.tagButton}
                onClick={() => onTagClick?.(tag.tag || tag)}
              >
                <span style={styles.tagName}>#{tag.tag || tag}</span>
                {tag.count && <span style={styles.tagCount}>{tag.count}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Users */}
      {suggestedUsers.length > 0 && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Suggested</h3>
          <div style={styles.userList}>
            {suggestedUsers.map((suggestedUser) => (
              <div key={suggestedUser.id} style={styles.userRow}>
                <div style={styles.userAvatar} onClick={() => onUserClick?.(suggestedUser)}>
                  {suggestedUser.avatar ? (
                    <img src={suggestedUser.avatar} alt="" style={styles.userAvatarImg} />
                  ) : (
                    suggestedUser.username?.[0]?.toUpperCase()
                  )}
                </div>
                <div style={styles.userInfo} onClick={() => onUserClick?.(suggestedUser)}>
                  <div style={styles.userName}>{suggestedUser.username}</div>
                  <div style={styles.userStats}>
                    {suggestedUser.posts_count || 0} posts
                  </div>
                </div>
                {user && suggestedUser.id !== user.id && (
                  <button style={styles.followButton}>
                    Follow
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Upcoming</h3>
          <div style={styles.eventList}>
            {upcomingEvents.map((event) => (
              <div key={event.id} style={styles.eventItem}>
                <div style={styles.eventName}>{event.name}</div>
                <div style={styles.eventMeta}>
                  {new Date(event.start_date || event.start).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.footerLinks}>
          <a href="#" style={styles.footerLink}>About</a>
          <span style={styles.footerDot}>•</span>
          <a href="#" style={styles.footerLink}>Guidelines</a>
          <span style={styles.footerDot}>•</span>
          <a href="#" style={styles.footerLink}>Support</a>
        </div>
        <p style={styles.copyright}>© 2024 HackForge Community</p>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    position: 'sticky',
    top: '24px',
    height: 'fit-content',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  card: {
    background: '#111114',
    border: '1px solid #1e1e24',
    borderRadius: '18px',
    padding: '20px',
    backdropFilter: 'blur(10px)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  cardTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: '15px',
    fontWeight: 700,
    color: '#f0f0f3',
    margin: 0,
  },
  liveDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#6EE7B7',
    boxShadow: '0 0 12px rgba(110,231,183,0.8)',
    animation: 'pulse 2s infinite',
  },
  eventList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  eventItem: {
    padding: '8px 0',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    borderBottom: '1px solid rgba(30,30,36,0.5)',
    ':last-child': {
      borderBottom: 'none',
    },
    ':hover': {
      '& $eventName': {
        color: '#6EE7B7',
      },
    },
  },
  eventName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#f0f0f3',
    marginBottom: '4px',
  },
  eventMeta: {
    fontSize: '11px',
    color: '#888',
  },
  tagsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  tagButton: {
    display: 'inlineFlex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 14px',
    background: '#17171b',
    border: '1px solid #1e1e24',
    borderRadius: '100px',
    color: '#888',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      background: 'rgba(110,231,183,0.08)',
      borderColor: 'rgba(110,231,183,0.3)',
      color: '#6EE7B7',
    },
  },
  tagName: {
    fontWeight: 500,
  },
  tagCount: {
    fontSize: '10px',
    color: '#5c5c6e',
    marginLeft: '2px',
  },
  userList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(110,231,183,0.08)',
    border: '1px solid rgba(110,231,183,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Syne', sans-serif",
    fontSize: '14px',
    fontWeight: 700,
    color: '#6EE7B7',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.2s ease',
    overflow: 'hidden',
    ':hover': {
      background: 'rgba(110,231,183,0.15)',
    },
  },
  userAvatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
    cursor: 'pointer',
  },
  userName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#f0f0f3',
    marginBottom: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userStats: {
    fontSize: '11px',
    color: '#888',
  },
  followButton: {
    padding: '5px 12px',
    background: 'transparent',
    border: '1px solid #6EE7B7',
    borderRadius: '100px',
    color: '#6EE7B7',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      background: '#6EE7B7',
      color: '#0c0c0f',
    },
  },
  footer: {
    padding: '16px',
    textAlign: 'center',
  },
  footerLinks: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '8px',
    flexWrap: 'wrap',
  },
  footerLink: {
    fontSize: '11px',
    color: '#5c5c6e',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
    ':hover': {
      color: '#6EE7B7',
    },
  },
  footerDot: {
    color: '#3a3a48',
    fontSize: '11px',
  },
  copyright: {
    fontSize: '10px',
    color: '#3a3a48',
    margin: 0,
  },
};

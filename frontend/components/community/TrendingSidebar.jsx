// "use client";

// export default function TrendingSidebar({
//   trendingTags = [],
//   suggestedUsers = [],
//   upcomingEvents = [],
//   onTagClick,
//   onUserClick,
//   onMessageClick,
// }) {
//   return (
//     <div style={styles.sidebar}>
//       {/* Trending Tags */}
//       <div style={styles.card}>
//         <div style={styles.cardHeader}>
//           <h3 style={styles.cardTitle}>🔥 Trending Tags</h3>
//         </div>
//         <div style={styles.tagsList}>
//           {trendingTags.map((tag, index) => (
//             <button
//               key={tag.tag || tag}
//               style={styles.tagButton}
//               onClick={() => onTagClick?.(tag.tag || tag)}
//             >
//               <span style={styles.tagName}>#{tag.tag || tag}</span>
//               {tag.count && <span style={styles.tagCount}>{tag.count}</span>}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Suggested Users */}
//       {suggestedUsers.length > 0 && (
//         <div style={styles.card}>
//           <div style={styles.cardHeader}>
//             <h3 style={styles.cardTitle}>👥 Suggested Users</h3>
//           </div>
//           <div style={styles.usersList}>
//             {suggestedUsers.map((user) => (
//               <div key={user.id} style={styles.userRow}>
//                 <div style={styles.userAvatar} onClick={() => onUserClick?.(user)}>
//                   {user.username?.[0]?.toUpperCase()}
//                 </div>
//                 <div style={styles.userInfo} onClick={() => onUserClick?.(user)}>
//                   <div style={styles.userName}>{user.username}</div>
//                   <div style={styles.userStats}>
//                     {user.posts_count || 0} posts
//                   </div>
//                 </div>
//                 <button
//                   style={styles.messageButton}
//                   onClick={() => onMessageClick?.(user)}
//                   title={`Message ${user.username}`}
//                 >
//                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                     <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
//                   </svg>
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Upcoming Events */}
//       {upcomingEvents.length > 0 && (
//         <div style={styles.card}>
//           <div style={styles.cardHeader}>
//             <h3 style={styles.cardTitle}>📅 Upcoming Events</h3>
//           </div>
//           <div style={styles.eventsList}>
//             {upcomingEvents.map((event) => (
//               <div key={event.id} style={styles.eventItem}>
//                 <div style={styles.eventName}>{event.name}</div>
//                 <div style={styles.eventDate}>
//                   {new Date(event.start_date || event.start).toLocaleDateString("en-US", {
//                     month: "short",
//                     day: "numeric",
//                   })}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Footer */}
//       <div style={styles.footer}>
//         <p style={styles.footerText}>
//           © 2024 HackForge Community
//         </p>
//         <div style={styles.footerLinks}>
//           <a href="#" style={styles.footerLink}>Guidelines</a>
//           <a href="#" style={styles.footerLink}>Support</a>
//           <a href="#" style={styles.footerLink}>API</a>
//         </div>
//       </div>
//     </div>
//   );
// }

// const styles = {
//   sidebar: {
//     position: 'sticky',
//     top: '24px',
//     height: 'fit-content',
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '16px',
//   },
//   card: {
//     background: '#111114',
//     border: '1px solid #1e1e24',
//     borderRadius: '20px',
//     padding: '20px',
//   },
//   cardHeader: {
//     marginBottom: '16px',
//   },
//   cardTitle: {
//     fontFamily: "'Syne', sans-serif",
//     fontSize: '16px',
//     fontWeight: 700,
//     color: '#f0f0f3',
//     margin: 0,
//   },
//   tagsList: {
//     display: 'flex',
//     flexWrap: 'wrap',
//     gap: '8px',
//   },
//   tagButton: {
//     display: 'inlineFlex',
//     alignItems: 'center',
//     gap: '6px',
//     padding: '6px 14px',
//     background: '#17171b',
//     border: '1px solid #1e1e24',
//     borderRadius: '100px',
//     color: '#888',
//     fontSize: '13px',
//     fontWeight: 500,
//     cursor: 'pointer',
//     transition: 'all 0.2s ease',
//     ':hover': {
//       color: '#6EE7B7',
//       borderColor: 'rgba(110,231,183,0.3)',
//       background: 'rgba(110,231,183,0.04)',
//     },
//   },
//   tagName: {
//     fontWeight: 500,
//   },
//   tagCount: {
//     fontSize: '11px',
//     color: '#5c5c6e',
//   },
//   usersList: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '12px',
//   },
//   userRow: {
//     display: 'flex',
//     alignItems: 'center',
//     gap: '12px',
//     padding: '4px 0',
//   },
//   userAvatar: {
//     width: '40px',
//     height: '40px',
//     borderRadius: '50%',
//     background: 'rgba(110,231,183,0.08)',
//     border: '1px solid rgba(110,231,183,0.15)',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     fontFamily: "'Syne', sans-serif",
//     fontSize: '14px',
//     fontWeight: 700,
//     color: '#6EE7B7',
//     cursor: 'pointer',
//     flexShrink: 0,
//     transition: 'all 0.2s ease',
//     ':hover': {
//       background: 'rgba(110,231,183,0.15)',
//     },
//   },
//   userInfo: {
//     flex: 1,
//     minWidth: 0,
//     cursor: 'pointer',
//   },
//   userName: {
//     fontSize: '14px',
//     fontWeight: 600,
//     color: '#f0f0f3',
//     marginBottom: '2px',
//     whiteSpace: 'nowrap',
//     overflow: 'hidden',
//     textOverflow: 'ellipsis',
//   },
//   userStats: {
//     fontSize: '11px',
//     color: '#5c5c6e',
//   },
//   messageButton: {
//     width: '32px',
//     height: '32px',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     background: 'transparent',
//     border: '1px solid #1e1e24',
//     borderRadius: '8px',
//     color: '#5c5c6e',
//     cursor: 'pointer',
//     flexShrink: 0,
//     transition: 'all 0.2s ease',
//     ':hover': {
//       color: '#6EE7B7',
//       borderColor: 'rgba(110,231,183,0.3)',
//       background: 'rgba(110,231,183,0.04)',
//     },
//   },
//   eventsList: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '8px',
//   },
//   eventItem: {
//     padding: '8px 0',
//     cursor: 'pointer',
//     transition: 'all 0.2s ease',
//     ':hover': {
//       '& $eventName': {
//         color: '#6EE7B7',
//       },
//     },
//   },
//   eventName: {
//     fontSize: '13px',
//     fontWeight: 600,
//     color: '#f0f0f3',
//     marginBottom: '4px',
//   },
//   eventDate: {
//     fontSize: '11px',
//     color: '#5c5c6e',
//   },
//   footer: {
//     padding: '16px',
//     textAlign: 'center',
//   },
//   footerText: {
//     fontSize: '11px',
//     color: '#3a3a48',
//     marginBottom: '8px',
//   },
//   footerLinks: {
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: '16px',
//   },
//   footerLink: {
//     fontSize: '11px',
//     color: '#5c5c6e',
//     textDecoration: 'none',
//     transition: 'color 0.2s ease',
//     ':hover': {
//       color: '#6EE7B7',
//     },
//   },
// };
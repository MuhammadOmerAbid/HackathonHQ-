"use client";

import { useRouter } from "next/navigation";

export default function CommunitySidebar({ events = [], trending = [], topUsers = [], onTagClick }) {
  const router = useRouter();

  const now = new Date();
  const liveEvents = events.filter(ev => {
    const s = new Date(ev.start_date || ev.start);
    const e = new Date(ev.end_date   || ev.end);
    return s <= now && e >= now;
  }).slice(0, 3);

  const upcomingEvents = events.filter(ev => {
    const s = new Date(ev.start_date || ev.start);
    return s > now;
  }).slice(0, 2);

  return (
    <aside className="cs-sidebar">

      {/* Live Events */}
      {liveEvents.length > 0 && (
        <div className="cs-panel">
          <h3 className="cs-panel-title">
            <span className="cs-live-dot" />
            Live Now
          </h3>
          {liveEvents.map(ev => (
            <div key={ev.id} className="cs-event-item" onClick={() => router.push(`/events/${ev.id}`)}>
              <div className="cs-event-name">{ev.name}</div>
              <div className="cs-event-meta">
                Ends {new Date(ev.end_date || ev.end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming */}
      {upcomingEvents.length > 0 && (
        <div className="cs-panel">
          <h3 className="cs-panel-title">Upcoming Events</h3>
          {upcomingEvents.map(ev => (
            <div key={ev.id} className="cs-event-item upcoming" onClick={() => router.push(`/events/${ev.id}`)}>
              <div className="cs-event-name">{ev.name}</div>
              <div className="cs-event-meta">
                Starts {new Date(ev.start_date || ev.start).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trending tags */}
      {trending.length > 0 && (
        <div className="cs-panel">
          <h3 className="cs-panel-title">Trending Tags</h3>
          <div className="cs-tags-cloud">
            {trending.map((t, i) => (
              <button key={t.tag || t} className={`cs-trend-tag size-${Math.min(i, 4)}`} onClick={() => onTagClick?.(t.tag || t)}>
                #{t.tag || t}
                {t.count && <span className="cs-trend-count">{t.count}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Top contributors */}
      {topUsers.length > 0 && (
        <div className="cs-panel">
          <h3 className="cs-panel-title">Top Contributors</h3>
          {topUsers.slice(0, 5).map((u, i) => (
            <div key={u.id} className="cs-user-row" onClick={() => router.push(`/users/${u.id}`)}>
              <span className="cs-user-rank">#{i + 1}</span>
              <div className="cs-user-avatar">{u.username?.[0]?.toUpperCase()}</div>
              <div className="cs-user-info">
                <div className="cs-user-name">{u.username}</div>
                <div className="cs-user-stat">{u.posts_count || 0} posts · {u.likes_received || 0} likes</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .cs-sidebar { display: flex; flex-direction: column; gap: 14px; }
        .cs-panel {
          background: #111114; border: 1px solid #1e1e24; border-radius: 14px;
          padding: 18px; overflow: hidden;
        }
        .cs-panel-title {
          display: flex; align-items: center; gap: 7px;
          font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
          color: #f0f0f3; margin: 0 0 14px; letter-spacing: -0.2px;
        }
        .cs-live-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #6EE7B7;
          box-shadow: 0 0 8px rgba(110,231,183,0.6); animation: pulse 2s infinite;
          flex-shrink: 0;
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

        /* Events */
        .cs-event-item {
          padding: 10px 12px; border-radius: 10px; cursor: pointer;
          transition: all .15s; border: 1px solid transparent; margin-bottom: 6px;
        }
        .cs-event-item:last-child { margin-bottom: 0; }
        .cs-event-item:hover { background: #17171b; border-color: rgba(110,231,183,0.15); }
        .cs-event-item.upcoming:hover { border-color: rgba(251,191,36,0.15); }
        .cs-event-name { font-size: 13px; font-weight: 600; color: #f0f0f3; margin-bottom: 3px; }
        .cs-event-meta { font-size: 11.5px; color: #5c5c6e; }

        /* Tags */
        .cs-tags-cloud { display: flex; flex-wrap: wrap; gap: 6px; }
        .cs-trend-tag {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 11px; border-radius: 100px; font-size: 12.5px; font-weight: 500;
          background: #17171b; border: 1px solid #1e1e24; color: #888;
          cursor: pointer; transition: all .15s; font-family: 'DM Sans', sans-serif;
        }
        .cs-trend-tag:hover { color: #6EE7B7; background: rgba(110,231,183,0.06); border-color: rgba(110,231,183,0.2); }
        .cs-trend-tag.size-0 { font-size: 13.5px; color: #6EE7B7; background: rgba(110,231,183,0.06); border-color: rgba(110,231,183,0.15); }
        .cs-trend-tag.size-1 { font-size: 13px; color: #aaa; }
        .cs-trend-count { font-size: 10px; color: #3a3a48; }

        /* Users */
        .cs-user-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; cursor: pointer; border-radius: 8px; transition: all .15s; }
        .cs-user-row:hover .cs-user-name { color: #6EE7B7; }
        .cs-user-rank { font-size: 12px; font-weight: 700; color: #3a3a48; min-width: 20px; }
        .cs-user-avatar {
          width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
          background: rgba(110,231,183,0.08); border: 1px solid rgba(110,231,183,0.15);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; color: #6EE7B7;
        }
        .cs-user-name { font-size: 13px; font-weight: 600; color: #f0f0f3; transition: color .15s; }
        .cs-user-stat { font-size: 11px; color: #5c5c6e; }
      `}</style>
    </aside>
  );
}
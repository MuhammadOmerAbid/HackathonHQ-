// components/teams/TeamCard.jsx - Compact Version
import Link from "next/link";

export default function TeamCard({ team, user }) {
  const memberCount = team.members?.length || 0;
  const maxMembers = team.max_members || 4;
  const isFull = memberCount >= maxMembers;
  const leaderUser = team.leader_details || team.leader;
  const isLeader = user && (team.leader_details?.id ?? team.leader) === user.id;
  const isMember = user && team.members?.some((m) => m.id === user.id);

  const statusColors = {
    open: { bg: "rgba(110,231,183,0.12)", text: "#6EE7B7", border: "rgba(110,231,183,0.25)" },
    full: { bg: "rgba(248,113,113,0.12)", text: "#f87171", border: "rgba(248,113,113,0.25)" }
  };

  const statusColor = statusColors[isFull ? "full" : "open"];

  return (
    <Link href={`/teams/${team.id}`} className="team-card-link">
      <div className="team-card">
        <div className="card-gradient" />
        
        <div className="card-content">
          {/* Header - Compact */}
          <div className="team-header">
            <div className="team-avatar">
              {team.name.charAt(0).toUpperCase()}
            </div>
            <div className="team-info">
              <h3 className="team-name">{team.name}</h3>
              <p className="team-event">{team.event?.name || "Hackathon Team"}</p>
            </div>
          </div>

          {/* Status Badge - Moved to top right via absolute positioning */}
          <span 
            className="team-status"
            style={{ 
              background: statusColor.bg,
              color: statusColor.text,
              borderColor: statusColor.border
            }}
          >
            {isFull ? "Full" : "Open"}
          </span>

          {/* Description - Compact */}
          <p className="team-description">
            {team.description?.substring(0, 80) || "No description"}
            {team.description?.length > 80 ? "..." : ""}
          </p>

          {/* Members - Compact row instead of section */}
          <div className="team-members-row">
            <div className="member-avatars">
              {team.members?.slice(0, 3).map((member, idx) => (
                <div key={member.id ?? idx} className="member-avatar" title={member.username}>
                  {member.avatar ? <img src={member.avatar} alt="" /> : member.username?.charAt(0).toUpperCase() || "?"}
                </div>
              ))}
              {memberCount > 3 && (
                <div className="member-avatar more">+{memberCount - 3}</div>
              )}
            </div>
            <span className="members-count">{memberCount}/{maxMembers}</span>
          </div>

          {/* Footer - Compact */}
          <div className="team-footer">
            <span className="leader-name">{leaderUser?.username || "Unknown"}</span>
            {isLeader && <span className="team-badge leader">Leader</span>}
            {isMember && !isLeader && <span className="team-badge member">Member</span>}
          </div>
        </div>
      </div>

      <style jsx>{`
        .team-card-link {
          text-decoration: none;
          display: block;
        }

        .team-card {
          position: relative;
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 14px;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .team-card:hover {
          transform: translateY(-2px);
          border-color: rgba(110,231,183,0.3);
        }

        .card-gradient {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at top right,
            rgba(110,231,183,0.1),
            transparent 70%
          );
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }

        .team-card:hover .card-gradient {
          opacity: 1;
        }

        .card-content {
          position: relative;
          z-index: 1;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Header */
        .team-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-right: 70px; /* Make room for absolute status badge */
        }

        .team-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(110,231,183,0.1);
          border: 1px solid rgba(110,231,183,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #6EE7B7;
          flex-shrink: 0;
        }

        .team-info {
          flex: 1;
          min-width: 0;
        }

        .team-name {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #f0f0f3;
          margin: 0 0 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .team-event {
          font-size: 11px;
          color: #888;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Status Badge - Absolute positioned */
        .team-status {
          position: absolute;
          top: 16px;
          right: 16px;
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 600;
          border: 1px solid;
          white-space: nowrap;
        }

        /* Description */
        .team-description {
          font-size: 12px;
          color: #b0b0ba;
          line-height: 1.5;
          margin: 0;
        }

        /* Members Row */
        .team-members-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
          border-top: 1px solid #1e1e24;
          border-bottom: 1px solid #1e1e24;
        }

        .member-avatars {
          display: flex;
          align-items: center;
        }

        .member-avatar {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: rgba(110,231,183,0.08);
          border: 1px solid rgba(110,231,183,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          color: #6EE7B7;
          margin-right: -6px; /* Overlap effect */
          overflow: hidden;
        }

        .member-avatar:first-child {
          margin-left: 0;
        }

        .member-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .member-avatar.more {
          background: #1e1e24;
          color: #888;
          font-size: 9px;
          border-color: #1e1e24;
        }

        .members-count {
          font-size: 11px;
          color: #6EE7B7;
          font-weight: 500;
        }

        /* Footer */
        .team-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .leader-name {
          font-size: 12px;
          color: #6EE7B7;
          font-weight: 500;
        }

        .team-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 100px;
          font-size: 9px;
          font-weight: 600;
          border: 1px solid;
        }

        .team-badge.leader {
          background: rgba(110,231,183,0.12);
          color: #6EE7B7;
          border-color: rgba(110,231,183,0.25);
        }

        .team-badge.member {
          background: rgba(96,165,250,0.12);
          color: #60a5fa;
          border-color: rgba(96,165,250,0.25);
        }
      `}</style>
    </Link>
  );
}
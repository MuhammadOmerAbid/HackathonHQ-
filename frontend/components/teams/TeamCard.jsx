  // components/teams/TeamCard.jsx
  // Reusable card — uses tm-* classes injected by the parent page.
  // Import and render inside the tm-grid on the Teams list page.

  import Link from "next/link";

  export default function TeamCard({ team, user }) {
    const memberCount = team.members?.length || 0;
    const maxMembers = team.max_members || 4;
    const isFull = memberCount >= maxMembers;
    // leader is a raw ID integer from the API; leader_details is the full user object
    const leaderUser = team.leader_details || team.leader;
    const isLeader = user && (team.leader_details?.id ?? team.leader) === user.id;
    const isMember = user && team.members?.some((m) => m.id === user.id);

    return (
      <Link href={`/teams/${team.id}`} className="tm-card-link">
        <div className="tm-card radial-card">
          {/* Top row */}
          <div className="tm-card-top">
            <div className="tm-card-avatar">
              {team.name.charAt(0).toUpperCase()}
            </div>
            <div className="tm-card-info">
              <p className="tm-card-name">{team.name}</p>
              <p className="tm-card-event">{team.event?.name || "Hackathon Team"}</p>
            </div>
            <span className={`tm-card-status ${isFull ? "full" : "open"}`}>
              {isFull ? "Full" : "Open"}
            </span>
          </div>

          {/* Description */}
          <p className="tm-card-desc">
            {team.description || "No description provided."}
          </p>

          {/* Members row */}
          <div className="tm-card-members">
            <div className="tm-pip-stack">
              {team.members?.slice(0, 4).map((member, idx) => (
                <div
                  key={member.id ?? idx}
                  className="tm-pip"
                  style={{ zIndex: 4 - idx }}
                  title={member.username}
                >
                  {member.avatar ? <img src={member.avatar} alt="" /> : (member.username?.charAt(0).toUpperCase() || "?")}
                </div>
              ))}
              {memberCount > 4 && (
                <div className="tm-pip tm-pip-more">+{memberCount - 4}</div>
              )}
            </div>
            <span className="tm-members-count">
              {memberCount}/{maxMembers} members
            </span>
          </div>

          {/* Footer */}
          <div className="tm-card-footer">
            <div className="tm-leader">
              <span className="tm-leader-label">Led by</span>
              <span className="tm-leader-name">{leaderUser?.username || "Unknown"}</span>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {isLeader && <span className="tm-badge tm-badge-leader">Leader</span>}
              {isMember && !isLeader && <span className="tm-badge tm-badge-member">Member</span>}
            </div>
          </div>
        </div>
      </Link>
    );
  }

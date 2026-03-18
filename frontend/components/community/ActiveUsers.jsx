"use client";

import { useRouter } from "next/navigation";

export default function ActiveUsers({ users = [], loading = false }) {
  const router = useRouter();
  

  return (
    <div className="active-users-card">
      <h3>Active Now</h3>
      <div className="active-users-row">
        {loading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div key={`active-skel-${idx}`} className="active-user skeleton">
                <div className="active-user-avatar-wrap">
                  <div className="active-user-avatar skeleton-circle" />
                </div>
                <span className="active-user-name skeleton-line" />
              </div>
            ))
          : users.slice(0, 10).map(user => (
              <div 
                key={user.id} 
                className="active-user"
                onClick={() => router.push(`/users/${user.id}`)}
              >
                <div className="active-user-avatar-wrap">
                  <div className="active-user-avatar">
                    {user.avatar ? <img src={user.avatar} alt="" /> : user.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="active-indicator"></span>
                </div>
                <span className="active-user-name">{user.username}</span>
              </div>
            ))}
      </div>

      <style jsx>{`
        .active-users-card {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 18px;
          padding: 20px;
        }
        .active-users-card h3 {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #f0f0f3;
          margin: 0 0 16px 0;
        }
        .active-users-row {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          padding-bottom: 4px;
          scroll-behavior: smooth;
        }
        .active-users-row::-webkit-scrollbar {
          height: 6px;
        }
        .active-users-row::-webkit-scrollbar-track {
          background: #151519;
          border-radius: 6px;
        }
        .active-users-row::-webkit-scrollbar-thumb {
          background: #26262e;
          border-radius: 6px;
        }
        .active-users-row::-webkit-scrollbar-thumb:hover {
          background: rgba(110,231,183,0.4);
        }
        .active-users-row {
          scrollbar-width: thin;
          scrollbar-color: #26262e #151519;
        }
        .active-user {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: transform 0.2s ease;
          min-width: 64px;
        }
        .active-user:hover {
          transform: translateY(-2px);
        }
        .active-user:hover .active-user-name {
          color: #6EE7B7;
        }
        .active-user-avatar-wrap {
          position: relative;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
        }
        .active-user-avatar {
          position: relative;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(110,231,183,0.12);
          border: 2px solid rgba(110,231,183,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #6EE7B7;
          overflow: hidden;
        }
        .active-user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          display: block;
          position: relative;
          z-index: 1;
        }
        .active-indicator {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #6EE7B7;
          border: 2px solid #111114;
          box-shadow: 0 0 8px rgba(110,231,183,0.8);
          z-index: 2;
        }
        .active-user-name {
          display: block;
          font-size: 11px;
          color: #888;
          text-align: center;
          max-width: 64px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .skeleton-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(90deg, #17171b 25%, #1f1f26 37%, #17171b 63%);
          background-size: 400% 100%;
          animation: shimmer 1.6s infinite;
          border: 1px solid #1e1e24;
        }
        .skeleton-line {
          width: 52px;
          height: 8px;
          border-radius: 6px;
          background: linear-gradient(90deg, #17171b 25%, #1f1f26 37%, #17171b 63%);
          background-size: 400% 100%;
          animation: shimmer 1.6s infinite;
        }
        .active-user.skeleton {
          cursor: default;
          pointer-events: none;
        }
        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}</style>
    </div>
  );
}

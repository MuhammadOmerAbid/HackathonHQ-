"use client";

import { useRouter } from "next/navigation";

export default function ActiveUsers({ users = [] }) {
  const router = useRouter();
  

  return (
    <div className="active-users-card">
      <h3>Active Now</h3>
      <div className="active-users-grid">
        {users.slice(0, 6).map(user => (
          <div 
            key={user.id} 
            className="active-user"
            onClick={() => router.push(`/users/${user.id}`)}
          >
            <div className="active-user-avatar">
              {user.username?.[0]?.toUpperCase()}
              <span className="active-indicator"></span>
            </div>
            <span className="active-user-name">{user.username}</span>
          </div>
        ))}
      </div>
      <button className="view-all-btn">View all</button>

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
        .active-users-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }
        .active-user {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .active-user:hover {
          transform: translateY(-2px);
        }
        .active-user:hover .active-user-name {
          color: #6EE7B7;
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
        }
        .active-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #6EE7B7;
          border: 2px solid #111114;
          box-shadow: 0 0 8px rgba(110,231,183,0.8);
        }
        .active-user-name {
          font-size: 11px;
          color: #888;
          text-align: center;
          max-width: 64px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .view-all-btn {
          width: 100%;
          padding: 10px;
          background: transparent;
          border: 1px solid #1e1e24;
          border-radius: 100px;
          color: #888;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .view-all-btn:hover {
          border-color: #6EE7B7;
          color: #6EE7B7;
        }
      `}</style>
    </div>
  );
}
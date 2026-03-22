"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../utils/axios";
import LoadingSpinner from "@/components/LoadingSpinner";
import UserCard from "../../components/users/UserCard";
import UserSearch from "../../components/users/UserSearch";
import UserFilters from "../../components/users/UserFilters";
import { useMessaging } from "@/context/MessagingContext";

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [currentUser, setCurrentUser] = useState(null);
  const { openChat } = useMessaging();
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
    totalPages: 1
  });

  const [filterCounts, setFilterCounts] = useState({
    all: 0,
    following: 0,
    admins: 0,
    organizers: 0,
    judges: 0
  });

  const fetchUsers = async (pageUrl = null) => {
    if (pageUrl) {
      setLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const url = pageUrl || "/users/directory/";
      const res = await api.get(url);
      console.log("Raw API response:", res.data);

      const usersArray = res.data.results || [];
      const activeUsers = usersArray.filter(user => user.is_active);
      
      if (pageUrl) {
        setUsers(prev => [...prev, ...activeUsers]);
      } else {
        setUsers(activeUsers);
      }

      setPagination({
        count: res.data.count || 0,
        next: res.data.next,
        previous: res.data.previous,
        currentPage: pageUrl ? pagination.currentPage + 1 : 1,
        totalPages: res.data.count ? Math.ceil(res.data.count / 20) : 1
      });

      // Update filter counts
      setFilterCounts({
        all: res.data.count || 0,
        following: activeUsers.filter(u => u.is_following).length,
        admins: activeUsers.filter(u => u.is_staff).length,
        organizers: activeUsers.filter(u => u.is_organizer).length,
        judges: activeUsers.filter(u => u.is_judge).length
      });

    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await api.get("/users/me/");
        setCurrentUser(res.data);
      } catch (err) {
        console.error("Error fetching current user:", err);
      }
    };
    
    fetchCurrentUser();
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.organization_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply role filter
    switch (activeFilter) {
      case "following":
        filtered = filtered.filter(u => u.is_following);
        break;
      case "admins":
        filtered = filtered.filter(u => u.is_staff);
        break;
      case "organizers":
        filtered = filtered.filter(u => u.is_organizer);
        break;
      case "judges":
        filtered = filtered.filter(u => u.is_judge);
        break;
      default:
        break;
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, activeFilter]);

  const loadMore = () => {
    if (pagination.next) {
      fetchUsers(pagination.next);
    }
  };

  const handleFollow = async (userId, isFollowing) => {
    setUsers(prev => prev.map(u => 
      u.id === userId 
        ? { ...u, is_following: isFollowing }
        : u
    ));
  };

  const handleMessage = (user) => {
    openChat(user);
  };

  const stats = {
    total: pagination.count,
    admins: users.filter(u => u.is_staff).length,
    organizers: users.filter(u => u.is_organizer).length,
    judges: users.filter(u => u.is_judge).length,
    online: users.filter(u => u.is_active).length
  };

  if (isLoading && users.length === 0) {
    return <LoadingSpinner message="Loading users..." />;
  }

  return (
    <div className="users-page">
      {/* Background Blobs */}
      <div className="blob blob1" aria-hidden="true"></div>
      <div className="blob blob2" aria-hidden="true"></div>
      <div className="blob blob3" aria-hidden="true"></div>

      <div className="users-container">
        {/* Header */}
        <div className="users-header">
          <div>
            <div className="users-eyebrow">
              <span className="users-eyebrow-dot" />
              <span className="users-eyebrow-label">Community</span>
            </div>
            <h1 className="users-title">Users</h1>
            <p className="users-subtitle">Connect with fellow hackers, organizers, and judges</p>
          </div>
          <div className="users-header-right">
            <button
              onClick={() => setViewMode(v => v === "grid" ? "list" : "grid")}
              className="users-btn-ghost"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {viewMode === "grid"
                  ? <path d="M4 6h16M4 12h16M4 18h16" />
                  : <path d="M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM10 10h4v4h-4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h4v4h-4zM16 16h4v4h-4z" />
                }
              </svg>
              {viewMode === "grid" ? "List" : "Grid"}
            </button>
          </div>
        </div>

      {/* Stats Cards */}
      <div className="users-stats">
        {[
          { label: "Total Users", value: stats.total, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
          { label: "Online Now", value: stats.online, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg> },
          { label: "Admins", value: stats.admins, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4L2 9.4h7.6z"/></svg> },
          { label: "Organizers", value: stats.organizers, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
          { label: "Judges", value: stats.judges, accent: true, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
        ].map((s, i) => (
          <div className="users-stat-card" key={i}>
            <div className="users-stat-icon">{s.icon}</div>
            <div className="users-stat-body">
              <div className={`users-stat-value${s.accent ? " accent" : ""}`}>{s.value}</div>
              <div className="users-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="users-search-section">
        <UserSearch 
          onSelect={(user) => router.push(`/users/${user.id}`)}
          placeholder="Search by username, email, or organization..."
        />
        
        <UserFilters 
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={filterCounts}
        />
      </div>

      {/* Users Grid/List */}
      {filteredUsers.length === 0 ? (
        <div className="users-empty">
          <svg className="users-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <h3 className="users-empty-title">
            {searchTerm ? "No users match your search" : "No users found"}
          </h3>
          <p className="users-empty-text">
            {searchTerm ? "Try adjusting your search terms" : "Check back later for new members"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="users-grid">
          {filteredUsers.map((user, index) => (
            <UserCard
              key={user.id}
              user={user}
              currentUser={currentUser}
              onFollow={handleFollow}
              onMessage={handleMessage}
            />
          ))}
        </div>
      ) : (
        <div className="users-list-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Stats</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => {
                const role = user.is_staff ? "Admin" : 
                            user.is_organizer ? "Organizer" :
                            user.is_judge ? "Judge" : "Member";
                const roleColor = user.is_staff ? "#fbbf24" :
                                 user.is_organizer ? "#a78bfa" :
                                 user.is_judge ? "#60a5fa" : "#5c5c6e";
                
                return (
                  <tr
                    key={user.id}
                    className="users-table-row"
                    onClick={() => router.push(`/users/${user.id}`)}
                  >
                    <td className="users-table-user">
                      <div className="users-table-avatar">
                        {user.avatar ? <img src={user.avatar} alt="" /> : user.username?.[0]?.toUpperCase()}
                        {user.is_active && <span className="users-table-active" />}
                      </div>
                      <div>
                        <div className="users-table-username">{user.username}</div>
                        <div className="users-table-email">{user.email}</div>
                      </div>
                    </td>
                    <td>
                      <span 
                        className="users-table-badge"
                        style={{ background: `${roleColor}15`, color: roleColor }}
                      >
                        {role}
                      </span>
                    </td>
                    <td>
                      <div className="users-table-stats">
                        <span>📝 {user.posts_count || 0}</span>
                        <span>👥 {user.followers_count || 0}</span>
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {currentUser && currentUser.id !== user.id && (
                        <div className="users-table-actions">
                          <button
                            className={`users-table-follow ${user.is_following ? 'following' : ''}`}
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                if (user.is_following) {
                                  await api.post(`/users/${user.id}/unfollow/`);
                                } else {
                                  await api.post(`/users/${user.id}/follow/`);
                                }
                                handleFollow(user.id, !user.is_following);
                              } catch (error) {
                                console.error("Error:", error);
                              }
                            }}
                          >
                            {user.is_following ? 'Following' : 'Follow'}
                          </button>
                          <button
                            className="users-table-message"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMessage(user);
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Load More */}
      {pagination.next && filteredUsers.length > 0 && (
        <div className="users-load-more">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="users-load-more-btn"
          >
            {loadingMore ? (
              <>
                <span className="users-spinner"></span>
                Loading...
              </>
            ) : (
              "Load More Users"
            )}
          </button>
          <p className="users-pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>
        </div>
      )}
      </div>

      <style jsx>{`
        .users-page {
          font-family: 'DM Sans', sans-serif;
          min-height: calc(100vh - 70px);
          position: relative;
          background: var(--bg);
          overflow: hidden;
        }

        .users-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 36px 32px 64px;
          position: relative;
          z-index: 1;
        }

        /* Header */
        .users-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 32px;
          gap: 20px;
        }
        .users-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .users-eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6EE7B7;
        }
        .users-eyebrow-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #6EE7B7;
        }
        .users-title {
          font-family: 'Syne', sans-serif;
          font-size: 30px;
          font-weight: 700;
          color: #f0f0f3;
          letter-spacing: -0.5px;
          line-height: 1.1;
          margin: 0;
        }
        .users-subtitle {
          font-size: 14px;
          color: #5c5c6e;
          margin-top: 6px;
          line-height: 1.6;
        }
        .users-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        /* Buttons */
        .users-btn-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.6rem 1.2rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 100px;
          color: #fff;
          font-size: 0.9rem;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(5px);
        }
        .users-btn-ghost:hover {
          background: rgba(255,255,255,0.1);
          border-color: #6EE7B7;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(110,231,183,0.15);
        }

        /* Stats Cards */
        .users-stats {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1rem;
          margin-bottom: 28px;
        }
        .users-stat-card {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 14px;
          padding: 20px 22px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: all 0.2s ease;
        }
        .users-stat-card:hover {
          border-color: rgba(110,231,183,0.3);
          background: #17171b;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        }
        .users-stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 11px;
          background: rgba(110,231,183,0.08);
          border: 1px solid rgba(110,231,183,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #6EE7B7;
        }
        .users-stat-icon svg {
          width: 20px;
          height: 20px;
          stroke: #6EE7B7;
        }
        .users-stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: #f0f0f3;
          letter-spacing: -1px;
          line-height: 1;
          margin-bottom: 4px;
        }
        .users-stat-value.accent { color: #6EE7B7; }
        .users-stat-label {
          font-size: 11px;
          font-weight: 500;
          color: #5c5c6e;
          text-transform: uppercase;
          letter-spacing: 0.7px;
        }

        /* Search Section */
        .users-search-section {
          margin-bottom: 24px;
        }

        /* Grid View */
        .users-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.2rem;
          margin-bottom: 2rem;
        }

        /* List View */
        .users-list-container {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 2rem;
        }
        .users-table {
          width: 100%;
          border-collapse: collapse;
        }
        .users-table th {
          text-align: left;
          padding: 16px 20px;
          background: #0c0c0f;
          color: #5c5c6e;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.7px;
        }
        .users-table td {
          padding: 16px 20px;
          color: #f0f0f3;
          font-size: 13px;
          border-top: 1px solid #1e1e24;
        }
        .users-table-row {
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .users-table-row:hover td {
          background: #17171b;
        }
        .users-table-user {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .users-table-avatar {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(110,231,183,0.1);
          border: 1px solid rgba(110,231,183,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #6EE7B7;
          flex-shrink: 0;
          overflow: hidden;
        }
        .users-table-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .users-table-active {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #4ade80;
          border: 2px solid #111114;
        }
        .users-table-username {
          font-weight: 600;
          color: #f0f0f3;
          margin-bottom: 2px;
          font-size: 14px;
        }
        .users-table-email {
          font-size: 11px;
          color: #888;
        }
        .users-table-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 600;
        }
        .users-table-stats {
          display: flex;
          gap: 12px;
          color: #888;
          font-size: 12px;
        }
        .users-table-actions {
          display: flex;
          gap: 8px;
        }
        .users-table-follow {
          padding: 6px 16px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid;
          background: transparent;
        }
        .users-table-follow:not(.following) {
          border-color: #6EE7B7;
          color: #6EE7B7;
        }
        .users-table-follow:not(.following):hover {
          background: #6EE7B7;
          color: #0c0c0f;
        }
        .users-table-follow.following {
          border-color: #1e1e24;
          color: #888;
        }
        .users-table-follow.following:hover {
          border-color: #f87171;
          color: #f87171;
        }
        .users-table-message {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid #1e1e24;
          border-radius: 50%;
          color: #888;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .users-table-message:hover {
          border-color: #6EE7B7;
          color: #6EE7B7;
        }

        /* Empty State */
        .users-empty {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 20px;
          padding: 64px 32px;
          text-align: center;
          margin: 2rem 0;
        }
        .users-empty-icon {
          width: 64px;
          height: 64px;
          color: #3a3a48;
          margin-bottom: 16px;
        }
        .users-empty-title {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #f0f0f3;
          margin: 0 0 8px;
        }
        .users-empty-text {
          font-size: 14px;
          color: #888;
          margin: 0;
        }

        /* Load More */
        .users-load-more {
          text-align: center;
          margin-top: 2rem;
        }
        .users-load-more-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 32px;
          background: #6EE7B7;
          border: 1px solid #4fb88b;
          border-radius: 100px;
          color: #0c0c0f;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .users-load-more-btn:hover:not(:disabled) {
          background: #86efac;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(110,231,183,0.3);
        }
        .users-load-more-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .users-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(12,12,15,0.2);
          border-top-color: #0c0c0f;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        .users-pagination-info {
          color: #5c5c6e;
          font-size: 12px;
          margin-top: 12px;
        }

        /* Animations */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 900px) {
          .users-container { padding: 24px 20px 48px; }
          .users-stats { grid-template-columns: repeat(2, 1fr); }
          .users-header { flex-direction: column; gap: 16px; }
        }
        @media (max-width: 600px) {
          .users-container { padding: 20px 16px 48px; }
          .users-stats { grid-template-columns: 1fr; }
          .users-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

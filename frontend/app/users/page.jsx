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
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [currentUser, setCurrentUser] = useState(null);
  const { openChat } = useMessaging();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;
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

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(PAGE_SIZE));
      const res = await api.get(`/users/directory/?${params.toString()}`);
      console.log("Raw API response:", res.data);

      const usersArray = res.data.results || [];
      const activeUsers = usersArray.filter(user => user.is_active);
      
      setUsers(activeUsers);

      setPagination({
        count: res.data.count || 0,
        next: res.data.next,
        previous: res.data.previous,
        currentPage: page,
        totalPages: res.data.count ? Math.ceil(res.data.count / PAGE_SIZE) : 1
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
  }, [page]);

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

  useEffect(() => {
    setPage(1);
  }, [activeFilter, searchTerm]);

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

  const totalPages = Math.max(1, pagination.totalPages || 1);
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const pageList = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  })();

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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

      {/* Stats Bar */}
<div className="users-stats-bar">
  <div className="users-stat-item">
    <span className="users-stat-value">{stats.total.toLocaleString()}</span>
    <span className="users-stat-label">Members</span>
  </div>
  <div className="users-stat-divider"></div>
  <div className="users-stat-item">
    <span className="users-stat-value">{stats.online}</span>
    <span className="users-stat-label">Online</span>
  </div>
  <div className="users-stat-divider"></div>
  <div className="users-stat-item">
    <span className="users-stat-value">{stats.admins}</span>
    <span className="users-stat-label">Admins</span>
  </div>
  <div className="users-stat-divider"></div>
  <div className="users-stat-item">
    <span className="users-stat-value">{stats.organizers}</span>
    <span className="users-stat-label">Organizers</span>
  </div>
  <div className="users-stat-divider"></div>
  <div className="users-stat-item">
    <span className="users-stat-value">{stats.judges}</span>
    <span className="users-stat-label">Judges</span>
  </div>
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

      {/* Pagination */}
      {filteredUsers.length > 0 && totalPages > 1 && (
        <div className="users-pagination">
          <button
            className="users-page-nav"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <div className="users-page-list">
            {pageList.map((p, idx) => (
              p === "..."
                ? <span key={`ellipsis-${idx}`} className="users-page-ellipsis">...</span>
                : (
                  <button
                    key={p}
                    className={`users-page-btn${p === currentPage ? " active" : ""}`}
                    onClick={() => goToPage(p)}
                  >
                    {p}
                  </button>
                )
            ))}
          </div>
          <button
            className="users-page-nav"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
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

        /* Stats Bar */
.users-stats-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #111114;
  border: 1px solid #1e1e24;
  border-radius: 12px;
  padding: 16px 24px;
  margin-bottom: 32px;
  gap: 16px;
  flex-wrap: wrap;
}

.users-stat-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex: 1;
  justify-content: center;
}

.users-stat-value {
  font-family: 'Syne', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #f0f0f3;
}

.users-stat-label {
  font-size: 13px;
  color: #5c5c6e;
  font-weight: 500;
}

.users-stat-divider {
  width: 1px;
  height: 30px;
  background: #1e1e24;
}

@media (max-width: 768px) {
  .users-stats-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .users-stat-divider {
    display: none;
  }
  
  .users-stat-item {
    justify-content: space-between;
    padding: 8px 0;
  }
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

        /* Pagination */
        .users-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 2rem;
          flex-wrap: wrap;
        }
        .users-page-list {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .users-page-btn,
        .users-page-nav {
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px solid #26262e;
          background: #111114;
          color: #5c5c6e;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .users-page-btn:hover:not(:disabled),
        .users-page-nav:hover:not(:disabled) {
          color: #f0f0f3;
          border-color: rgba(110,231,183,.35);
          background: #17171b;
        }
        .users-page-btn.active {
          background: #6EE7B7;
          border-color: #4fb88b;
          color: #0c0c0f;
        }
        .users-page-nav:disabled,
        .users-page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .users-page-ellipsis {
          color: #5c5c6e;
          font-size: 12px;
          padding: 0 4px;
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

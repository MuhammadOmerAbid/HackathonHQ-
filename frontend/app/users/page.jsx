"use client";

import { useEffect, useState } from "react";
import api from "../../utils/axios";
import "../../styles/global.css";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
    totalPages: 1
  });

  const fetchUsers = async (pageUrl = null) => {
    setIsLoading(true);
    try {
      // If pageUrl is provided, use it (for next/prev), otherwise use the base URL
      const url = pageUrl || "/users/";
      const res = await api.get(url);
      console.log("Raw API response:", res.data);

      // Handle paginated response
      const usersArray = res.data.results || [];
      const activeUsers = usersArray.filter(user => user.is_active);
      
      // If this is the first page, replace users; otherwise append
      if (pageUrl) {
        setUsers(prev => [...prev, ...activeUsers]);
      } else {
        setUsers(activeUsers);
      }

      // Update pagination info
      setPagination({
        count: res.data.count || 0,
        next: res.data.next,
        previous: res.data.previous,
        currentPage: pageUrl ? pagination.currentPage + 1 : 1,
        totalPages: res.data.count ? Math.ceil(res.data.count / 5) : 1 // Assuming 5 per page
      });

    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const loadMore = () => {
    if (pagination.next) {
      fetchUsers(pagination.next);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="register-container" style={{ alignItems: 'flex-start', padding: '2rem 1rem' }}>
      <div className="blob blob1" aria-hidden="true"></div>
      <div className="blob blob2" aria-hidden="true"></div>
      <div className="blob blob3" aria-hidden="true"></div>

      <div className="register-card" style={{ maxWidth: '1000px' }}>
        <div className="register-header">
          <h1 className="register-title">Users</h1>
          <p className="register-subtitle">View all registered users</p>
        </div>

        {/* Search Bar */}
        <div className="register-input-group" style={{ marginBottom: '2rem' }}>
          <label htmlFor="search" className="register-label">Search Users</label>
          <div className="register-input-wrapper">
            <svg className="register-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              id="search"
              type="text"
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="register-input"
            />
          </div>
        </div>

        {/* Users List */}
        <div>
          <h2 className="register-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
            All Users {pagination.count > 0 && `(${pagination.count} total, showing ${users.length})`}
          </h2>
          
          {isLoading && users.length === 0 ? (
            <div className="users-loading">
              <div className="register-loader" style={{ width: '40px', height: '40px' }}></div>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="users-empty">
              <svg className="users-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <p className="users-empty-text">
                {searchTerm ? "No users match your search" : "No active users found"}
              </p>
            </div>
          ) : (
            <>
              <div className="users-grid">
                {filteredUsers.map((user, index) => (
                  <div 
                    key={user.id} 
                    className="users-card"
                    style={{
                      animation: `fadeIn 0.5s ease-out ${index * 0.05}s both`
                    }}
                  >
                    <div className="users-avatar">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="users-info">
                      <h3 className="users-username">{user.username}</h3>
                      <p className="users-email">{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {pagination.next && (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <button 
                    onClick={loadMore}
                    disabled={isLoading}
                    className="register-button"
                    style={{ padding: '0.75rem 2rem', width: 'auto' }}
                  >
                    {isLoading ? (
                      <>
                        <span className="register-loader"></span>
                        Loading...
                      </>
                    ) : (
                      'Load More Users'
                    )}
                  </button>
                </div>
              )}

              {/* Pagination Info */}
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '1rem' }}>
                Page {pagination.currentPage} of {pagination.totalPages}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
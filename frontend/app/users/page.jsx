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
    <main className="w-full min-h-screen bg-[#0a0a0a]">
      {/* Content container - centered but background is full width */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {/* Header Section - Consistent with other pages */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6EE7B7] shadow-[0_0_12px_rgba(110,231,183,0.6)]" />
              <span className="text-[11px] font-semibold tracking-[1.2px] uppercase text-[#6EE7B7]">
                NETWORK
              </span>
            </div>
            <h1 className="font-['Syne'] text-[30px] font-bold text-[#f0f0f3] tracking-[-0.5px] leading-[1.1] mb-1">
              Developer Directory
            </h1>
            <p className="text-[14px] text-[#5c5c6e] leading-[1.6]">
              Connect with {stats.total}+ builders, organizers, and innovators
            </p>
          </div>
          
          <button
            onClick={() => setViewMode(v => v === "grid" ? "list" : "grid")}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#111114] border border-[#1e1e24] rounded-full text-[13px] text-[#888] hover:border-[#6EE7B7] hover:text-[#f0f0f3] transition-all duration-200 self-start sm:self-auto"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {viewMode === "grid" ? (
                <path d="M4 6h16M4 12h16M4 18h16" />
              ) : (
                <path d="M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM10 10h4v4h-4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h4v4h-4zM16 16h4v4h-4z" />
              )}
            </svg>
            <span>{viewMode === "grid" ? "List view" : "Grid view"}</span>
          </button>
        </div>

        {/* Stats Bar - Consistent sizing */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6 p-5 bg-[#111114] border border-[#1e1e24] rounded-[14px] mb-8">
          <div className="flex items-center gap-2">
            <span className="font-['Syne'] text-[26px] font-bold text-[#f0f0f3] tracking-[-1px] leading-[1]">{stats.total}</span>
            <span className="text-[11px] font-medium uppercase tracking-[0.7px] text-[#5c5c6e]">Total</span>
          </div>
          <div className="w-px h-6 bg-[#1e1e24]" />
          <div className="flex items-center gap-2">
            <span className="font-['Syne'] text-[26px] font-bold text-[#f0f0f3] tracking-[-1px] leading-[1]">{stats.online}</span>
            <span className="text-[11px] font-medium uppercase tracking-[0.7px] text-[#5c5c6e]">Online</span>
            <span className="w-2 h-2 rounded-full bg-[#4ade80] shadow-[0_0_12px_rgba(74,222,128,0.6)] animate-pulse" />
          </div>
          <div className="w-px h-6 bg-[#1e1e24]" />
          <div className="flex items-center gap-2">
            <span className="font-['Syne'] text-[26px] font-bold text-[#f0f0f3] tracking-[-1px] leading-[1]">{stats.admins}</span>
            <span className="text-[11px] font-medium uppercase tracking-[0.7px] text-[#5c5c6e]">Admins</span>
          </div>
          <div className="w-px h-6 bg-[#1e1e24]" />
          <div className="flex items-center gap-2">
            <span className="font-['Syne'] text-[26px] font-bold text-[#f0f0f3] tracking-[-1px] leading-[1]">{stats.organizers}</span>
            <span className="text-[11px] font-medium uppercase tracking-[0.7px] text-[#5c5c6e]">Org</span>
          </div>
          <div className="w-px h-6 bg-[#1e1e24]" />
          <div className="flex items-center gap-2">
            <span className="font-['Syne'] text-[26px] font-bold text-[#f0f0f3] tracking-[-1px] leading-[1]">{stats.judges}</span>
            <span className="text-[11px] font-medium uppercase tracking-[0.7px] text-[#5c5c6e]">Judges</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
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

        {/* Results count */}
        <div className="mb-6 text-[13px] text-[#5c5c6e]">
          <span>
            Showing <strong className="text-[#f0f0f3] font-semibold">{filteredUsers.length}</strong> of <strong className="text-[#f0f0f3] font-semibold">{stats.total}</strong> members
            {searchTerm && ` matching "${searchTerm}"`}
            {activeFilter !== "all" && ` • ${activeFilter} filter applied`}
          </span>
        </div>

        {/* Users Grid/List */}
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 bg-[#111114] border border-[#1e1e24] rounded-[20px] text-center">
            <div className="w-16 h-16 rounded-full bg-[#1e1e24] flex items-center justify-center mb-4 text-[#3a3a48]">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h3 className="font-['Syne'] text-[20px] font-bold text-[#f0f0f3] mb-2">
              {searchTerm ? "No matches found" : "No users yet"}
            </h3>
            <p className="text-[14px] text-[#888] mb-6">
              {searchTerm 
                ? "Try different keywords or clear filters"
                : "The community is growing — check back soon"}
            </p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="px-6 py-2.5 bg-transparent border border-[#6EE7B7] rounded-full text-[13px] font-semibold text-[#6EE7B7] hover:bg-[#6EE7B7] hover:text-[#0c0c0f] transition-all duration-200"
              >
                Clear search
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {filteredUsers.map((user) => (
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
          <div className="bg-[#111114] border border-[#1e1e24] rounded-[16px] overflow-hidden mb-10">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#0c0c0f] border-b border-[#1e1e24]">
                  <th className="text-left py-4 px-5 text-[11px] font-semibold uppercase tracking-[0.7px] text-[#5c5c6e]">Member</th>
                  <th className="text-left py-4 px-5 text-[11px] font-semibold uppercase tracking-[0.7px] text-[#5c5c6e]">Role</th>
                  <th className="text-left py-4 px-5 text-[11px] font-semibold uppercase tracking-[0.7px] text-[#5c5c6e]">Activity</th>
                  <th className="text-left py-4 px-5 text-[11px] font-semibold uppercase tracking-[0.7px] text-[#5c5c6e]">Network</th>
                  <th className="text-left py-4 px-5 text-[11px] font-semibold uppercase tracking-[0.7px] text-[#5c5c6e]"></th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const role = user.is_staff ? "Admin" : 
                              user.is_organizer ? "Organizer" :
                              user.is_judge ? "Judge" : "Member";
                  const roleColor = user.is_staff ? "#fbbf24" :
                                   user.is_organizer ? "#a78bfa" :
                                   user.is_judge ? "#60a5fa" : "#5c5c6e";
                  
                  return (
                    <tr
                      key={user.id}
                      onClick={() => router.push(`/users/${user.id}`)}
                      className="cursor-pointer border-b border-[#1e1e24] last:border-0 hover:bg-[#1a1a1f] transition-colors duration-200"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-full bg-[#1e1e24] flex items-center justify-center font-['Syne'] text-base font-bold text-[#6EE7B7] overflow-hidden">
                            {user.avatar ? (
                              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              user.username?.[0]?.toUpperCase()
                            )}
                            {user.is_active && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#4ade80] border-2 border-[#111114]" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-[#f0f0f3] text-[14px] mb-0.5">{user.username}</div>
                            <div className="text-[11px] text-[#888]">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span 
                          className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold border"
                          style={{ 
                            backgroundColor: `${roleColor}12`,
                            color: roleColor,
                            borderColor: `${roleColor}25`
                          }}
                        >
                          {role}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex gap-4">
                          <span className="flex items-center gap-1 text-[12px] text-[#888]">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            {user.posts_count || 0}
                          </span>
                          <span className="flex items-center gap-1 text-[12px] text-[#888]">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            </svg>
                            {user.followers_count || 0}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex gap-4">
                          <span className="flex items-center gap-1 text-[12px] text-[#888]">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            </svg>
                            {user.following_count || 0}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-5" onClick={(e) => e.stopPropagation()}>
                        {currentUser && currentUser.id !== user.id && (
                          <div className="flex gap-2">
                            <button
                              className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200 ${
                                user.is_following 
                                  ? 'bg-transparent border border-[#1e1e24] text-[#888] hover:border-[#f87171] hover:text-[#f87171]' 
                                  : 'bg-[#6EE7B7] border border-[#4fb88b] text-[#0c0c0f] hover:bg-[#86efac]'
                              }`}
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
                              className="w-8 h-8 flex items-center justify-center bg-transparent border border-[#1e1e24] rounded-full text-[#888] hover:border-[#6EE7B7] hover:text-[#6EE7B7] transition-all duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMessage(user);
                              }}
                              title="Send message"
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
        {pagination.next && filteredUsers.length > 0 && (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="inline-flex items-center justify-center gap-2 px-9 py-3.5 bg-[#1e1e24] border border-[#6EE7B7] rounded-full text-[14px] font-semibold text-[#6EE7B7] hover:bg-[#6EE7B7] hover:text-[#0c0c0f] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#6EE7B7] border-t-transparent rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <span>Load more</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </>
              )}
            </button>
            <div className="text-[12px] text-[#5c5c6e]">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
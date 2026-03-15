"use client";

export default function UserFilters({ activeFilter, onFilterChange, counts }) {
  const filters = [
    { key: "all", label: "All Users", icon: "👥" },
    { key: "following", label: "Following", icon: "✓" },
    { key: "followers", label: "Followers", icon: "👤" },
    { key: "admins", label: "Admins", icon: "⭐" },
    { key: "organizers", label: "Organizers", icon: "🎯" },
    { key: "judges", label: "Judges", icon: "⚖️" },
  ];

  return (
    <div className="user-filters">
      <div className="user-filters-list">
        {filters.map((filter) => (
          <button
            key={filter.key}
            className={`user-filter-btn ${activeFilter === filter.key ? "active" : ""}`}
            onClick={() => onFilterChange(filter.key)}
          >
            <span className="user-filter-icon">{filter.icon}</span>
            <span className="user-filter-label">{filter.label}</span>
            {counts[filter.key] > 0 && (
              <span className="user-filter-count">{counts[filter.key]}</span>
            )}
          </button>
        ))}
      </div>

      <style jsx>{`
        .user-filters {
          margin-bottom: 24px;
        }
        .user-filters-list {
          display: flex;
          gap: 4px;
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 100px;
          padding: 4px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .user-filters-list::-webkit-scrollbar {
          display: none;
        }
        .user-filter-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: none;
          border-radius: 100px;
          background: transparent;
          color: #888;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .user-filter-btn:hover {
          color: #f0f0f3;
          background: rgba(255,255,255,0.03);
        }
        .user-filter-btn.active {
          background: #6EE7B7;
          color: #0c0c0f;
          font-weight: 600;
        }
        .user-filter-icon {
          font-size: 14px;
        }
        .user-filter-count {
          background: rgba(0,0,0,0.2);
          padding: 2px 6px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 600;
        }
        .active .user-filter-count {
          background: rgba(12,12,15,0.2);
        }
      `}</style>
    </div>
  );
}
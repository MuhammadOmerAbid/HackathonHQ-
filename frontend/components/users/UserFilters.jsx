"use client";

export default function UserFilters({ activeFilter, onFilterChange, counts }) {
  const filters = [
    { 
      key: "all", 
      label: "All members", 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    },
    { 
      key: "following", 
      label: "Following", 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          <line x1="16" y1="8" x2="16" y2="16" />
          <line x1="20" y1="12" x2="12" y2="12" />
        </svg>
      )
    },
    { 
      key: "admins", 
      label: "Admins", 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      )
    },
    { 
      key: "organizers", 
      label: "Organizers", 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8.5" />
          <path d="M16 2v4" />
          <path d="M8 2v4" />
          <path d="M3 10h18" />
          <path d="M8 14h8" />
          <path d="M12 14v5" />
        </svg>
      )
    },
    { 
      key: "judges", 
      label: "Judges", 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v4" />
          <path d="M18 5h-3" />
          <path d="M6 5H3" />
          <rect x="4" y="8" width="16" height="12" rx="2" />
          <path d="M8 12h8" />
          <path d="M8 16h4" />
        </svg>
      )
    },
  ];

  return (
    <div className="filters-container">
      <div className="filters-list">
        {filters.map((filter) => (
          <button
            key={filter.key}
            className={`filter-btn ${activeFilter === filter.key ? "active" : ""}`}
            onClick={() => onFilterChange(filter.key)}
          >
            <span className="filter-icon">{filter.icon}</span>
            <span className="filter-label">{filter.label}</span>
            {counts[filter.key] > 0 && (
              <span className="filter-count">{counts[filter.key]}</span>
            )}
          </button>
        ))}
      </div>

      <style jsx>{`
        .filters-container {
          margin-top: 16px;
        }

        .filters-list {
          display: flex;
          gap: 4px;
          background: rgba(17,17,20,0.4);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(110,231,183,0.08);
          border-radius: 100px;
          padding: 4px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .filters-list::-webkit-scrollbar {
          display: none;
        }

        .filter-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
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

        .filter-btn:hover {
          color: #f0f0f3;
          background: rgba(255,255,255,0.03);
        }

        .filter-btn.active {
          background: rgba(110,231,183,0.1);
          color: #6EE7B7;
        }

        .filter-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
        }

        .filter-icon svg {
          width: 16px;
          height: 16px;
          stroke: currentColor;
        }

        .filter-count {
          background: rgba(0,0,0,0.3);
          padding: 2px 6px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 600;
        }

        .active .filter-count {
          background: rgba(110,231,183,0.2);
          color: #6EE7B7;
        }
      `}</style>
    </div>
  );
}
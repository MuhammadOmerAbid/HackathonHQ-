"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "../../utils/axios";

export default function UserSearch({ onSearch, onSelect, placeholder = "Search users..." }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await axios.get(`/users/?search=${encodeURIComponent(query)}&limit=5`);
        setResults(res.data.results || res.data || []);
        setShowResults(true);
        onSearch?.(res.data);
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [query, onSearch]);

  const handleSelect = (user) => {
    setQuery("");
    setShowResults(false);
    if (onSelect) {
      onSelect(user);
    } else {
      router.push(`/users/${user.id}`);
    }
  };

  return (
    <div className="user-search" ref={searchRef}>
      <div className="user-search-input-wrapper">
        <svg className="user-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="user-search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setShowResults(true)}
        />
        {isLoading && <span className="user-search-spinner" />}
        {query && !isLoading && (
          <button className="user-search-clear" onClick={() => setQuery("")}>
            ✕
          </button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="user-search-results">
          {results.map((user) => (
            <div
              key={user.id}
              className="user-search-result"
              onClick={() => handleSelect(user)}
            >
              <div className="user-result-avatar">
                {user.username?.[0]?.toUpperCase()}
              </div>
              <div className="user-result-info">
                <div className="user-result-name">{user.username}</div>
                <div className="user-result-email">{user.email}</div>
              </div>
              {user.is_following && (
                <span className="user-result-badge">Following</span>
              )}
            </div>
          ))}
        </div>
      )}

      {showResults && query && !isLoading && results.length === 0 && (
        <div className="user-search-empty">
          <p>No users found matching "{query}"</p>
        </div>
      )}

      <style jsx>{`
        .user-search {
          position: relative;
          width: 100%;
        }

        .user-search-input-wrapper {
          position: relative;
          width: 100%;
        }

        .user-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 18px;
          height: 18px;
          color: #5c5c6e;
        }

        .user-search-input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 100px;
          color: #f0f0f3;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: all 0.2s ease;
        }
        .user-search-input:focus {
          border-color: rgba(110,231,183,0.4);
          box-shadow: 0 0 0 2px rgba(110,231,183,0.1);
        }
        .user-search-input::placeholder {
          color: #5c5c6e;
        }

        .user-search-spinner {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          border: 2px solid #1e1e24;
          border-top-color: #6EE7B7;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        .user-search-clear {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: #5c5c6e;
          font-size: 14px;
          cursor: pointer;
          padding: 4px;
        }
        .user-search-clear:hover {
          color: #f0f0f3;
        }

        .user-search-results {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: #1a1a1f;
          border: 1px solid #26262e;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          z-index: 100;
          max-height: 300px;
          overflow-y: auto;
        }

        .user-search-result {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.2s ease;
          border-bottom: 1px solid #1e1e24;
        }
        .user-search-result:last-child {
          border-bottom: none;
        }
        .user-search-result:hover {
          background: #17171b;
        }

        .user-result-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(110,231,183,0.1);
          border: 1px solid rgba(110,231,183,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #6EE7B7;
          flex-shrink: 0;
        }

        .user-result-info {
          flex: 1;
          min-width: 0;
        }

        .user-result-name {
          font-size: 14px;
          font-weight: 600;
          color: #f0f0f3;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-result-email {
          font-size: 11px;
          color: #888;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-result-badge {
          padding: 2px 8px;
          background: rgba(110,231,183,0.1);
          border: 1px solid rgba(110,231,183,0.2);
          border-radius: 100px;
          color: #6EE7B7;
          font-size: 10px;
          font-weight: 600;
        }

        .user-search-empty {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: #1a1a1f;
          border: 1px solid #26262e;
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          color: #888;
          font-size: 13px;
          z-index: 100;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

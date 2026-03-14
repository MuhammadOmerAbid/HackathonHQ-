"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LiquidGlassNavbar() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [bubblePosition, setBubblePosition] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  const { user, isOrganizer, isJudge, logout, loading } = useAuth();

  const navItems = [
    {
      id: 0,
      path: "/",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      label: "Dashboard",
    },
    {
      id: 1,
      path: "/events",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      label: "Events",
    },
    {
      id: 2,
      path: "/teams",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      label: "Teams",
    },
    {
      id: 3,
      path: "/submissions",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      label: "Submissions",
    },
    ...(user
      ? [
          {
            id: 4,
            path: "/posts",
            icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z",
            label: "Posts",
          },
          {
            id: 5,
            path: "/users",
            icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
            label: "Users",
          },
        ]
      : []),
    ...(isJudge
      ? [
          {
            id: 7,
            path: "/judge/dashboard",
            icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
            label: "Judge",
          },
        ]
      : []),
    ...(isOrganizer
      ? [
          {
            id: 6,
            path: "/events/create",
            icon: "M12 4v16m8-8H4",
            label: "Create Event",
          },
        ]
      : []),
  ];

  const getActiveIndex = () => {
    const index = navItems.findIndex(
      (item) =>
        pathname === item.path ||
        (item.path !== "/" && pathname.startsWith(item.path))
    );
    return index >= 0 ? index : 0;
  };

  const [activeIndex, setActiveIndex] = useState(getActiveIndex());

  useEffect(() => {
    setActiveIndex(getActiveIndex());
  }, [pathname, user, isOrganizer, isJudge]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = 300;
      const progress = Math.min(scrollY / maxScroll, 1);
      setScrollProgress(progress);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updateBubblePosition = () => {
      const items = document.querySelectorAll(".glass-nav-item");
      if (items[activeIndex]) {
        const itemRect = items[activeIndex].getBoundingClientRect();
        const navRect = document.querySelector(".glass-nav")?.getBoundingClientRect();
        if (navRect) {
          const centerX = itemRect.left + itemRect.width / 2 - navRect.left;
          setBubblePosition(centerX);
        }
      }
    };
    updateBubblePosition();
    window.addEventListener("resize", updateBubblePosition);
    return () => window.removeEventListener("resize", updateBubblePosition);
  }, [activeIndex, navItems.length]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    router.push("/");
  };

  const blurIntensity = 8 + scrollProgress * 12;
  const bgOpacity = 0.15 + scrollProgress * 0.2;

  const bubbleStyle = { transform: `translateX(${bubblePosition - 40}px)` };
  const mobileBubbleStyle = { transform: `translateX(${bubblePosition * 0.6 - 24}px)` };

  if (loading) {
    return (
      <>
        <nav className="glass-nav-wrapper">
          <div
            className="glass-nav-container"
            style={{ backgroundColor: "rgba(10, 10, 10, 0.15)" }}
          >
            <Link href="/" className="glass-logo">
              <Image src="/logo.png" alt="HackathonHQ Logo" width={32} height={32} className="glass-logo-image" priority />
              <Image src="/HackathonHQ.png" alt="HackathonHQ" width={120} height={32} className="glass-logo-text-image" priority />
            </Link>
            <div className="glass-nav-placeholder"></div>
          </div>
        </nav>
        <div className="glass-navbar-spacer"></div>
      </>
    );
  }

  return (
    <>
      <nav className="glass-nav-wrapper">
        <div
          className="glass-nav-container"
          style={{
            backgroundColor: `rgba(10, 10, 10, ${bgOpacity})`,
            backdropFilter: `blur(${blurIntensity}px)`,
            WebkitBackdropFilter: `blur(${blurIntensity}px)`,
          }}
        >
          <Link href="/" className="glass-logo">
            <Image src="/logo.png" alt="HackathonHQ Logo" width={32} height={32} className="glass-logo-image" priority />
            <Image src="/HackathonHQ.png" alt="HackathonHQ" width={120} height={32} className="glass-logo-text-image" priority />
          </Link>

          <div className="glass-nav">
            <div className="glass-nav-bubble" style={bubbleStyle} />
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.path}
                className={`glass-nav-item ${activeIndex === item.id ? "active" : ""}`}
              >
                <svg className="glass-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={item.icon} />
                </svg>
                <span className="glass-nav-label">{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="glass-user" ref={dropdownRef}>
            {user ? (
              <div className="glass-user-menu" onClick={() => setShowDropdown(!showDropdown)}>
                <div className="glass-user-avatar">
                  {user.username?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="glass-user-name">{user.username || "User"}</span>
                {/* Role badge */}
                {isJudge && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "1px 7px",
                    borderRadius: 100, background: "rgba(251,191,36,.15)",
                    color: "#fbbf24", border: "1px solid rgba(251,191,36,.3)",
                    marginLeft: 4, letterSpacing: "0.3px"
                  }}>JUDGE</span>
                )}
                {isOrganizer && !isJudge && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "1px 7px",
                    borderRadius: 100, background: "rgba(110,231,183,.1)",
                    color: "#6EE7B7", border: "1px solid rgba(110,231,183,.2)",
                    marginLeft: 4, letterSpacing: "0.3px"
                  }}>ORG</span>
                )}
                <button className="glass-user-dropdown">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {showDropdown && (
  <div className="glass-dropdown">
    <Link href="/profile" className="glass-dropdown-item" onClick={() => setShowDropdown(false)}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
      Profile
    </Link>
    {isJudge && (
      <Link href="/judge/dashboard" className="glass-dropdown-item" onClick={() => setShowDropdown(false)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        Judge Dashboard
      </Link>
    )}
    {isOrganizer && (
      <Link href="/organizer/users" className="glass-dropdown-item" onClick={() => setShowDropdown(false)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        Manage Users
      </Link>
    )}
    <Link href="/profile?tab=settings" className="glass-dropdown-item" onClick={() => setShowDropdown(false)}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H5.78a1.65 1.65 0 0 0-1.51 1 1.65 1.65 0 0 0 .33 1.82l.09.1A10 10 0 0 0 12 17.66a10 10 0 0 0 6.22-2.46l.09-.1z"></path>
      </svg>
      Settings
    </Link>
    <div className="glass-dropdown-divider"></div>
    <button onClick={handleLogout} className="glass-dropdown-item logout">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
      </svg>
      Logout
    </button>
  </div>
)}
              </div>
            ) : (
              <div className="glass-auth-buttons">
                <Link href="/login" className="glass-auth-btn login">Login</Link>
                <Link href="/register" className="glass-auth-btn register">Register</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <nav className="glass-mobile-nav">
        <div className="glass-mobile-nav-container">
          <div className="glass-mobile-bubble" style={mobileBubbleStyle} />
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.id}
              href={item.path}
              className={`glass-mobile-item ${activeIndex === item.id ? "active" : ""}`}
            >
              <svg className="glass-mobile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={item.icon} />
              </svg>
              <span className="glass-mobile-label">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <div className="glass-navbar-spacer"></div>
    </>
  );
}
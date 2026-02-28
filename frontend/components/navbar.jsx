"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import axios from "../utils/axios";

export default function LiquidGlassNavbar() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [bubblePosition, setBubblePosition] = useState(0);
  const [user, setUser] = useState(null);
  const pathname = usePathname();

  // Navigation items
  const navItems = [
    { 
      id: 0,
      path: "/", 
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      label: "Dashboard" 
    },
    { 
      id: 1,
      path: "/events", 
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      label: "Events" 
    },
    { 
      id: 2,
      path: "/teams", 
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      label: "Teams" 
    },
    { 
      id: 3,
      path: "/submissions", 
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      label: "Submissions" 
    },
    { 
      id: 4,
      path: "/posts", 
      icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z",
      label: "Posts" 
    },
    { 
      id: 5,
      path: "/users", 
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      label: "Users" 
    },
  ];

  // Get current active index based on pathname
  const getActiveIndex = () => {
    const index = navItems.findIndex(item => 
      pathname === item.path || 
      (item.path !== "/" && pathname.startsWith(item.path))
    );
    return index >= 0 ? index : 0;
  };

  const [activeIndex, setActiveIndex] = useState(getActiveIndex());

  useEffect(() => {
    setActiveIndex(getActiveIndex());
  }, [pathname]);

  // Track scroll progress for blur effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = 300;
      const progress = Math.min(scrollY / maxScroll, 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update bubble position based on active index
  useEffect(() => {
    const updateBubblePosition = () => {
      const navItems = document.querySelectorAll('.glass-nav-item');
      if (navItems[activeIndex]) {
        const itemRect = navItems[activeIndex].getBoundingClientRect();
        const navRect = document.querySelector('.glass-nav')?.getBoundingClientRect();
        
        if (navRect) {
          const centerX = itemRect.left + (itemRect.width / 2) - navRect.left;
          setBubblePosition(centerX);
        }
      }
    };

    updateBubblePosition();
    window.addEventListener('resize', updateBubblePosition);
    return () => window.removeEventListener('resize', updateBubblePosition);
  }, [activeIndex]);

  // Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/users/me/");
        setUser(res.data);
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  // Calculate styles based on scroll
  const blurIntensity = 8 + (scrollProgress * 12); // 8px to 20px
  const bgOpacity = 0.15 + (scrollProgress * 0.2); // 0.15 to 0.35

  const bubbleStyle = {
    transform: `translateX(${bubblePosition - 48}px)`,
  };

  const mobileBubbleStyle = {
    transform: `translateX(${bubblePosition * 0.6 - 28}px)`,
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="glass-nav-wrapper">
        <div 
          className="glass-nav-container"
          style={{
            backgroundColor: `rgba(10, 10, 10, ${bgOpacity})`,
            backdropFilter: `blur(${blurIntensity}px)`,
            WebkitBackdropFilter: `blur(${blurIntensity}px)`,
          }}
        >
          {/* Logo */}
          <Link href="/" className="glass-logo">
            <svg className="glass-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0114 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="glass-logo-text">HackForge</span>
          </Link>

          {/* Navigation Items */}
          <div className="glass-nav">
            {/* Animated Bubble */}
            <div className="glass-nav-bubble" style={bubbleStyle} />

            {/* Nav Items */}
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.path}
                className={`glass-nav-item ${activeIndex === item.id ? 'active' : ''}`}
              >
                <svg className="glass-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={item.icon} />
                </svg>
                <span className="glass-nav-label">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="glass-user">
            {user ? (
              <div className="glass-user-menu">
                <div className="glass-user-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="glass-user-name">{user.username}</span>
                <button className="glass-user-dropdown">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
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

      {/* Mobile Bottom Navigation */}
      <nav className="glass-mobile-nav">
        <div className="glass-mobile-nav-container">
          {/* Animated Bubble */}
          <div className="glass-mobile-bubble" style={mobileBubbleStyle} />

          {/* Mobile Nav Items */}
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.id}
              href={item.path}
              className={`glass-mobile-item ${activeIndex === item.id ? 'active' : ''}`}
            >
              <svg className="glass-mobile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={item.icon} />
              </svg>
              <span className="glass-mobile-label">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Spacer */}
      <div className="glass-navbar-spacer"></div>
    </>
  );
}
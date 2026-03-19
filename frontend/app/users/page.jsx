"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // Show nothing while checking auth
  if (loading) {
    return (
      <div className="home-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  // If user is logged in, don't render the landing page (redirect will happen)
  if (user) {
    return null;
  }

  return (
    <div className="home-page">
      {/* Background Elements */}
      <div className="home-bg-gradient" />
      <div className="home-bg-grid" />
      
      {/* Navigation */}
      <nav className="home-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-text">HackForge</span>
            <span className="logo-badge">beta</span>
          </div>
          <div className="nav-links">
            <Link href="/features" className="nav-link">Features</Link>
            <Link href="/about" className="nav-link">About</Link>
            <Link href="/contact" className="nav-link">Contact</Link>
          </div>
          <div className="nav-buttons">
            <Link href="/login" className="nav-btn-secondary">
              Log in
            </Link>
            <Link href="/register" className="nav-btn-primary">
              Sign up free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="home-hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="eyebrow-dot" />
              <span className="eyebrow-text">HACKATHON PLATFORM</span>
            </div>
            <h1 className="hero-title">
              Build, Compete, <br />
              <span className="hero-title-gradient">Win Together</span>
            </h1>
            <p className="hero-subtitle">
              Join the ultimate hackathon community. Form teams, submit projects, 
              get feedback from judges, and showcase your skills.
            </p>
            <div className="hero-cta">
              <Link href="/register" className="cta-primary">
                Get started
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <Link href="/about" className="cta-secondary">
                Learn more
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-card card-1">
              <div className="card-glow" />
              <div className="card-content">
                <div className="card-header">
                  <div className="card-avatars">
                    <div className="avatar">👤</div>
                    <div className="avatar">👤</div>
                    <div className="avatar">👤</div>
                  </div>
                  <span className="card-badge">Live now</span>
                </div>
                <div className="card-title">AI Hackathon 2026</div>
                <div className="card-meta">24 teams · 3 days left</div>
              </div>
            </div>
            <div className="visual-card card-2">
              <div className="card-glow" />
              <div className="card-content">
                <div className="card-stats">
                  <div className="stat">
                    <span className="stat-value">156</span>
                    <span className="stat-label">projects</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">42</span>
                    <span className="stat-label">judges</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="visual-card card-3">
              <div className="card-glow" />
              <div className="card-content">
                <div className="card-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '75%' }} />
                  </div>
                  <span className="progress-label">75% reviewed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="home-stats">
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-number">500+</span>
            <span className="stat-name">Hackathons</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">10k+</span>
            <span className="stat-name">Participants</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">2.5k+</span>
            <span className="stat-name">Projects</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">150+</span>
            <span className="stat-name">Judges</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="home-features">
        <div className="features-container">
          <div className="features-header">
            <h2 className="features-title">Everything you need to hack</h2>
            <p className="features-subtitle">
              From team formation to final submissions, we've got you covered
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">Discover Events</h3>
              <p className="feature-desc">
                Find hackathons that match your interests and skill level
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3 className="feature-title">Form Teams</h3>
              <p className="feature-desc">
                Connect with like-minded hackers and build dream teams
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3 className="feature-title">Submit Projects</h3>
              <p className="feature-desc">
                Showcase your work and get feedback from expert judges
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚖️</div>
              <h3 className="feature-title">Expert Judging</h3>
              <p className="feature-desc">
                Get scored by industry professionals and win prizes
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3 className="feature-title">Community</h3>
              <p className="feature-desc">
                Engage with fellow hackers, share ideas, and grow together
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3 className="feature-title">Win Recognition</h3>
              <p className="feature-desc">
                Get featured as winners and build your portfolio
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="home-cta">
        <div className="cta-container">
          <h2 className="cta-title">Ready to start your journey?</h2>
          <p className="cta-subtitle">
            Join thousands of hackers building the future, one hackathon at a time
          </p>
          <Link href="/register" className="cta-button">
            Create your account
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-container">
          <div className="footer-logo">
            <span className="footer-logo-text">HackForge</span>
            <span className="footer-copyright">© 2026 HackForge. All rights reserved.</span>
          </div>
          <div className="footer-links">
            <Link href="/privacy" className="footer-link">Privacy</Link>
            <Link href="/terms" className="footer-link">Terms</Link>
            <Link href="/contact" className="footer-link">Contact</Link>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .home-page {
          min-height: 100vh;
          background: #0a0a0a;
          color: #f0f0f3;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Background Effects */
        .home-bg-gradient {
          position: fixed;
          top: -50vh;
          left: -50vw;
          width: 200vw;
          height: 200vh;
          background: radial-gradient(circle at 30% 30%, rgba(110,231,183,0.05) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .home-bg-grid {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            linear-gradient(rgba(110,231,183,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(110,231,183,0.02) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 0;
        }

        .home-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0a0a;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(110,231,183,0.1);
          border-top-color: #6EE7B7;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        /* Navigation */
        .home-nav {
          position: relative;
          z-index: 10;
          padding: 20px 0;
          border-bottom: 1px solid rgba(110,231,183,0.1);
          backdrop-filter: blur(10px);
          background: rgba(10,10,10,0.8);
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 700;
          background: linear-gradient(135deg, #f0f0f3, #6EE7B7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .logo-badge {
          font-size: 10px;
          padding: 2px 6px;
          background: rgba(110,231,183,0.1);
          border: 1px solid rgba(110,231,183,0.2);
          border-radius: 100px;
          color: #6EE7B7;
          text-transform: uppercase;
        }

        .nav-links {
          display: flex;
          gap: 32px;
        }

        .nav-link {
          color: #888;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s ease;
        }

        .nav-link:hover {
          color: #6EE7B7;
        }

        .nav-buttons {
          display: flex;
          gap: 12px;
        }

        .nav-btn-secondary {
          padding: 8px 20px;
          border: 1px solid #1e1e24;
          border-radius: 100px;
          color: #f0f0f3;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .nav-btn-secondary:hover {
          border-color: #6EE7B7;
          color: #6EE7B7;
        }

        .nav-btn-primary {
          padding: 8px 20px;
          background: #6EE7B7;
          border: 1px solid #4fb88b;
          border-radius: 100px;
          color: #0c0c0f;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .nav-btn-primary:hover {
          background: #86efac;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(110,231,183,0.3);
        }

        /* Hero Section */
        .home-hero {
          position: relative;
          z-index: 5;
          padding: 80px 24px;
        }

        .hero-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .hero-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
        }

        .eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6EE7B7;
          box-shadow: 0 0 12px rgba(110,231,183,0.6);
        }

        .eyebrow-text {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #6EE7B7;
        }

        .hero-title {
          font-family: 'Syne', sans-serif;
          font-size: 56px;
          font-weight: 800;
          line-height: 1.1;
          margin: 0 0 24px;
          letter-spacing: -1px;
        }

        .hero-title-gradient {
          background: linear-gradient(135deg, #6EE7B7, #4fb88b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 16px;
          color: #888;
          line-height: 1.7;
          margin: 0 0 32px;
          max-width: 500px;
        }

        .hero-cta {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .cta-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 32px;
          background: #6EE7B7;
          border: 1px solid #4fb88b;
          border-radius: 100px;
          color: #0c0c0f;
          text-decoration: none;
          font-size: 15px;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .cta-primary:hover {
          background: #86efac;
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(110,231,183,0.4);
        }

        .cta-secondary {
          padding: 14px 24px;
          color: #888;
          text-decoration: none;
          font-size: 15px;
          transition: color 0.2s ease;
        }

        .cta-secondary:hover {
          color: #6EE7B7;
        }

        /* Hero Visual Cards */
        .hero-visual {
          position: relative;
          height: 400px;
        }

        .visual-card {
          position: absolute;
          background: rgba(17,17,20,0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(110,231,183,0.1);
          border-radius: 24px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .visual-card:hover {
          transform: translateY(-4px);
          border-color: rgba(110,231,183,0.3);
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }

        .card-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top right, rgba(110,231,183,0.1), transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .visual-card:hover .card-glow {
          opacity: 1;
        }

        .card-content {
          position: relative;
          z-index: 1;
          padding: 24px;
        }

        .card-1 {
          top: 20px;
          right: 40px;
          width: 280px;
        }

        .card-2 {
          bottom: 40px;
          left: 20px;
          width: 240px;
        }

        .card-3 {
          top: 50%;
          right: 0;
          transform: translateY(-50%);
          width: 200px;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .card-avatars {
          display: flex;
          align-items: center;
        }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(110,231,183,0.1);
          border: 2px solid rgba(110,231,183,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: -8px;
          font-size: 14px;
        }

        .avatar:first-child {
          margin-left: 0;
        }

        .card-badge {
          padding: 4px 10px;
          background: rgba(110,231,183,0.1);
          border: 1px solid rgba(110,231,183,0.2);
          border-radius: 100px;
          font-size: 10px;
          color: #6EE7B7;
        }

        .card-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .card-meta {
          font-size: 12px;
          color: #888;
        }

        .card-stats {
          display: flex;
          gap: 24px;
        }

        .stat {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #6EE7B7;
        }

        .stat-label {
          font-size: 11px;
          color: #888;
          text-transform: uppercase;
        }

        .card-progress {
          width: 100%;
        }

        .progress-bar {
          height: 6px;
          background: #1e1e24;
          border-radius: 100px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6EE7B7, #4fb88b);
          border-radius: 100px;
        }

        .progress-label {
          font-size: 11px;
          color: #6EE7B7;
        }

        /* Stats Section */
        .home-stats {
          position: relative;
          z-index: 5;
          padding: 60px 24px;
          border-top: 1px solid rgba(110,231,183,0.05);
          border-bottom: 1px solid rgba(110,231,183,0.05);
        }

        .stats-container {
          max-width: 1000px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .stat-item {
          text-align: center;
          flex: 1;
        }

        .stat-number {
          display: block;
          font-family: 'Syne', sans-serif;
          font-size: 42px;
          font-weight: 800;
          color: #f0f0f3;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #f0f0f3, #6EE7B7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .stat-name {
          font-size: 14px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .stat-divider {
          width: 1px;
          height: 40px;
          background: rgba(110,231,183,0.15);
        }

        /* Features Section */
        .home-features {
          position: relative;
          z-index: 5;
          padding: 100px 24px;
        }

        .features-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .features-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .features-title {
          font-family: 'Syne', sans-serif;
          font-size: 36px;
          font-weight: 700;
          color: #f0f0f3;
          margin: 0 0 16px;
        }

        .features-subtitle {
          font-size: 16px;
          color: #888;
          max-width: 600px;
          margin: 0 auto;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
        }

        .feature-card {
          background: rgba(17,17,20,0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(110,231,183,0.08);
          border-radius: 24px;
          padding: 32px;
          text-align: center;
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          border-color: rgba(110,231,183,0.2);
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }

        .feature-icon {
          font-size: 42px;
          margin-bottom: 20px;
        }

        .feature-title {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #f0f0f3;
          margin: 0 0 12px;
        }

        .feature-desc {
          font-size: 14px;
          color: #888;
          line-height: 1.6;
          margin: 0;
        }

        /* CTA Section */
        .home-cta {
          position: relative;
          z-index: 5;
          padding: 80px 24px;
          background: linear-gradient(135deg, rgba(110,231,183,0.05), transparent);
          border-top: 1px solid rgba(110,231,183,0.1);
          border-bottom: 1px solid rgba(110,231,183,0.1);
        }

        .cta-container {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        .cta-title {
          font-family: 'Syne', sans-serif;
          font-size: 42px;
          font-weight: 700;
          color: #f0f0f3;
          margin: 0 0 16px;
        }

        .cta-subtitle {
          font-size: 18px;
          color: #888;
          margin: 0 0 32px;
        }

        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 42px;
          background: #6EE7B7;
          border: 1px solid #4fb88b;
          border-radius: 100px;
          color: #0c0c0f;
          text-decoration: none;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .cta-button:hover {
          background: #86efac;
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(110,231,183,0.4);
        }

        /* Footer */
        .home-footer {
          position: relative;
          z-index: 5;
          padding: 40px 24px;
          background: rgba(10,10,10,0.9);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(110,231,183,0.1);
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .footer-logo {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .footer-logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #f0f0f3;
        }

        .footer-copyright {
          font-size: 12px;
          color: #5c5c6e;
        }

        .footer-links {
          display: flex;
          gap: 32px;
        }

        .footer-link {
          color: #888;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s ease;
        }

        .footer-link:hover {
          color: #6EE7B7;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .hero-container {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .hero-subtitle {
            margin: 0 auto 32px;
          }

          .hero-cta {
            justify-content: center;
          }

          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .hero-visual {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .nav-container {
            flex-direction: column;
            gap: 16px;
          }

          .nav-links {
            gap: 20px;
          }

          .hero-title {
            font-size: 42px;
          }

          .stats-container {
            flex-direction: column;
            gap: 30px;
          }

          .stat-divider {
            display: none;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .footer-container {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }

          .cta-title {
            font-size: 32px;
          }
        }
      `}</style>
    </div>
  );
}
"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already logged in
  React.useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // Show nothing while checking auth
  if (loading) {
    return (
      <div className="landing-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  // If user is logged in, don't render (redirect will happen)
  if (user) {
    return null;
  }

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-text">HackForge</span>
            <span className="logo-badge">beta</span>
          </div>
          <div className="nav-links">
            <Link href="#features" className="nav-link">Features</Link>
            <Link href="#how-it-works" className="nav-link">How it works</Link>
            <Link href="/about" className="nav-link">About</Link>
          </div>
          <div className="nav-buttons">
            <Link href="/login" className="nav-btn-secondary">
              Log in
            </Link>
            <Link href="/register" className="nav-btn-primary">
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="eyebrow-dot" />
              <span className="eyebrow-text">HACKATHON PLATFORM</span>
            </div>
            <h1 className="hero-title">
              Build, compete, and <br />
              <span className="hero-gradient">win together</span>
            </h1>
            <p className="hero-subtitle">
              Join the ultimate hackathon community. Form teams, submit projects, 
              get expert feedback, and showcase your skills to the world.
            </p>
            <div className="hero-actions">
              <Link href="/register" className="hero-btn-primary">
                Get started
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <Link href="#how-it-works" className="hero-btn-secondary">
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
                  <span className="card-badge">Live</span>
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
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="landing-stats">
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-number">500+</span>
            <span className="stat-name">Hackathons</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">10k+</span>
            <span className="stat-name">Hackers</span>
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
      <section id="features" className="landing-features">
        <div className="features-container">
          <h2 className="features-title">Everything you need to hack</h2>
          <p className="features-subtitle">
            From team formation to final submissions, we've got you covered
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3 className="feature-heading">Discover events</h3>
              <p className="feature-description">
                Find hackathons that match your interests and skill level
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3 className="feature-heading">Form teams</h3>
              <p className="feature-description">
                Connect with like-minded hackers and build dream teams
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3 className="feature-heading">Submit projects</h3>
              <p className="feature-description">
                Showcase your work and get feedback from expert judges
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚖️</div>
              <h3 className="feature-heading">Expert judging</h3>
              <p className="feature-description">
                Get scored by industry professionals with detailed feedback
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3 className="feature-heading">Community</h3>
              <p className="feature-description">
                Engage with fellow hackers, share ideas, and grow together
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3 className="feature-heading">Win prizes</h3>
              <p className="feature-description">
                Compete for prizes and get recognized for your work
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="landing-how-it-works">
        <div className="how-container">
          <h2 className="how-title">How it works</h2>
          <p className="how-subtitle">Four simple steps to hackathon success</p>

          <div className="how-grid">
            <div className="how-step">
              <div className="step-number">1</div>
              <h3 className="step-title">Find an event</h3>
              <p className="step-description">
                Browse upcoming hackathons and find one that excites you
              </p>
            </div>

            <div className="how-step">
              <div className="step-number">2</div>
              <h3 className="step-title">Join or form a team</h3>
              <p className="step-description">
                Team up with other hackers or create your own team
              </p>
            </div>

            <div className="how-step">
              <div className="step-number">3</div>
              <h3 className="step-title">Build your project</h3>
              <p className="step-description">
                Collaborate with your team to create something amazing
              </p>
            </div>

            <div className="how-step">
              <div className="step-number">4</div>
              <h3 className="step-title">Submit and win</h3>
              <p className="step-description">
                Submit your project and get judged by experts
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta">
        <div className="cta-container">
          <h2 className="cta-title">Ready to start hacking?</h2>
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
          <p className="cta-login">
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
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
        .landing-page {
          min-height: 100vh;
          background: #0a0a0a;
          color: #f0f0f3;
          font-family: 'DM Sans', sans-serif;
        }

        .landing-loading {
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
        .landing-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(10,10,10,0.8);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(110,231,183,0.1);
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 24px;
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
        .landing-hero {
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

        .hero-content {
          max-width: 540px;
        }

        .hero-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
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
          font-size: 52px;
          font-weight: 800;
          line-height: 1.1;
          margin: 0 0 20px;
          letter-spacing: -1px;
        }

        .hero-gradient {
          background: linear-gradient(135deg, #6EE7B7, #4fb88b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 16px;
          color: #888;
          line-height: 1.7;
          margin: 0 0 32px;
        }

        .hero-actions {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .hero-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 28px;
          background: #6EE7B7;
          border: 1px solid #4fb88b;
          border-radius: 100px;
          color: #0c0c0f;
          text-decoration: none;
          font-size: 15px;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .hero-btn-primary:hover {
          background: #86efac;
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(110,231,183,0.4);
        }

        .hero-btn-secondary {
          padding: 12px 24px;
          color: #888;
          text-decoration: none;
          font-size: 15px;
          transition: color 0.2s ease;
        }

        .hero-btn-secondary:hover {
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
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .visual-card:hover {
          transform: translateY(-4px);
          border-color: rgba(110,231,183,0.3);
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
          padding: 20px;
        }

        .card-1 {
          top: 40px;
          right: 20px;
          width: 260px;
        }

        .card-2 {
          bottom: 40px;
          left: 0;
          width: 220px;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .card-avatars {
          display: flex;
          align-items: center;
        }

        .avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(110,231,183,0.1);
          border: 2px solid rgba(110,231,183,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: -8px;
          font-size: 12px;
        }

        .card-badge {
          padding: 4px 8px;
          background: rgba(110,231,183,0.1);
          border: 1px solid rgba(110,231,183,0.2);
          border-radius: 100px;
          font-size: 10px;
          color: #6EE7B7;
        }

        .card-title {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .card-meta {
          font-size: 11px;
          color: #888;
        }

        .card-stats {
          display: flex;
          gap: 20px;
        }

        .stat {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #6EE7B7;
        }

        .stat-label {
          font-size: 10px;
          color: #888;
          text-transform: uppercase;
        }

        /* Stats Section */
        .landing-stats {
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
        .landing-features {
          padding: 100px 24px;
        }

        .features-container {
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
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
          margin: 0 auto 60px;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
        }

        .feature-card {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 20px;
          padding: 32px 24px;
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          border-color: rgba(110,231,183,0.3);
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }

        .feature-icon {
          font-size: 42px;
          margin-bottom: 20px;
        }

        .feature-heading {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #f0f0f3;
          margin: 0 0 12px;
        }

        .feature-description {
          font-size: 14px;
          color: #888;
          line-height: 1.6;
          margin: 0;
        }

        /* How It Works */
        .landing-how-it-works {
          padding: 80px 24px;
          background: rgba(17,17,20,0.5);
          border-top: 1px solid rgba(110,231,183,0.05);
          border-bottom: 1px solid rgba(110,231,183,0.05);
        }

        .how-container {
          max-width: 1000px;
          margin: 0 auto;
          text-align: center;
        }

        .how-title {
          font-family: 'Syne', sans-serif;
          font-size: 36px;
          font-weight: 700;
          color: #f0f0f3;
          margin: 0 0 16px;
        }

        .how-subtitle {
          font-size: 16px;
          color: #888;
          margin-bottom: 60px;
        }

        .how-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 30px;
        }

        .how-step {
          text-align: center;
        }

        .step-number {
          width: 48px;
          height: 48px;
          margin: 0 auto 20px;
          background: rgba(110,231,183,0.1);
          border: 1px solid rgba(110,231,183,0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #6EE7B7;
        }

        .step-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #f0f0f3;
          margin: 0 0 8px;
        }

        .step-description {
          font-size: 14px;
          color: #888;
          line-height: 1.6;
          margin: 0;
        }

        /* CTA Section */
        .landing-cta {
          padding: 100px 24px;
          text-align: center;
        }

        .cta-container {
          max-width: 700px;
          margin: 0 auto;
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
          margin-bottom: 20px;
        }

        .cta-button:hover {
          background: #86efac;
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(110,231,183,0.4);
        }

        .cta-login {
          font-size: 14px;
          color: #888;
        }

        .cta-login a {
          color: #6EE7B7;
          text-decoration: none;
          font-weight: 600;
        }

        .cta-login a:hover {
          text-decoration: underline;
        }

        /* Footer */
        .landing-footer {
          padding: 40px 24px;
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

          .hero-content {
            max-width: 100%;
          }

          .hero-actions {
            justify-content: center;
          }

          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .how-grid {
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

          .how-grid {
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
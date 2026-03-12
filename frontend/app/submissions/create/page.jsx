"use client";
 
import React from "react";
import Link from "next/link";
import SubmissionForm from "../../../components/submissions/SubmissionForm";
 
export default function CreateSubmissionPage() {
  return (
    <>
      {/* This full-page backdrop kills any green tint bleeding from layout */}
      <div style={{
        position: "fixed",
        inset: 0,
        background: "#0c0c0f",
        zIndex: 0,
        pointerEvents: "none"
      }} />
 
      <div style={{
        position: "relative",
        zIndex: 1,
        maxWidth: "900px",
        margin: "0 auto",
        padding: "36px 32px 64px",
        fontFamily: "'DM Sans', sans-serif",
        minHeight: "calc(100vh - 70px)"
      }}>
 
        <Link href="/submissions" className="evc-back-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        <span>Back to Submissions</span>
      </Link>
 
        <div className="evc-eyebrow">
          <div className="evc-eyebrow-dot" />
          <span className="evc-eyebrow-label">New Project</span>
        </div>
        <h1 className="evc-title">Submit Your Project</h1>
        <p className="evc-subtitle">Share your hackathon creation with the world</p>
 
        <div className="evc-card">
          <SubmissionForm />
        </div>
       
    

      <style jsx>{`
        .evc-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
          min-height: 100vh;
          background: #0a0a0a;
          position: relative;
          font-family: 'DM Sans', sans-serif;
        }
        
        .evc-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 1.2rem 0.6rem 1rem;
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 30px;
          color: #5c5c6e;
          font-size: 0.9rem;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 1.75rem;
          text-decoration: none;
          width: fit-content;
        }
        
        .evc-back-btn:hover {
          background: #17171b;
          border-color: #6EE7B7;
          color: #f0f0f3;
          transform: translateX(-4px);
        }
        
        .evc-back-btn svg {
          width: 18px;
          height: 18px;
          transition: transform 0.2s ease;
        }
        
        .evc-back-btn:hover svg {
          transform: translateX(-2px);
          stroke: #6EE7B7;
        }
        
        .evc-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .evc-eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6EE7B7;
        }
        
        .evc-eyebrow-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #6EE7B7;
        }
        
        .evc-title {
          font-family: 'Syne', sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: #f0f0f3;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.02em;
        }
        
        .evc-subtitle {
          font-size: 1rem;
          color: #5c5c6e;
          margin: 0 0 2rem 0;
          line-height: 1.6;
        }
        
        .evc-card {
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
        }
        
        /* Background blobs */
        .blob {
          position: fixed;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          filter: blur(80px);
          z-index: 0;
          pointer-events: none;
        }
        
        .blob1 {
          top: -100px;
          right: -100px;
          background: rgba(110, 231, 183, 0.15);
        }
        
        .blob2 {
          bottom: -100px;
          left: -100px;
          background: rgba(110, 231, 183, 0.1);
        }
        
        .blob3 {
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 400px;
          height: 400px;
          background: rgba(110, 231, 183, 0.05);
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .evc-page {
            padding: 1.5rem 1rem;
          }
          
          .evc-title {
            font-size: 2rem;
          }
          
          .evc-card {
            padding: 1.5rem;
          }
        }
        
        @media (max-width: 480px) {
          .evc-title {
            font-size: 1.75rem;
          }
          
          .evc-card {
            padding: 1.25rem;
          }
        }
      `}</style>
    </div>
    </>
  );
}
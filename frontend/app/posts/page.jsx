"use client";

import { useState, useEffect } from "react";
import axios from "../../utils/axios";
import "../../styles/global.css";

export default function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState({ type: null, text: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const fetchPosts = async () => {
    setIsFetching(true);
    try {
      const res = await axios.get("/posts/");
      setPosts(res.data.results || res.data);
      setMessage({ type: null, text: "" });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to load posts" });
    } finally {
      setIsFetching(false);
    }
  };

  const createPost = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: null, text: "" });

    try {
      await axios.post("/posts/", { title, content });
      setTitle("");
      setContent("");
      setMessage({ type: "success", text: "Post created successfully!" });
      fetchPosts();
    } catch (err) {
      console.error(err);
      setMessage({ 
        type: "error", 
        text: err.response?.data?.message || "Failed to create post" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="posts-container">
      {/* Animated background blobs */}
      <div className="blob blob1" aria-hidden="true"></div>
      <div className="blob blob2" aria-hidden="true"></div>
      <div className="blob blob3" aria-hidden="true"></div>

      <div className="posts-card">
        <div className="posts-header">
          <h1 className="posts-title">Posts</h1>
          <p className="posts-subtitle">Create and view posts</p>
        </div>

        {/* Create Post Form */}
        <form onSubmit={createPost} className="posts-form">
          <div className="posts-input-group">
            <label htmlFor="title" className="posts-label">Title</label>
            <div className="posts-input-wrapper">
              <svg className="posts-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16v16H4z"></path>
                <path d="M8 8h8v2H8zM8 12h8v2H8zM8 16h4v2H8z"></path>
              </svg>
              <input
                id="title"
                type="text"
                placeholder="Enter post title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="posts-input"
                required
                disabled={isLoading}
                minLength={3}
                maxLength={100}
              />
            </div>
          </div>

          <div className="posts-input-group">
            <label htmlFor="content" className="posts-label">Content</label>
            <div className="posts-input-wrapper">
              <svg className="posts-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <textarea
                id="content"
                placeholder="Write your post content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="posts-input posts-textarea"
                rows={5}
                required
                disabled={isLoading}
                minLength={10}
                maxLength={1000}
              />
            </div>
            <p className="posts-hint">
              {content.length}/1000 characters
            </p>
          </div>

          <button 
            type="submit" 
            className={`posts-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="posts-loader"></span>
                <span>Creating...</span>
              </>
            ) : (
              "Create Post"
            )}
          </button>

          {message.type && (
            <div 
              className={`posts-message ${message.type}`}
              role="alert"
            >
              <svg className="posts-message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {message.type === "success" ? (
                  <path d="M20 6L9 17l-5-5" />
                ) : (
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </>
                )}
              </svg>
              {message.text}
            </div>
          )}
        </form>

        {/* Posts List */}
        <div className="posts-section">
          <h2 className="posts-section-title">All Posts</h2>
          
          {isFetching ? (
            <div className="posts-loading">
              <div className="posts-spinner"></div>
              <p>Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="posts-empty">
              <svg className="posts-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16v16H4z"></path>
                <line x1="8" y1="8" x2="16" y2="16"></line>
                <line x1="16" y1="8" x2="8" y2="16"></line>
              </svg>
              <p className="posts-empty-text">No posts yet. Create your first post above!</p>
            </div>
          ) : (
            <div className="posts-grid">
              {posts.map((post) => (
                <div key={post.id} className="posts-item">
                  <div className="posts-item-header">
                    <h3 className="posts-item-title">{post.title}</h3>
                    <span className="posts-item-owner">@{post.owner || 'anonymous'}</span>
                  </div>
                  <p className="posts-item-content">{post.content}</p>
                  {post.created_at && (
                    <time className="posts-item-date">
                      {new Date(post.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </time>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


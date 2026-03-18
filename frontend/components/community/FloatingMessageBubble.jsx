"use client";

import { useEffect, useRef, useState } from "react";
import axios from "@/utils/axios";
import { useAuth } from "@/context/AuthContext";
import { useMessaging } from "@/context/MessagingContext";
import DMPanel from "@/components/community/DMPanel";

export default function FloatingMessageBubble() {
  const { user } = useAuth();
  const { isOpen, activeRecipient, openInbox, closeChat } = useMessaging();
  const [unreadCount, setUnreadCount] = useState(0);
  const bubbleRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    let mounted = true;

    const fetchUnread = async () => {
      try {
        const res = await axios.get("/messages/unread/count/");
        if (mounted) setUnreadCount(res.data.count || 0);
      } catch (err) {
        console.error("Error fetching unread count:", err);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user?.id]);

  if (!user) return null;

  return (
    <div className="msg-bubble-wrap">
      <button
        ref={bubbleRef}
        className="msg-bubble-btn"
        onClick={() => (isOpen ? closeChat() : openInbox())}
        aria-label="Messages"
      >
        <svg className="msg-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {unreadCount > 0 && (
          <span className="msg-bubble-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      <DMPanel
        currentUser={user}
        initialRecipient={activeRecipient}
        isOpen={isOpen}
        onClose={closeChat}
        anchorRef={bubbleRef}
        showTrigger={false}
      />

      <style jsx>{`
        .msg-bubble-wrap {
          position: fixed;
          right: 32px;
          bottom: 32px;
          z-index: 1200;
          filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.3));
        }

        .msg-bubble-btn {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: #111114;
          border: 1px solid rgba(110, 231, 183, 0.2);
          color: #6EE7B7;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          backdrop-filter: blur(8px);
        }

        .msg-bubble-btn:hover {
          background: #1a1a1f;
          border-color: rgba(110, 231, 183, 0.4);
          transform: translateY(-2px);
        }

        .msg-icon {
          width: 22px;
          height: 22px;
          stroke: currentColor;
        }

        .msg-bubble-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          min-width: 20px;
          height: 20px;
          padding: 0 5px;
          border-radius: 100px;
          background: #f87171;
          color: white;
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #0a0a0a;
          box-shadow: 0 2px 8px rgba(248, 113, 113, 0.3);
        }

        @media (max-width: 768px) {
          .msg-bubble-wrap {
            right: 20px;
            bottom: 90px;
          }
          
          .msg-bubble-btn {
            width: 48px;
            height: 48px;
            border-radius: 14px;
          }
          
          .msg-icon {
            width: 20px;
            height: 20px;
          }
        }
      `}</style>
    </div>
  );
}
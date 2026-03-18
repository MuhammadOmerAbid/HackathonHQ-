"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "../../utils/axios";

function MsgBubble({ msg, isMe }) {
  const t = new Date(msg.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
  
  return (
    <div className={`msg-bubble-wrapper ${isMe ? 'me' : 'other'}`}>
      {!isMe && (
        <div className="msg-avatar">
          {msg.sender?.avatar ? (
            <img src={msg.sender.avatar} alt="" />
          ) : (
            msg.sender?.username?.[0]?.toUpperCase()
          )}
        </div>
      )}
      <div className={`msg-content ${isMe ? 'me' : 'other'}`}>
        <div className="msg-text">{msg.content}</div>
        <span className="msg-time">{t}</span>
      </div>
      
      <style jsx>{`
        .msg-bubble-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          margin-bottom: 16px;
          max-width: 85%;
        }
        .msg-bubble-wrapper.me {
          margin-left: auto;
          flex-direction: row-reverse;
        }
        
        .msg-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(110,231,183,0.1);
          border: 1.5px solid rgba(110,231,183,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #6EE7B7;
          flex-shrink: 0;
          overflow: hidden;
        }
        .msg-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .msg-content {
          display: flex;
          flex-direction: column;
          max-width: calc(100% - 36px);
        }
        .msg-content.other {
          align-items: flex-start;
        }
        .msg-content.me {
          align-items: flex-end;
        }
        
        .msg-text {
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 13px;
          line-height: 1.5;
          word-break: break-word;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          max-width: 100%;
        }
        .msg-content.other .msg-text {
          background: #17171b;
          border: 1px solid #26262e;
          color: #f0f0f3;
          border-bottom-left-radius: 4px;
        }
        .msg-content.me .msg-text {
          background: rgba(110,231,183,0.15);
          border: 1px solid rgba(110,231,183,0.3);
          color: #f0f0f3;
          border-bottom-right-radius: 4px;
        }
        
        .msg-time {
          font-size: 10px;
          color: #5c5c6e;
          margin-top: 4px;
          padding: 0 4px;
        }
      `}</style>
    </div>
  );
}

function ConvoRow({ convo, meId, active, onClick }) {
  const isTeam = !!convo.is_team;
  const other = !isTeam ? (convo.other_user || convo.participants?.find(p=>p.id!==meId)) : null;
  const last  = convo.last_message;
  const unread= convo.unread_count||0;
  const teamName = convo.team?.name || "Team";
  const displayName = isTeam ? teamName : (other?.username||"Unknown");
  const displayInitial = (isTeam ? teamName?.[0] : other?.username?.[0])?.toUpperCase() || "?";
  
  const ago = (d) => {
    if (!d) return "";
    const m = Math.floor((Date.now()-new Date(d))/60000);
    if (m < 1) return "now"; 
    if (m < 60) return `${m}m`; 
    if (m < 1440) return `${Math.floor(m/60)}h`; 
    return `${Math.floor(m/1440)}d`;
  };
  
  return (
    <div className={`convo-row ${active ? 'active' : ''}`} onClick={onClick}>
      <div className="convo-avatar">
        {isTeam ? (
          <span className="convo-team-initial">{displayInitial}</span>
        ) : other?.avatar ? (
          <img src={other.avatar} alt="" />
        ) : (
          displayInitial
        )}
        {unread > 0 && <span className="convo-badge">{unread}</span>}
      </div>
      <div className="convo-info">
        <div className="convo-header">
          <div className="convo-title">
            <span className="convo-name">{displayName}</span>
            {isTeam && <span className="convo-team-badge">Team</span>}
          </div>
          <span className="convo-time">{ago(last?.created_at)}</span>
        </div>
        <div className="convo-preview">
          {last?.content?.slice(0,40) || <em>{isTeam ? "No team messages yet" : "No messages yet"}</em>}
        </div>
      </div>
      
      <style jsx>{`
        .convo-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid #1e1e24;
        }
        .convo-row:last-child {
          border-bottom: none;
        }
        .convo-row:hover {
          background: #151519;
        }
        .convo-row.active {
          background: #151519;
          border-left: 3px solid #6EE7B7;
        }
        
        .convo-avatar {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(110,231,183,0.1);
          border: 2px solid rgba(110,231,183,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #6EE7B7;
          flex-shrink: 0;
          overflow: hidden;
        }
        .convo-team-initial {
          font-size: 16px;
          font-weight: 700;
          color: #6EE7B7;
        }
        .convo-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .convo-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 50px;
          background: #f87171;
          color: white;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #111114;
        }
        
        .convo-info {
          flex: 1;
          min-width: 0;
        }
        .convo-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .convo-title {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }
        .convo-name {
          font-size: 14px;
          font-weight: 600;
          color: #f0f0f3;
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .convo-team-badge {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          padding: 2px 6px;
          border-radius: 999px;
          background: rgba(110,231,183,0.12);
          color: #6EE7B7;
          border: 1px solid rgba(110,231,183,0.25);
        }
        .convo-time {
          font-size: 11px;
          color: #5c5c6e;
        }
        .convo-preview {
          font-size: 12px;
          color: #888;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
}

export default function DMPanel({
  currentUser,
  initialRecipient = null,
  onClose,
  isOpen: controlledOpen,
  onOpen,
  anchorRef = null,
  showTrigger = true,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [convos, setConvos] = useState([]);
  const [active, setActive] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loadC, setLoadC] = useState(false);
  const [loadM, setLoadM] = useState(false);
  const [srch, setSrch] = useState("");
  const [sRes, setSRes] = useState([]);
  const [view, setView] = useState("list");
  const [unreadCount, setUnreadCount] = useState(0);
  const [panelPosition, setPanelPosition] = useState("down");
  const [panelHeight, setPanelHeight] = useState(600);
  const [panelCoords, setPanelCoords] = useState({ top: 0, left: 0 });
  
  const endRef = useRef(null);
  const inRef = useRef(null);
  const pollRef = useRef(null);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const openPanel = () => {
    if (onOpen) return onOpen();
    setInternalOpen(true);
  };

  const closePanel = () => {
    if (onClose) onClose();
    if (controlledOpen === undefined) setInternalOpen(false);
    setView("list");
    setActive(null);
  };

  useEffect(() => {
    if (isOpen) {
      fetchConvos();
      fetchUnreadCount();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      fetchUnreadCount();
      if (isOpen) {
        fetchConvos(true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [currentUser?.id, isOpen]);

  useEffect(() => {
    if (initialRecipient && isOpen) {
      startConvo(initialRecipient);
    } else if (isOpen && !initialRecipient) {
      setView("list");
    }
  }, [initialRecipient?.id, isOpen]);

  useEffect(() => {
    if (isOpen && active) {
      endRef.current?.scrollIntoView({behavior:"smooth"});
    }
  }, [msgs, isOpen, active]);

  useEffect(() => {
    if (isOpen && active) {
      clearInterval(pollRef.current);
      pollRef.current = setInterval(() => fetchMsgs(active.id, true), 5000);
    }
    return () => clearInterval(pollRef.current);
  }, [active?.id, isOpen]);

  useEffect(() => {
    const anchorEl = anchorRef?.current || triggerRef.current;
    if (isOpen && anchorEl) {
      const calculatePosition = () => {
        const triggerRect = anchorEl.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const panelWidth = 360;
        const margin = 12;
        const spaceBelow = viewportHeight - triggerRect.bottom - 30;
        const spaceAbove = triggerRect.top - 30;
        const desiredHeight = 600;
        
        let nextPosition = "down";
        let nextHeight = desiredHeight;
        if (spaceBelow >= desiredHeight) {
          nextPosition = "down";
          nextHeight = desiredHeight;
        } else if (spaceAbove >= desiredHeight) {
          nextPosition = "up";
          nextHeight = desiredHeight;
        } else if (spaceBelow > spaceAbove) {
          nextPosition = "down";
          nextHeight = Math.max(350, spaceBelow);
        } else {
          nextPosition = "up";
          nextHeight = Math.max(350, spaceAbove);
        }

        const left = Math.min(
          Math.max(triggerRect.right - panelWidth, margin),
          viewportWidth - panelWidth - margin
        );
        const top =
          nextPosition === "down"
            ? triggerRect.bottom + 10
            : triggerRect.top - nextHeight - 10;

        setPanelPosition(nextPosition);
        setPanelHeight(nextHeight);
        setPanelCoords({
          top: Math.max(margin, Math.min(viewportHeight - nextHeight - margin, top)),
          left,
        });
      };
      
      calculatePosition();
      
      window.addEventListener("scroll", calculatePosition, true);
      window.addEventListener("resize", calculatePosition);
      
      return () => {
        window.removeEventListener("scroll", calculatePosition, true);
        window.removeEventListener("resize", calculatePosition);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!isOpen) return;
      const anchorEl = anchorRef?.current || triggerRef.current;
      const clickedPanel = panelRef.current && panelRef.current.contains(e.target);
      const clickedTrigger = anchorEl && anchorEl.contains(e.target);
      if (!clickedPanel && !clickedTrigger) {
        closePanel();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  const fetchConvos = async (silent=false) => {
    if (!silent) setLoadC(true);
    try { 
      const r = await axios.get("/messages/conversations/"); 
      setConvos(r.data.results||r.data||[]); 
    } catch(e){console.error(e)}
    finally{if (!silent) setLoadC(false);}
  };

  const fetchUnreadCount = async () => {
    try {
      const r = await axios.get("/messages/unread/count/");
      setUnreadCount(r.data.count || 0);
    } catch(e){console.error(e)}
  };

  const fetchMsgs = async (id, silent=false) => {
    if(!silent) setLoadM(true);
    try { 
      const r = await axios.get(`/messages/conversations/${id}/messages/`); 
      setMsgs(r.data.results||r.data||[]);
      if (!silent) fetchUnreadCount();
    } catch(e){console.error(e)}
    finally{if(!silent) setLoadM(false);}
  };

  const startConvo = async (recipient) => {
    try {
      const r = await axios.post("/messages/conversations/", {recipient_id:recipient.id});
      const convo = {...r.data, other_user:recipient};
      setActive(convo); 
      await fetchMsgs(convo.id); 
      setView("chat"); 
      setSrch(""); 
      setSRes([]);
      setTimeout(()=>inRef.current?.focus(),100);
    } catch(e){console.error(e);}
  };

  const openConvo = async (c) => {
    setActive(c); 
    setView("chat"); 
    await fetchMsgs(c.id); 
    setTimeout(()=>inRef.current?.focus(),100);
  };

  const send = async () => {
    if (!newMsg.trim()||!active) return;
    setSending(true);
    try {
      const r = await axios.post(`/messages/conversations/${active.id}/messages/`, {content:newMsg.trim()});
      setMsgs(p=>[...p,r.data]); 
      setNewMsg(""); 
      fetchConvos();
      fetchUnreadCount();
    } catch(e){console.error(e);}
    finally{setSending(false);}
  };

  const searchUsers = async (q) => {
    setSrch(q);
    if (!q.trim()) { setSRes([]); return; }
    try { 
      const r = await axios.get(`/users/?search=${q}&page_size=5`); 
      setSRes((r.data.results||r.data||[]).filter(u=>u.id!==currentUser.id)); 
    } catch(e){console.error(e);}
  };

  const activeIsTeam = !!active?.is_team;
  const activeTeam = activeIsTeam ? active?.team : null;
  const other = !activeIsTeam
    ? (active?.other_user || active?.participants?.find(p=>p.id!==currentUser.id))
    : null;
  
  return (
    <div className="dm-container">
      {showTrigger && !isOpen && (
        <button 
          ref={triggerRef}
          className="dm-trigger" 
          onClick={openPanel}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>Messages</span>
          {unreadCount > 0 && <span className="dm-trigger-badge">{unreadCount}</span>}
        </button>
      )}

      {isOpen && typeof window !== "undefined" && createPortal(
        <div 
          className={`dm-panel dm-panel-${panelPosition}`}
          style={{ height: panelHeight, top: panelCoords.top, left: panelCoords.left }}
          ref={panelRef}
        >
          {/* Header */}
          <div className="dm-header">
            {view === "chat" && (
              <button className="dm-back-btn" onClick={() => setView("list")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
            )}
            
            {view === "chat" ? (
              <>
                <div className="dm-header-avatar">
                  {activeIsTeam ? (
                    <span className="dm-team-initial">
                      {activeTeam?.name?.[0]?.toUpperCase() || "T"}
                    </span>
                  ) : other?.avatar ? (
                    <img src={other.avatar} alt="" />
                  ) : (
                    other?.username?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="dm-header-meta">
                  <span className="dm-header-name">
                    {activeIsTeam ? (activeTeam?.name || "Team chat") : other?.username}
                  </span>
                  {activeIsTeam && <span className="dm-header-subtitle">Team chat</span>}
                </div>
              </>
            ) : (
              <h3 className="dm-header-title">Messages</h3>
            )}
            
            <button className="dm-close-btn" onClick={closePanel}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {view === "list" ? (
            <>
              {/* Search */}
              <div className="dm-search">
                <svg className="dm-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  className="dm-search-input"
                  placeholder="Find someone to message..."
                  value={srch}
                  onChange={e => searchUsers(e.target.value)}
                />
              </div>

              {/* Search Results */}
              {sRes.length > 0 && (
                <div className="dm-search-results">
                  {sRes.map(u => (
                    <div key={u.id} className="dm-search-row" onClick={() => startConvo(u)}>
                      <div className="dm-search-avatar">
                        {u.avatar ? <img src={u.avatar} alt="" /> : u.username?.[0]?.toUpperCase()}
                      </div>
                      <span className="dm-search-name">{u.username}</span>
                      <svg className="dm-search-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  ))}
                </div>
              )}

              {/* Conversations */}
              <div className="dm-conversations">
                {loadC ? (
                  <div className="dm-loading">
                    <span className="dm-spinner" />
                  </div>
                ) : convos.length === 0 ? (
                  <div className="dm-empty">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <p>No conversations yet</p>
                    <span>Search above to start one</span>
                  </div>
                ) : (
                  convos.map(c => (
                    <ConvoRow
                      key={c.id}
                      convo={{...c, me_id: currentUser.id}}
                      meId={currentUser.id}
                      active={active?.id === c.id}
                      onClick={() => openConvo(c)}
                    />
                  ))
                )}
              </div>
            </>
          ) : (
            /* Chat View */
            <div className="dm-chat-view">
              <div className="dm-messages">
                {loadM ? (
                  <div className="dm-loading">
                    <span className="dm-spinner" />
                  </div>
                ) : msgs.length === 0 ? (
                  <div className="dm-empty dm-empty-chat">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <p>
                      {activeIsTeam
                        ? `Say hello to team ${activeTeam?.name || ""}!`
                        : `Say hello to ${other?.username || ""}!`}
                    </p>
                  </div>
                ) : (
                  msgs.map(m => (
                    <MsgBubble
                      key={m.id}
                      msg={m}
                      isMe={m.sender?.id === currentUser.id || m.sender === currentUser.id}
                    />
                  ))
                )}
                <div ref={endRef} />
              </div>

              {/* Input */}
              <div className="dm-input-area">
                <textarea
                  ref={inRef}
                  className="dm-input"
                  placeholder={`Message ${activeIsTeam ? (activeTeam?.name || "team") : (other?.username || "")}...`}
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                />
                <button className="dm-send-btn" onClick={send} disabled={sending || !newMsg.trim()}>
                  {sending ? (
                    <span className="dm-spinner dm-spinner-small" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}

      <style jsx>{`
        .dm-container {
          position: relative;
          width: 100%;
        }

        /* Trigger Button */
        .dm-trigger {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 12px 16px;
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 12px;
          color: #888;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .dm-trigger:hover {
          background: #151519;
          border-color: rgba(110,231,183,0.3);
          color: #f0f0f3;
        }
        .dm-trigger svg {
          stroke: currentColor;
        }
        .dm-trigger-badge {
          margin-left: auto;
          background: #f87171;
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 100px;
          min-width: 20px;
          text-align: center;
        }

        /* Expanded Panel */
        .dm-panel {
          position: fixed;
          width: 360px;
          background: #111114;
          border: 1px solid #1e1e24;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          z-index: 1000;
        }

        .dm-panel-down {
          animation: slideDown 0.25s ease;
        }
        .dm-panel-up {
          animation: slideUp 0.25s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Header */
        .dm-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid #1e1e24;
          background: #111114;
          flex-shrink: 0;
        }
        .dm-header-title {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #f0f0f3;
          margin: 0;
          flex: 1;
        }
        .dm-header-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(110,231,183,0.12);
          border: 2px solid rgba(110,231,183,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #6EE7B7;
          overflow: hidden;
        }
        .dm-team-initial {
          font-size: 14px;
          font-weight: 700;
          color: #6EE7B7;
        }
        .dm-header-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .dm-header-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }
        .dm-header-name {
          font-size: 15px;
          font-weight: 600;
          color: #f0f0f3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dm-header-subtitle {
          font-size: 11px;
          color: #5c5c6e;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .dm-back-btn, .dm-close-btn {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid #1e1e24;
          border-radius: 8px;
          color: #5c5c6e;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .dm-back-btn:hover {
          color: #6EE7B7;
          border-color: rgba(110,231,183,0.3);
        }
        .dm-close-btn:hover {
          color: #f87171;
          border-color: #f87171;
        }

        /* Search */
        .dm-search {
          position: relative;
          padding: 12px 16px;
          border-bottom: 1px solid #1e1e24;
          flex-shrink: 0;
        }
        .dm-search-icon {
          position: absolute;
          left: 28px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: #3a3a48;
        }
        .dm-search-input {
          width: 100%;
          padding: 10px 16px 10px 44px;
          background: #17171b;
          border: 1px solid #1e1e24;
          border-radius: 100px;
          color: #f0f0f3;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .dm-search-input:focus {
          border-color: rgba(110,231,183,0.4);
        }

        /* Search Results */
        .dm-search-results {
          border-bottom: 1px solid #1e1e24;
          max-height: 200px;
          overflow-y: auto;
          flex-shrink: 0;
        }
        .dm-search-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .dm-search-row:hover {
          background: #151519;
        }
        .dm-search-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(110,231,183,0.08);
          border: 2px solid rgba(110,231,183,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #6EE7B7;
          overflow: hidden;
        }
        .dm-search-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .dm-search-name {
          flex: 1;
          font-size: 13px;
          font-weight: 500;
          color: #f0f0f3;
        }
        .dm-search-arrow {
          width: 14px;
          height: 14px;
          color: #3a3a48;
        }

        /* Conversations List */
        .dm-conversations {
          flex: 1;
          overflow-y: auto;
          min-height: 0;
        }

        /* Chat View */
        .dm-chat-view {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .dm-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          min-height: 0;
        }

        /* Input Area */
        .dm-input-area {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          padding: 16px;
          border-top: 1px solid #1e1e24;
          background: #111114;
          flex-shrink: 0;
        }
        .dm-input {
          flex: 1;
          padding: 10px 14px;
          background: #17171b;
          border: 1px solid #1e1e24;
          border-radius: 20px;
          color: #f0f0f3;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          resize: none;
          outline: none;
          max-height: 100px;
          line-height: 1.5;
        }
        .dm-input:focus {
          border-color: rgba(110,231,183,0.4);
        }
        .dm-send-btn {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #6EE7B7;
          border: none;
          border-radius: 50%;
          color: #0c0c0f;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .dm-send-btn:hover:not(:disabled) {
          background: #86efac;
          transform: scale(1.05);
        }
        .dm-send-btn:disabled {
          opacity: 0.4;
        }

        /* Loading States */
        .dm-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          flex: 1;
        }
        .dm-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #1e1e24;
          border-top-color: #6EE7B7;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        .dm-spinner-small {
          width: 16px;
          height: 16px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Empty States */
        .dm-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 40px 20px;
          color: #5c5c6e;
          text-align: center;
          flex: 1;
        }
        .dm-empty svg {
          color: #3a3a48;
        }
        .dm-empty p {
          font-size: 14px;
          font-weight: 600;
          color: #f0f0f3;
          margin: 0;
        }
        .dm-empty span {
          font-size: 12px;
        }

        /* Scrollbar Styling */
        .dm-conversations::-webkit-scrollbar,
        .dm-messages::-webkit-scrollbar,
        .dm-search-results::-webkit-scrollbar {
          width: 4px;
        }
        .dm-conversations::-webkit-scrollbar-thumb,
        .dm-messages::-webkit-scrollbar-thumb,
        .dm-search-results::-webkit-scrollbar-thumb {
          background: #1e1e24;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}

"use client";

import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

const MessagingContext = createContext(null);

export function MessagingProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeRecipient, setActiveRecipient] = useState(null);

  const openChat = useCallback((user) => {
    setActiveRecipient(user || null);
    setIsOpen(true);
  }, []);

  const openInbox = useCallback(() => {
    setActiveRecipient(null);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      activeRecipient,
      openChat,
      openInbox,
      closeChat,
      setActiveRecipient,
    }),
    [isOpen, activeRecipient, openChat, openInbox, closeChat]
  );

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error("useMessaging must be used within a MessagingProvider");
  }
  return context;
}

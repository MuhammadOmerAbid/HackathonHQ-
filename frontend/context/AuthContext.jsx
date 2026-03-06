"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "@/utils/axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOrganizer, setIsOrganizer] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get('/users/me/');
      setUser(response.data);
      
      // Check if user is organizer
      const organizerStatus = 
        response.data.profile?.is_organizer === true || 
        response.data.is_staff || 
        response.data.is_superuser;
      setIsOrganizer(organizerStatus);
    } catch (error) {
      console.error('Auth error:', error);
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (tokens) => {
    localStorage.setItem('access', tokens.access);
    localStorage.setItem('refresh', tokens.refresh);
    axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
    await checkAuth(); // This will fetch user data and set state
  };

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsOrganizer(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isOrganizer,
      login,
      logout,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
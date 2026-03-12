import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // e.g., http://127.0.0.1:8000/api/
  headers: { "Content-Type": "application/json" },
});

// Attach token to ALL requests by default
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("401 Unauthorized - Token may be expired");
      
      // Only redirect if not already on login page
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        // Clear tokens
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        
        // Store the current URL to redirect back after login
        const currentPath = window.location.pathname;
        if (currentPath !== "/login" && currentPath !== "/") {
          sessionStorage.setItem("redirectAfterLogin", currentPath);
        }
        
        // Redirect to login
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
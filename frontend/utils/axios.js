import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // e.g., http://127.0.0.1:8000/api/
  headers: { "Content-Type": "application/json" },
});

// Attach token only for protected endpoints
api.interceptors.request.use((config) => {
  const publicEndpoints = ["register/", "token/", "token/refresh/"];
  if (!publicEndpoints.some((url) => config.url?.includes(url))) {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
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

const MODERATION_CODES = new Set(["user_suspended", "user_banned"]);

const extractModeration = (data) => {
  if (!data || typeof data !== "object") return null;
  if (data.detail && typeof data.detail === "object") {
    return extractModeration(data.detail);
  }
  const code = data.code;
  const type = data.type;
  const message = data.message || "";
  if (code && MODERATION_CODES.has(code)) {
    return {
      code,
      type: type || (code === "user_banned" ? "ban" : "suspend"),
      until: data.until || null,
      reason: data.reason || "",
      detail: data.detail || "",
      message,
    };
  }
  if (type === "ban" || type === "suspend") {
    return {
      code: code || (type === "ban" ? "user_banned" : "user_suspended"),
      type,
      until: data.until || null,
      reason: data.reason || "",
      detail: data.detail || "",
      message,
    };
  }
  if (data.moderation && (data.moderation.type === "ban" || data.moderation.type === "suspend")) {
    const mod = data.moderation;
    return {
      code: mod.code || (mod.type === "ban" ? "user_banned" : "user_suspended"),
      type: mod.type,
      until: mod.until || null,
      reason: mod.reason || "",
      detail: mod.detail || data.detail || "",
      message: mod.message || message,
    };
  }
  return null;
};

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data;
    const moderation = extractModeration(data);
    if (moderation && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:moderation", { detail: moderation }));
      return Promise.reject(error);
    }

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

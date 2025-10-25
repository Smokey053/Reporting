import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? String(import.meta.env.VITE_API_URL)
    : "https://reporting-backend-1yy6.onrender.com/api",
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const stored = window.localStorage.getItem("luct-reporting-session");
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn("Failed to parse session token", err);
    }
  }

  return config;
});

export default api;

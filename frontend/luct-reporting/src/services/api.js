import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://reporting-backend-1yy6.onrender.com/",
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }
  const stored = window.localStorage.getItem("luct-reporting-session");
  if (stored) {
    const { token } = JSON.parse(stored);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;



import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api.js";

const AuthContext = createContext(null);
const STORAGE_KEY = "luct-reporting-session";

const loadSession = () => {
  if (typeof window === "undefined") {
    return { token: null, user: null };
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : { token: null, user: null };
  } catch (error) {
    console.warn("Unable to read session", error);
    return { token: null, user: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(loadSession);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (session?.token) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  const login = async (credentials) => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", credentials);
      setSession({ token: data.token, user: data.user });
      return data.user;
    } catch (err) {
      const message = err.response?.data?.message || "Unable to sign in";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", payload);
      setSession({ token: data.token, user: data.user });
      return data.user;
    } catch (err) {
      const message = err.response?.data?.message || "Unable to register";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setSession({ token: null, user: null });
  };

  const value = useMemo(
    () => ({
      user: session.user,
      token: session.token,
      login,
      register,
      logout,
      loading,
      error,
      setError,
    }),
    [session, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

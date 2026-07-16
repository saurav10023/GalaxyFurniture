import { createContext, useContext, useEffect, useState } from "react";
import {
  loginAdmin,
  logoutAdmin,
  fetchCurrentAdmin,
  getStoredUser,
  clearSession
} from "../api/axios"; // adjust path if api.js lives elsewhere

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore user on app load: hydrate instantly from whatever's cached in
  // localStorage (avoids a flash of "logged out" UI), then confirm against
  // the backend since the cached copy could be stale (blocked, role
  // changed, refresh token revoked elsewhere, etc).
  useEffect(() => {
    const cached = getStoredUser();
    if (cached) setUser(cached);

    refreshUser();

    // api.js dispatches this when a 401 survives the refresh attempt —
    // e.g. refresh token expired/revoked. Treat it as a hard logout.
    const handleSessionExpired = () => clearUser();
    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () =>
      window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, []);

  // Verify the cached user with the backend (getCurrentAdmin). This also
  // writes the freshest copy back to localStorage under "user" via
  // fetchCurrentAdmin itself, so there's no duplicate localStorage logic
  // here.
  const refreshUser = async () => {
    try {
      const admin = await fetchCurrentAdmin();
      setUser(admin);
    } catch (error) {
      clearUser();
    } finally {
      setLoading(false);
    }
  };

  // login({ mobileNumber, password }) — matches the Admin model's login
  // identifier. Delegates the network call + localStorage write to
  // loginAdmin() in api.js so there's a single source of truth for the
  // "user" key instead of two places writing it.
  const login = async ({ mobileNumber, password }) => {
    const admin = await loginAdmin({ mobileNumber, password });
    setUser(admin);
    return admin;
  };

  const clearUser = () => {
    clearSession();
    setUser(null);
  };

  // logout — calls backend to clear the refresh token, then always clears
  // local state even if the request fails (dropped connection shouldn't
  // leave a stale session sitting in the browser).
  const logout = async () => {
    try {
      await logoutAdmin();
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      clearUser();
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, setUser, refreshUser, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
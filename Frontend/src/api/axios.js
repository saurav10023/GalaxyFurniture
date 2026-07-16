import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
});

// ---------------------------------------------------------------------------
// Local storage helpers
// ---------------------------------------------------------------------------
// "user" always holds the admin document returned by the backend (minus
// password/refreshToken, per .select("-password -refreshToken") in the
// controller) — NOT the raw token. Keeping the key name "user" so existing
// code that reads it (AuthContext, the session-expired handler, etc.) keeps
// working without a rename.
const setSession = ({ admin, accessToken } = {}) => {
  if (admin) localStorage.setItem("user", JSON.stringify(admin));
  if (accessToken) localStorage.setItem("accessToken", accessToken);
};

const clearSession = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("accessToken");
};

const getStoredUser = () => {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

// Merged Request Interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Shared refresh state (fixes concurrent-401 race condition) ---
let isRefreshing = false;
let refreshPromise = null;

const performRefresh = async () => {
  const res = await axios.post(
    `${import.meta.env.VITE_API_URL}/api/v1/admin/refresh-token`,
    {},
    { withCredentials: true }
  );

  // refreshAccessToken controller only returns { accessToken, refreshToken }
  // — no admin object — so this only ever touches the "accessToken" key,
  // leaving whatever admin data is already stored under "user" untouched.
  const newAccessToken = res.data.data?.accessToken;
  if (newAccessToken) {
    localStorage.setItem("accessToken", newAccessToken);
  }
  return newAccessToken;
};

// Response Interceptor for handling 401s and Token Refresh
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // If a refresh is already in flight, piggyback on it instead of
        // firing a second /refresh-token call (avoids rotation races).
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = performRefresh().finally(() => {
            isRefreshing = false;
          });
        }

        await refreshPromise;

        return API(originalRequest);
      } catch (refreshError) {
        clearSession();

        // Dispatch instead of hard-reloading, so the app can navigate
        // via the router (no full page reload / lost SPA state).
        // Listen for this in App.jsx / a top-level component with useNavigate.
        window.dispatchEvent(new CustomEvent("auth:session-expired"));

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Admin auth endpoints
// ---------------------------------------------------------------------------
// Mirrors controllers/auth.controller.js + the Admin model 1:1:
//   - mobileNumber is the login identifier (not email)
//   - login response body is { admin, accessToken, refreshToken } even
//     though both tokens are also set as httpOnly cookies server-side
//   - registerAdmin is NOT public — it requires an existing admin's token
//     (verifyJWT + verifyAdmin on the route), so it's exposed here for the
//     admin dashboard's "add staff/admin" flow, not a public signup form
//
// Route names confirmed against AuthContext: login, logout, refresh-token,
// current-admin. Adjust AUTH_BASE below if admin.routes.js mounts elsewhere.
const AUTH_BASE = "/api/v1/admin";

export const loginAdmin = async ({ mobileNumber, password }) => {
  const res = await API.post(`${AUTH_BASE}/login`, { mobileNumber, password });
  const { admin, accessToken } = res.data.data;
  setSession({ admin, accessToken });
  return admin;
};

export const registerAdmin = async ({ mobileNumber, username, password }) => {
  const res = await API.post(`${AUTH_BASE}/register`, {
    mobileNumber,
    username,
    password
  });
  return res.data.data; // newly created admin — does not log the caller in
};

export const logoutAdmin = async () => {
  try {
    await API.post(`${AUTH_BASE}/logout`);
  } finally {
    clearSession();
  }
};

export const fetchCurrentAdmin = async () => {
  const res = await API.get(`${AUTH_BASE}/current-admin`);
  const admin = res.data.data;
  setSession({ admin });
  return admin;
};

export { getStoredUser, clearSession };
export default API;
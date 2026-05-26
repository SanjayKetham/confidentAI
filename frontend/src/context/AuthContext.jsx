import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5555/api';

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken]     = useState(() => localStorage.getItem('cai_token'));

  /* ── Hydrate user from stored token ── */
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchProfile() {
    try {
      const { data } = await axios.get(`${API_BASE}/auth/me`);
      setUser(data.user);
    } catch {
      // Token invalid / expired
      logout();
    } finally {
      setLoading(false);
    }
  }

  /* ── Register ─────────────────────── */
  async function register(name, email, password) {
    const { data } = await axios.post(`${API_BASE}/auth/register`, { name, email, password });
    _storeAuth(data);
    toast.success(`Welcome aboard, ${data.user.name}! 🎉`);
    return data;
  }

  /* ── Login ────────────────────────── */
  async function login(email, password) {
    const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
    _storeAuth(data);
    toast.success(`Welcome back, ${data.user.name}! 👋`);
    return data;
  }

  /* ── Logout ───────────────────────── */
  function logout() {
    localStorage.removeItem('cai_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  }

  /* ── Helpers ──────────────────────── */
  function _storeAuth({ token: t, user: u }) {
    localStorage.setItem('cai_token', t);
    axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    setToken(t);
    setUser(u);
  }

  const value = { user, token, loading, login, register, logout, setUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

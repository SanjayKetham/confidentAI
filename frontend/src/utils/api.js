import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5555/api',
  timeout: 15000,
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cai_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cai_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register: (d) => api.post('/auth/register', d),
  login:    (d) => api.post('/auth/login', d),
  me:       ()  => api.get('/auth/me'),
};

// ── Questions ─────────────────────────────────────────────────
export const questionsAPI = {
  getByCategory: (cat, level, limit = 60) => api.get(`/questions`, { params: { category: cat, difficulty: level, limit } }),
  getById:       (id)                     => api.get(`/questions/${id}`),
  getStats:      ()                       => api.get('/questions/stats'),
  create:        (d)                      => api.post('/questions', d),
  bulkCreate:    (questions)              => api.post('/questions/bulk', { questions }),
  update:        (id, d)                  => api.patch(`/questions/${id}`, d),
  delete:        (id)                     => api.delete(`/questions/${id}`),
  wipeAll:       ()                       => api.delete('/questions/wipe/all'),
};

// ── Coding Questions ──────────────────────────────────────────
export const codingQuestionsAPI = {
  list: (params)  => api.get('/coding-questions', { params }),
  get: (slug)     => api.get(`/coding-questions/${slug}`),
  create: (d)     => api.post('/coding-questions', d),
  update: (id, d) => api.patch(`/coding-questions/${id}`, d),
  delete: (id)    => api.delete(`/coding-questions/${id}`),
  seed: ()        => api.post('/coding-questions/seed'),
};

// ── Interviews ────────────────────────────────────────────────
export const interviewsAPI = {
  create:         (d)  => api.post('/interviews', d),
  getStats:       ()   => api.get('/interviews/stats'),
  getHistory:     ()   => api.get('/interviews/history'),
  getLeaderboard: ()   => api.get('/interviews/leaderboard'),
  getById:        (id) => api.get(`/interviews/${id}`),
};

// ── AI Dynamic Interviews ─────────────────────────────────────
export const aiInterviewAPI = {
  start:   (d) => api.post('/ai-interviews/start', d),
  respond: (d) => api.post('/ai-interviews/respond', d),
};

// ── Admin Portal ──────────────────────────────────────────────
export const adminAPI = {
  getStats:   ()     => api.get('/admin/stats'),
  getUsers:   ()     => api.get('/admin/users'),
  updateUser: (id, d)=> api.patch(`/admin/users/${id}`, d),
};

// ── Analytics ─────────────────────────────────────────────────
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getProgress:  () => api.get('/analytics/progress'),
};

// ── Compiler ──────────────────────────────────────────────────
export const compilerAPI = {
  run: (d) => api.post('/compiler/run', d),
};

export default api;

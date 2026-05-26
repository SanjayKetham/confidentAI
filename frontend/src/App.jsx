/* ── App.jsx — Main Router ───────────────────────────────────── */
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';

// Layout & Guards
import Layout         from './components/Layout';
import { ProtectedRoute, PublicRoute, AdminRoute } from './components/ProtectedRoute';

// Auth Pages
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// App Pages
import DashboardPage        from './pages/DashboardPage';
import PracticePage         from './pages/PracticePage';
import QuestionsPage        from './pages/QuestionsPage';
import InterviewSetupPage   from './pages/InterviewSetupPage';
import InterviewSessionPage from './pages/InterviewSessionPage';
import ResultsPage          from './pages/ResultsPage';
import SettingsPage         from './pages/SettingsPage';
import AdminPortalPage       from './pages/AdminPortalPage';
import AdminCodingPage       from './pages/AdminCodingPage';

import ResumePage           from './pages/ResumePage';
import AchievementsPage     from './pages/AchievementsPage';

// Placeholder Pages
import {
  NotFoundPage,
} from './pages/PlaceholderPages';

import AnalyticsPage from './pages/AnalyticsPage';
import CodingPage    from './pages/CodingPage';

export default function App() {
  return (
    <Routes>
      {/* ── Public / Auth Routes ── */}
      <Route path="/"         element={<LandingPage />} />
      <Route path="/login"    element={<PublicRoute><LoginPage    /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* ── Protected App Routes (with sidebar layout) ── */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="dashboard"   element={<DashboardPage />} />
        <Route path="practice"    element={<PracticePage />} />
        <Route path="questions"   element={<QuestionsPage />} />
        <Route path="coding"      element={<CodingPage />} />
        <Route path="resume"      element={<ResumePage />} />
        <Route path="analytics"   element={<AnalyticsPage />} />
        <Route path="achievements"element={<AchievementsPage />} />
        <Route path="settings"    element={<SettingsPage />} />
        <Route path="admin"       element={<AdminRoute><AdminPortalPage /></AdminRoute>} />
        <Route path="admin/coding" element={<AdminRoute><AdminCodingPage /></AdminRoute>} />
      </Route>

      {/* ── Interview Setup (camera/mic check, fullscreen) ── */}
      <Route path="/interview/setup"   element={<InterviewSetupPage />} />
      {/* ── Interview Session (live, fullscreen) ── */}
      <Route path="/interview/session" element={<InterviewSessionPage />} />
      <Route path="/interview/results" element={<ResultsPage />} />

      {/* ── Root redirect → dashboard ── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

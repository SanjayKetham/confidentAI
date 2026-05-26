/* ── Sidebar — Tailwind + shadcn/ui ──────────────────────────── */
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Mic, BookOpen, BarChart2,
  Code2, Upload, Trophy, Settings, LogOut,
  Brain, ChevronLeft, ChevronRight, Zap, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '@/lib/utils';
import ThemeToggle from './ThemeToggle';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',    to: '/dashboard' },
  { icon: Mic,             label: 'MockPractice', to: '/practice' },
  { icon: Code2,           label: 'Coding',       to: '/coding' },
  { icon: Upload,          label: 'Resume',       to: '/resume' },
  { icon: BarChart2,       label: 'Analytics',    to: '/analytics' },
  { icon: Trophy,          label: 'Achievements', to: '/achievements' },
  { icon: Settings,        label: 'Settings',     to: '/settings' },
];

const PRESET_AVATARS = {
  dev_purple: { emoji: '👾', bg: 'bg-gradient-to-br from-purple-600 to-indigo-600' },
  ai_cyan:    { emoji: '🤖', bg: 'bg-gradient-to-br from-cyan-500 to-blue-600' },
  design_rose: { emoji: '🎨', bg: 'bg-gradient-to-br from-rose-500 to-pink-600' },
  pm_gold:     { emoji: '👑', bg: 'bg-gradient-to-br from-amber-500 to-orange-600' },
  sys_emerald: { emoji: '⚡', bg: 'bg-gradient-to-br from-emerald-500 to-teal-600' },
  growth_amber: { emoji: '🚀', bg: 'bg-gradient-to-br from-orange-500 to-red-600' },
};

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const matchedAvatar = user && PRESET_AVATARS[user.avatar];

  let activeNavItems = [];
  if (user?.role === 'admin') {
    activeNavItems = [
      { icon: ShieldCheck, label: 'Admin Portal', to: '/admin' },
      { icon: Code2,       label: 'Manage Coding', to: '/admin/coding' },
      { icon: BookOpen,    label: 'Questions',    to: '/questions' },
      { icon: Settings,    label: 'Settings',     to: '/settings' },
    ];
  } else {
    activeNavItems = [...NAV_ITEMS];
  }

  return (
    <>
      <motion.aside
        className="fixed left-0 top-0 h-screen flex flex-col z-50 border-r overflow-hidden"
        style={{
          background: 'var(--sidebar-bg)',
          backdropFilter: 'blur(20px)',
          borderColor: 'var(--sidebar-border)',
        }}
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
          <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white"
               style={{ background: 'var(--gradient-brand)' }}>
            <Brain size={16} />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                className="gradient-text font-bold text-base font-display whitespace-nowrap"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                ConfidentAI
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Upgrade Banner */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              className="mx-3 mt-3 mb-1 rounded-xl p-3 flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.1))', border: '1px solid rgba(124,58,237,0.3)' }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                   style={{ background: 'var(--gradient-brand)' }}>
                <Zap size={13} className="text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">Go Pro</div>
                <div className="text-[10px] text-muted-foreground">Unlock AI feedback</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {activeNavItems.map(({ icon: Icon, label, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 whitespace-nowrap group',
                isActive
                  ? 'text-purple-600 dark:text-purple-300 font-extrabold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.06]'
              )}
              style={({ isActive }) => isActive ? {
                background: 'var(--theme-active-nav-bg, linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.08)))',
                boxShadow: '0 0 0 1px var(--theme-active-nav-border, rgba(124,58,237,0.25))',
              } : {}}
            >
              <Icon size={18} className="shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t p-3 space-y-1" style={{ borderColor: 'var(--sidebar-border)' }}>
          <AnimatePresence>
            {!collapsed && user && (
              <motion.div
                className="flex items-center gap-2.5 px-2 py-2 rounded-xl mb-1"
                style={{ background: 'var(--bg-card)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                {user.avatar && (user.avatar.startsWith('data:image/') || user.avatar.startsWith('http')) ? (
                  <img src={user.avatar} alt="Profile" className="w-7 h-7 rounded-lg object-cover shrink-0" />
                ) : matchedAvatar ? (
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0", matchedAvatar.bg)}>
                    {matchedAvatar.emoji}
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                       style={{ background: 'var(--gradient-brand)' }}>
                    {user.name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">{user.name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{user.email}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <ThemeToggle collapsed={collapsed} />
          <button
            onClick={handleLogout}
            title="Logout"
            className={cn(
              'flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-150',
              collapsed && 'justify-center'
            )}
          >
            <LogOut size={15} className="shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Floating Sidebar Toggle Button */}
      <motion.button
        onClick={onToggle}
        aria-label="Toggle sidebar"
        className="fixed top-[68px] w-6 h-6 rounded-full border flex items-center justify-center z-[60] transition-colors hover:bg-purple-500/20 shadow-md cursor-pointer"
        style={{ background: 'var(--bg-elevated)', borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-secondary)' }}
        animate={{ left: collapsed ? 60 : 228 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </motion.button>
    </>
  );
}

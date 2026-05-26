/* ── ThemeToggle — Animated sun/moon toggle ──────────────────── */
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '@/lib/utils';

export default function ThemeToggle({ collapsed = false }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
      className={cn(
        'flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200',
        'text-muted-foreground hover:text-foreground',
        isDark
          ? 'hover:bg-amber-400/10 hover:text-amber-300'
          : 'hover:bg-indigo-500/10 hover:text-indigo-500',
        collapsed && 'justify-center',
      )}
    >
      <div className="relative w-[15px] h-[15px] shrink-0">
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.span
              key="sun"
              className="absolute inset-0 flex items-center justify-center text-amber-300"
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              <Sun size={15} />
            </motion.span>
          ) : (
            <motion.span
              key="moon"
              className="absolute inset-0 flex items-center justify-center text-indigo-400"
              initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              <Moon size={15} />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      {!collapsed && (
        <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
      )}
    </button>
  );
}

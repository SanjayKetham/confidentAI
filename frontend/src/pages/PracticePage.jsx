/* ── Interview Categories / Practice Page (Day 5) ────────────── */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2, Users, Heart, Briefcase, Zap,
  ChevronRight, Play, Clock, Star, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import './PracticePage.css';

const CATEGORIES = [
  {
    id: 'technical',
    icon: Code2, emoji: '💻',
    label: 'Technical',
    description: 'Data structures, algorithms, system design, and language-specific questions.',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.12)',
    border: 'rgba(124,58,237,0.3)',
    count: 320,
    roles: ['Frontend Developer','Backend Developer','Full Stack','Data Engineer','DevOps Engineer','Mobile Dev'],
  },
  {
    id: 'hr',
    icon: Users, emoji: '🤝',
    label: 'HR Round',
    description: 'Salary negotiation, company culture, career goals, and behavioral questions.',
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.12)',
    border: 'rgba(6,182,212,0.3)',
    count: 180,
    roles: ['Any Role'],
  },
  {
    id: 'behavioral',
    icon: Heart, emoji: '🎯',
    label: 'Behavioral',
    description: 'STAR method questions: teamwork, conflict resolution, and leadership scenarios.',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.3)',
    count: 240,
    roles: ['Team Lead','Manager','SDE-1','SDE-2','Product Manager','Any Role'],
  },
  {
    id: 'case_study',
    icon: Briefcase, emoji: '📊',
    label: 'Case Study',
    description: 'Business problems, product thinking, and analytical reasoning questions.',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.3)',
    count: 95,
    roles: ['Product Manager','Business Analyst','Consultant','MBA Roles'],
  },
  {
    id: 'rapid_fire',
    icon: Zap, emoji: '⚡',
    label: 'Rapid Fire',
    description: 'Quick-answer trivia-style questions. 60 questions in 10 minutes!',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.3)',
    count: 500,
    roles: ['Any Role'],
  },
];

const DIFFICULTY_LEVELS = [
  { id: 'beginner',     label: 'Beginner',     desc: 'Entry-level concepts', icon: '🌱', color: 'var(--success)' },
  { id: 'intermediate', label: 'Intermediate', desc: '1–3 years experience',  icon: '⚡', color: 'var(--warning)' },
  { id: 'advanced',     label: 'Advanced',     desc: 'Senior & above',        icon: '🔥', color: 'var(--danger)'  },
];

const DURATION_OPTIONS = [
  { id: 10, label: '10 min',  desc: 'Quick warmup',  icon: '⚡' },
  { id: 20, label: '20 min',  desc: 'Standard',      icon: '🎯' },
  { id: 45, label: '45 min',  desc: 'Full session',  icon: '💪' },
];

export default function PracticePage() {
  const [step,       setStep]       = useState(1); // 1 = category, 2 = role+difficulty+duration
  const [category,   setCategory]   = useState(null);
  const [role,       setRole]       = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [duration,   setDuration]   = useState(null);
  const navigate = useNavigate();

  function handleCategorySelect(cat) {
    setCategory(cat);
    setRole(cat.roles[0]);
    setStep(2);
  }

  function handleStart() {
    if (!difficulty) { toast.error('Please select a difficulty level.'); return; }
    if (!duration)   { toast.error('Please select a session duration.'); return; }
    
    // Strip non-serializable 'icon' component before passing to state
    const { icon, ...serializableCategory } = category;
    
    navigate('/interview/setup', {
      state: { category: serializableCategory, role, difficulty, duration },
    });
  }

  return (
    <div className="practice-page">
      {/* ── Page Header ── */}
      <div className="practice-header">
        <h1>Start Practice Session</h1>
        <p>Choose your interview category, role, and difficulty to begin</p>
      </div>

      {/* ── Step Indicator ── */}
      <div className="step-indicator">
        {['Choose Category', 'Configure Session'].map((label, i) => (
          <div key={i} className={`step-pill ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}>
            <span className="step-num">{step > i + 1 ? '✓' : i + 1}</span>
            {label}
          </div>
        ))}
        <div className="step-connector" style={{ flex: 0, width: 40 }} />
      </div>

      <AnimatePresence mode="wait">
        {/* ── STEP 1: Category Selection ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="categories-grid">
              {CATEGORIES.map((cat, i) => {
                const Icon = cat.icon;
                return (
                  <motion.div
                    key={cat.id}
                    className="category-card"
                    style={{
                      '--cat-color': cat.color,
                      '--cat-bg': cat.bg,
                      '--cat-border': cat.border,
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    onClick={() => handleCategorySelect(cat)}
                  >
                    <div className="cat-icon-wrap">
                      <span className="cat-emoji">{cat.emoji}</span>
                      <Icon size={20} className="cat-icon" />
                    </div>
                    <div className="cat-label">{cat.label}</div>
                    <div className="cat-desc">{cat.description}</div>
                    <div className="cat-footer">
                      <span className="badge badge-purple">{cat.count}+ Questions</span>
                      <ChevronRight size={16} className="cat-arrow" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: Configure ── */}
        {step === 2 && category && (
          <motion.div
            key="step2"
            className="configure-panel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Back button */}
            <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)} style={{ marginBottom: 20 }}>
              ← Back to Categories
            </button>

            {/* Selected category mini card */}
            <div className="selected-cat" style={{ borderColor: category.border, background: category.bg }}>
              <span style={{ fontSize: 24 }}>{category.emoji}</span>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{category.label} Interview</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{category.count}+ questions available</div>
              </div>
              <span className="badge badge-cyan">{category.count}+ Q</span>
            </div>

            <div className="configure-sections">
              {/* Role Selection */}
              {category.roles.length > 1 && (
                <div className="config-section">
                  <h3>Select Role</h3>
                  <div className="role-grid">
                    {category.roles.map(r => (
                      <button
                        key={r}
                        className={`role-btn ${role === r ? 'selected' : ''}`}
                        onClick={() => setRole(r)}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Difficulty */}
              <div className="config-section">
                <h3>Difficulty Level</h3>
                <div className="difficulty-grid">
                  {DIFFICULTY_LEVELS.map(d => (
                    <motion.div
                      key={d.id}
                      className={`difficulty-card ${difficulty === d.id ? 'selected' : ''}`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setDifficulty(d.id)}
                    >
                      <span className="diff-icon">{d.icon}</span>
                      <div className="diff-label" style={{ color: d.color }}>{d.label}</div>
                      <div className="diff-desc">{d.desc}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="config-section">
                <h3>Session Duration</h3>
                <div className="duration-grid">
                  {DURATION_OPTIONS.map(d => (
                    <motion.div
                      key={d.id}
                      className={`duration-card ${duration === d.id ? 'selected' : ''}`}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setDuration(d.id)}
                    >
                      <span className="dur-icon">{d.icon}</span>
                      <div className="dur-label">{d.label}</div>
                      <div className="dur-desc">{d.desc}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Session Summary */}
              {difficulty && duration && (
                <motion.div
                  className="session-summary"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Info size={16} style={{ color: 'var(--primary-light)', flexShrink: 0 }} />
                  <span>
                    You'll have a <strong>{duration}-minute</strong> {difficulty} {category.label} interview
                    {role !== 'Any Role' ? ` for ${role}` : ''}. Questions will adapt to your level.
                  </span>
                </motion.div>
              )}

              <motion.button
                className="btn btn-primary btn-full btn-lg"
                id="start-interview-btn"
                onClick={handleStart}
                disabled={!difficulty || !duration}
                whileHover={difficulty && duration ? { scale: 1.02 } : {}}
                whileTap={difficulty && duration ? { scale: 0.98 } : {}}
                style={{
                  opacity: (!difficulty || !duration) ? 0.5 : 1,
                  cursor: (!difficulty || !duration) ? 'not-allowed' : 'pointer',
                }}
              >
                <Play size={18} />
                Begin Interview Session
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

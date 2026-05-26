/* ── Dashboard Page — Tailwind + shadcn/ui ───────────────────── */
import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mic, Target, Flame, Star, Clock,
  ChevronRight, Brain, Zap, Play, ArrowRight, Loader2,
  Trophy, Award, Lock, Unlock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { interviewsAPI } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const UPCOMING_TOPICS = [
  { icon: '🧠', title: 'System Design Basics',   level: 'Intermediate', duration: '30 min' },
  { icon: '💻', title: 'Data Structures & Algo', level: 'Hard',         duration: '45 min' },
  { icon: '🗣️', title: 'HR Round Mastery',       level: 'Easy',         duration: '20 min' },
];

const STAT_CARDS = [
  { icon: Mic,    label: 'Interviews', key: 'totalInterviews', gradient: 'from-purple-600/20 to-purple-600/5',   border: 'border-purple-500/30', iconBg: 'bg-purple-500/20',   iconColor: 'text-purple-400' },
  { icon: Target, label: 'Avg Score',  key: 'avgScore',        gradient: 'from-cyan-500/20 to-cyan-500/5',       border: 'border-cyan-500/30',   iconBg: 'bg-cyan-500/20',     iconColor: 'text-cyan-400',   suffix: '%' },
  { icon: Flame,  label: 'Streak',     key: 'streak',          gradient: 'from-amber-500/20 to-amber-500/5',     border: 'border-amber-500/30',  iconBg: 'bg-amber-500/20',    iconColor: 'text-amber-400',  suffix: '🔥' },
  { icon: Star,   label: 'XP Points',  key: 'xpPoints',        gradient: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/30',iconBg: 'bg-emerald-500/20',  iconColor: 'text-emerald-400' },
];

function StatCard({ icon: Icon, label, value, gradient, border, iconBg, iconColor, suffix = '', delay }) {
  return (
    <motion.div
      className={`rounded-2xl border p-5 bg-gradient-to-br ${gradient} ${border} transition-all duration-200 cursor-default`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4 }}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${iconBg}`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div className="text-2xl font-bold text-foreground">{value.toLocaleString()}{suffix}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const [dbStats, setDbStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    interviewsAPI.getStats()
      .then(res => {
        if (isMounted) {
          if (res.data?.success) {
            setDbStats(res.data.data);
          }
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to load real dashboard metrics:', err);
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const scoreColor = (s) =>
    s >= 80 ? 'text-emerald-400' : s >= 70 ? 'text-amber-400' : 'text-red-400';

  const levelBadge = (l) =>
    l === 'Hard' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
    l === 'Intermediate' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 size={36} className="animate-spin text-purple-500 mx-auto" />
          <p className="text-sm text-muted-foreground">Loading your personalized progress dashboard…</p>
        </div>
      </div>
    );
  }

  // Active real stats or safe zero fallbacks
  const stats = dbStats || {
    totalInterviews: 0,
    avgScore: 0,
    streak: user?.streak || 0,
    xpPoints: user?.xpPoints || 0,
    level: user?.level || 1,
    weeklyProgress: [
      { day: 'Mon', score: 0 }, { day: 'Tue', score: 0 },
      { day: 'Wed', score: 0 }, { day: 'Thu', score: 0 },
      { day: 'Fri', score: 0 }, { day: 'Sat', score: 0 },
      { day: 'Sun', score: 0 },
    ],
    recentInterviews: [],
  };

  // ── Dynamic Level & Gamification System ──
  const xp = stats.xpPoints || 0;
  const xpPerLevel = 1000;
  const currentLevel = Math.floor(xp / xpPerLevel) + 1;
  const currentLevelXP = xp % xpPerLevel;
  const progressPercent = Math.min(100, Math.max(0, (currentLevelXP / xpPerLevel) * 100));
  const remainingXP = xpPerLevel - currentLevelXP;

  const levelTitles = [
    "Novice Aspirant",       // Level 1
    "Behavioral Scholar",    // Level 2
    "Technical Contender",   // Level 3
    "Fluent Communicator",   // Level 4
    "Interview Veteran",     // Level 5
    "Elite Mastery Practitioner" // Level 6+
  ];
  const currentTitle = levelTitles[Math.min(levelTitles.length - 1, currentLevel - 1)];

  // Badges system based on user stats
  const achievements = [
    { name: '🏆 First Step', desc: 'Completed first mock round', unlocked: stats.totalInterviews >= 1 },
    { name: '🔥 On Fire', desc: 'Maintain a 3-day practice streak', unlocked: stats.streak >= 3 },
    { name: '🎯 Mastermind', desc: 'Achieved average score >= 80%', unlocked: stats.avgScore >= 80 },
    { name: '💻 Code Ninja', desc: 'Earned 1000+ XP points', unlocked: xp >= 1000 },
  ];

  const getDynamicRecommendations = () => {
    const avg = stats.avgScore || 0;
    
    if (avg === 0) {
      return [
        { icon: '🧠', title: 'Behavioral Prep Warmup', level: 'Easy', duration: '15 min', path: '/questions', desc: 'Master basic HR and STAR-method situations.' },
        { icon: '💻', title: 'Data Structures Challenge', level: 'Medium', duration: '30 min', path: '/coding', desc: 'Build logic inside the Monaco Sandbox.' },
        { icon: '🗣️', title: 'Full AI Mock Simulation', level: 'Medium', duration: '45 min', path: '/practice', desc: 'Full conversational audio evaluation.' },
      ];
    } else if (avg < 70) {
      return [
        { icon: '🗣️', title: 'Clarity & Delivery Training', level: 'Easy', duration: '20 min', path: '/practice', desc: 'Improve vocabulary and vocal delivery.' },
        { icon: '🧠', title: 'Scenario Question Drill', level: 'Medium', duration: '25 min', path: '/questions', desc: 'Practice structuring behavioral answers.' },
        { icon: '💻', title: 'Array Optimization Practice', level: 'Medium', duration: '30 min', path: '/coding', desc: 'Optimize algorithm runtimes.' },
      ];
    } else {
      return [
        { icon: '💻', title: 'BST & String Algorithms', level: 'Hard', duration: '45 min', path: '/coding', desc: 'Solve high-complexity technical tests.' },
        { icon: '🗣️', title: 'Stress Mock Execution', level: 'Hard', duration: '40 min', path: '/practice', desc: 'Simulate high-pressure technical rounds.' },
        { icon: '🧠', title: 'Advanced System Architecture', level: 'Hard', duration: '35 min', path: '/questions', desc: 'Review scaling databases and systems.' },
      ];
    }
  };

  const recommendations = getDynamicRecommendations();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-1.5 text-xs text-purple-400 font-medium mb-1">
            <Zap size={12} /> {greeting}
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting},{' '}
            <span className="gradient-text">{user?.name?.split(' ')[0] ?? 'Learner'}</span>! 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            You're on a <span className="text-amber-400 font-semibold">{stats.streak}-day streak</span> 🔥 Keep it going!
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <Link to="/practice">
            <Button className="h-10 text-white font-semibold rounded-xl hover:opacity-90 transition-all"
                    style={{ background: 'var(--gradient-brand)', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}>
              <Play size={15} className="mr-1.5" /> Start Interview
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ icon, label, key, gradient, border, iconBg, iconColor, suffix }, i) => (
          <StatCard key={key} icon={icon} label={label} value={stats[key]}
            gradient={gradient} border={border} iconBg={iconBg} iconColor={iconColor}
            suffix={suffix ?? ''} delay={i * 0.08} />
        ))}
      </div>


      {/* ── Daily AI Prep Challenge (Viral Retention Loop) ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Card className="rounded-2xl border-purple-500/20 bg-purple-500/[0.03] overflow-hidden relative shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
                <Flame size={12} className="text-purple-400 animate-pulse" /> Daily Retention Loop Challenge
              </span>
              <h2 className="text-base font-bold text-foreground">
                Today's Challenge: Behavioral STAR Cadence 🎙️
              </h2>
              <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                Practice today's 3-question mock session. Complete the session with an AI score of <span className="text-purple-300 font-semibold">75% or higher</span> to maintain your streak and earn an extra <span className="text-amber-400 font-bold">+150 XP bonus</span>!
              </p>
            </div>
            
            <Link to="/practice" className="shrink-0">
              <Button className="h-9 px-5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-all shadow-md">
                Accept & Start
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Chart — spans 2 cols */}
        <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="rounded-2xl border-border/50 bg-card hover:bg-card/80 transition-colors shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-foreground">Weekly Performance</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Your score trend over 7 days</p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[11px]">↑ +14%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stats.weeklyProgress} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--sidebar-border)" opacity={0.3} />
                  <XAxis dataKey="day" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[50, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--sidebar-border)', borderRadius: 10, color: 'var(--text-primary)' }}
                    labelStyle={{ color: 'var(--text-secondary)', fontSize: 11 }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2.5}
                        fill="url(#scoreGrad)" dot={{ fill: '#a855f7', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Interviews */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="rounded-2xl border-border/50 bg-card h-full shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">Recent Interviews</CardTitle>
                <Link to="/analytics">
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground px-2">
                    View all <ChevronRight size={12} className="ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.recentInterviews.map((iv, i) => (
                <motion.div key={iv.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/40 transition-colors cursor-default"
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
                  <div>
                    <div className="text-xs font-semibold text-foreground">{iv.type}</div>
                    <div className="text-[11px] text-muted-foreground">{iv.role}</div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {iv.tags.map(t => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-sm font-bold ${scoreColor(iv.score)}`}>{iv.score}%</div>
                    <div className="text-[10px] text-muted-foreground">{iv.time}</div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recommended Practice */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="rounded-2xl border-border/50 bg-card hover:border-purple-500/20 transition-all duration-300 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-foreground">Recommended Practice</CardTitle>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Custom fit to your stats</p>
                </div>
                <Link to="/practice">
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground px-2">
                    Start <ChevronRight size={12} className="ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              {recommendations.map((t, i) => (
                <Link to={t.path} key={t.title}>
                  <motion.div className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border/40 hover:bg-muted/50 cursor-pointer transition-all group mb-2"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                    whileHover={{ x: 4 }}>
                    <div className="text-xl shrink-0 mt-0.5">{t.icon}</div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-xs font-bold text-foreground group-hover:text-purple-400 transition-colors truncate">{t.title}</div>
                      <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{t.desc}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[9px] font-semibold text-muted-foreground flex items-center gap-1">
                          <Clock size={9} /> {t.duration}
                        </span>
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${levelBadge(t.level)}`}>
                          {t.level}
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={13} className="text-muted-foreground/60 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all shrink-0 self-center" />
                  </motion.div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* XP Level Progress */}
        <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="rounded-2xl border-border/50 bg-card shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-foreground">Gamified Progress Board</CardTitle>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Solve challenges to unlock multipliers</p>
                </div>
                <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 text-xs font-black uppercase tracking-wider px-2.5 py-0.5">
                  Lv. {currentLevel} — {currentTitle}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Slider Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-foreground font-extrabold flex items-center gap-1">
                    <Trophy size={12} className="text-amber-400" /> {currentLevelXP.toLocaleString()} XP <span className="text-muted-foreground font-normal">in level</span>
                  </span>
                  <span className="text-muted-foreground font-bold">{xpPerLevel} XP limit</span>
                </div>
                
                <div className="w-full h-3 rounded-full overflow-hidden bg-muted/40 border border-border/30">
                  <motion.div 
                    className="h-full rounded-full" 
                    style={{ background: 'linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)' }}
                    initial={{ width: 0 }} 
                    animate={{ width: `${progressPercent}%` }} 
                    transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }} 
                  />
                </div>
                
                <div className="flex justify-between items-center mt-2.5">
                  <p className="text-[11px] text-muted-foreground text-left">
                    <span className="text-cyan-400 font-bold">{remainingXP} XP</span> required to rank up to <span className="text-purple-400 font-extrabold">Level {currentLevel + 1}</span>
                  </p>
                  <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    Total: {xp.toLocaleString()} XP
                  </span>
                </div>
              </div>

              {/* Achievements Toggles */}
              <div className="pt-2.5 border-t border-border/30 text-left">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2.5">
                  Practice Milestones & Accomplishments
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {achievements.map((ach) => (
                    <div 
                      key={ach.name} 
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-300 ${ach.unlocked ? 'bg-purple-500/[0.03] border-purple-500/20' : 'bg-muted/20 border-border/30 opacity-50'}`}
                    >
                      <div className={`p-1.5 rounded-lg ${ach.unlocked ? 'bg-purple-500/10 text-purple-400' : 'bg-muted/40 text-muted-foreground'}`}>
                        {ach.unlocked ? <Award size={14} className="text-purple-300" /> : <Lock size={14} className="text-muted-foreground/60" />}
                      </div>
                      
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          {ach.name}
                        </div>
                        <p className="text-[9px] text-muted-foreground truncate">{ach.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

/* ── AchievementsPage — Gamified XP, Streak calendar & Leaderboard ── */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Flame, Star, Award, Zap,
  TrendingUp, Calendar, Users, ChevronRight,
  ShieldCheck, HelpCircle, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { interviewsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AchievementsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load real user interview stats and real database global rankings
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      interviewsAPI.getStats(),
      interviewsAPI.getLeaderboard()
    ])
      .then(([statsRes, leaderboardRes]) => {
        if (isMounted) {
          if (statsRes.data?.success) {
            setStats(statsRes.data.data);
          }
          if (leaderboardRes.data?.success) {
            setLeaderboard(leaderboardRes.data.data);
          }
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to load achievements data:', err);
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 size={36} className="animate-spin text-purple-500 mx-auto" />
          <p className="text-sm text-muted-foreground">Polishing your medals & trophies…</p>
        </div>
      </div>
    );
  }

  // Real stats or safe fallbacks
  const activeStats = stats || {
    totalInterviews: 0,
    avgScore: 0,
    streak: user?.streak || 0,
    xpPoints: user?.xpPoints || 0,
    level: user?.level || 1,
  };

  // Math for Level Up progress (500 XP per level tier)
  const currentXP = activeStats.xpPoints;
  const levelFloor = (activeStats.level - 1) * 500;
  const nextLevelCeil = activeStats.level * 500;
  const levelProgressXP = Math.max(0, currentXP - levelFloor);
  const pctToNextLevel = Math.min(100, Math.round((levelProgressXP / 500) * 100));
  const xpNeeded = Math.max(0, nextLevelCeil - currentXP);

  // Curated Medals List with dynamic progress bindings
  const BADGES = [
    {
      id: 'first_win',
      emoji: '🏆',
      title: 'First Win',
      desc: 'Complete your first complete AI mock interview session.',
      xp: 150,
      unlocked: activeStats.totalInterviews >= 1,
      progress: activeStats.totalInterviews >= 1 ? 100 : 0,
      target: '1 session'
    },
    {
      id: 'marathon',
      emoji: '🏃‍♂️',
      title: 'Interview Marathoner',
      desc: 'Complete at least 5 structured mock interview sessions.',
      xp: 350,
      unlocked: activeStats.totalInterviews >= 5,
      progress: Math.min(100, Math.round((activeStats.totalInterviews / 5) * 100)),
      target: `${activeStats.totalInterviews}/5 runs`
    },
    {
      id: 'streak_3',
      emoji: '🔥',
      title: 'Consistent Practice',
      desc: 'Unlock a consecutive 3-day practice streak.',
      xp: 200,
      unlocked: activeStats.streak >= 3,
      progress: Math.min(100, Math.round((activeStats.streak / 3) * 100)),
      target: `${activeStats.streak}/3 days`
    },
    {
      id: 'expert_score',
      emoji: '🎯',
      title: 'Elite Communicator',
      desc: 'Score over 85% in any communication competency evaluation.',
      xp: 300,
      unlocked: activeStats.avgScore >= 80, 
      progress: Math.min(100, Math.round((activeStats.avgScore / 85) * 100)),
      target: `${activeStats.avgScore}/85%`
    },
    {
      id: 'technical_titan',
      emoji: '💻',
      title: 'Technical Titan',
      desc: 'Practice technical rounds to score outstanding feedback.',
      xp: 400,
      unlocked: activeStats.totalInterviews >= 3 && activeStats.avgScore >= 75,
      progress: activeStats.totalInterviews >= 3 ? 100 : Math.round((activeStats.totalInterviews / 3) * 100),
      target: `${activeStats.totalInterviews}/3 tech`
    },
    {
      id: 'level_master',
      emoji: '👑',
      title: 'Rising Star',
      desc: 'Accumulate experience points to reach Level 3.',
      xp: 500,
      unlocked: activeStats.level >= 3,
      progress: Math.min(100, Math.round((activeStats.level / 3) * 100)),
      target: `Lvl ${activeStats.level}/3`
    }
  ];

  // Dynamic Gamified Level Tiers
  const getLevelTierName = (lvl) => {
    if (lvl >= 10) return "Grandmaster Pro";
    if (lvl >= 7)  return "Elite Architect";
    if (lvl >= 4)  return "Expert Communicator";
    if (lvl >= 2)  return "Rising Challenger";
    return "Aspiring Novice";
  };

  // Compile real competitor list from Mongoose sorted database users
  const leaderboardList = leaderboard && leaderboard.length > 0
    ? leaderboard.map((item, idx) => ({
        rank: idx + 1,
        name: item._id === user?._id ? `${item.name} (You)` : item.name,
        level: item.level || 1,
        xp: item.xpPoints || 0,
        avatar: item.avatar || (item.role === 'admin' ? '👑' : '🔥'),
        isCurrentUser: item._id === user?._id
      }))
    : [
        { rank: 1, name: `${user?.name || 'You'} (You)`, level: activeStats.level, xp: activeStats.xpPoints, avatar: '🔥', isCurrentUser: true }
      ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-left">
        <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
          🏆 Achievements & Real-Time Tracking
        </h1>
        <p className="text-sm text-muted-foreground">
          Earn XP points by completing mock sessions, level up your tiers, maintain streaks, and compete against active users.
        </p>
      </div>

      {/* Gamification Banner / Level Up Info */}
      <Card className="rounded-3xl border-white/[0.08] bg-white/[0.04] p-6 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-40 h-40 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-40 h-40 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-left">
          {/* Level Badge */}
          <div className="flex items-center gap-4 md:border-r border-white/[0.06] pr-4">
            <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-white shrink-0"
                 style={{ background: 'var(--gradient-brand)', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">Lvl</span>
              <span className="text-2xl font-black mt-[-4px]">{activeStats.level}</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">{getLevelTierName(activeStats.level)}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Rank tier based on your stack</p>
            </div>
          </div>

          {/* XP Progress Slider */}
          <div className="space-y-2 md:col-span-2">
            <div className="flex justify-between items-end text-xs">
              <span className="text-muted-foreground flex items-center gap-1 font-semibold">
                <Star size={13} className="text-purple-400 fill-purple-400" />
                {activeStats.xpPoints.toLocaleString()} Total XP
              </span>
              <span className="text-muted-foreground">
                {pctToNextLevel}% toward <span className="text-purple-400 font-bold">Level {activeStats.level + 1}</span>
              </span>
            </div>

            <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
              <motion.div 
                className="h-full rounded-full" 
                style={{ background: 'var(--gradient-brand)' }}
                initial={{ width: 0 }}
                animate={{ width: `${pctToNextLevel}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </div>

            <p className="text-[10px] text-muted-foreground">
              ⚡ You need <span className="text-foreground font-bold">{xpNeeded} XP</span> to reach Level {activeStats.level + 1}. Every mock session yields up to 150 XP!
            </p>
          </div>
        </div>
      </Card>

      {/* Grid: Achievements Shelf & Competitors Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        {/* Left 2 Cols: Badges / Achievements Grid */}
        <div className="md:col-span-2 space-y-6">
          <Card className="rounded-3xl border-white/[0.08] bg-white/[0.04]">
            <CardHeader className="pb-3 border-b border-white/[0.05]">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Award size={16} className="text-purple-400" /> Medals Shelf ({BADGES.filter(b => b.unlocked).length}/{BADGES.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BADGES.map((b, i) => (
                <motion.div
                  key={b.id}
                  className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                    b.unlocked 
                      ? 'bg-purple-500/[0.02] border-purple-500/25 hover:border-purple-500/40 animate-fadeIn' 
                      : 'bg-white/[0.01] border-white/[0.04] opacity-70 hover:opacity-85'
                  }`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  whileHover={{ y: -3 }}
                >
                  <div className="flex items-start gap-3">
                    {/* Badge Emoji */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                      b.unlocked 
                        ? 'bg-purple-500/10 border border-purple-500/20' 
                        : 'bg-white/[0.04] grayscale'
                    }`}>
                      {b.emoji}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        {b.title}
                        {b.unlocked && <ShieldCheck size={12} className="text-emerald-400 shrink-0" />}
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{b.desc}</p>
                      
                      {/* Mini progress bar */}
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-[9px] text-muted-foreground font-semibold">
                          <span>{b.target}</span>
                          <span>{b.progress}%</span>
                        </div>
                        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                          <div className={`h-full rounded-full ${b.unlocked ? 'bg-purple-500' : 'bg-white/20'}`} style={{ width: `${b.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reward XP Badge */}
                  <div className="absolute right-3 top-3 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-400">
                    +{b.xp} XP
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: REAL Competitive Leaderboard */}
        <div className="md:col-span-1 space-y-6">
          <Card className="rounded-3xl border-white/[0.08] bg-white/[0.04]">
            <CardHeader className="pb-3 border-b border-white/[0.05]">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Users size={16} className="text-cyan-400" /> Active Leaderboard
              </CardTitle>
              <CardDescription className="text-[10px] text-muted-foreground">
                Real-time tracking of all registered users in the system!
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 px-3 space-y-2">
              {leaderboardList.map((item) => (
                <div
                  key={item.rank}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-all border ${
                    item.isCurrentUser 
                      ? 'bg-purple-600/10 border-purple-500/35 shadow-lg shadow-purple-900/10' 
                      : 'hover:bg-white/[0.03] border-transparent'
                  }`}
                >
                  {/* Rank position */}
                  <div className="w-5 shrink-0 text-center font-bold text-xs">
                    {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}
                  </div>

                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base ${
                    item.isCurrentUser ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-white/[0.04]'
                  }`}>
                    {item.avatar}
                  </div>

                  {/* Name and Level */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-semibold truncate ${item.isCurrentUser ? 'text-purple-400 font-bold' : 'text-foreground'}`}>
                      {item.name}
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">Level {item.level}</div>
                  </div>

                  {/* Score */}
                  <div className="text-xs font-bold text-foreground shrink-0 pr-1">
                    {item.xp.toLocaleString()} <span className="text-[9px] font-normal text-muted-foreground">XP</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── Analytics Page — Tailwind + Recharts + Framer Motion ──────── */
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Award, Activity, Flame, Zap, Clock,
  Search, Filter, Calendar, ChevronRight, User,
  CheckCircle2, AlertTriangle, X, ExternalLink, Sparkles,
  BookOpenCheck, BrainCircuit, Lightbulb, BarChart3, HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { interviewsAPI } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, Radar
} from 'recharts';

/* ── High Fidelity Demo Sessions (Fallback when history is empty) ── */
const MOCK_SESSIONS = [
  {
    _id: "demo-1",
    category: { id: "technical", label: "Technical Interview" },
    role: "Lead React Developer",
    difficulty: "Hard",
    duration: 25,
    overallScore: 84,
    xpEarned: 126,
    metrics: { communication: 78, technical: 90, confidence: 82, clarity: 85, structure: 85 },
    answers: [
      {
        questionText: "How does React's Reconciliation process and Fiber architecture optimize UI renders?",
        userAnswer: "React's reconciliation creates a virtual representation of the DOM tree in memory. When state updates, it generates a new Virtual DOM and compares it using a heuristic diffing algorithm that runs in O(n) time. The Fiber architecture splits rendering work into smaller chunk units and processes them concurrently, allowing it to pause, resume, or abort render work to keep the browser main thread responsive.",
        score: 92,
        feedback: "Outstanding explanation! You correctly explained reconciliation complexity and how the Fiber engine facilitates concurrent, non-blocking rendering. Mentioning double-buffering would represent absolute mastery."
      },
      {
        questionText: "What are the trade-offs of micro-frontends and how do you implement them?",
        userAnswer: "Micro-frontends allow independent deployments, technology isolation, and autonomous team structures. However, they introduce overhead in bundle size duplication, complex testing pipelines, and potential brand inconsistencies. We can implement them via Module Federation in Webpack/Vite or build-time composition using NPM packages.",
        score: 82,
        feedback: "Very strong architecture response. The bundle size overhead and Module Federation choices were perfectly detailed. Make sure to detail runtime orchestration vs build-time composition explicitly next time."
      },
      {
        questionText: "Explain how you would handle complex state transitions and memory leaks in real-time WebSockets.",
        userAnswer: "For WebSockets, I write cleanups inside useEffect to close the socket instance when a component unmounts. I manage state transitions through a reducer rather than spread states to keep things predictable. I also ensure that event listeners are garbage collected.",
        score: 78,
        feedback: "Solid engineering answer. Good focus on useEffect cleanup functions. Elaborate on utilizing Chrome DevTools Heap Snapshots to diagnose closures holding stale references for junior-to-mid validation."
      }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.5).toISOString() // 1.5 days ago
  },
  {
    _id: "demo-2",
    category: { id: "behavioral", label: "Behavioral Round" },
    role: "Senior Product Engineer",
    difficulty: "Medium",
    duration: 18,
    overallScore: 76,
    xpEarned: 114,
    metrics: { communication: 86, technical: 68, confidence: 78, clarity: 74, structure: 74 },
    answers: [
      {
        questionText: "Tell me about a time you made a significant technical mistake. What happened and how did you resolve it?",
        userAnswer: "I deployed an un-indexed query to a production MongoDB collections which caused database CPU usage to spike to 100% and degraded API response times. I noticed the Alert Manager warning, rolled back the deployment, isolated the slow query using database profilers, added the compound index, and re-deployed safely in 15 minutes. We then established an ESLint rule for schema definitions.",
        score: 84,
        feedback: "Perfect deployment of the STAR model. You highlighted a genuine problem, showed precise actions, and showed post-incident remediation steps. Quantifying the impact on user traffic would elevate this even further."
      },
      {
        questionText: "How do you handle scope creep and disagreements with Product Managers on deadlines?",
        userAnswer: "I try to keep lines of communication open. When a PM adds features late, I show them the technical impact using visual story charts. We then discuss whether we should move the release date or cut down on nice-to-have items. Keeping it transparent resolves friction.",
        score: 68,
        feedback: "An empathetic approach. However, it's slightly too generic. Mention specific technical sizing frameworks or prioritization matrixes (like MoSCoW) that you use to structure discussions objectively."
      }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4.2).toISOString() // 4 days ago
  },
  {
    _id: "demo-3",
    category: { id: "resume", label: "Resume Deep-Dive" },
    role: "Fullstack Developer",
    difficulty: "Easy",
    duration: 12,
    overallScore: 68,
    xpEarned: 102,
    metrics: { communication: 70, technical: 64, confidence: 66, clarity: 71, structure: 69 },
    answers: [
      {
        questionText: "Detail the architecture of the distributed caching layer mentioned on your CV.",
        userAnswer: "I added Redis caching in front of our main PostgreSQL database. It cache read-heavy endpoints like user profiles and product grids. We used a Cache-Aside strategy. The cache expires every 1 hour, or when a user updates their profile to avoid stale data.",
        score: 68,
        feedback: "Good summary of Cache-Aside policy. You should expand on the exact throughput improvements (e.g., latency dropped from 250ms to 12ms) to make this technical bullet point highly convincing on CV audits."
      }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString() // 9 days ago
  }
];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  // Drawer / Drilldown State
  const [selectedSession, setSelectedSession] = useState(null);
  const [drawerTab, setDrawerTab] = useState('overview');

  useEffect(() => {
    let isMounted = true;
    
    // Fetch live session history, stats, and leaderboard in parallel
    Promise.all([
      interviewsAPI.getHistory().catch(err => {
        console.warn('Could not fetch real history:', err);
        return { data: { success: false } };
      }),
      interviewsAPI.getLeaderboard().catch(err => {
        console.warn('Could not fetch leaderboard:', err);
        return { data: { success: false } };
      })
    ]).then(([historyRes, leaderboardRes]) => {
      if (!isMounted) return;

      // Handle history data
      if (historyRes.data?.success && historyRes.data.data?.length > 0) {
        setSessions(historyRes.data.data);
        setIsDemo(false);
      } else {
        // Fallback to gorgeous mock data so user sees active visuals immediately
        setSessions(MOCK_SESSIONS);
        setIsDemo(true);
      }

      // Handle leaderboard data
      if (leaderboardRes.data?.success && leaderboardRes.data.data?.length > 0) {
        setLeaderboard(leaderboardRes.data.data);
      } else {
        // High fidelity mock leaderboard
        setLeaderboard([
          { _id: '1', name: 'Alex Rivera', xpPoints: 2450, level: 5 },
          { _id: '2', name: 'Sarah Chen', xpPoints: 2120, level: 5 },
          { _id: '3', name: 'James Morrison', xpPoints: 1890, level: 4 },
          { _id: 'user', name: user?.name || 'You', xpPoints: user?.xpPoints || 1240, level: user?.level || 4, isCurrentUser: true },
          { _id: '5', name: 'Elena Rostova', xpPoints: 1150, level: 3 },
        ].sort((a,b) => b.xpPoints - a.xpPoints));
      }
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching analytics:', err);
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; };
  }, [user]);

  // Recalculate metrics based on current sessions (whether mock or real)
  const stats = useMemo(() => {
    const total = sessions.length;
    if (total === 0) return { avgScore: 0, totalHours: 0, avgWordCount: 0, metrics: { communication: 0, technical: 0, confidence: 0, clarity: 0, structure: 0 } };

    let sumScore = 0;
    let sumDuration = 0;
    let sumWords = 0;
    let totalAnswers = 0;

    let comm = 0, tech = 0, conf = 0, clar = 0, stru = 0;

    sessions.forEach(s => {
      sumScore += s.overallScore;
      sumDuration += s.duration || 0;
      
      const m = s.metrics || {};
      comm += m.communication || s.overallScore;
      tech += m.technical || s.overallScore;
      conf += m.confidence || s.overallScore;
      clar += m.clarity || s.overallScore;
      stru += m.structure || s.overallScore;

      if (s.answers && s.answers.length > 0) {
        s.answers.forEach(ans => {
          if (ans.userAnswer) {
            sumWords += ans.userAnswer.split(/\s+/).filter(Boolean).length;
            totalAnswers += 1;
          }
        });
      }
    });

    return {
      avgScore: Math.round(sumScore / total),
      totalHours: Math.max(1, Math.round((sumDuration) / 60 * 10) / 10),
      avgWordCount: totalAnswers > 0 ? Math.round(sumWords / totalAnswers) : 84,
      metrics: {
        communication: Math.round(comm / total),
        technical: Math.round(tech / total),
        confidence: Math.round(conf / total),
        clarity: Math.round(clar / total),
        structure: Math.round(stru / total)
      }
    };
  }, [sessions]);

  // Filter sessions for the data table
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchesSearch = s.role?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            s.category?.label?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const catId = s.category?.id || (s.category?.label?.toLowerCase().includes('tech') ? 'technical' : 'behavioral');
      const matchesCategory = categoryFilter === 'all' || catId === categoryFilter;

      const diff = s.difficulty?.toLowerCase();
      const matchesDiff = difficultyFilter === 'all' || diff === difficultyFilter.toLowerCase();

      return matchesSearch && matchesCategory && matchesDiff;
    });
  }, [sessions, searchQuery, categoryFilter, difficultyFilter]);

  // Recharts Area Chart Data (History Trends)
  const timelineData = useMemo(() => {
    return [...sessions]
      .reverse()
      .map((s, index) => ({
        index: index + 1,
        date: new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: s.overallScore,
        role: s.role?.split(' ')[0] || 'Mock'
      }));
  }, [sessions]);

  // Recharts Radar Chart Data
  const radarData = useMemo(() => {
    const m = stats.metrics;
    return [
      { subject: 'Communication', A: m.communication, fullMark: 100 },
      { subject: 'Technical', A: m.technical, fullMark: 100 },
      { subject: 'Confidence', A: m.confidence, fullMark: 100 },
      { subject: 'Clarity', A: m.clarity, fullMark: 100 },
      { subject: 'Structure', A: m.structure, fullMark: 100 },
    ];
  }, [stats]);

  // AI Coach Insights Engine
  const coachInsights = useMemo(() => {
    const m = stats.metrics;
    const skills = [
      { name: 'Technical Depth', val: m.technical, desc: 'Conceptual accuracy and keyword targeting.' },
      { name: 'Communication Style', val: m.communication, desc: 'Vocabulary rich, assertive tone, and completeness.' },
      { name: 'Vocal Confidence', val: m.confidence, desc: 'Consistent pace and low presence of verbal pauses/fillers.' },
      { name: 'Response Clarity', val: m.clarity, desc: 'Clear articulation and concise explanations.' },
      { name: 'Answer Structure', val: m.structure, desc: 'Effective use of the STAR method and logical transition terms.' },
    ].sort((a,b) => b.val - a.val);

    const highest = skills[0];
    const lowest = skills[skills.length - 1];

    let actionPlan = '';
    let recommendationCTA = '/practice';

    if (lowest.name.includes('Technical')) {
      actionPlan = 'Brush up on system design principles and language-specific features. Try navigating our curated Question Bank filtering by hard concepts.';
      recommendationCTA = '/questions';
    } else if (lowest.name.includes('Structure')) {
      actionPlan = 'When practicing, structure behavioral answers strictly: set the Situation (15%), define the Task (15%), outline your Action in detail (50%), and state the quantified Result (20%).';
    } else if (lowest.name.includes('Confidence')) {
      actionPlan = 'Minimize rapid verbal starts. Pause for 2 full seconds after a prompt to organize your points. Try voice-to-text mode on behavioral rounds to hear vocal fillers.';
    } else {
      actionPlan = 'Expand response length. Focus on using transitions like "specifically", "as a consequence", and "to resolve this" to elaborate complex bullet points.';
    }

    return {
      highest,
      lowest,
      actionPlan,
      recommendationCTA
    };
  }, [stats]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Analyzing session histories and compilation metrics…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-2 text-xs text-purple-400 font-semibold mb-1">
            <Sparkles size={13} className="animate-pulse" /> PERFORMANCE COMMAND CENTER
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            AI <span className="gradient-text">Performance Analytics</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time competency grids, linguistic assessments, and competitive leaderboards.
          </p>
        </motion.div>

        {isDemo && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-2 rounded-xl text-xs text-left"
          >
            <AlertTriangle size={15} className="shrink-0" />
            <div>
              <span className="font-bold">Displaying Demo Data:</span> Start your first interview session to unlock live personalized history tracking!
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Activity,
            label: 'Practice Sessions',
            val: sessions.length,
            sub: `Total: ${stats.totalHours} hrs active`,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20'
          },
          {
            icon: Award,
            label: 'AI Competency Score',
            val: `${stats.avgScore}%`,
            sub: stats.avgScore >= 80 ? '🏆 Elite Level' : stats.avgScore >= 70 ? '⚡ Strong Practitioner' : '📚 Developing',
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10',
            border: 'border-cyan-500/20'
          },
          {
            icon: BrainCircuit,
            label: 'Linguistic Stamina',
            val: `${stats.avgWordCount} words`,
            sub: 'Avg answer description depth',
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20'
          },
          {
            icon: Flame,
            label: 'Active Streak',
            val: `${user?.streak || 0} Days`,
            sub: 'Keep daily momentum!',
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20'
          }
        ].map((item, i) => (
          <motion.div
            key={item.label}
            className={`rounded-2xl border p-4 bg-white/[0.02] ${item.border} hover:bg-white/[0.04] transition-all`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            whileHover={{ y: -3 }}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${item.bg}`}>
                <item.icon size={18} className={item.color} />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-foreground">{item.val}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground/80 mt-3 pt-2.5 border-t border-white/[0.04] text-left">
              {item.sub}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Visual Analytics Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Area Progress Chart */}
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <Card className="rounded-2xl border-white/[0.08] bg-white/[0.03] overflow-hidden h-full">
            <CardHeader className="pb-2 border-b border-white/[0.04] text-left">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">Skill Growth Progression</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Session-by-session overall score timeline</p>
                </div>
                <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] uppercase font-semibold">
                  Interactive Chart
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {timelineData.length < 2 ? (
                <div className="h-60 flex flex-col items-center justify-center text-center">
                  <BarChart3 size={32} className="text-muted-foreground/60 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">More practice sessions needed to calculate trends</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Complete at least 2 sessions to see performance curves</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <AreaChart data={timelineData} margin={{ top: 10, right: 10, bottom: 5, left: -25 }}>
                    <defs>
                      <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[40, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#f1f5f9' }}
                      labelStyle={{ color: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                      itemStyle={{ color: '#7c3aed', fontSize: 12 }}
                      formatter={(value, name, props) => [`${value}% Score`, `${props.payload.role} Prep`]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#7c3aed" 
                      strokeWidth={3}
                      fill="url(#analyticsGrad)" 
                      dot={{ fill: '#7c3aed', strokeWidth: 1.5, r: 4, stroke: '#ffffff' }}
                      activeDot={{ fill: '#06b6d4', r: 6, strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Radar Chart Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <Card className="rounded-2xl border-white/[0.08] bg-white/[0.03] h-full overflow-hidden">
            <CardHeader className="pb-2 border-b border-white/[0.04] text-left">
              <CardTitle className="text-base font-bold text-foreground">Competency Balance</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">5 Core professional dimensions evaluated</p>
            </CardHeader>
            <CardContent className="flex items-center justify-center pt-6">
              <ResponsiveContainer width="100%" height={230}>
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'medium' }} />
                  <Radar 
                    name="Skills" 
                    dataKey="A" 
                    stroke="#7c3aed" 
                    fill="#7c3aed" 
                    fillOpacity={0.25} 
                    dot={{ fill: '#a855f7', r: 3 }} 
                  />
                  <Tooltip contentStyle={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Coach & Leaderboard Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* AI Performance Coach */}
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Card className="rounded-2xl border-white/[0.08] bg-white/[0.03] overflow-hidden h-full flex flex-col justify-between">
            <div>
              <CardHeader className="pb-2 border-b border-white/[0.04] text-left">
                <div className="flex items-center gap-2">
                  <div className="text-lg">🤖</div>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">AI Performance Coach</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Personalized recommendations from your historic records</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-5 space-y-4 text-left">
                {/* Strength */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <CheckCircle2 className="text-emerald-400 mt-0.5 shrink-0" size={16} />
                  <div>
                    <div className="text-xs font-bold text-foreground">Core Competency Strength</div>
                    <div className="text-xs font-semibold text-emerald-400 mt-0.5">{coachInsights.highest.name} ({coachInsights.highest.val}%)</div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{coachInsights.highest.desc}</p>
                  </div>
                </div>

                {/* Priority */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                  <AlertTriangle className="text-purple-400 mt-0.5 shrink-0" size={16} />
                  <div>
                    <div className="text-xs font-bold text-foreground">High Priority Target Zone</div>
                    <div className="text-xs font-semibold text-purple-400 mt-0.5">{coachInsights.lowest.name} ({coachInsights.lowest.val}%)</div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{coachInsights.lowest.desc}</p>
                  </div>
                </div>
              </CardContent>
            </div>
            
            <CardContent className="pt-0 pb-5 text-left">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
                <div>
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Lightbulb size={12} className="text-amber-400" /> Strategic Action Recommendation
                  </div>
                  <p className="text-xs text-foreground mt-1 leading-relaxed max-w-lg">{coachInsights.actionPlan}</p>
                </div>
                <Link to={coachInsights.recommendationCTA} className="shrink-0">
                  <Button size="sm" className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-xl flex items-center gap-1">
                    Next Action <ChevronRight size={12} />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Competitive Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <Card className="rounded-2xl border-white/[0.08] bg-white/[0.03] h-full overflow-hidden flex flex-col">
            <CardHeader className="pb-2 border-b border-white/[0.04] text-left">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-foreground">Practice Hall of Fame</CardTitle>
                <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20 text-[9px] uppercase font-bold tracking-wider">
                  Top 5 Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Competitive XP standings among peers</p>
            </CardHeader>
            <CardContent className="pt-4 flex-1 space-y-2 text-left">
              {leaderboard.map((item, index) => {
                const isUser = item.isCurrentUser || item._id === 'user' || item.name === user?.name;
                const rankColor = index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-600' : 'text-muted-foreground';
                const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`;

                return (
                  <div 
                    key={item._id || index}
                    className={`flex items-center justify-between p-2 rounded-xl transition-colors ${isUser ? 'bg-purple-500/15 border border-purple-500/30' : 'hover:bg-white/[0.02]'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold text-center w-5 ${rankColor}`}>{rankEmoji}</span>
                      <div className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-xs text-foreground font-bold shrink-0">
                        {item.name?.charAt(0) || 'P'}
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-semibold truncate ${isUser ? 'text-purple-300' : 'text-foreground'}`}>
                          {item.name} {isUser && ' (You)'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Level {item.level} Practitioner</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-foreground">{item.xpPoints.toLocaleString()} XP</div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Interactive Historical Sessions Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Card className="rounded-2xl border-white/[0.08] bg-white/[0.03] overflow-hidden">
          <CardHeader className="pb-3 border-b border-white/[0.04] text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold text-foreground">Session Performance Logs</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Explore detailed question scoring and AI feedback timelines</p>
              </div>
              
              {/* Dynamic Filter Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[180px]">
                  <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                  <Input 
                    placeholder="Search by role..." 
                    className="h-8 pl-8 text-xs rounded-xl bg-white/[0.02] border-white/10 text-foreground w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <select 
                  className="h-8 px-2 text-xs rounded-xl bg-white/[0.02] border border-white/10 text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all" className="bg-[#111118]">All Categories</option>
                  <option value="technical" className="bg-[#111118]">Technical Rounds</option>
                  <option value="behavioral" className="bg-[#111118]">Behavioral Rounds</option>
                  <option value="resume" className="bg-[#111118]">Resume deepdives</option>
                </select>

                <select 
                  className="h-8 px-2 text-xs rounded-xl bg-white/[0.02] border border-white/10 text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                >
                  <option value="all" className="bg-[#111118]">All Difficulties</option>
                  <option value="easy" className="bg-[#111118]">Easy</option>
                  <option value="medium" className="bg-[#111118]">Medium</option>
                  <option value="hard" className="bg-[#111118]">Hard</option>
                </select>
              </div>
            </div>
          </CardHeader>

          {/* Table Content */}
          <CardContent className="p-0">
            {filteredSessions.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <HelpCircle size={28} className="mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm font-medium">No performance records matched your criteria.</p>
                <p className="text-xs mt-0.5">Try clearing filters or search terms.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/[0.01] border-b border-white/[0.04] text-muted-foreground font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Interview Details</th>
                      <th className="py-3 px-4">Date Conducted</th>
                      <th className="py-3 px-4">Difficulty</th>
                      <th className="py-3 px-4">Session Duration</th>
                      <th className="py-3 px-4">Performance Score</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredSessions.map((s, index) => {
                      const scoreColor = s.overallScore >= 80 ? 'text-emerald-400' : s.overallScore >= 68 ? 'text-amber-400' : 'text-red-400';
                      const diffBadge = s.difficulty === 'Hard' ? 'badge-red' : s.difficulty === 'Medium' ? 'badge-amber' : 'badge-green';
                      
                      return (
                        <tr 
                          key={s._id || index}
                          className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                          onClick={() => { setSelectedSession(s); setDrawerTab('overview'); }}
                        >
                          <td className="py-3.5 px-4 text-left">
                            <div className="font-bold text-foreground group-hover:text-purple-400 transition-colors">
                              {s.role}
                            </div>
                            <div className="text-[10px] text-muted-foreground/80 mt-0.5">
                              {s.category?.label || 'Practice Session'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground text-left">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} />
                              {new Date(s.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-left">
                            <span className={`badge ${diffBadge}`}>{s.difficulty || 'Medium'}</span>
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground text-left">
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} />
                              {s.duration || 15} mins
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-left">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-current" style={{ color: s.overallScore >= 80 ? '#10b981' : s.overallScore >= 68 ? '#f59e0b' : '#ef4444' }} />
                              <span className={`font-extrabold ${scoreColor}`}>{s.overallScore}%</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-[10px] text-muted-foreground group-hover:text-foreground group-hover:bg-white/[0.04] rounded-lg px-2 gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSession(s);
                                setDrawerTab('overview');
                              }}
                            >
                              Inspect AI Report <ExternalLink size={10} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Sliding Session Detail Drawer ── */}
      <AnimatePresence>
        {selectedSession && (
          <>
            {/* Backdrop */}
            <motion.div 
              className="fixed inset-0 bg-[#000000]/70 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSession(null)}
            />

            {/* Sliding Panel */}
            <motion.div 
              className="fixed top-0 right-0 h-full w-full max-w-2xl bg-[#0e0e15] border-l border-white/[0.08] shadow-2xl z-50 overflow-y-auto flex flex-col justify-between"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-white/[0.06] bg-white/[0.01] text-left">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="badge badge-purple mb-2">{selectedSession.difficulty} Level</span>
                    <h2 className="text-xl font-extrabold text-foreground">{selectedSession.role}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedSession.category?.label || 'Mock Assessment'} · Conducted on {new Date(selectedSession.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    </p>
                  </div>
                  <button 
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setSelectedSession(null)}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Score Summary Metrics */}
                <div className="grid grid-cols-3 gap-3 mt-5">
                  <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                    <div className="text-2xl font-black text-purple-400">{selectedSession.overallScore}%</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Overall Grade</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                    <div className="text-2xl font-black text-cyan-400">+{selectedSession.xpEarned || Math.round(selectedSession.overallScore * 1.5)}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">XP Accumulated</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <div className="text-2xl font-black text-emerald-400">{selectedSession.duration || 15}m</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Session Length</div>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mt-6 pt-1 border-t border-white/[0.04]">
                  {[
                    { id: 'overview', label: 'Overall Competency', icon: BarChart3 },
                    { id: 'questions', label: 'Questions Reviewed', icon: BookOpenCheck },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${drawerTab === tab.id ? 'bg-purple-600 text-white animate-none' : 'bg-white/[0.04] text-muted-foreground hover:text-foreground'}`}
                      onClick={() => setDrawerTab(tab.id)}
                    >
                      <tab.icon size={12} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drawer Content */}
              <div className="p-6 flex-1 bg-[#0b0b10] text-left">
                {/* ── OVERVIEW TAB ── */}
                {drawerTab === 'overview' && (
                  <div className="space-y-5">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
                        <TrendingUp size={13} className="text-purple-400" /> Evaluation Metric Breakdown
                      </h4>
                      
                      <div className="space-y-4">
                        {[
                          { l: 'Communication Clarity', k: 'communication', color: 'bg-purple-500' },
                          { l: 'Technical Proficiency', k: 'technical', color: 'bg-cyan-500' },
                          { l: 'Delivery Confidence', k: 'confidence', color: 'bg-emerald-500' },
                          { l: 'Articulation Speed', k: 'clarity', color: 'bg-amber-500' },
                          { l: 'Answer Structure (STAR)', k: 'structure', color: 'bg-rose-500' }
                        ].map((metric) => {
                          const val = selectedSession.metrics?.[metric.k] || selectedSession.overallScore;
                          return (
                            <div key={metric.k} className="space-y-1.5">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{metric.l}</span>
                                <span className="font-bold text-foreground">{val}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                                <motion.div 
                                  className={`h-full rounded-full ${metric.color}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${val}%` }}
                                  transition={{ duration: 0.6, delay: 0.1 }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* AI Coach Summary Card */}
                    <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={16} className="text-purple-400 animate-pulse" />
                        <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">AI Coach Summary Notes</h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        During this mock {selectedSession.role} round, you performed {selectedSession.overallScore >= 80 ? 'exceptionally well' : selectedSession.overallScore >= 70 ? 'reasonably well' : 'fairly'}. 
                        Your strongest category was {(selectedSession.metrics?.technical || 0) >= (selectedSession.metrics?.communication || 0) ? 'Technical Depth' : 'Vocal Clarity'}. 
                        To achieve higher results next time, focus heavily on improving your {(selectedSession.metrics?.structure || 75) <= 80 ? 'STAR structural framing' : 'confidence delivery'}. Focus on minimizing fillers like 'um' and adding numerical impact descriptions.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── QUESTIONS REVIEW TAB ── */}
                {drawerTab === 'questions' && (
                  <div className="space-y-5">
                    {(!selectedSession.answers || selectedSession.answers.length === 0) ? (
                      <div className="p-12 text-center text-muted-foreground bg-white/[0.01] rounded-2xl border border-white/[0.04]">
                        <BookOpenCheck size={28} className="mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-xs font-medium">Question-by-question metrics weren't saved for this interview.</p>
                      </div>
                    ) : (
                      selectedSession.answers.map((ans, i) => {
                        const scoreColor = ans.score >= 80 ? 'text-emerald-400' : ans.score >= 65 ? 'text-amber-400' : 'text-red-400';
                        return (
                          <div 
                            key={i} 
                            className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-3"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex gap-2">
                                <span className="w-5 h-5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  Q{i + 1}
                                </span>
                                <h4 className="text-xs font-bold text-foreground leading-relaxed">{ans.questionText}</h4>
                              </div>
                              <span className={`text-xs font-black shrink-0 ${scoreColor}`}>
                                {ans.score}%
                              </span>
                            </div>

                            {/* User Answer */}
                            <div className="bg-white/[0.01] border border-white/[0.03] p-3 rounded-xl">
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                                Your Response
                              </span>
                              <p className="text-xs text-muted-foreground/90 leading-relaxed italic">
                                "{ans.userAnswer || 'No response detected.'}"
                              </p>
                            </div>

                            {/* AI Coach Feedback */}
                            <div className="bg-purple-500/[0.02] border border-purple-500/10 p-3 rounded-xl flex items-start gap-2.5">
                              <Lightbulb size={14} className="text-amber-400 mt-0.5 shrink-0" />
                              <div>
                                <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider block mb-0.5">
                                  AI Grading & Correction Insights
                                </span>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {ans.feedback || 'Review the conceptual structure of this question.'}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-white/[0.06] bg-white/[0.01] flex items-center justify-between text-left">
                <div className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider">
                  ConfidentAI AI Coach Panel v1.2
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-8 text-xs border-white/10 text-foreground hover:bg-white/[0.04] rounded-xl"
                  onClick={() => setSelectedSession(null)}
                >
                  Close Insights
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

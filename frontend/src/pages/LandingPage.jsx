/* ── LandingPage.jsx — Vercel & GitHub Premium Landing Page ────────── */
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Code2, Trophy, Sparkles, Mic, FileText, ArrowRight, 
  Terminal, CheckCircle, Star, Zap, Shield, Play, 
  Layers, Volume2, Cpu, HelpCircle, ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ── Inline SVG Github Icon to avoid version export issues ── */
const Github = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

/* ── Custom HTML5 Canvas Particle Grid Animation ── */
function CanvasBackground() {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    
    // Nodes / Stars array
    const nodes = [];
    const nodeCount = 50;
    
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.5,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        alpha: Math.random() * 0.4 + 0.15,
        color: Math.random() > 0.4 ? '#7c3aed' : '#06b6d4'
      });
    }

    // Grid beams flowing vertically down
    const beams = [];
    const beamCount = 15;
    for (let i = 0; i < beamCount; i++) {
      beams.push({
        x: Math.floor(Math.random() * (width / 50)) * 50, // snap to grid x
        y: Math.random() * -height,
        speed: Math.random() * 1.8 + 0.7,
        length: Math.random() * 140 + 60,
        color: Math.random() > 0.5 ? '#7c3aed' : '#06b6d4',
        thickness: Math.random() * 1.2 + 0.5
      });
    }
    
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.012)';
      ctx.lineWidth = 0.8;
      const gridSize = 60;
      
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      // Flow laser grid beams
      beams.forEach(beam => {
        const grad = ctx.createLinearGradient(beam.x, beam.y - beam.length, beam.x, beam.y);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(1, beam.color);
        
        ctx.strokeStyle = grad;
        ctx.lineWidth = beam.thickness;
        ctx.beginPath();
        ctx.moveTo(beam.x, beam.y - beam.length);
        ctx.lineTo(beam.x, beam.y);
        ctx.stroke();
        
        // Move beam
        beam.y += beam.speed;
        if (beam.y - beam.length > height) {
          beam.y = -Math.random() * 200;
          beam.x = Math.floor(Math.random() * (width / 50)) * 50;
        }
      });
      
      // Floating neon network nodes
      nodes.forEach((n, index) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.globalAlpha = n.alpha;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        
        // Update positions
        n.x += n.vx;
        n.y += n.vy;
        
        // Wrap coordinates
        if (n.x < 0) n.x = width;
        if (n.x > width) n.x = 0;
        if (n.y < 0) n.y = height;
        if (n.y > height) n.y = 0;
        
        // Draw lines connecting nearby nodes
        for (let j = index + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n.x - n2.x;
          const dy = n.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 120) {
            const opacity = (1 - dist / 120) * 0.05;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = n.color === '#7c3aed' ? `rgba(124, 58, 237, ${opacity})` : `rgba(6, 182, 212, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });
      
      animationFrameId = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
}

/* ── FAQ Component ── */
function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/5 py-4 text-left">
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-sm font-semibold text-white hover:text-purple-300 transition-colors py-2 outline-none"
      >
        <span>{question}</span>
        <ChevronDown size={16} className={`text-muted-foreground transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="text-xs text-muted-foreground leading-relaxed mt-2.5 pb-2">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main Landing Page ── */
export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Pricing Toggle state
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' or 'yearly'

  const handleCtaClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-foreground font-sans relative overflow-x-hidden select-none">
      
      {/* Dynamic Laser Beams Canvas background */}
      <CanvasBackground />

      {/* Grid Overlay Mask */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-40" 
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(124,58,237,0.08) 0%, transparent 60%)'
        }}
      />

      {/* ── Glass Top Header ── */}
      <header className="sticky top-0 w-full z-50 border-b border-white/5 bg-[#030303]/60 backdrop-blur-md px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white bg-gradient-to-br from-purple-600 to-cyan-500 shadow-md group-hover:scale-105 transition-all">
              <Brain size={18} />
            </div>
            <span className="font-display font-extrabold text-lg text-white tracking-tight">
              Confident<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">AI</span>
            </span>
          </Link>

          {/* Central Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-muted-foreground">
            <a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#sandbox" className="text-gray-400 hover:text-white transition-colors">Compiler Sandbox</a>
            <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="text-gray-400 hover:text-white transition-colors">FAQ</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard">
                <button className="h-9 px-4 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 font-semibold text-xs transition-all flex items-center gap-2">
                  Enter Dashboard <ArrowRight size={13} />
                </button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-xs font-semibold text-muted-foreground hover:text-white transition-colors px-3 py-1.5">
                  Sign In
                </Link>
                <Link to="/register">
                  <button className="h-9 px-4 rounded-xl bg-white text-black hover:bg-white/90 font-semibold text-xs shadow-md transition-all">
                    Start Mocks Free
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── 1. Hero Section ── */}
      <section className="relative z-10 pt-16 pb-24 px-4 max-w-6xl mx-auto text-center flex flex-col items-center">
        
        {/* Glow pill */}
        <motion.div 
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[10px] font-bold tracking-wide uppercase mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Sparkles size={11} className="text-purple-400" />
          Split-Pane Monaco Compiler Sandbox live
        </motion.div>

        {/* Hero Title */}
        <motion.h1 
  className="text-4xl sm:text-6xl font-extrabold font-display leading-[1.08] tracking-tight max-w-4xl text-gray-400"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.1 }}
>
  Master Mocks & Coding. <br />
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-violet-400 via-indigo-400 to-cyan-400">
    Assisted by Advanced AI.
  </span>
</motion.h1>

        {/* Hero Paragraph */}
        <motion.p 
          className="text-sm sm:text-base text-muted-foreground mt-6 max-w-2xl leading-relaxed font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Simulate real-world audio mock interviews with customizable AI personas, compile Python, JavaScript, and C++ code in our split IDE sandbox, optimize resume ATS keyword weightings, and claim your place on the live XP leaderboard.
        </motion.p>

        {/* CTAs */}
        <motion.div 
          className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full sm:w-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <button 
            onClick={handleCtaClick}
            className="w-full sm:w-auto h-12 px-8 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-[0_0_30px_rgba(124,58,237,0.3)] transition-all flex items-center justify-center gap-2"
          >
            Start Practicing Free <ArrowRight size={15} />
          </button>
          
          <a href="#sandbox" className="w-full sm:w-auto">
            <button className="w-full h-12 px-8 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] text-white font-semibold text-sm transition-all">
              Explore Sandbox IDE
            </button>
          </a>
        </motion.div>

        {/* ── 3D Dashboard Preview ── */}
        <motion.div 
          className="w-full mt-16 rounded-2xl border border-white/10 bg-[#0e0e15]/40 backdrop-blur-xl p-3 shadow-2xl relative"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ perspective: 1000 }}
        >
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 opacity-20 blur-xl z-0" />
          
          {/* Header Controls */}
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/5 z-10 relative">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            <div className="h-4 w-40 rounded bg-white/[0.04] ml-4 text-[9px] text-muted-foreground flex items-center justify-center ">
              confidentai.dev/dashboard
            </div>
          </div>
          
          {/* Mockup Dashboard Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 text-left z-10 relative min-h-[260px]">
            {/* Left Column: Stats & Recommendations */}
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Level Status</div>
                <div className="text-lg font-display font-extrabold mt-1 text-purple-400">Level 4 — Elite Advocate</div>
                <div className="w-full h-1.5 rounded-full bg-white/[0.04] mt-2 overflow-hidden">
                  <div className="w-3/4 h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full" />
                </div>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-2">
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Recommended Mocks</div>
                <div className="flex items-center justify-between p-1.5 rounded bg-white/[0.03]">
                  <span className="text-[10px] font-bold text-foreground truncate text-gray-400">Behavioral prep practice</span>
                  <span className="text-[8px] bg-purple-500/20 text-purple-300 px-1 rounded">Medium</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-white/[0.03]">
                  <span className="text-[10px] font-bold text-foreground truncate text-gray-400">Array list search</span>
                  <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1 rounded">Easy</span>
                </div>
              </div>
            </div>

            {/* Center Column: Weekly Progress */}
            <div className="md:col-span-2 p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-white">Weekly score consistency</span>
                  <span className="text-[10px] text-emerald-400 font-bold">+14.2%</span>
                </div>
                <span className="text-[9px] text-muted-foreground leading-relaxed block">Your confidence & technical averages are climbing.</span>
              </div>
              
              {/* Dummy Chart wave */}
              <div className="h-28 flex items-end gap-1.5 mt-4">
                {[60, 68, 64, 75, 78, 88, 92].map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end items-center h-full gap-1 group">
                    <div 
                      className="w-full rounded-t-lg bg-gradient-to-t from-purple-600/30 to-purple-500 hover:to-cyan-400 transition-all duration-300 relative" 
                      style={{ height: `${v}%` }}
                    >
                      <div className="absolute inset-0 bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg" />
                    </div>
                    <span className="text-[8px] text-muted-foreground font-semibold">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── 2. The Features Bento Grid ── */}
      <section id="features" className="relative z-10 py-24 px-4 max-w-6xl mx-auto border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-2">Designed for Mastery</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white">
            Everything you need to claim top tech offers.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Bento 1: Monaco sandbox */}
          <div className="md:col-span-2 p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:border-purple-500/20 transition-all duration-300 text-left flex flex-col justify-between min-h-[300px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-44 h-44 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/15 transition-all" />
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 shrink-0">
                <Code2 size={20} />
              </div>
              <h3 className="text-lg font-bold font-display text-white">Split-Pane Monaco Compiler</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-md">
                Solve algorithms directly inside a sandboxed editor powered by Microsoft’s Monaco library. Supports C++, Python, and JS test automation.
              </p>
            </div>
            
            {/* Visual Monaco Simulator */}
            <div className="mt-6 rounded-xl border border-white/5 bg-[#08080c] p-3 text-[10px] font-mono leading-relaxed text-muted-foreground relative">
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-2">
                <span className="text-[9px] text-purple-400 font-semibold">SolutionWrapper.py</span>
                <span className="text-[8px] bg-purple-600/20 text-purple-300 px-1.5 rounded">Active</span>
              </div>
              <div className="text-purple-300">def <span className="text-white">twoSum</span>(nums, target):</div>
              <div className="pl-4 text-slate-400">hash_map = {'{}'}</div>
              <div className="pl-4 text-slate-400">for i, num in enumerate(nums):</div>
              <div className="pl-8 text-cyan-400">diff = target - num</div>
              <div className="pl-8 text-slate-400">if diff in hash_map:</div>
              <div className="pl-12 text-purple-300">return [hash_map[diff], i]</div>
            </div>
          </div>

          {/* Bento 2: Adaptive Audio */}
          <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:border-cyan-500/20 transition-all duration-300 text-left flex flex-col justify-between min-h-[300px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all" />
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shrink-0">
                <Mic size={20} />
              </div>
              <h3 className="text-lg font-bold font-display text-white">Adaptive Voice AI Mocks</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Experience realistic audio mock rounds. AI interviewers change behavior and follow-up based on your response quality.
              </p>
            </div>
            
            {/* Voice Soundwaves simulator */}
            <div className="flex items-end gap-1 mt-6 h-12 overflow-hidden px-1 py-1">
              {[8, 20, 36, 12, 44, 28, 16, 32, 24, 8, 40, 16, 28, 12].map((h, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-full voice-bar-anim"
                  style={{ 
                    height: `${h}%`,
                    animationDelay: `${i * 0.05}s`,
                    animationDuration: `${0.4 + (i % 4) * 0.12}s`
                  }}
                />
              ))}
            </div>
          </div>

          {/* Bento 3: Gamified Accomplishments */}
          <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:border-cyan-500/20 transition-all duration-300 text-left flex flex-col justify-between min-h-[300px] relative overflow-hidden group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shrink-0">
                <Trophy size={20} />
              </div>
              <h3 className="text-lg font-bold font-display text-white">Gamified XP Board</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Rank up from Novice to Elite. Complete weekly milestone objectives, keep daily practice streaks alive, and earn special status badges.
              </p>
            </div>
            
            <div className="mt-6 p-3 rounded-xl bg-[#08080c] border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-foreground">🏆 Streak Master Achievement</span>
                <span className="text-amber-400 font-extrabold">+250 XP</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                <div className="w-[80%] h-full bg-amber-400 rounded-full" />
              </div>
            </div>
          </div>

          {/* Bento 4: Resume Analyzer */}
          <div className="md:col-span-2 p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:border-purple-500/20 transition-all duration-300 text-left flex flex-col justify-between min-h-[300px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-all" />
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shrink-0">
                <FileText size={20} />
              </div>
              <h3 className="text-lg font-bold font-display text-white">AI ATS Resume Optimizer</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-md">
                Upload your resume to retrieve immediate ATS compatibility ratings. Review target keyword match scores and structured recommendation advice to bypass screeners automatically.
              </p>
            </div>
            
            {/* ATS Scoring Bar Simulator */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="p-2.5 rounded-lg bg-[#08080c] border border-white/5 text-center">
                <span className="text-[8px] text-muted-foreground font-semibold block">ATS score</span>
                <span className="text-sm font-bold text-emerald-400 mt-0.5 block">87%</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#08080c] border border-white/5 text-center">
                <span className="text-[8px] text-muted-foreground font-semibold block">Missing keywords</span>
                <span className="text-sm font-bold text-amber-400 mt-0.5 block">4 critical</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#08080c] border border-white/5 text-center">
                <span className="text-[8px] text-muted-foreground font-semibold block">Readability</span>
                <span className="text-sm font-bold text-cyan-400 mt-0.5 block">Excellent</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── 3. Monaco Compiler Demo Section ── */}
      <section id="sandbox" className="relative z-10 py-24 px-4 bg-[#050508]/40 border-t border-white/5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="text-left space-y-6">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Interactive compilation</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white leading-tight">
              Test your logic <br />
              against secure unit suites.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Ditch basic markdown input fields. Our split Monaco editor handles multi-language syntax highlighting, compiles C++, Python, Java, or JavaScript on a secure runner backend, captures standard standard streams, and reports real-time unit test executions.
            </p>
            
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <CheckCircle size={15} className="text-purple-400 shrink-0" />
                <span className="text-xs font-semibold text-foreground text-gray-400">Standard STL support for g++ (GCC) C++ binaries</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle size={15} className="text-purple-400 shrink-0" />
                <span className="text-xs font-semibold text-foreground text-gray-400">Self-contained Sandboxed JS runtime engine fallbacks</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle size={15} className="text-purple-400 shrink-0" />
                <span className="text-xs font-semibold text-foreground text-gray-400">Dynamic server verification routing templates</span>
              </div>
            </div>
            
            <button 
              onClick={handleCtaClick}
              className="h-10 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-xs text-white shadow-lg transition-all flex items-center gap-2 mt-4"
            >
              Open Compiler Sandbox <ArrowRight size={13} />
            </button>
          </div>

          {/* Monaco Screen Mockup Frame */}
          <div className="relative p-1 rounded-2xl border border-white/10 bg-[#0e0e15]/60 shadow-2xl overflow-hidden text-left">
            {/* Tab strip */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-[10px] text-muted-foreground ml-3 font-mono">Solution.cpp</span>
              </div>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                Unit Tests Passing (3/3)
              </span>
            </div>
            
            <div className="p-4 font-mono text-[10.5px] leading-relaxed text-muted-foreground space-y-1 bg-[#09090f]">
              <div><span className="text-purple-400">#include</span> <span className="text-cyan-400">&lt;iostream&gt;</span></div>
              <div><span className="text-purple-400">#include</span> <span className="text-cyan-400">&lt;vector&gt;</span></div>
              <div><span className="text-purple-400">#include</span> <span className="text-cyan-400">&lt;stack&gt;</span></div>
              <div className="text-slate-500">// Check valid brackets matching targetTarget</div>
              <div><span className="text-purple-400">bool</span> <span className="text-white">isValid</span>(std::string s) {"{"}</div>
              <div className="pl-4">std::stack&lt;<span className="text-purple-400">char</span>&gt; st;</div>
              <div className="pl-4"><span className="text-purple-400">for</span> (<span className="text-purple-400">char</span> c : s) {"{"}</div>
              <div className="pl-8"><span className="text-purple-400">if</span> (c == <span className="text-cyan-400">{"'('"}</span> || c == <span className="text-cyan-400">{"'['"}</span> || c == <span className="text-cyan-400">{"'{'"}</span>) st.push(c);</div>
              <div className="pl-8"><span className="text-purple-400">else</span> {"{"}</div>
              <div className="pl-12"><span className="text-purple-400">if</span> (st.empty()) <span className="text-purple-400">return</span> <span className="text-cyan-400">false</span>;</div>
              <div className="pl-12"><span className="text-purple-400">char</span> top = st.top();</div>
              <div className="pl-12">st.pop();</div>
              <div className="pl-12"><span className="text-purple-400">if</span> ((c == <span className="text-cyan-400">{"')'"}</span> && top != <span className="text-cyan-400">{"'('"}</span>) || ... ) <span className="text-purple-400">return</span> <span className="text-cyan-400">false</span>;</div>
              <div className="pl-8">{"}"}</div>
              <div className="pl-4">{"}"}</div>
              <div className="pl-4"><span className="text-purple-400">return</span> st.empty();</div>
              <div>{"}"}</div>
            </div>
            
            {/* Output Panel simulator */}
            <div className="border-t border-white/5 bg-[#040406] p-4 text-[10px] font-mono">
              <span className="text-purple-400 font-bold block mb-1">CONSOLE RUN LOGS:</span>
              <div className="text-emerald-400">✓ Test Case 1 Passed: Input = "()[]{}" {"->"} Expected = True</div>
              <div className="text-emerald-400">✓ Test Case 2 Passed: Input = "(]" {"->"} Expected = False</div>
              <div className="text-emerald-400">✓ Test Case 3 Passed: Input = "([)]" {"->"} Expected = False</div>
              <div className="text-muted-foreground mt-2">Compiled in 184ms — Code execution sweep completed.</div>
            </div>
          </div>

        </div>
      </section>

      {/* ── 4. Premium SaaS Pricing Section (Vercel style) ── */}
      <section id="pricing" className="relative z-10 py-24 px-4 max-w-6xl mx-auto border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block mb-2">Transparent Subscriptions</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white">
            Plans built to accelerate your career.
          </h2>
          
          {/* Billing Switcher */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className={`text-xs font-semibold ${billingPeriod === 'monthly' ? 'text-white' : 'text-muted-foreground'}`}>Monthly billing</span>
            <button 
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className="w-10 h-5 rounded-full bg-white/10 p-0.5 flex items-center transition-all duration-300 relative"
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-all ${billingPeriod === 'yearly' ? 'translate-x-5 bg-purple-400' : ''}`} />
            </button>
            <span className={`text-xs font-semibold ${billingPeriod === 'yearly' ? 'text-white' : 'text-muted-foreground'} flex items-center gap-1.5`}>
              Yearly billing 
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Plan 1: Free Starter */}
          <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col justify-between text-left relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Starter Tier</span>
                <h3 className="text-2xl font-extrabold font-display text-white mt-1">Free Aspirant</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Excellent option for developers exploring initial setup parameters and preparing basic technical concepts.
                </p>
              </div>

              <div className="py-4 border-y border-white/5">
                <span className="text-4xl font-extrabold font-display text-white">$0</span>
                <span className="text-xs text-muted-foreground ml-1">forever free</span>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Starter Pack Features:</span>
                <div className="flex items-center gap-2.5 text-xs text-foreground text-gray-400">
                  <CheckCircle size={13} className="text-muted-foreground" />
                  <span>3 Audio Mock Interview simulations per month</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-foreground text-gray-400">
                  <CheckCircle size={13} className="text-muted-foreground" />
                  <span>Basic Monaco Coding editor access (JS evaluation)</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-foreground text-gray-400">
                  <CheckCircle size={13} className="text-muted-foreground" />
                  <span>Standard leaderboard XP points accumulation</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-foreground text-gray-400">
                  <CheckCircle size={13} className="text-muted-foreground" />
                  <span>Comprehensive question list browsing</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleCtaClick}
              className="w-full h-11 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] text-white font-semibold text-xs mt-8 transition-all"
            >
              {user ? 'Enter App' : 'Get Started Free'}
            </button>
          </div>

          {/* Plan 2: Elite Pro */}
          <div className="p-8 rounded-2xl border border-purple-500/30 bg-[#0e0e1a]/40 backdrop-blur-xl flex flex-col justify-between text-left relative overflow-hidden group">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 opacity-10 blur-xl z-0" />
            
            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block">Unlimited Tier</span>
                  <h3 className="text-2xl font-extrabold font-display text-white mt-1">Elite Pro</h3>
                </div>
                <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Popular Choice
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                For developers committed to securing premium target offers and running intensive multi-language algorithm checks.
              </p>

              <div className="py-4 border-y border-white/5">
                <span className="text-4xl font-extrabold font-display text-white">
                  {billingPeriod === 'monthly' ? '$19' : '$15'}
                </span>
                <span className="text-xs text-muted-foreground ml-1">/ month billed {billingPeriod}</span>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Elite Pro Pack Features:</span>
                <div className="flex items-center gap-2.5 text-xs text-gray-400">
                  <CheckCircle size={13} className="text-purple-400" />
                  <span>Unlimited AI Audio Mock rounds with custom voice options</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-foreground text-gray-400">
                  <CheckCircle size={13} className="text-purple-400" />
                  <span>Full secure C++, Python, and Java compilation runs</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-foreground text-gray-400">
                  <CheckCircle size={13} className="text-purple-400" />
                  <span>AI ATS Resume Optimizer compatibility scorecard</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-foreground text-gray-400">
                  <CheckCircle size={13} className="text-purple-400" />
                  <span>Priority access to newly updated technical question cards</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-foreground text-gray-400">
                  <CheckCircle size={13} className="text-purple-400" />
                  <span>24/7 dedicated platform guidance support</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleCtaClick}
              className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs mt-8 transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] relative z-10"
            >
              Upgrade to Pro ⚡
            </button>
          </div>

        </div>
      </section>

      {/* ── 5. FAQ Section ── */}
      <section id="faq" className="relative z-10 py-24 px-4 bg-[#050508]/20 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-2">Have questions?</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-1">
            <FaqItem 
              question="How does the AI audio mock interview simulate actual rounds?"
              answer="Our audio interface captures raw vocal responses via microphone streams, converts them using browser speech-to-text models, and forwards the parsed data to a customizable GPT evaluator. The AI evaluates both structural clarity (like STAR framework checks) and technical precision, adjusting its next conversational follow-up to match standard live tech interview routines."
            />
            <FaqItem 
              question="What programming languages does the Monaco compiler support?"
              answer="The compiler interface supports standard multi-language structures including Python 3, JavaScript (Vite-Node), Java, and C++ (using the GCC g++ optimization flags). Standard input/output processes compile in secure subfolders on our server sandboxes."
            />
            <FaqItem 
              question="Can I use the ATS Resume Optimizer on the free tier?"
              answer="The ATS Resume Optimizer, including structured keyword checks and compatibility reports, is reserved for our Premium Elite Pro subscribers. Free tier members can update basic profile characteristics, answer questions, and execute basic JavaScript compiling tasks."
            />
            <FaqItem 
              question="Is my uploaded code or resume private?"
              answer="Yes! All code solutions are isolated to secure temp folder runtimes and swept immediately clean post-execution. Resumes are processed dynamically to report matching scores and are stored safely under restricted user tokens in MongoDB. We never sell or share user data."
            />
          </div>
        </div>
      </section>

      {/* ── 6. Bottom Banner / CTA ── */}
      <section className="relative z-10 py-24 px-4 bg-gradient-to-b from-transparent to-[#05050a] border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white">
            Build interview confidence today.
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto font-medium">
            Join thousands of developers leveling up their interview techniques, tracking streaks, compiling algorithms, and landing engineering roles.
          </p>
          
          <button 
            onClick={handleCtaClick}
            className="h-12 px-8 rounded-2xl bg-white text-black hover:bg-white/90 font-semibold text-sm shadow-[0_4px_30px_rgba(255,255,255,0.15)] transition-all inline-flex items-center gap-2 mt-4"
          >
            Claim Your Free Mocks Now <Zap size={14} className="text-purple-600 fill-purple-600" />
          </button>
        </div>
      </section>

      {/* ── 7. Premium Designer Footer (Heizen style) ── */}
      <footer className="relative z-10 border-t border-white/5 bg-[#050508] pt-16 pb-6 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col gap-8 relative z-10">
          
          {/* First Row: Brand Logo & Main Navigation */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-white/5 pb-8 text-left">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-glow">
                <Brain size={16} />
              </div>
              <span className="font-display font-extrabold text-lg text-white tracking-tight">
                Confident<span className="text-purple-400">AI</span>
              </span>
            </div>
          </div>

          {/* Second Row: Copyright & Socials */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 text-center sm:text-left">
            <span>© {new Date().getFullYear()} ConfidentAI. All Rights Reserved</span>
            
            {/* Social Icons */}
            <div className="flex items-center gap-4 text-gray-400">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Instagram">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="X (Twitter)">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
          </div>

        </div>

        {/* Third Row: Massive decorative cut-off brand text */}
        <div className="w-full text-center pointer-events-none select-none overflow-hidden mt-6">
          <h1 className="text-[12vw] sm:text-[13.8vw] font-black tracking-widest bg-gradient-to-b from-purple-300/25 via-cyan-400/5 to-transparent bg-clip-text text-transparent uppercase leading-none font-display translate-y-8 select-none">
            CONFIDENTAI
          </h1>
        </div>
      </footer>

    </div>
  );
}

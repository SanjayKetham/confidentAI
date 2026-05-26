/* ── Login Page — Tailwind + shadcn/ui ───────────────────────── */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});
  const { login }               = useAuth();
  const navigate                = useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  }

  function validate() {
    const errs = {};
    if (!form.email)                          errs.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email  = 'Invalid email address';
    if (!form.password)                       errs.password = 'Password is required';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      if (data?.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // async function demoLogin() {
  //   setLoading(true);
  //   try {
  //     await login('demo@confidentai.app', 'demo1234');
  //     navigate('/dashboard');
  //   } catch {
  //     toast('Demo mode — backend not connected yet', { icon: 'ℹ️' });
  //     navigate('/dashboard');
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden"
         style={{ background: 'var(--bg-base)' }}>
      {/* Animated gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none animate-pulse"
           style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-15 blur-3xl pointer-events-none animate-pulse"
           style={{ background: 'radial-gradient(circle, #06b6d4, transparent 70%)', animationDelay: '1s' }} />

      <motion.div
        className="relative z-10 w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Card */}
        <div className="rounded-3xl border p-8 shadow-2xl backdrop-blur-xl"
             style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
                 style={{ background: 'var(--gradient-brand)' }}>
              <Brain size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold font-display text-foreground mb-1">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to continue your interview journey</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                Email address
              </Label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="email" name="email" type="email"
                  className={cn(
                    'pl-10 bg-black/5 dark:bg-white/[0.04] border-black/10 dark:border-white/10 text-foreground placeholder:text-muted-foreground/60 focus:border-purple-400/60 focus:ring-purple-500/20',
                    errors.email && 'border-red-500 focus:border-red-500'
                  )}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="password" name="password"
                  type={showPass ? 'text' : 'password'}
                  className={cn(
                    'pl-10 pr-10 bg-black/5 dark:bg-white/[0.04] border-black/10 dark:border-white/10 text-foreground placeholder:text-muted-foreground/60 focus:border-purple-400/60 focus:ring-purple-500/20',
                    errors.password && 'border-red-500 focus:border-red-500'
                  )}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPass(p => !p)}
                  aria-label="Toggle password visibility"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
            </div>

            {/* Forgot */}
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <Button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full h-11 text-white font-semibold rounded-xl transition-all duration-200 hover:opacity-90 hover:shadow-glow"
              style={{ background: 'var(--gradient-brand)', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}
            >
              {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <ArrowRight size={16} className="mr-2" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
          </div>

          {/* Demo */}
          {/* <Button
            id="demo-login-btn"
            type="button"
            variant="outline"
            disabled={loading}
            onClick={demoLogin}
            className="w-full h-10 border-white/10 bg-white/[0.04] text-foreground hover:bg-white/[0.08] hover:border-white/20 rounded-xl"
          >
            ⚡ Try Demo Account
          </Button> */}

          {/* Switch */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Register for free →
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

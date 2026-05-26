/* ── Register Page — Tailwind + shadcn/ui ────────────────────── */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, User, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#ef4444', '#f59e0b', '#10b981', '#06b6d4'];

function getPasswordStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8)            score++;
  if (/[A-Z]/.test(pwd))         score++;
  if (/[0-9]/.test(pwd))         score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

export default function RegisterPage() {
  const [form, setForm]         = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});
  const { register }            = useAuth();
  const navigate                = useNavigate();
  const strength                = getPasswordStrength(form.password);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim())                     errs.name     = 'Full name is required';
    if (!form.email)                           errs.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email   = 'Invalid email address';
    if (!form.password)                        errs.password = 'Password is required';
    else if (form.password.length < 8)         errs.password = 'Minimum 8 characters';
    if (form.password !== form.confirm)        errs.confirm  = 'Passwords do not match';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await register(form.name.trim(), form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputBase = 'bg-black/5 dark:bg-white/[0.04] border-black/10 dark:border-white/10 text-foreground placeholder:text-muted-foreground/60 focus:border-purple-400/60 focus-visible:ring-purple-500/20';

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden py-8"
         style={{ background: 'var(--bg-base)' }}>
      <div className="absolute top-[-15%] right-[-5%] w-[450px] h-[450px] rounded-full opacity-20 blur-3xl pointer-events-none animate-pulse"
           style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }} />
      <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-15 blur-3xl pointer-events-none animate-pulse"
           style={{ background: 'radial-gradient(circle, #06b6d4, transparent 70%)', animationDelay: '1.5s' }} />

      <motion.div
        className="relative z-10 w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="rounded-3xl border p-8 shadow-2xl backdrop-blur-xl"
             style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}>
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
                 style={{ background: 'var(--gradient-brand)' }}>
              <Brain size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Create your account</h1>
            <p className="text-sm text-muted-foreground">Start your AI-powered interview prep today</p>
          </div>

          {/* Benefits */}
          <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
            {['Free forever', 'AI feedback', 'Voice analysis'].map(b => (
              <div key={b} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                <span>{b}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-name" className="text-xs text-muted-foreground">Full name</Label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input id="reg-name" name="name" type="text"
                  className={cn('pl-10', inputBase, errors.name && 'border-red-500')}
                  placeholder="Ravi Kumar" value={form.name} onChange={handleChange} autoComplete="name" />
              </div>
              {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-email" className="text-xs text-muted-foreground">Email address</Label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input id="reg-email" name="email" type="email"
                  className={cn('pl-10', inputBase, errors.email && 'border-red-500')}
                  placeholder="you@example.com" value={form.email} onChange={handleChange} autoComplete="email" />
              </div>
              {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-password" className="text-xs text-muted-foreground">Password</Label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input id="reg-password" name="password" type={showPass ? 'text' : 'password'}
                  className={cn('pl-10 pr-10', inputBase, errors.password && 'border-red-500')}
                  placeholder="Min 8 characters" value={form.password} onChange={handleChange} autoComplete="new-password" />
                <button type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPass(p => !p)}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.password && (
                <div className="flex items-center gap-1.5 mt-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                         style={{ background: i <= strength ? STRENGTH_COLORS[strength] : 'var(--bg-elevated)' }} />
                  ))}
                  <span className="text-[11px] ml-1 font-medium" style={{ color: STRENGTH_COLORS[strength] }}>
                    {STRENGTH_LABELS[strength]}
                  </span>
                </div>
              )}
              {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
            </div>

            {/* Confirm */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-confirm" className="text-xs text-muted-foreground">Confirm password</Label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input id="reg-confirm" name="confirm" type={showPass ? 'text' : 'password'}
                  className={cn('pl-10', inputBase, errors.confirm && 'border-red-500')}
                  placeholder="Repeat password" value={form.confirm} onChange={handleChange} autoComplete="new-password" />
              </div>
              {errors.confirm && <p className="text-xs text-red-400">{errors.confirm}</p>}
            </div>

            <Button id="register-submit-btn" type="submit" disabled={loading}
              className="w-full h-11 text-white font-semibold rounded-xl mt-2 hover:opacity-90 transition-all"
              style={{ background: 'var(--gradient-brand)', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}>
              {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <ArrowRight size={16} className="mr-2" />}
              {loading ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-[11px] text-muted-foreground mt-4">
            By registering you agree to our{' '}
            <a href="#" className="text-purple-400 hover:underline">Terms</a> and{' '}
            <a href="#" className="text-purple-400 hover:underline">Privacy Policy</a>.
          </p>
          <p className="text-center text-sm text-muted-foreground mt-3">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">Sign in →</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/* ── SettingsPage.jsx — Custom high-fidelity page ──────────────── */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  User, Volume2, Mic, Bot, Sparkles, Lock, Shield, Save,
  Check, Loader2, Video, Sliders, ToggleLeft, ToggleRight, Eye, EyeOff
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5555/api';

const PRESET_AVATARS = [
  { id: 'dev_purple', emoji: '👾', label: 'Tech Wizard', bg: 'from-purple-600 to-indigo-600' },
  { id: 'ai_cyan', emoji: '🤖', label: 'AI Architect', bg: 'from-cyan-500 to-blue-600' },
  { id: 'design_rose', emoji: '🎨', label: 'UI Crafter', bg: 'from-rose-500 to-pink-600' },
  { id: 'pm_gold', emoji: '👑', label: 'Strategy Lead', bg: 'from-amber-500 to-orange-600' },
  { id: 'sys_emerald', emoji: '⚡', label: 'System Lead', bg: 'from-emerald-500 to-teal-600' },
  { id: 'growth_amber', emoji: '🚀', label: 'Innovator', bg: 'from-orange-500 to-red-600' },
];

// Helper to dynamically load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  // Trigger Razorpay payment flows
  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      // 1. Load Razorpay script dynamically
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast.error('Failed to load Razorpay window. Please check your network connection.');
        setUpgrading(false);
        return;
      }

      // 2. Call backend order endpoint
      const { data } = await axios.post(`${API_BASE}/payments/order`, {
        amount: 1499, // ₹1,499.00
      });

      if (!data.success) {
        toast.error(data.message || 'Failed to initialize transaction order.');
        setUpgrading(false);
        return;
      }

      // 3. Configure modal properties
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'ConfidentAI',
        description: 'Elite Pro Subscription (1 Month Access)',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
        order_id: data.orderId,
        handler: async function (response) {
          try {
            // Cryptographic verification post-payment
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };

            const verifyRes = await axios.post(`${API_BASE}/payments/verify`, verifyPayload);

            if (verifyRes.data.success) {
              setUser(verifyRes.data.user);
              toast.success('Subscription upgraded successfully! Welcome to Elite Pro! ⚡🎉');
            } else {
              toast.error(verifyRes.data.message || 'Verification failed.');
            }
          } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Error verifying payment details.');
          } finally {
            setUpgrading(false);
          }
        },
        prefill: {
          name: data.userName || user?.name || '',
          email: data.userEmail || user?.email || '',
        },
        theme: {
          color: '#7c3aed', // Purple theme
        },
        modal: {
          ondismiss: function () {
            setUpgrading(false);
            toast.error('Payment window dismissed.');
          }
        }
      };

      const paymentWindow = new window.Razorpay(options);
      paymentWindow.open();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to initiate checkout session.');
      setUpgrading(false);
    }
  };

  // Profile fields state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');

  // Preference fields state
  const [jobRole, setJobRole] = useState('Frontend Engineer');
  const [experienceLevel, setExperienceLevel] = useState('mid');
  const [interviewDifficulty, setInterviewDifficulty] = useState('medium');
  const [aiVoice, setAiVoice] = useState('female_warm');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);

  // AI customization fields state
  const [aiPersonality, setAiPersonality] = useState('supportive');
  const [verbosity, setVerbosity] = useState('balanced');

  // Security password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Hydrate form states once user is loaded
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAvatar(user.avatar || '');

      if (user.preferences) {
        setJobRole(user.preferences.jobRole || 'Frontend Engineer');
        setExperienceLevel(user.preferences.experienceLevel || 'mid');
        setInterviewDifficulty(user.preferences.interviewDifficulty || 'medium');
        setAiVoice(user.preferences.aiVoice || 'female_warm');
        setVideoEnabled(user.preferences.videoEnabled !== false);
        setSubtitlesEnabled(user.preferences.subtitlesEnabled !== false);
      }
    }
  }, [user]);

  // Handle custom image file upload converting it to Base64
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result); // Base64 string!
      toast.success('Real avatar loaded! Save to apply. 📸');
    };
    reader.readAsDataURL(file);
  };

  // Handle Profile, Preference & AI save
  async function handleSaveSettings(e) {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name,
        avatar,
        preferences: {
          jobRole,
          experienceLevel,
          interviewDifficulty,
          aiVoice,
          aiPersonality,
          verbosity,
          videoEnabled,
          subtitlesEnabled,
        },
      };

      const { data } = await axios.patch(`${API_BASE}/auth/me`, payload);
      if (data.success) {
        setUser(data.user);
        toast.success('Settings updated successfully! 🚀');
      } else {
        toast.error(data.message || 'Failed to save settings.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error occurred while saving settings.');
    } finally {
      setSaving(false);
    }
  }

  // Handle password update
  async function handlePasswordUpdate(e) {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }

    setPasswordSaving(true);
    try {
      const { data } = await axios.post(`${API_BASE}/auth/change-password`, {
        currentPassword,
        newPassword,
      });

      if (data.success) {
        toast.success('Password changed successfully! 🔑');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.message || 'Password update failed.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Current password may be incorrect.');
    } finally {
      setPasswordSaving(false);
    }
  }

  const activeAvatarObj = PRESET_AVATARS.find(a => a.id === avatar);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold font-display bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customize your profile, target role details, AI interviewer preferences, and security.
        </p>
      </div>

      {/* Main Settings Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'profile', label: 'Profile & Details', icon: User },
            { id: 'preferences', label: 'Interview Mode', icon: Sliders },
            { id: 'ai', label: 'AI Customization', icon: Bot },
            { id: 'security', label: 'Security & Password', icon: Lock },
            { id: 'billing', label: 'Billing & Plan', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 relative ${
                  active
                    ? 'text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                }`}
                style={active ? {
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(6,182,212,0.15))',
                  boxShadow: '0 0 0 1px rgba(124,58,237,0.3)',
                } : {}}
              >
                <Icon size={18} className={active ? 'text-cyan-400' : 'text-muted-foreground'} />
                <span>{tab.label}</span>
                {active && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute left-0 w-1 h-1/2 bg-gradient-to-b from-purple-500 to-cyan-400 rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Settings Active Pane */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="card glass glow border-white/5 p-6 md:p-8 rounded-2xl"
            >
              {activeTab === 'profile' && (
                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold font-display flex items-center gap-2">
                      <User className="text-purple-400" size={20} />
                      Profile & Details
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Provide your basic details and configure your avatar.
                    </p>
                  </div>

                  <div className="divider"></div>

                  {/* Real Profile Avatar Photo & Preset Picker */}
                  <div className="space-y-4 p-5 rounded-2xl border border-white/5 bg-white/[0.01]">
                    <label className="form-label text-sm font-bold text-foreground">Real Profile Avatar</label>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      {/* Live Avatar Preview Shield */}
                      <div className="relative group shrink-0">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-purple-500/40 bg-[#0e0e15] flex items-center justify-center shadow-2xl relative">
                          {avatar && (avatar.startsWith('data:image/') || avatar.startsWith('http')) ? (
                            <img src={avatar} alt="Profile preview" className="w-full h-full object-cover" />
                          ) : activeAvatarObj ? (
                            <div className={`w-full h-full bg-gradient-to-br ${activeAvatarObj.bg} flex items-center justify-center text-3xl`}>
                              {activeAvatarObj.emoji}
                            </div>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white">
                              {name?.[0]?.toUpperCase() ?? 'U'}
                            </div>
                          )}
                          
                          {/* Hover action overlay */}
                          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold text-white cursor-pointer transition-opacity">
                            Change Photo
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleFileChange}
                              className="hidden" 
                            />
                          </label>
                        </div>
                      </div>

                      {/* Photo Actions & Presets Selection */}
                      <div className="flex-1 space-y-3 text-left w-full">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <label className="h-9 px-4 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all">
                              Upload Real Photo
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleFileChange} 
                                className="hidden" 
                              />
                            </label>
                            
                            {avatar && (avatar.startsWith('data:image/') || avatar.startsWith('http')) && (
                              <button 
                                type="button" 
                                onClick={() => setAvatar('dev_purple')}
                                className="h-9 px-4 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-muted-foreground hover:text-foreground text-xs font-semibold transition-all"
                              >
                                Reset to Default Preset
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                            Supports PNG, JPG, or GIF up to 2MB. Your upload is stored securely as an inline Base64 data vector.
                          </p>
                        </div>

                        {/* Presets Subsection */}
                        <div className="pt-2 border-t border-white/[0.04]">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                            Or Select A Tech Visual Persona
                          </span>
                          
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {PRESET_AVATARS.map((preset) => {
                              const selected = avatar === preset.id;
                              return (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() => setAvatar(preset.id)}
                                  className={`py-1.5 px-2 rounded-xl border transition-all duration-200 text-center flex flex-col items-center gap-1 ${
                                    selected
                                      ? 'border-purple-500 bg-purple-500/10 scale-105'
                                      : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.04]'
                                  }`}
                                >
                                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${preset.bg} flex items-center justify-center text-base shadow-sm`}>
                                    {preset.emoji}
                                  </div>
                                  <span className="text-[9px] font-medium text-foreground truncate max-w-full">
                                    {preset.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Target Job Role / Focus</label>
                      <input
                        type="text"
                        value={jobRole}
                        onChange={(e) => setJobRole(e.target.value)}
                        placeholder="Frontend Engineer, Backend Lead, Fullstack Developer..."
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Target Level</label>
                      <select
                        value={experienceLevel}
                        onChange={(e) => setExperienceLevel(e.target.value)}
                        className="form-input"
                        style={{ background: 'var(--bg-elevated)' }}
                      >
                        <option value="junior">Junior Developer (0-2 Yrs)</option>
                        <option value="mid">Mid-Level Engineer (2-5 Yrs)</option>
                        <option value="senior">Senior Engineer (5-8 Yrs)</option>
                        <option value="lead">Tech Lead / Architect (8+ Yrs)</option>
                      </select>
                    </div>
                  </div>

                  <div className="divider"></div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      {saving ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Save size={16} />
                      )}
                      {saving ? 'Saving...' : 'Save Profile Details'}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'preferences' && (
                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold font-display flex items-center gap-2">
                      <Sliders className="text-cyan-400" size={20} />
                      Interview Mode Preferences
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configure your general mock interview settings.
                    </p>
                  </div>

                  <div className="divider"></div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="form-label">Default Difficulty</label>
                      <select
                        value={interviewDifficulty}
                        onChange={(e) => setInterviewDifficulty(e.target.value)}
                        className="form-input"
                        style={{ background: 'var(--bg-elevated)' }}
                      >
                        <option value="easy">Easy (Casual & Informative)</option>
                        <option value="medium">Medium (Standard Professional)</option>
                        <option value="hard">Hard (Demanding / FAANG level)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Interviewer Voice Accent</label>
                      <select
                        value={aiVoice}
                        onChange={(e) => setAiVoice(e.target.value)}
                        className="form-input"
                        style={{ background: 'var(--bg-elevated)' }}
                      >
                        <option value="female_warm">Seraphina (Female / Warm & Clear)</option>
                        <option value="male_professional">Elias (Male / Professional British)</option>
                        <option value="female_clinical">Aria (Female / Concise Technical)</option>
                        <option value="male_casual">Oliver (Male / US Friendly)</option>
                      </select>
                    </div>
                  </div>

                  {/* System Toggles */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                      <div className="flex gap-3">
                        <Video className="text-purple-400 mt-1 shrink-0" size={18} />
                        <div>
                          <div className="text-sm font-semibold text-foreground">Video Feed Verification</div>
                          <div className="text-xs text-muted-foreground mt-0.5">Enable webcam verification checklist during interview setup.</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVideoEnabled(!videoEnabled)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {videoEnabled ? (
                          <ToggleRight size={38} className="text-cyan-400" />
                        ) : (
                          <ToggleLeft size={38} />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                      <div className="flex gap-3">
                        <Mic className="text-purple-400 mt-1 shrink-0" size={18} />
                        <div>
                          <div className="text-sm font-semibold text-foreground">Subtitle Helper</div>
                          <div className="text-xs text-muted-foreground mt-0.5">Display real-time subtitles/text help alongside voice-to-text.</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {subtitlesEnabled ? (
                          <ToggleRight size={38} className="text-cyan-400" />
                        ) : (
                          <ToggleLeft size={38} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="divider"></div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      {saving ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Save size={16} />
                      )}
                      {saving ? 'Saving...' : 'Save Mode Preferences'}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'ai' && (
                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold font-display flex items-center gap-2">
                      <Bot className="text-cyan-400" size={20} />
                      AI Personality Customization
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tailor how the AI Interviewer behaves and critiques your answers.
                    </p>
                  </div>

                  <div className="divider"></div>

                  <div className="space-y-5">
                    <div className="form-group">
                      <label className="form-label text-sm">Interviewer Personality Persona</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { id: 'supportive', emoji: '🤝', title: 'Supportive & Warm', desc: 'Provides positive micro-feedback, helps when you struggle, and fosters a relaxed vibe.' },
                          { id: 'neutral', emoji: '💼', title: 'Neutral & Standard', desc: 'Standard business demeanor. Professional, calm, realistic mock interview atmosphere.' },
                          { id: 'tough', emoji: '🕵️‍♂️', title: 'Tough & Probing', desc: 'Drills down on gaps, asks aggressive follow-up questions, mimics elite technical panels.' },
                        ].map((style) => {
                          const selected = aiPersonality === style.id;
                          return (
                            <button
                              key={style.id}
                              type="button"
                              onClick={() => setAiPersonality(style.id)}
                              className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all duration-200 ${
                                selected
                                  ? 'border-cyan-500 bg-cyan-500/10 scale-[1.02]'
                                  : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
                              }`}
                            >
                              <div className="text-2xl">{style.emoji}</div>
                              <div className="text-sm font-bold text-foreground">{style.title}</div>
                              <div className="text-xs text-muted-foreground leading-relaxed">{style.desc}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">AI Verbosity / Feedback Level</label>
                      <select
                        value={verbosity}
                        onChange={(e) => setVerbosity(e.target.value)}
                        className="form-input"
                        style={{ background: 'var(--bg-elevated)' }}
                      >
                        <option value="concise">Concise (Direct questions only, minimum chat)</option>
                        <option value="balanced">Balanced (Polite reactions and clear questions)</option>
                        <option value="detailed">Detailed (Includes helpful mid-interview summaries and suggestions)</option>
                      </select>
                    </div>
                  </div>

                  <div className="divider"></div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      {saving ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Save size={16} />
                      )}
                      {saving ? 'Saving...' : 'Save AI Settings'}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'security' && (
                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold font-display flex items-center gap-2">
                      <Shield className="text-purple-400" size={20} />
                      Security & Password
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Ensure your account remains safe and locked down.
                    </p>
                  </div>

                  <div className="divider"></div>

                  <div className="space-y-4 max-w-lg">
                    <div className="form-group relative">
                      <label className="form-label">Current Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="form-input pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <div className="form-group relative">
                      <label className="form-label">New Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 8 characters with 1 letter & 1 number"
                        className="form-input pr-10"
                      />
                    </div>

                    <div className="form-group relative">
                      <label className="form-label">Confirm New Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="form-input pr-10"
                      />
                    </div>
                  </div>

                  <div className="divider"></div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="btn btn-danger flex items-center gap-2"
                    >
                      {passwordSaving ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Lock size={16} />
                      )}
                      {passwordSaving ? 'Updating...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'billing' && (
                <div className="space-y-6 text-left">
                  <div>
                    <h2 className="text-xl font-bold font-display flex items-center gap-2">
                      <Shield className="text-purple-400" size={20} />
                      Billing & Subscription Plan
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Manage your subscription tier, check usage quotas, or upgrade to Elite Pro.
                    </p>
                  </div>

                  <div className="divider"></div>

                  {/* Plan Overview Shield */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Active Plan Status */}
                    <div className="md:col-span-2 p-5 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col justify-between min-h-[160px]">
                      <div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Current Account Plan</div>
                        <h3 className="text-2xl font-extrabold font-display text-white mt-1.5 flex items-center gap-2">
                          {user?.subscription === 'premium' ? (
                            <span className="flex items-center gap-1.5">
                              Elite Pro Subscription <Sparkles className="text-cyan-400 animate-pulse" size={20} />
                            </span>
                          ) : (
                            'Free Aspirant Plan'
                          )}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                          {user?.subscription === 'premium' ? (
                            `Thank you for being an Elite Pro member! Your active billing period is set to expire or auto-renew on ${
                              user.subscriptionExpiresAt 
                                ? new Date(user.subscriptionExpiresAt).toLocaleDateString(undefined, { dateStyle: 'long' })
                                : 'next billing date'
                            }.`
                          ) : (
                            'You are currently on our free plan. Free users are limited to 3 mock interviews per month, basic questions, and standard Javascript compilation.'
                          )}
                        </p>
                      </div>

                      {user?.subscription === 'premium' ? (
                        <div className="mt-4 flex items-center gap-2 text-xs text-cyan-400 font-bold bg-cyan-950/20 border border-cyan-800/30 w-fit px-3 py-1 rounded-lg">
                          Unlimited practice active ⚡
                        </div>
                      ) : (
                        <div className="mt-4 text-xs font-semibold text-gray-400">
                          Usage limit: <span className="text-white">{user?.usageLimits?.interviewsTakenThisMonth ?? 0}</span> / <span className="text-white">3</span> mock interviews completed this month.
                        </div>
                      )}
                    </div>

                    {/* Right Column: Dynamic Action Card */}
                    <div className="p-5 rounded-2xl border border-purple-500/30 bg-[#0c0c16]/30 flex flex-col justify-between text-center relative overflow-hidden">
                      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 opacity-5 blur-xl pointer-events-none" />
                      
                      <div className="relative z-10 flex flex-col justify-between h-full">
                        <div>
                          <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {user?.subscription === 'premium' ? 'Pro Status' : 'Upgrade Plan'}
                          </span>
                          <div className="mt-4">
                            <span className="text-3xl font-extrabold font-display text-white">
                              ₹1,499
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">/ mo</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                            Secure instant unlimited access to premium interview features.
                          </p>
                        </div>

                        {user?.subscription === 'premium' ? (
                          <button
                            type="button"
                            disabled
                            className="w-full mt-4 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold text-xs transition-all relative z-10"
                          >
                            Subscription Active
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleUpgrade}
                            disabled={upgrading}
                            className="w-full mt-4 h-9 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] relative z-10 flex items-center justify-center gap-1.5"
                          >
                            {upgrading ? (
                              <>
                                <Loader2 className="animate-spin" size={14} /> Loading...
                              </>
                            ) : (
                              <>
                                Upgrade to Pro ⚡
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Feature Comparison Grid for free users */}
                  {user?.subscription !== 'premium' && (
                    <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] space-y-4">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider text-purple-300">
                        Unlocked with Elite Pro ⚡
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex gap-2.5 text-xs text-gray-400">
                          <Check className="text-purple-400 shrink-0" size={14} />
                          <span><strong>Unlimited Mocks:</strong> Run as many audio AI interview sessions as you like.</span>
                        </div>
                        <div className="flex gap-2.5 text-xs text-gray-400">
                          <Check className="text-purple-400 shrink-0" size={14} />
                          <span><strong>C++ & Python Compiling:</strong> Compile advanced backends securely in real time.</span>
                        </div>
                        <div className="flex gap-2.5 text-xs text-gray-400">
                          <Check className="text-purple-400 shrink-0" size={14} />
                          <span><strong>ATS Optimizer Score:</strong> Direct feedback on resume keyword weighting bypasses screeners.</span>
                        </div>
                        <div className="flex gap-2.5 text-xs text-gray-400">
                          <Check className="text-purple-400 shrink-0" size={14} />
                          <span><strong>Custom Interview Personalities:</strong> Unlock Tough & Probing panel interview settings.</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

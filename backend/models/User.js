/* ── models/User.js ─────────────────────────────────────────────── */
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned in queries by default
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    subscription: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free',
    },
    razorpayOrderId: {
      type: String,
      default: '',
    },
    razorpayPaymentId: {
      type: String,
      default: '',
    },
    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },
    usageLimits: {
      interviewsTakenThisMonth: { type: Number, default: 0 },
      lastLimitResetDate: { type: Date, default: Date.now },
    },
    // Gamification / progress
    xpPoints: { type: Number, default: 0 },
    level:    { type: Number, default: 1 },
    streak:   { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now },
    isEmailVerified: { type: Boolean, default: false },
    isActive:        { type: Boolean, default: true },

    // Preferences & settings
    preferences: {
      jobRole:             { type: String, default: 'Frontend Engineer' },
      experienceLevel:     { type: String, enum: ['junior', 'mid', 'senior', 'lead'], default: 'mid' },
      interviewDifficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
      aiVoice:             { type: String, default: 'female_warm' },
      aiPersonality:       { type: String, enum: ['supportive', 'tough', 'neutral'], default: 'supportive' },
      verbosity:           { type: String, enum: ['concise', 'balanced', 'detailed'], default: 'balanced' },
      videoEnabled:        { type: Boolean, default: true },
      subtitlesEnabled:    { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,   // createdAt, updatedAt
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/* ── Hash password before save ── */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/* ── Instance method: compare password ── */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/* ── Public profile (safe to send to client) ── */
userSchema.methods.toPublicJSON = function () {
  return {
    _id:             this._id,
    name:            this.name,
    email:           this.email,
    avatar:          this.avatar,
    role:            this.role,
    subscription:    this.subscription,
    subscriptionExpiresAt: this.subscriptionExpiresAt,
    usageLimits:     this.usageLimits,
    xpPoints:        this.xpPoints,
    level:           this.level,
    streak:          this.streak,
    lastActiveAt:    this.lastActiveAt,
    isEmailVerified: this.isEmailVerified,
    createdAt:       this.createdAt,
    preferences:     this.preferences || {
      jobRole:             'Frontend Engineer',
      experienceLevel:     'mid',
      interviewDifficulty: 'medium',
      aiVoice:             'female_warm',
      aiPersonality:       'supportive',
      verbosity:           'balanced',
      videoEnabled:        true,
      subtitlesEnabled:    true,
    },
  };
};

module.exports = mongoose.model('User', userSchema);

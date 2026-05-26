/* ── controllers/auth.controller.js ─────────────────────────────── */
const jwt            = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User           = require('../models/User');

/* ── Helper: sign JWT ── */
function signToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/* ── Helper: send auth response ── */
function sendAuthResponse(res, statusCode, user, message) {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: user.toPublicJSON(),
  });
}

/* ── Helper: handle validation errors ── */
function handleValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    res.status(422).json({ success: false, message: messages[0], errors: messages });
    return true;
  }
  return false;
}

/* ══════════════════════════════════════════════════════════════════
   POST /api/auth/register
   ══════════════════════════════════════════════════════════════════ */
async function register(req, res, next) {
  try {
    if (handleValidationErrors(req, res)) return;

    const { name, email, password } = req.body;

    // Check duplicate email
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Create user (password hashed by pre-save hook)
    const user = await User.create({ name, email, password });

    sendAuthResponse(res, 201, user, `Welcome to ConfidentAI, ${user.name}! 🎉`);
  } catch (err) {
    // Mongoose duplicate key (race condition safety)
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }
    next(err);
  }
}

/* ══════════════════════════════════════════════════════════════════
   POST /api/auth/login
   ══════════════════════════════════════════════════════════════════ */
async function login(req, res, next) {
  try {
    if (handleValidationErrors(req, res)) return;

    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Update last active timestamp
    user.lastActiveAt = new Date();
    await user.save({ validateBeforeSave: false });

    sendAuthResponse(res, 200, user, `Welcome back, ${user.name}! 👋`);
  } catch (err) {
    next(err);
  }
}

/* ══════════════════════════════════════════════════════════════════
   GET /api/auth/me  (protected)
   ══════════════════════════════════════════════════════════════════ */
async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

/* ══════════════════════════════════════════════════════════════════
   PATCH /api/auth/me  (protected) — update profile
   ══════════════════════════════════════════════════════════════════ */
async function updateMe(req, res, next) {
  try {
    // Prevent password change and role escalation via this route
    const { password, role, ...allowedUpdates } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Merge preferences if present to prevent overwriting other preference keys
    if (allowedUpdates.preferences) {
      user.preferences = {
        ...(user.preferences ? user.preferences.toObject() : {}),
        ...allowedUpdates.preferences
      };
      delete allowedUpdates.preferences;
    }

    // Set other allowed top-level updates (like name, email, avatar)
    user.set(allowedUpdates);

    await user.save();

    res.json({ success: true, message: 'Profile updated.', user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

/* ══════════════════════════════════════════════════════════════════
   POST /api/auth/change-password  (protected)
   ══════════════════════════════════════════════════════════════════ */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
    }

    // Find user and select password (which is normally hidden)
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password.' });
    }

    // Update password (triggers hashing hook on save)
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully. 🔒' });
  } catch (err) {
    next(err);
  }
}

/* ══════════════════════════════════════════════════════════════════
   POST /api/auth/logout  (optional — client-side token removal)
   ══════════════════════════════════════════════════════════════════ */
function logout(_req, res) {
  res.json({ success: true, message: 'Logged out successfully.' });
}

module.exports = { register, login, getMe, updateMe, changePassword, logout };

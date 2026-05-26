/* ── routes/auth.routes.js ──────────────────────────────────────── */
const express    = require('express');
const { body }   = require('express-validator');
const rateLimit  = require('express-rate-limit');
const controller = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

/* ── Strict rate limiter for auth endpoints (20 req / 15 min) ── */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true, // only count failed attempts
  message: { success: false, message: 'Too many attempts. Please wait 15 minutes before trying again.' },
});

/* ── Validation rules ── */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Za-z]/).withMessage('Password must contain at least one letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

/* ══════════════════════════════════════════════════════════════════
   Public routes
   ══════════════════════════════════════════════════════════════════ */
router.post('/register', authLimiter, registerValidation, controller.register);
router.post('/login',    authLimiter, loginValidation,    controller.login);
router.post('/logout',   controller.logout);

/* ══════════════════════════════════════════════════════════════════
   Protected routes (JWT required)
   ══════════════════════════════════════════════════════════════════ */
router.get('/me',            protect, controller.getMe);
router.patch('/me',          protect, controller.updateMe);
router.post('/change-password', protect, controller.changePassword);

module.exports = router;

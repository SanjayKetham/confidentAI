/* ── server.js — ConfidentAI Backend Entry Point ─────────────── */
require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss          = require('xss-clean');
const hpp          = require('hpp');

const authRoutes      = require('./routes/auth.routes');
const questionsRoutes = require('./routes/questions.routes');
const codingQuestionsRoutes = require('./routes/codingQuestions.routes');
const adminRoutes     = require('./routes/admin.routes');
const interviewRoutes = require('./routes/interview.routes');
const compilerRoutes  = require('./routes/compiler.routes');
const paymentRoutes   = require('./routes/payment.routes');
const aiInterviewRoutes = require('./routes/aiInterview.routes');

const app  = express();
const PORT = process.env.PORT || 5000;

/* ── Security & Middleware ─────────────────────────────────────── */
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── NoSQL Injection Protection ──────────────────────────────────
// Strips keys containing '$' or '.' from req.body, req.query, req.params
// This prevents attackers from injecting MongoDB operators like { $gt: '' }
app.use(mongoSanitize());

// ── XSS Protection ─────────────────────────────────────────────
// Sanitizes user input in req.body, req.query, req.params
app.use(xss());

// ── HTTP Parameter Pollution Protection ────────────────────────
app.use(hpp());

// CORS — allow frontend dev server
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:3000',
  ],
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Global rate limiter (100 req / 15 min per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use(globalLimiter);

/* ── Routes ────────────────────────────────────────────────────── */
app.use('/api/auth',             authRoutes);
app.use('/api/questions',        questionsRoutes);
app.use('/api/coding-questions', codingQuestionsRoutes);
app.use('/api/admin',            adminRoutes);
app.use('/api/interviews',       interviewRoutes);
app.use('/api/compiler',         compilerRoutes);
app.use('/api/payments',         paymentRoutes);
app.use('/api/ai-interviews',    aiInterviewRoutes);

// Health check
app.get('/api/health', (_req, res) =>
  res.json({ success: true, message: 'ConfidentAI API is running 🚀' })
);

// 404 handler
app.use((_req, res) =>
  res.status(404).json({ success: false, message: 'Route not found' })
);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  const status  = err.statusCode || 500;
  const message = err.message    || 'Internal server error';
  res.status(status).json({ success: false, message });
});

/* ── MongoDB Connection & Start ─────────────────────────────────── */
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000, // fail fast if DB is unreachable
  })
  .then(() => {
    console.log('✅  MongoDB connected:', mongoose.connection.host);
    app.listen(PORT, () =>
      console.log(`🚀  Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌  MongoDB connection error:', err.message);
    process.exit(1);
  });

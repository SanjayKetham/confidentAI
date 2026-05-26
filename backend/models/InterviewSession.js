/* ── models/InterviewSession.js ───────────────────────────────────── */
const mongoose = require('mongoose');

const interviewSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      id: { type: String, required: true },
      label: { type: String, required: true },
      emoji: { type: String, default: '🧠' },
    },
    role: { type: String, required: true },
    difficulty: { type: String, required: true },
    duration: { type: Number, required: true }, // in minutes
    overallScore: { type: Number, required: true },
    metrics: {
      communication: { type: Number, default: 0 },
      technical: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
      clarity: { type: Number, default: 0 },
      structure: { type: Number, default: 0 },
    },
    answers: [
      {
        questionId: String,
        questionText: String,
        userAnswer: String,
        score: Number,
        feedback: String,
      }
    ],
    xpEarned: { type: Number, default: 0 },
  },
  {
    timestamps: true, // gets us createdAt, which acts as the completion date
  }
);

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);

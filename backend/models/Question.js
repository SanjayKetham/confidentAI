/* ── models/Question.js ──────────────────────────────────────────── */
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['technical', 'hr', 'behavioral', 'case_study', 'rapid_fire'],
      index: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['beginner', 'intermediate', 'advanced'],
      index: true,
    },
    // Optional: role/topic tag for filtering
    role: {
      type: String,
      default: 'Any Role',
    },
    topic: {
      type: String,   // e.g. 'Arrays', 'System Design', 'STAR Method'
      default: '',
    },
    // Model answer / hint shown after submission
    hint: {
      type: String,
      default: '',
    },
    sampleAnswer: {
      type: String,
      default: '',
    },
    // Rapid-fire questions have a short expected answer
    expectedAnswer: {
      type: String,
      default: '',
    },
    tags: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index for fast filtered queries
questionSchema.index({ category: 1, difficulty: 1 });
questionSchema.index({ category: 1, difficulty: 1, role: 1 });

module.exports = mongoose.model('Question', questionSchema);

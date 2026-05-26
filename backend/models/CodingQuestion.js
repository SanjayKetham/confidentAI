/* ── models/CodingQuestion.js ─────────────────────────────────────────── */
const mongoose = require('mongoose');

const codingQuestionSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, 'Unique slug identifier is required'],
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Problem title is required'],
      trim: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['Easy', 'Medium', 'Hard'],
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Markdown problem description is required'],
    },
    examples: [
      {
        input: { type: String, required: true },
        output: { type: String, required: true },
        explanation: { type: String, default: '' },
      },
    ],
    constraints: [String],
    hints: [String],
    
    // Starter templates shown in the Monaco Editor
    starterCodes: {
      javascript: { type: String, default: '' },
      python: { type: String, default: '' },
      cpp: { type: String, default: '' },
      java: { type: String, default: '' },
    },
    
    // Optimal reference solutions (powering dynamic AI diagnostics)
    optimalSolutions: {
      javascript: { type: String, default: '' },
      python: { type: String, default: '' },
      cpp: { type: String, default: '' },
      java: { type: String, default: '' },
    },
    
    // Structured Test Cases for compiler sandboxed execution
    testCases: [
      {
        inputArgs: { type: String, required: true }, // e.g. "[[2,7,11,15], 9]"
        expectedOutput: { type: String, required: true }, // e.g. "[0,1]"
        isSample: { type: Boolean, default: false }, // Shown in dry run panels
      },
    ],
    
    // Core function entry target to dynamically build runner files
    entryFunctionName: {
      type: String,
      required: [true, 'Entry function name is required (e.g. twoSum)'],
      trim: true,
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound indexes
codingQuestionSchema.index({ difficulty: 1, category: 1 });

module.exports = mongoose.model('CodingQuestion', codingQuestionSchema);

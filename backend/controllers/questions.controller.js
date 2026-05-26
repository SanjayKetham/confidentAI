/* ── controllers/questions.controller.js ────────────────────────── */
const Question = require('../models/Question');

/* ══════════════════════════════════════════════════════════════════
   GET /api/questions
   Query params: category, difficulty, role, limit (default 10)
   ══════════════════════════════════════════════════════════════════ */
async function getQuestions(req, res, next) {
  try {
    const { category, difficulty, role, limit = 10 } = req.query;

    const filter = { isActive: true };
    if (category)   filter.category   = category;
    if (difficulty) filter.difficulty = difficulty;
    if (role && role !== 'Any Role') {
      filter.$or = [{ role }, { role: 'Any Role' }];
    }

    const cap = Math.min(parseInt(limit) || 10, 60); // max 60 per request

    // Random selection via aggregation for variety
    const questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: cap } },
      { $project: { sampleAnswer: 0, __v: 0 } }, // hide answer in list
    ]);

    res.json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (err) {
    next(err);
  }
}

/* ══════════════════════════════════════════════════════════════════
   GET /api/questions/:id
   Returns full question including sampleAnswer (shown after submit)
   ══════════════════════════════════════════════════════════════════ */
async function getQuestionById(req, res, next) {
  try {
    const question = await Question.findById(req.params.id);
    if (!question || !question.isActive) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }
    res.json({ success: true, question });
  } catch (err) {
    next(err);
  }
}

/* ══════════════════════════════════════════════════════════════════
   GET /api/questions/categories/stats
   Returns count per category+difficulty for dashboard stats
   ══════════════════════════════════════════════════════════════════ */
async function getCategoryStats(req, res, next) {
  try {
    const stats = await Question.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: { category: '$category', difficulty: '$difficulty' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.category': 1, '_id.difficulty': 1 } },
    ]);
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
}

/* ══════════════════════════════════════════════════════════════════
   POST /api/questions  (Admin only)
   ══════════════════════════════════════════════════════════════════ */
async function createQuestion(req, res, next) {
  try {
    const { text, category, difficulty, role, topic, hint, sampleAnswer, expectedAnswer, tags } = req.body;
    
    const question = await Question.create({
      text,
      category,
      difficulty,
      role,
      topic,
      hint,
      sampleAnswer,
      expectedAnswer,
      tags
    });

    res.status(201).json({ success: true, message: 'Question created successfully. 📚', question });
  } catch (err) {
    next(err);
  }
}

/* ══════════════════════════════════════════════════════════════════
   PATCH /api/questions/:id  (Admin only)
   ══════════════════════════════════════════════════════════════════ */
async function updateQuestion(req, res, next) {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    res.json({ success: true, message: 'Question updated successfully. 📝', question });
  } catch (err) {
    next(err);
  }
}

/* ══════════════════════════════════════════════════════════════════
   DELETE /api/questions/:id  (Admin only)
   ══════════════════════════════════════════════════════════════════ */
async function deleteQuestion(req, res, next) {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    res.json({ success: true, message: 'Question deleted successfully. 🗑️' });
  } catch (err) {
    next(err);
  }
}

/* ══════════════════════════════════════════════════════════════════
   POST /api/questions/bulk  (Admin only)
   ══════════════════════════════════════════════════════════════════ */
async function bulkCreateQuestions(req, res, next) {
  try {
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide a non-empty list of questions to import.' });
    }

    const validatedQuestions = [];
    const errors = [];

    const allowedCategories = ['technical', 'hr', 'behavioral', 'case_study', 'rapid_fire'];
    const allowedDifficulties = ['beginner', 'intermediate', 'advanced'];

    questions.forEach((q, idx) => {
      const rowNum = idx + 1;
      const { text, category, difficulty, role, topic, hint, sampleAnswer, expectedAnswer, tags, isActive } = q;

      if (!text || typeof text !== 'string' || text.trim() === '') {
        errors.push(`Row ${rowNum}: Question text is required.`);
        return;
      }
      if (!category || !allowedCategories.includes(String(category).toLowerCase().trim())) {
        errors.push(`Row ${rowNum}: Category must be one of: ${allowedCategories.join(', ')}.`);
        return;
      }
      if (!difficulty || !allowedDifficulties.includes(String(difficulty).toLowerCase().trim())) {
        errors.push(`Row ${rowNum}: Difficulty must be one of: ${allowedDifficulties.join(', ')}.`);
        return;
      }

      // Process tags
      let processedTags = [];
      if (Array.isArray(tags)) {
        processedTags = tags.map(t => String(t).trim()).filter(Boolean);
      } else if (typeof tags === 'string' && tags.trim() !== '') {
        processedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      }

      validatedQuestions.push({
        text: text.trim(),
        category: String(category).toLowerCase().trim(),
        difficulty: String(difficulty).toLowerCase().trim(),
        role: role ? String(role).trim() : 'Any Role',
        topic: topic ? String(topic).trim() : '',
        hint: hint ? String(hint).trim() : '',
        sampleAnswer: sampleAnswer ? String(sampleAnswer).trim() : '',
        expectedAnswer: expectedAnswer ? String(expectedAnswer).trim() : '',
        tags: processedTags,
        isActive: isActive !== undefined ? Boolean(isActive) : true
      });
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Validation failed for ${errors.length} questions. Please correct the Excel file and try again.`,
        errors
      });
    }

    const createdQuestions = await Question.insertMany(validatedQuestions);

    res.status(201).json({
      success: true,
      message: `Successfully imported ${createdQuestions.length} questions! 📚🎉`,
      count: createdQuestions.length,
      questions: createdQuestions
    });
  } catch (err) {
    next(err);
  }
}

async function wipeQuestions(req, res, next) {
  try {
    await Question.deleteMany({});
    res.json({ success: true, message: 'All questions have been cleared from the database successfully. 🗑️' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getQuestions,
  getQuestionById,
  getCategoryStats,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkCreateQuestions,
  wipeQuestions,
};

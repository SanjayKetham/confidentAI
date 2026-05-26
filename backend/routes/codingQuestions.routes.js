/* ── routes/codingQuestions.routes.js ───────────────────────────────── */
const express = require('express');
const controller = require('../controllers/codingQuestions.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// Enforce auth check on all coding question actions
router.use(protect);

// Candidates + Admins can fetch active lists & detail profiles
router.get('/', controller.getCodingQuestions);
router.get('/:slug', controller.getCodingQuestionBySlug);

// Admin-exclusive management routes
router.post('/seed', restrictTo('admin'), controller.seedCodingQuestions);
router.post('/', restrictTo('admin'), controller.createCodingQuestion);
router.patch('/:id', restrictTo('admin'), controller.updateCodingQuestion);
router.delete('/:id', restrictTo('admin'), controller.deleteCodingQuestion);

module.exports = router;

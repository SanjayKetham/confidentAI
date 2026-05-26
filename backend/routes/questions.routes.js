const express    = require('express');
const controller = require('../controllers/questions.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes for authenticated users (read-only)
router.get('/',            protect, controller.getQuestions);
router.get('/stats',       protect, controller.getCategoryStats);
router.get('/:id',         protect, controller.getQuestionById);

// Admin-only management routes (write operations)
router.post('/bulk',       protect, restrictTo('admin'), controller.bulkCreateQuestions);
router.post('/',           protect, restrictTo('admin'), controller.createQuestion);
router.patch('/:id',       protect, restrictTo('admin'), controller.updateQuestion);
router.delete('/wipe/all',  protect, restrictTo('admin'), controller.wipeQuestions);
router.delete('/:id',      protect, restrictTo('admin'), controller.deleteQuestion);

module.exports = router;

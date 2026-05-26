/* ── routes/interview.routes.js ───────────────────────────────────── */
const express    = require('express');
const controller = require('../controllers/interview.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// All interview session operations are protected to logged-in users
router.use(protect);

router.post('/',       controller.createInterviewSession);
router.get('/stats',   controller.getInterviewStats);
router.get('/history', controller.getInterviewHistory);
router.get('/leaderboard', controller.getLeaderboard);
router.get('/:id',     controller.getInterviewById);

module.exports = router;

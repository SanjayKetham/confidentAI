/* ── routes/aiInterview.routes.js ───────────────────────────────── */
const express = require('express');
const controller = require('../controllers/aiInterview.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Protect all AI-based interview operations
router.use(protect);

router.post('/start',   controller.startInterview);
router.post('/respond', controller.processResponse);

module.exports = router;

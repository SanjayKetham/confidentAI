/* ── routes/compiler.routes.js — Compiler API Routes ──────────── */
const express = require('express');
const controller = require('../controllers/compiler.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Enforce auth check on compiler operations
router.use(protect);

router.post('/run', controller.runCompilerCode);

module.exports = router;

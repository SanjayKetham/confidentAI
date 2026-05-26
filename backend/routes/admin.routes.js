/* ── routes/admin.routes.js ─────────────────────────────────────── */
const express = require('express');
const controller = require('../controllers/admin.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth protection and admin restriction globally for all routes in this router
router.use(protect);
router.use(restrictTo('admin'));

router.get('/stats',       controller.getAdminStats);
router.get('/users',       controller.getAllUsers);
router.patch('/users/:id', controller.updateUser);

module.exports = router;

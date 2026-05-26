/* ── routes/payment.routes.js ─────────────────────────────────────── */
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { createOrder, verifyPayment } = require('../controllers/payment.controller');

// Create a new Razorpay Order (Protected)
router.post('/order', protect, createOrder);

// Verify Razorpay cryptographic signature (Protected)
router.post('/verify', protect, verifyPayment);

module.exports = router;

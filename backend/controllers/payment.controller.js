/* ── controllers/payment.controller.js ────────────────────────────── */
const Razorpay = require('razorpay');
const crypto   = require('crypto');
const User     = require('../models/User');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Step 1: Create Razorpay Order
 * Amount is passed in standard format (e.g., 1499.00 for INR), converted to paise
 */
async function createOrder(req, res, next) {
  try {
    const { amount, currency = 'INR' } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid payment amount.' });
    }

    // Convert amount to paise (e.g., ₹1499.00 -> 149900 paise)
    const amountInPaise = Math.round(Number(amount) * 100);

    const options = {
      amount: amountInPaise,
      currency,
      receipt: `receipt_order_${req.user._id}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    if (!order) {
      return res.status(500).json({ success: false, message: 'Could not generate Razorpay order.' });
    }

    // Store the orderId in the user's record temporarily
    await User.findByIdAndUpdate(req.user._id, {
      razorpayOrderId: order.id,
    });

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      userEmail: req.user.email,
      userName: req.user.name,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Step 2: Verify Cryptographic Payment Signature
 * Prevents clients from faking a successful checkout
 */
async function verifyPayment(req, res, next) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing verification parameters. order_id, payment_id, and signature are required.',
      });
    }

    // Verify signature using HMAC SHA-256
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      // Signature is valid! Upgrade subscription to 'premium'
      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + 1); // 1 month access

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
          subscription: 'premium',
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          subscriptionExpiresAt: expirationDate,
        },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Payment verified and subscription activated successfully! ⚡',
        user: updatedUser.toPublicJSON(),
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Cryptographic verification failed. Payment signature is invalid.',
      });
    }
  } catch (error) {
    next(error);
  }
}

module.exports = { createOrder, verifyPayment };

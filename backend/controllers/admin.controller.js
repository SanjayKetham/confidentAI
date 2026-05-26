/* ── controllers/admin.controller.js ────────────────────────────── */
const User = require('../models/User');
const Question = require('../models/Question');

/* ══════════════════════════════════════════════════════════════════
   GET /api/admin/stats
   Returns dashboard stats for Admin Panel
   ══════════════════════════════════════════════════════════════════ */
async function getAdminStats(req, res, next) {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalQuestions = await Question.countDocuments();

    // Group questions by category for a cool chart/list
    const questionsByCategory = await Question.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalAdmins,
        totalQuestions,
        questionsByCategory
      }
    });
  } catch (err) {
    next(err);
  }
}

/* ══════════════════════════════════════════════════════════════════
   GET /api/admin/users
   Returns all users sorted by registration date
   ══════════════════════════════════════════════════════════════════ */
async function getAllUsers(req, res, next) {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    next(err);
  }
}

/* ══════════════════════════════════════════════════════════════════
   PATCH /api/admin/users/:id
   Allows admins to toggle user roles or active statuses
   ══════════════════════════════════════════════════════════════════ */
async function updateUser(req, res, next) {
  try {
    const { role, isActive } = req.body;
    const updates = {};
    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      message: 'User updated successfully. 👤',
      user
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAdminStats,
  getAllUsers,
  updateUser
};

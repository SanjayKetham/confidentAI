/* ── controllers/interview.controller.js ────────────────────────── */
const InterviewSession = require('../models/InterviewSession');
const User             = require('../models/User');

// Save a completed mock interview session
exports.createInterviewSession = async (req, res, next) => {
  try {
    const {
      category,
      role,
      difficulty,
      duration,
      overallScore,
      metrics,
      answers,
    } = req.body;

    if (!category || !role || overallScore === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required session parameters (category, role, overallScore)',
      });
    }

    // 1. Calculate XP Earned (e.g. 1.5x of the overall score)
    const xpEarned = Math.round(overallScore * 1.5);

    // 2. Create and save the session
    const session = await InterviewSession.create({
      user: req.user._id,
      category,
      role,
      difficulty,
      duration,
      overallScore,
      metrics,
      answers,
      xpEarned,
    });

    // 3. Update the User's gamification metrics (XP, streak, level)
    const user = await User.findById(req.user._id);
    if (user) {
      user.xpPoints += xpEarned;

      // Update level (Level up every 500 XP)
      const newLevel = Math.max(1, Math.floor(user.xpPoints / 500) + 1);
      user.level = newLevel;

      // Update practice streak
      const now = new Date();
      const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt) : null;

      if (!lastActive) {
        user.streak = 1;
      } else {
        const diffTime = Math.abs(now - lastActive);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Practiced on consecutive day
          user.streak += 1;
        } else if (diffDays > 1) {
          // Streak broken
          user.streak = 1;
        }
        // If diffDays === 0, they already practiced today, keep streak the same
      }

      user.lastActiveAt = now;
      await user.save();
    }

    res.status(201).json({
      success: true,
      data: session,
      updatedUser: {
        xpPoints: user ? user.xpPoints : 0,
        level: user ? user.level : 1,
        streak: user ? user.streak : 0,
      }
    });
  } catch (err) {
    next(err);
  }
};

// Fetch real aggregated analytics & progress tracking for the dashboard
exports.getInterviewStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    // Get all sessions sorted by date
    const sessions = await InterviewSession.find({ user: userId }).sort({ createdAt: 1 });

    const totalInterviews = sessions.length;
    const avgScore = totalInterviews > 0
      ? Math.round(sessions.reduce((acc, s) => acc + s.overallScore, 0) / totalInterviews)
      : 0;

    // Calculate weekly performance trends (Mon-Sun average scores)
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Group scores by weekday from the last 7 days of practice
    const dayScoresMap = { Sun: [], Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [] };
    
    // Default fallback weekly progress chart points
    const defaultWeeklyProgress = [
      { day: 'Mon', score: 0 }, { day: 'Tue', score: 0 },
      { day: 'Wed', score: 0 }, { day: 'Thu', score: 0 },
      { day: 'Fri', score: 0 }, { day: 'Sat', score: 0 },
      { day: 'Sun', score: 0 },
    ];

    sessions.forEach(s => {
      const dayName = daysOfWeek[new Date(s.createdAt).getDay()];
      dayScoresMap[dayName].push(s.overallScore);
    });

    const weeklyProgress = totalInterviews > 0
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
          const scores = dayScoresMap[day];
          return {
            day,
            score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
          };
        })
      : defaultWeeklyProgress;

    // Fetch the 3 most recent sessions
    const recentSessionsRaw = await InterviewSession.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(3);

    // Format recent interviews for the frontend card
    const recentInterviews = recentSessionsRaw.map(s => {
      const timeDiff = Math.abs(new Date() - new Date(s.createdAt));
      const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
      let timeText = 'Just now';
      if (hoursDiff >= 24) {
        const daysDiff = Math.floor(hoursDiff / 24);
        timeText = `${daysDiff}d ago`;
      } else if (hoursDiff > 0) {
        timeText = `${hoursDiff}h ago`;
      } else {
        const minsDiff = Math.floor(timeDiff / (1000 * 60));
        if (minsDiff > 0) timeText = `${minsDiff}m ago`;
      }

      return {
        id: s._id,
        type: s.category.label,
        role: s.role,
        score: s.overallScore,
        time: timeText,
        tags: s.category.id === 'technical' ? ['Technical', s.difficulty] : ['Behavioral', s.difficulty],
      };
    });

    res.json({
      success: true,
      data: {
        totalInterviews,
        avgScore,
        streak: user ? user.streak : 0,
        xpPoints: user ? user.xpPoints : 0,
        level: user ? user.level : 1,
        weeklyProgress,
        recentInterviews,
      }
    });
  } catch (err) {
    next(err);
  }
};

// Fetch full session history list
exports.getInterviewHistory = async (req, res, next) => {
  try {
    const sessions = await InterviewSession.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: sessions,
    });
  } catch (err) {
    next(err);
  }
};

// Fetch single session by ID
exports.getInterviewById = async (req, res, next) => {
  try {
    const session = await InterviewSession.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found',
      });
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (err) {
    next(err);
  }
};

// Fetch global competitive leaderboard (all active users sorted by XP descending, excluding admins)
exports.getLeaderboard = async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true, role: { $ne: 'admin' } })
      .select('name xpPoints level avatar role')
      .sort({ xpPoints: -1 })
      .limit(10);

    res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

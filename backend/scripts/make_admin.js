/* ── scripts/make_admin.js ──────────────────────────────────────── */
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = "mongodb+srv://kethamsanjay_db_user:dF3yociBfqiQOlMv@cluster0.ihr4s4d.mongodb.net/?appName=Cluster0";

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.");

    const email = "testsettings1@example.com";
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`User not found: ${email}. Creating a default admin instead...`);
      const newAdmin = await User.create({
        name: "Sanjay Kumar Admin",
        email,
        password: "Password123!",
        role: "admin",
        avatar: "ai_cyan"
      });
      console.log("Admin created successfully:", newAdmin);
    } else {
      user.role = "admin";
      await user.save();
      console.log(`Successfully elevated user ${email} to admin!`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

run();

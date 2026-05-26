/* ── scripts/seed.js — Create demo user ───────────────────────── */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User     = require('../models/User');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  Connected to MongoDB');

  const demoEmail = 'demo@confidentai.app';

  // Remove existing demo user
  await User.deleteOne({ email: demoEmail });

  const demo = await User.create({
    name:            'Demo User',
    email:           demoEmail,
    password:        'demo1234',   // will be hashed by pre-save hook
    avatar:          '',
    role:            'user',
    xpPoints:        1240,
    level:           4,
    streak:          5,
    isEmailVerified: true,
  });

  console.log('🌱  Demo user created:');
  console.log('    Email   :', demo.email);
  console.log('    Password: demo1234');
  console.log('    ID      :', demo._id.toString());

  await mongoose.disconnect();
  console.log('✅  Seeding complete. Database connection closed.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Seed error:', err);
  process.exit(1);
});

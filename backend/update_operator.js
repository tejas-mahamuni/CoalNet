const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const connectDB = require('./config/db');

async function updateRole() {
  await connectDB();
  const email = 'tejasmahamuni16@gmail.com';
  
  try {
    // Upsert the user: create if not exists, update if it does.
    const user = await User.findOneAndUpdate(
      { email: email },
      { 
        email: email,
        role: 'operator',
        displayName: 'Tejas Mahamuni' 
      },
      { new: true, upsert: true }
    );
    
    console.log(`✅ Success: User ${email} is now an ${user.role} (pre-assigned).`);
  } catch (err) {
    console.error('❌ Error updating role:', err.message);
  } finally {
    process.exit();
  }
}

updateRole();

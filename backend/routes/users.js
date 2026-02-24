const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * POST /api/users/sync
 * Syncs user data from Firebase to local MongoDB and returns role.
 */
router.post('/sync', async (req, res) => {
  const { uid, email, displayName } = req.body;

  if (!uid || !email) {
    return res.status(400).json({ error: 'UID and email are required' });
  }

  try {
    let user = await User.findOne({ uid });

    // If not found by UID, check by email (for pre-assigned roles)
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.uid = uid; // Claim this record with the Firebase UID
        if (displayName) user.displayName = displayName;
        await user.save();
        console.log(`✅ Pre-existing user ${email} claimed with UID ${uid}`);
      }
    }

    if (!user) {
      // Create new user with default observer role
      user = await User.create({
        uid,
        email,
        displayName: displayName || 'User',
        role: 'observer'
      });
      console.log(`✅ New user created: ${email}`);
    } else {
      // Update display name if it changed
      if (displayName && user.displayName !== displayName) {
        user.displayName = displayName;
        await user.save();
      }
    }

    res.json(user);
  } catch (err) {
    console.error('User sync error:', err.message);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

/**
 * GET /api/users/me/:uid
 * Returns current user profile and role by UID.
 */
router.get('/me/:uid', async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Get user profile error:', err.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;

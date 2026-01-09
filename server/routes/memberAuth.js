const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { MEMBER_JWT_SECRET, authenticateMember } = require('../middleware/memberAuth');

const DATA_PATH = process.env.DATA_PATH || path.join(__dirname, '..', '..', 'data');
const membersPath = path.join(DATA_PATH, 'members.json');

const getMembers = () => {
  return JSON.parse(fs.readFileSync(membersPath, 'utf8'));
};

const saveMembers = (members) => {
  fs.writeFileSync(membersPath, JSON.stringify(members, null, 2));
};

// Register new member
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, password, and display name are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check password strength
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const members = getMembers();

    // Check if email already exists
    if (members.find(m => m.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    const newMember = {
      id: uuidv4(),
      email: email.toLowerCase(),
      password: hashedPassword,
      displayName,
      bio: '',
      avatarImage: null,
      createdAt: now,
      updatedAt: now
    };

    members.push(newMember);
    saveMembers(members);

    // Return member without password
    const { password: _, ...memberWithoutPassword } = newMember;

    res.status(201).json({
      message: 'Registration successful',
      member: memberWithoutPassword
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login member
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const members = getMembers();
    const member = members.find(m => m.email.toLowerCase() === email.toLowerCase());

    if (!member) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, member.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: member.id, email: member.email, displayName: member.displayName },
      MEMBER_JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...memberWithoutPassword } = member;

    res.json({
      token,
      member: memberWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify token
router.get('/verify', authenticateMember, (req, res) => {
  try {
    const members = getMembers();
    const member = members.find(m => m.id === req.member.id);

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const { password: _, ...memberWithoutPassword } = member;
    res.json({ valid: true, member: memberWithoutPassword });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change password
router.post('/change-password', authenticateMember, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const members = getMembers();
    const memberIndex = members.findIndex(m => m.id === req.member.id);

    if (memberIndex === -1) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const validPassword = await bcrypt.compare(currentPassword, members[memberIndex].password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    members[memberIndex].password = await bcrypt.hash(newPassword, 10);
    members[memberIndex].updatedAt = new Date().toISOString();
    saveMembers(members);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current member's profile
router.get('/profile', authenticateMember, (req, res) => {
  try {
    const members = getMembers();
    const member = members.find(m => m.id === req.member.id);

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const { password: _, ...memberWithoutPassword } = member;
    res.json(memberWithoutPassword);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update current member's profile
router.put('/profile', authenticateMember, (req, res) => {
  try {
    const { displayName, bio } = req.body;
    const members = getMembers();
    const memberIndex = members.findIndex(m => m.id === req.member.id);

    if (memberIndex === -1) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (displayName) members[memberIndex].displayName = displayName;
    if (bio !== undefined) members[memberIndex].bio = bio;
    members[memberIndex].updatedAt = new Date().toISOString();

    saveMembers(members);

    const { password: _, ...memberWithoutPassword } = members[memberIndex];
    res.json(memberWithoutPassword);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get public profile by ID
router.get('/:id/public', (req, res) => {
  try {
    const members = getMembers();
    const member = members.find(m => m.id === req.params.id);

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Only return public info
    res.json({
      id: member.id,
      displayName: member.displayName,
      bio: member.bio,
      avatarImage: member.avatarImage,
      createdAt: member.createdAt
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

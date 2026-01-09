const jwt = require('jsonwebtoken');

const MEMBER_JWT_SECRET = process.env.MEMBER_JWT_SECRET || 'goat-grids-member-secret-change-in-production';

const authenticateMember = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Member access token required' });
  }

  jwt.verify(token, MEMBER_JWT_SECRET, (err, member) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.member = member;
    next();
  });
};

module.exports = { authenticateMember, MEMBER_JWT_SECRET };

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    // Support token in query parameter for direct download / media streams
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided. Please log in.',
    });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      success: false,
      message: 'Server configuration error: JWT_SECRET is not configured',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      secret || 'dev_secret_local_only_secure_file_hub_2026'
    );

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended by an administrator.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError' ||
      error.name === 'SyntaxError'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token is invalid or expired.',
      });
    }
    // Pass unexpected internal/database errors to centralized error handler
    next(error);
  }
};

module.exports = { protect };

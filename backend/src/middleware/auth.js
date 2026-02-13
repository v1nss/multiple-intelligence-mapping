import jwt from 'jsonwebtoken';
import { User, Assessment } from '../models/index.js';

/**
 * Middleware: Require a valid JWT token.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password_hash'] },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Middleware: Require admin role. Must be used AFTER requireAuth.
 */
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

/**
 * Middleware: Verify the authenticated user owns the assessment.
 */
export const requireOwnership = (paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const assessmentId = req.params[paramName];
      const assessment = await Assessment.findByPk(assessmentId, {
        attributes: ['user_id'],
      });

      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
      }

      if (assessment.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      next();
    } catch (err) {
      return res.status(500).json({ error: 'Server error' });
    }
  };
};

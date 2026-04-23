import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

function generateToken(userId, role) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/**
 * POST /auth/register
 */
export const register = async (req, res) => {
  try {
    const { email, password, first_name, last_name, gender, birthdate, role } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const userRole = (role === 'admin' && req.user?.role === 'admin') ? 'admin' : 'student';

    const user = await User.create({
      email: email.toLowerCase(),
      password_hash,
      first_name,
      last_name,
      gender: gender || null,
      birthdate: birthdate || null,
      role: userRole,
    });

    const token = generateToken(user.id, user.role);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * POST /auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.role);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /auth/me
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * PUT /auth/me
 */
export const updateMe = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      birthdate,
      gender,
      address,
    } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail !== user.email) {
      const existing = await User.findOne({ where: { email: normalizedEmail } });
      if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
      }
    }

    await user.update({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || null,
      birthdate: birthdate || null,
      gender: gender || null,
      address: address?.trim() || null,
    });

    const safeUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password_hash'] },
    });

    res.json({
      message: 'Profile updated successfully',
      user: safeUser,
    });
  } catch (err) {
    console.error('UpdateMe error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

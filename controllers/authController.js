import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';

const TOKEN_TTL = '7d';
const googleClient = new OAuth2Client();

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';
    const username = (req.body.username || '').trim();

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    if (password.length > 72) {
      // bcrypt silently truncates beyond 72 bytes — reject rather than mislead.
      return res.status(400).json({ message: 'Password must be 72 characters or fewer.' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, username, passwordHash });

    res.status(201).json({ token: signToken(user._id), user: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    const user = await User.findOne({ email });
    // Same response whether the email is unknown or the password is wrong,
    // so we don't leak which emails are registered.
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    res.status(200).json({ token: signToken(user._id), user: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/google  { credential }  → verify Google ID token, find/create user
export const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'Missing Google credential.' });
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Google sign-in is not configured on the server.' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = (payload.email || '').toLowerCase();
    if (!email) return res.status(400).json({ message: 'Google account has no email.' });
    // Only trust a verified Google email — otherwise a token bearing an
    // unverified address could be used to log into a matching local account.
    if (payload.email_verified === false) {
      return res.status(401).json({ message: 'Your Google email is not verified.' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        name: payload.name || '',
        profilePicture: payload.picture || '',
        authProvider: 'google',
      });
    }

    res.status(200).json({ token: signToken(user._id), user: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/profile  (protected) — update name/username/picture/theme/decor
export const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'username', 'profilePicture', 'theme', 'shelfDecor'];
    const updates = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json(user.toJSON());
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
export const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json(user.toJSON());
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/change-password  (protected)
export const changePassword = async (req, res, next) => {
  try {
    const currentPassword = req.body.currentPassword || '';
    const newPassword = req.body.newPassword || '';

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }
    if (newPassword.length > 72) {
      return res.status(400).json({ message: 'New password must be 72 characters or fewer.' });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ message: 'New password must be different from the current one.' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
};

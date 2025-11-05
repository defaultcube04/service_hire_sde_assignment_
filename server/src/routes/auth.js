import express from 'express';
import { User } from '../models/User.js';
import { createToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ error: 'Email already in use' });
  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash });
  const token = createToken(user);
  return res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await user.verifyPassword(password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = createToken(user);
  return res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
});

export default router;



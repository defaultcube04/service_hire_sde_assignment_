import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { Event, EVENT_STATUS } from '../models/Event.js';

const router = express.Router();

router.use(requireAuth);

// List my events
router.get('/', async (req, res) => {
  const events = await Event.find({ owner: req.user.id }).sort({ startTime: 1 });
  res.json(events);
});

// Create event
router.post('/', async (req, res) => {
  const { title, startTime, endTime, status } = req.body || {};
  if (!title || !startTime || !endTime) return res.status(400).json({ error: 'Missing fields' });
  const event = await Event.create({
    title,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    status: status && Object.values(EVENT_STATUS).includes(status) ? status : EVENT_STATUS.BUSY,
    owner: req.user.id
  });
  res.status(201).json(event);
});

// Update event (only owner)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = {};
  const { title, startTime, endTime, status } = req.body || {};
  if (title !== undefined) updates.title = title;
  if (startTime !== undefined) updates.startTime = new Date(startTime);
  if (endTime !== undefined) updates.endTime = new Date(endTime);
  if (status !== undefined && Object.values(EVENT_STATUS).includes(status)) updates.status = status;
  const event = await Event.findOneAndUpdate({ _id: id, owner: req.user.id }, updates, { new: true });
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

// Delete event
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const result = await Event.findOneAndDelete({ _id: id, owner: req.user.id });
  if (!result) return res.status(404).json({ error: 'Event not found' });
  res.json({ ok: true });
});

export default router;



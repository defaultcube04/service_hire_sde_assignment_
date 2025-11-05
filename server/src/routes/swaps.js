import express from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth.js';
import { Event, EVENT_STATUS } from '../models/Event.js';
import { SwapRequest, SWAP_STATUS } from '../models/SwapRequest.js';

export default function swapsRouter(io) {
  const router = express.Router();
  router.use(requireAuth);

  // GET /api/swappable-slots (others')
  router.get('/swappable-slots', async (req, res) => {
    const slots = await Event.find({ owner: { $ne: req.user.id }, status: EVENT_STATUS.SWAPPABLE })
      .sort({ startTime: 1 })
      .populate('owner', 'name email');
    res.json(slots);
  });

  // POST /api/swap-request
  router.post('/swap-request', async (req, res) => {
    const { mySlotId, theirSlotId } = req.body || {};
    if (!mySlotId || !theirSlotId) return res.status(400).json({ error: 'Missing slot ids' });

    const mySlot = await Event.findOne({ _id: mySlotId, owner: req.user.id });
    const theirSlot = await Event.findById(theirSlotId);
    if (!mySlot || !theirSlot) return res.status(404).json({ error: 'Slot not found' });
    if (String(theirSlot.owner) === String(req.user.id)) return res.status(400).json({ error: 'Cannot swap with self' });
    if (mySlot.status !== EVENT_STATUS.SWAPPABLE || theirSlot.status !== EVENT_STATUS.SWAPPABLE) {
      return res.status(400).json({ error: 'Both slots must be SWAPPABLE' });
    }

    const session = await mongoose.startSession();
    let swap;
    await session.withTransaction(async () => {
      // Lock and re-check
      const [myLocked, theirLocked] = await Promise.all([
        Event.findOne({ _id: mySlotId, owner: req.user.id, status: EVENT_STATUS.SWAPPABLE }).session(session),
        Event.findOne({ _id: theirSlotId, status: EVENT_STATUS.SWAPPABLE }).session(session)
      ]);
      if (!myLocked || !theirLocked) throw new Error('Slots no longer swappable');

      swap = await SwapRequest.create([
        {
          requester: req.user.id,
          responder: theirLocked.owner,
          mySlot: myLocked._id,
          theirSlot: theirLocked._id,
          status: SWAP_STATUS.PENDING
        }
      ], { session });
      swap = swap[0];

      await Event.updateMany(
        { _id: { $in: [myLocked._id, theirLocked._id] } },
        { $set: { status: EVENT_STATUS.SWAP_PENDING } },
        { session }
      );
    });
    session.endSession();

    // Notify responder
    io.to(String(swap.responder)).emit('swap:incoming', { requestId: swap._id });

    res.status(201).json(swap);
  });

  // POST /api/swap-response/:requestId
  router.post('/swap-response/:requestId', async (req, res) => {
    const { requestId } = req.params;
    const { accepted } = req.body || {};

    const swap = await SwapRequest.findById(requestId);
    if (!swap) return res.status(404).json({ error: 'Request not found' });
    if (String(swap.responder) !== String(req.user.id)) return res.status(403).json({ error: 'Not authorized' });
    if (swap.status !== SWAP_STATUS.PENDING) return res.status(400).json({ error: 'Already decided' });

    const session = await mongoose.startSession();
    let updated;
    await session.withTransaction(async () => {
      const mySlot = await Event.findById(swap.mySlot).session(session);
      const theirSlot = await Event.findById(swap.theirSlot).session(session);
      if (!mySlot || !theirSlot) throw new Error('Slots missing');

      if (!accepted) {
        updated = await SwapRequest.findByIdAndUpdate(
          requestId,
          { status: SWAP_STATUS.REJECTED },
          { new: true, session }
        );
        await Event.updateMany(
          { _id: { $in: [mySlot._id, theirSlot._id] } },
          { $set: { status: EVENT_STATUS.SWAPPABLE } },
          { session }
        );
        return;
      }

      // Accept path: exchange owners, set BUSY
      const originalOwnerMy = mySlot.owner;
      const originalOwnerTheir = theirSlot.owner;
      await Event.updateOne({ _id: mySlot._id }, { $set: { owner: originalOwnerTheir, status: EVENT_STATUS.BUSY } }, { session });
      await Event.updateOne({ _id: theirSlot._id }, { $set: { owner: originalOwnerMy, status: EVENT_STATUS.BUSY } }, { session });

      updated = await SwapRequest.findByIdAndUpdate(
        requestId,
        { status: SWAP_STATUS.ACCEPTED },
        { new: true, session }
      );
    });
    session.endSession();

    // Notify both parties
    io.to(String(swap.requester)).emit('swap:update', { requestId: swap._id, status: updated.status });
    io.to(String(swap.responder)).emit('swap:update', { requestId: swap._id, status: updated.status });

    res.json(updated);
  });

  // Requests views: incoming and outgoing
  router.get('/requests', async (req, res) => {
    const [incoming, outgoing] = await Promise.all([
      SwapRequest.find({ responder: req.user.id }).sort({ createdAt: -1 }).populate('mySlot theirSlot requester responder', 'title startTime endTime status name email'),
      SwapRequest.find({ requester: req.user.id }).sort({ createdAt: -1 }).populate('mySlot theirSlot requester responder', 'title startTime endTime status name email')
    ]);
    res.json({ incoming, outgoing });
  });

  return router;
}



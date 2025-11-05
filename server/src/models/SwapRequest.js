import mongoose from 'mongoose';

export const SWAP_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED'
};

const swapRequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    responder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mySlot: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    theirSlot: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    status: { type: String, enum: Object.values(SWAP_STATUS), default: SWAP_STATUS.PENDING }
  },
  { timestamps: true }
);

export const SwapRequest = mongoose.model('SwapRequest', swapRequestSchema);



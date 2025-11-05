import jwt from 'jsonwebtoken';

const userIdToSocketIds = new Map();

export function authSocketMiddleware(socket, next) {
  try {
    const token = socket.handshake.auth?.token || null;
    if (!token) return next(new Error('No token'));
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = String(payload.userId);
    next();
  } catch (e) {
    next(new Error('Unauthorized'));
  }
}

export const socketRegistry = {
  register(socket) {
    const userId = String(socket.userId);
    const set = userIdToSocketIds.get(userId) || new Set();
    set.add(socket.id);
    userIdToSocketIds.set(userId, set);
    socket.join(userId); // use rooms keyed by userId
  },
  unregister(socket) {
    const userId = String(socket.userId);
    const set = userIdToSocketIds.get(userId);
    if (set) {
      set.delete(socket.id);
      if (set.size === 0) userIdToSocketIds.delete(userId);
    }
  }
};



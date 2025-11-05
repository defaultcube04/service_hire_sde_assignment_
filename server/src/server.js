import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import authRouter from './routes/auth.js';
import eventsRouter from './routes/events.js';
import swapsRouter from './routes/swaps.js';
import { authSocketMiddleware, socketRegistry } from './sockets/registry.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
	cors: {
		origin: process.env.CLIENT_ORIGIN || '*',
		methods: ['GET', 'POST', 'PUT', 'DELETE']
	}
});

// Socket auth and registry
io.use(authSocketMiddleware);
io.on('connection', (socket) => {
	socketRegistry.register(socket);
	socket.on('disconnect', () => {
		socketRegistry.unregister(socket);
	});
});

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*', credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => {
	res.json({ ok: true });
});

app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api', swapsRouter(io));

const PORT = process.env.PORT || 4000;

async function start() {
	const mongoUri = process.env.MONGO_URI;
	if (!mongoUri) {
		console.error('MONGO_URI is not set');
		process.exit(1);
	}
	await mongoose.connect(mongoUri);
	httpServer.listen(PORT, () => {
		console.log(`Server listening on :${PORT}`);
	});
}

start().catch((err) => {
	console.error(err);
	process.exit(1);
});



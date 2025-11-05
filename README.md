# SlotSwapper

Peer-to-peer time-slot swapping app built with Node/Express, MongoDB, JWT, and React.

## Prerequisites
- Node 18+
- MongoDB running locally or a connection string for Atlas

## Setup

1) Backend
- Create `server/.env` with:
```
PORT=4000
MONGO_URI=mongodb://localhost:27017/slotswapper
JWT_SECRET=change_me
CLIENT_ORIGIN=http://localhost:5173
```
- Install and run:
```
cd server
npm install
npm run dev
```

2) Frontend
- Optionally create `client/.env` with:
```
VITE_API_BASE=http://localhost:4000/api
```
- Install and run:
```
cd client
npm install
npm run dev
```

Open the app at http://localhost:5173

## API Overview
- Auth: `POST /api/auth/signup`, `POST /api/auth/login` → returns JWT. Send as `Authorization: Bearer <token>`.
- Events (auth required):
  - `GET /api/events` list my events
  - `POST /api/events` create `{ title, startTime, endTime, status? }`
  - `PUT /api/events/:id` update fields (e.g., `{ status: 'SWAPPABLE' }`)
  - `DELETE /api/events/:id`
- Swap Logic (auth required):
  - `GET /api/swappable-slots` other users' swappable slots
  - `POST /api/swap-request` `{ mySlotId, theirSlotId }`
  - `POST /api/swap-response/:requestId` `{ accepted: true|false }`
  - `GET /api/requests` incoming/outgoing lists

## Realtime
- socket.io is used for notifications; the client authenticates with the JWT.



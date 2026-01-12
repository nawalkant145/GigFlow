# GigFlow - Freelance Marketplace

A full-stack freelance marketplace built with Vite + Express.js + MongoDB.

## Tech Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: MongoDB with Mongoose
- **Auth**: JWT (Access + Refresh Tokens)
- **Real-time**: Socket.io

## Project Structure

```
gigflow/
├── client/                 # Vite React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── socket/
│   └── package.json
└── README.md
```

## Setup Instructions

### 1. Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets
npm run dev
```

### 2. Frontend Setup

```bash
cd client
npm install
npm run dev
```

### 3. Environment Variables

Server `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gigflow
JWT_ACCESS_SECRET=your-access-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CLIENT_URL=http://localhost:5173
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Gigs
- `GET /api/gigs` - Get all gigs (with filters)
- `GET /api/gigs/:id` - Get single gig
- `POST /api/gigs` - Create gig (auth required)
- `PUT /api/gigs/:id` - Update gig (owner only)
- `DELETE /api/gigs/:id` - Delete gig (owner only)

### Bids
- `POST /api/gigs/:gigId/bids` - Place bid
- `GET /api/gigs/:gigId/bids` - Get bids for gig
- `POST /api/gigs/:gigId/bids/:bidId/accept` - Accept bid (gig owner only)

### User
- `GET /api/users/me` - Get current user profile
- `GET /api/users/me/gigs` - Get user's posted gigs
- `GET /api/users/me/bids` - Get user's bids

## Features

- JWT Authentication with refresh tokens
- Role-based access (poster can't bid on own gigs)
- Real-time notifications via Socket.io
- MongoDB transactions for hiring workflow
- Responsive UI with Tailwind CSS

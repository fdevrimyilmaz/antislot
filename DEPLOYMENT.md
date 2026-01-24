# Deployment

This repository contains:
- Expo mobile app (root)
- Backend API (Fastify) in `backend/`
- AI chat server in `server/`

## Docker Compose (backend + AI server)

1) Create env files:

```bash
cp backend/.env.example backend/.env
cp server/.env.example server/.env
```

2) Set secrets in those `.env` files (especially `HMAC_SECRET` and `OPENAI_API_KEY`).

3) Build and run:

```bash
docker-compose up --build
```

4) Services:
- Backend API: `http://localhost:3000`
- AI chat server: `http://localhost:3001`

## Mobile app config

For the Expo app, set public variables in `./.env`:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_HMAC_SECRET=change-me
```

## Manual build (backend + AI server)

```bash
cd backend
npm install
npm run build
npm start
```

```bash
cd server
npm install
npm run build
npm start
```

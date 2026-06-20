# CodeSync — Frontend

Premium React frontend for the Real-Time Collaborative Learning Platform.
Connects to the deployed backend at **https://secapstone.onrender.com**.

## Stack
React + TypeScript + Vite · Tailwind CSS · Framer Motion · React Query · Zustand ·
React Router · React Hook Form · Zod · Axios · Firebase Auth · Socket.IO client.

## Develop
```bash
npm install
cp .env.example .env   # values are pre-filled for this project
npm run dev            # http://localhost:5173
```

## Build
```bash
npm run build          # output in dist/
npm run preview
```

## Features
- Premium animated landing page (hero, stats, features, pricing, FAQ, CTA)
- Firebase email/password auth (login, register, protected routes)
- Dashboard: overview with animated charts, classrooms, submissions, settings
- **Live classroom**: real-time code sync, participants, chat, and code execution
- Dark/light mode, glassmorphism, skeleton loading, responsive, code-split routes

## Deploy to Vercel
1. Push this folder to a GitHub repo.
2. Vercel → New Project → import the repo (framework auto-detected: Vite).
3. Add the env vars from `.env.example` in the Vercel project settings.
4. Deploy. `vercel.json` handles SPA routing.

After deploy, set the backend's `FRONTEND_URL` env var (on Render) to your Vercel
URL for tighter CORS.

## Env vars
See `.env.example` — `VITE_API_URL` + the `VITE_FIREBASE_*` web config.

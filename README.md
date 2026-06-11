# Study Command

Assignment tracker with a **timeline command center**, **in-app/browser notifications**, and a **demo AI assistant** trained on your syllabi and PDFs — **no API keys required**.

## Features

- **Timeline command center** — See every assignment and exam numbered 1–N on a vertical timeline (not a calendar grid)
- **In-app notifications** — Bell icon shows due-soon assignments; optional browser pop-ups
- **Demo assistant** — Ask questions about assignments, grading policies, and course materials (no OpenAI key needed)
- **Course materials** — Paste syllabus text or upload PDFs to power the assistant

## Quick start

```bash
npm install
cp .env.example .env
# Set DATABASE_URL in .env (or use `npx create-db`)
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Postgres connection string |
| `CRON_SECRET` | Optional | Secures the reminder cron endpoint in production |

No OpenAI or Twilio keys needed for the demo.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Jalani77/ai-agent&project-name=study-command&env=DATABASE_URL)

1. Click **Deploy with Vercel** above (or import [github.com/Jalani77/ai-agent](https://github.com/Jalani77/ai-agent)).
2. Add a **Postgres** database (Vercel Postgres or [Neon](https://neon.tech)) and set `DATABASE_URL`.
3. Deploy — migrations run automatically during build.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Timeline command center + quick-add |
| `/courses` | Manage courses, syllabi, PDF uploads |
| `/chat` | Demo assistant (no API key) |
| `/settings` | Notification preferences |

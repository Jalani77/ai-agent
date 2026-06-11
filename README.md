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
| `DATABASE_URL` | Optional | Postgres connection string — a demo DB is bundled so you can try it immediately |

No OpenAI, Twilio, or cron setup needed for the demo.

**Claim your free demo database** (keeps it permanently):  
https://create-db.prisma.io/claim?projectID=proj_cmq8sx9750rejymf7jfmc535v

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Jalani77/ai-agent&project-name=study-command&env=DATABASE_URL)

1. Click **Deploy with Vercel** above (or import [github.com/Jalani77/ai-agent](https://github.com/Jalani77/ai-agent)).
2. In Vercel → **Storage**, add **Postgres** (or use [Neon](https://neon.tech) / `npx create-db`).
3. Set `DATABASE_URL` in **Environment Variables** (must be available at build time).
4. Deploy — migrations run automatically when `DATABASE_URL` is set.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Timeline command center + quick-add |
| `/courses` | Manage courses, syllabi, PDF uploads |
| `/chat` | Demo assistant (no API key) |
| `/settings` | Notification preferences |

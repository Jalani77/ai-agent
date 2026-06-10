# Study Command

Assignment tracker with a **timeline command center**, **SMS text reminders**, and an **AI assistant** trained on your syllabi and PDFs.

## Features

- **Timeline command center** — See every assignment and exam numbered 1–N on a vertical timeline (not a calendar grid)
- **SMS reminders** — Text message alerts via Twilio when deadlines approach
- **AI assistant** — Ask questions about assignments, grading policies, and course materials
- **Course materials** — Paste syllabus text or upload PDFs to power the AI

## Quick start

```bash
npm install
cp .env.example .env
# Add OPENAI_API_KEY to .env
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Postgres connection string (Vercel Postgres, Neon, or `npx create-db`) |
| `OPENAI_API_KEY` | Yes | Powers the AI assistant |
| `TWILIO_ACCOUNT_SID` | For SMS | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | For SMS | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | For SMS | Twilio sender number (E.164) |
| `CRON_SECRET` | Production | Secures the reminder cron endpoint |

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Jalani77/ai-agent&project-name=study-command&env=DATABASE_URL,OPENAI_API_KEY,TWILIO_ACCOUNT_SID,TWILIO_AUTH_TOKEN,TWILIO_PHONE_NUMBER,CRON_SECRET)

1. Click **Deploy with Vercel** above (or import [github.com/Jalani77/ai-agent](https://github.com/Jalani77/ai-agent) in the Vercel dashboard).
2. Add a **Postgres** database (Vercel Postgres or [Neon](https://neon.tech)) and set `DATABASE_URL`.
3. Set `OPENAI_API_KEY`, Twilio credentials, and `CRON_SECRET`.
4. Deploy — migrations run automatically during build.

SMS reminders run hourly via Vercel Cron (`vercel.json`).

## Pages

| Route | Description |
|-------|-------------|
| `/` | Timeline command center + quick-add assignments |
| `/courses` | Manage courses, syllabi, and PDF uploads |
| `/chat` | AI assistant for assignment questions |
| `/settings` | Phone number and SMS reminder preferences |

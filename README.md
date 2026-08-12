# Alphabet Atlas — English Trainer App

A Duolingo-style English learning app: a 26-level **A → Z roadmap**, bite-size
lessons with instant-feedback exercises, XP + streaks, and an **AI Trainer**
chat widget for doubt-clearing, powered by the Anthropic API.

Everything is plain **Node.js / Express / vanilla JavaScript** — no framework,
no build step. The database is **SQLite** (via `better-sqlite3`), so it runs
locally with zero setup (no separate DB server to install).

## Project structure

```
english-trainer-app/
├── server.js              # Express entry point
├── package.json
├── .env.example            # copy to .env
├── db/
│   ├── schema.sql          # full table definitions (see below)
│   ├── db.js                # opens the DB + seeds the A-Z roadmap & sample lessons
│   └── english_trainer.db  # created automatically on first run
├── routes/
│   ├── auth.js              # signup / login (JWT)
│   ├── lessons.js           # levels, lessons, exercises, progress
│   └── aiTrainer.js         # doubt-clearing chat -> Anthropic API
└── public/
    ├── index.html
    ├── style.css
    └── app.js               # frontend logic (no framework)
```

## Setup

```bash
cd english-trainer-app
npm install
cp .env.example .env
```

Edit `.env`:
- `JWT_SECRET` — any long random string.
- `ANTHROPIC_API_KEY` — get one at https://console.anthropic.com/. Required
  for the AI Trainer chat to work; the rest of the app works without it.

Then run:

```bash
npm start
```

Open **http://localhost:4000**. The database and the A–Z level roadmap are
created automatically on first boot (see `db/db.js`). Levels **A** and **B**
ship with real sample lessons so you can try the full flow immediately;
levels C–Z are ready as empty roadmap stops — add lessons the same way (see
"Adding content" below).

## How the pieces fit together

1. **Auth** (`routes/auth.js`) — email/password signup & login, passwords
   hashed with bcrypt, sessions handled with a JWT bearer token stored in
   `localStorage` on the frontend.
2. **Roadmap & lessons** (`routes/lessons.js`) — serves the 26 levels, the
   lessons inside a level, and the exercises inside a lesson. Answers are
   checked server-side (`POST /api/exercises/:id/answer`) so the correct
   answer is never sent to the browser up front. Completing a lesson
   (`POST /api/lessons/:id/complete`) awards XP and updates the daily streak.
3. **AI Trainer** (`routes/aiTrainer.js`) — a chat endpoint
   (`POST /api/ai/ask`) that forwards the learner's question, plus the
   running conversation, to the Anthropic Messages API with a system prompt
   tuned to be a patient English tutor. Every message is stored in
   `ai_chat_sessions` / `ai_chat_messages`, so a learner's doubt history is
   never lost and could later be shown as "past questions."
4. **Frontend** (`public/`) — a single HTML page with four views
   (auth → roadmap → lesson list → lesson player) swapped via JS, plus a
   floating AI Trainer chat panel available on every screen.

## Database schema (overview)

See `db/schema.sql` for the full definitions. Core tables:

| Table | Purpose |
|---|---|
| `users` | account, XP total, streak count, current level |
| `levels` | the 26 A→Z roadmap stops |
| `lessons` | lessons within a level |
| `exercises` | individual questions within a lesson (mcq / fill-blank / etc.) |
| `user_progress` | per-user completion state & best score per lesson |
| `exercise_attempts` | every answer ever submitted (useful for "weak spots" analytics later) |
| `ai_chat_sessions` / `ai_chat_messages` | AI Trainer doubt-clearing conversations |
| `badges` / `user_badges` | achievements (streaks, first lesson, reaching level Z, etc.) |

The schema file also has one-line notes at the bottom for adapting it to
MySQL or PostgreSQL if you outgrow SQLite.

## Adding content (new lessons/exercises)

Content currently lives in `SAMPLE_LESSONS` inside `db/db.js` for levels A
and B. The cleanest way to add more:
1. Add entries to `SAMPLE_LESSONS` (or build a small admin script) following
   the same shape — a lesson with a `type`/`prompt`/`options`/`answer`/
   `explanation` per exercise.
2. Delete `db/english_trainer.db` and run `npm run seed` again, **or** insert
   directly with SQL against the running `.db` file (any SQLite GUI, e.g.
   DB Browser for SQLite, works fine for this).

## Notes & next steps

- The AI Trainer currently calls `claude-sonnet-5` — swap the
  `ANTHROPIC_MODEL` value in `.env` for `claude-haiku-4-5-20251001` if you
  want cheaper/faster replies for simple doubts.
- Speaking/listening exercise *types* exist in the schema (`speak`,
  `listen_type`) but audio capture/playback isn't wired into the frontend
  yet — that's the natural next feature to add.
- Passwords are hashed, but this is a learning-project baseline: add rate
  limiting, email verification, and HTTPS/production hardening before any
  real deployment.

# Saarthi - Personal Operating System

**Saarthi** is a comprehensive, single-user-oriented Personal Operating System designed to centralize and deterministicly track daily life.

## Project Philosophy
Saarthi is built with a strict adherence to determinism and simplicity. It is designed for a single owner who wants complete control and visibility over their life's data. 
- **No AI Fluff:** Absolutely no AI calorie estimation, AI recipe generation, or unpredictable black-box features. The system does exactly what you tell it to do.
- **Deterministic:** Your inputs perfectly mirror the outputs. 
- **Unified & Connected:** All modules (Tasks, Notes, Workouts, Finance, etc.) are deeply interconnected, allowing you to link a specific Task to a specific Workout, or a Note to a Financial Goal.

## Modules

- 📋 **Tasks:** Manage, prioritize, and track open and completed tasks with integrated due dates.
- 📝 **Notes:** A quick, searchable digital brain for capturing thoughts.
- 🏋️ **Workouts:** Create routines, manage a weekly schedule, and log workout sessions (volumes, sets, reps).
- ⚖️ **Weight Tracking:** Log body weight over time and visualize trends via charts.
- 💰 **Finance:** Manage income/expenses, setup recurring rules, and track leftover budget for the month.
- 🍎 **Food (Phase 2):** Deterministic macro and calorie tracking.

---

## Setup Instructions

### 1. Install
Install dependencies using `pnpm`:
```bash
pnpm install
```

### 2. Configure Neon
1. Create a free account at [Neon](https://neon.tech).
2. Create a new PostgreSQL project.
3. Copy your connection string (make sure it includes `sslmode=require` or pooled connection if required).

### 3. Configure environment
Copy the sample environment file:
```bash
cp .env.example .env
```
Update `.env` with your Neon `DATABASE_URL` and your email (`OWNER_EMAIL`).
Optionally set up `AUTH_EMAIL_SERVER` if you want real emails to be sent, otherwise the local development server will log the magic links to the terminal.

### 4. Run migrations
Push the initial schema to your Neon database:
```bash
pnpm db:generate
pnpm db:migrate
```
*(Note: For fresh Neon databases on Vercel, use the `scratch/run_all_migrations.ts` script to bypass CLI interactive prompts).*

### 5. Start development server
```bash
pnpm dev
```

### 6. Open local app
Open [http://localhost:3000](http://localhost:3000) in your browser.
You will be redirected to the `/sign-in` page. Enter the email you configured as `OWNER_EMAIL` to receive a magic link to log in.

---

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Auth:** Auth.js v5 (Passwordless Email Links)
- **Database:** Neon PostgreSQL with Drizzle ORM
- **UI:** Tailwind CSS, shadcn/ui, Lucide Icons, Recharts

# Personal OS - Phase 1

This is Phase 1 of the Personal OS. It establishes the mobile-first shell, database foundations, single-owner authentication, global navigation, and the core command surface (`Cmd+K`).

## Setup Instructions

### 1. Install
Install dependencies using `pnpm`:
```bash
pnpm install
```

### 2. Configure Neon
1. Create a free account at [Neon](https://neon.tech).
2. Create a new PostgreSQL project (e.g., `personal-os-dev`).
3. Copy your connection string (make sure it includes `sslmode=require` or pooled connection if required).

### 3. Configure environment
Copy the sample environment file:
```bash
cp .env.example .env
```
Update `.env` with your Neon `DATABASE_URL` and your email (`OWNER_EMAIL`).
Optionally set up `AUTH_EMAIL_SERVER` if you want real emails to be sent, otherwise the local development server will just log the magic links to the terminal.

### 4. Run migrations
Push the initial Phase 1 schema to your Neon database:
```bash
pnpm db:generate
pnpm db:migrate
```

### 5. Start development server
```bash
pnpm dev
```

### 6. Open local app
Open [http://localhost:3000](http://localhost:3000) in your browser.
You will be redirected to the `/sign-in` page. Enter the email you configured as `OWNER_EMAIL` to receive a magic link (or view it in your terminal output) to log in.

## Phase 1 Deliverables
- **Auth:** Auth.js v5 with passwordless email links.
- **Database:** Neon PostgreSQL with Drizzle ORM.
- **Pages:** `/today`, `/overview`, `/settings`, `/search`, and a `/food` placeholder.
- **UI:** Mobile-first layout with desktop sidebar, using standard shadcn/ui primitives.

# Vinted Poland — Fulfillment Tracker

Internal 2-role workflow tool between an admin (owner) and an employee (Poland) for Shein → Vinted reshipping, backed by the [DOTB](https://dotb.io) API for orders, photos, and shipping labels.

## How it works

1. **Sync (automatic)** — the server syncs orders on its own on a schedule (Vercel Cron in production, a background loop locally — see "Automatic sync" below). The admin can also click "Sync now" for an immediate pull. Orders from the enabled DOTB Vinted accounts come in with their items, photos, and shipping label.
2. **Queue** — as soon as DOTB reports an order's shipping label as sent, it automatically moves into the employee's "In progress" queue — no manual push needed. (Manually-created orders still need the admin to click "Release", since there's no DOTB signal for those.)
3. **Pack & ship** — the employee matches the photo/label to the garment, packs it, and clicks "Mark as shipped". This also tries (best-effort) to mark the order as packed back in DOTB.
4. **History** — shipped orders are visible in "Shipped" (last 7 days) and the full searchable "History".

Orders can also be created manually (photo + label upload) for anything outside DOTB.

### Automatic sync

- **Locally**: `src/instrumentation.ts` starts a background loop when the dev server boots, syncing every `SYNC_INTERVAL_MINUTES` (default 5). No cron needed for local testing.
- **On Vercel**: the local loop is disabled (serverless functions don't stay alive for `setInterval`), and `vercel.json` registers a Cron Job that hits `/api/cron/sync` every 10 minutes instead. Set `CRON_SECRET` as a project env var — Vercel sends it automatically as a Bearer token when it calls the cron route.
- **Vercel Hobby (free) plan note**: Vercel currently limits Hobby-plan Cron Jobs to roughly once a day regardless of the schedule you set. `.github/workflows/sync-cron.yml` works around this — it's a GitHub Actions workflow that hits `/api/cron/sync` every 10 minutes on its own, using your existing GitHub repo (no extra third-party account needed). To enable it, go to the repo's **Settings → Secrets and variables → Actions** and add two repository secrets:
  - `APP_URL` — your deployed URL, e.g. `https://your-app.vercel.app`
  - `CRON_SECRET` — the same value you set for the `CRON_SECRET` env var on the Vercel project
  
  Once both secrets exist the workflow runs automatically; you can also trigger it manually from the repo's **Actions** tab ("Sync DOTB orders" → **Run workflow**) to test it. If you'd rather upgrade to Vercel Pro instead, its own Cron Jobs run on the exact schedule and you can ignore this workflow (or just delete the file).

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run db:migrate           # creates tables (needs DATABASE_URL)
npm run db:seed              # creates the admin + employee accounts
npm run dev
```

### Environment variables

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Create a free Postgres database at [neon.tech](https://neon.tech). Use the **pooled** connection string for `DATABASE_URL` and the **direct** connection string for `DIRECT_URL` (Neon's dashboard shows both). |
| `DOTB_API_TOKEN` | In DOTB: Settings → API (requires the Boutique AI subscription). Token looks like `dotb_pk_...`. |
| `SESSION_SECRET` | Any random 32+ byte string. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. |
| `BLOB_READ_WRITE_TOKEN` | Created automatically when you add a **Blob** store to your Vercel project (Storage tab). |
| `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` | Login for the owner account. Change the password after first login isn't self-service yet — pick a strong one now. |
| `EMPLOYEE_SEED_EMAIL` / `EMPLOYEE_SEED_PASSWORD` | Login for the Poland employee account. |
| `SYNC_WINDOW_DAYS` | How many days back to pull orders from DOTB on each sync (default 45). |
| `CRON_SECRET` | Any random string (same generator as `SESSION_SECRET`). Set it as a Vercel project env var too — Vercel then sends it automatically to `/api/cron/sync`. |
| `SYNC_INTERVAL_MINUTES` | Local dev only — how often the background loop syncs (default 5). Ignored on Vercel. |

## Deploying (Vercel)

1. Push this repo to GitHub.
2. Create a project on [vercel.com](https://vercel.com) from that repo.
3. In the Vercel project: **Storage** → add a **Neon Postgres** database (or connect an existing Neon project) — this auto-fills `DATABASE_URL`/`DIRECT_URL`. Also add a **Blob** store — this auto-fills `BLOB_READ_WRITE_TOKEN`.
4. In **Settings → Environment Variables**, add `DOTB_API_TOKEN`, `SESSION_SECRET`, `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`, `EMPLOYEE_SEED_EMAIL`, `EMPLOYEE_SEED_PASSWORD`, `SYNC_WINDOW_DAYS`, `CRON_SECRET`.
5. Deploy.
6. Run the migration + seed once against production (from your machine, with prod `DATABASE_URL`/`DIRECT_URL` in `.env.local` temporarily, or via `vercel env pull`):
   ```bash
   npm run db:deploy
   npm run db:seed
   ```
7. Visit the deployed URL, log in as admin, go to **Vinted accounts**, enable the accounts you want synced, then **Sync now** from the dashboard.

## Notes

- Only the admin can release orders, create/edit manual orders, and manage which Vinted accounts sync. The employee can view the queue/shipped/history, add a note to an order, and mark it shipped.
- DOTB sync runs automatically (see "Automatic sync" above); the "Sync now" button on the dashboard is just for an immediate pull on top of that.
- If the best-effort `pack` call back to DOTB fails after shipping, the order detail page shows a "DOTB sync failed" banner with a retry button — this never blocks the local shipped status.

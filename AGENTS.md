# AGENTS.md

MonkFlow is a personal finance app split into two independent pnpm packages. There is **no root `package.json` or workspace**: `pnpm install` at the repo root fails. Always target a package with `pnpm -C backend ...` or `pnpm -C frontend ...`. Node 22, pnpm 10, and the committed `pnpm-lock.yaml` files are the source of truth.

## Stack and entrypoints

- `backend/`: Express 5 + TypeScript (ESM/NodeNext) + Prisma 6 + PostgreSQL (Neon). Boot flow: `src/index.ts` (connect DB, listen) -> `src/server.ts` (Express app, routers). Controllers are classes with static handlers; routes own the `express-validator` chains.
- `frontend/`: React 19 + Vite 8 + TanStack Query + Zod + Tailwind 4 + React Router 7. Boot flow: `src/main.tsx` -> `src/router.tsx` (QueryClientProvider + routes). `@/*` maps to `frontend/src/*`.
- Dev servers: backend on `PORT` (default 3000) via `tsx --watch --env-file=.env`; Vite on 5173 proxies `/api` to `http://localhost:3000`.
- CORS allows `FRONTEND_URL` plus `http://localhost:5173` (`backend/src/config/cors.ts`).

## Commands

```bash
# Backend (from repo root)
pnpm -C backend dev
pnpm -C backend build                 # tsc -> dist
pnpm -C backend exec tsc --noEmit     # typecheck; no npm script exists
pnpm -C backend start                 # runs dist; unlike dev, does NOT load .env

# Frontend
pnpm -C frontend dev
pnpm -C frontend lint
pnpm -C frontend exec tsc --noEmit -p tsconfig.app.json   # typecheck; no npm script exists
pnpm -C frontend build                # tsc -b && vite build
```

There is no test suite. `pnpm -C backend test` is a placeholder that exits 1.

Known baseline at commit `a759e39`: backend typecheck/build pass, but frontend lint and typecheck fail on pre-existing issues (`MovementForm.tsx` unused `isError`/`errorMessage`; irregular whitespace from keycap emoji comments in `useAccounts.ts` and `useMovements.ts`). Check whether your change adds new errors instead of assuming a clean tree.

## Backend contracts

- ESM NodeNext: relative imports must include `.js` (e.g. `import prisma from '../config/db.js'`) even in `.ts` files.
- Use the Prisma singleton from `src/config/db.ts`; do not instantiate `new PrismaClient()` in controllers.
- Domain rules live in `src/middleware/index.ts`: `normalizeAmount` forces `Math.abs` + 2 decimals; `validateMovementLogic` enforces per-type accounts (INCOME: income only; EXPENSE: expense only; TRANSFER/DEPOSIT/WITHDRAWAL: both, and distinct). `createMovement` updates account balances inside `prisma.$transaction`.
- `Movement.amount` is `Decimal(12,2)` while `Account.balance` is `Float`; do not mix these assumptions.
- Error contract: controllers return `{ error }`, validation returns `{ errors: [...] }`. The frontend reads `errors[0].msg || error || message` in `src/api/handleApiErrors.ts`; preserve it.

## Prisma and environment

- Secrets are git-ignored and must never be printed or committed: `backend/.env` (`DATABASE_URL`) and `frontend/.env.local` (`VITE_API_URL`).
- The Prisma CLI does **not** auto-load `backend/.env` because `backend/prisma.config.ts` exists (it prints "skipping environment variable loading"). Load it first:
  ```bash
  set -a && . backend/.env && set +a && pnpm -C backend exec prisma <command>
  ```
- Schema: `backend/prisma/schema.prisma`. Regenerate after schema changes with `pnpm -C backend exec prisma generate`; apply with `db push`/migrations. The client is generated into `node_modules` (`prisma-client-js`); no generated code is committed.
- Do not run destructive DB or migration commands without asking.

## Frontend conventions

- Zod schemas and inferred types live in `frontend/src/types/index.ts`. Every `src/api/*` module validates responses with `safeParse` and throws on mismatch, so when adding a field or endpoint update schema/types -> API -> hooks -> view together.
- Data flow: `src/api` -> `src/hooks` (TanStack Query) -> components/views. Query keys: `['movements']`, `['movements','detail',id]`, `['accounts']`, `['tags']`, `['dashboard-summary']`; mutations invalidate the affected keys.
- UI copy is Spanish. Use theme tokens declared in `src/index.css` `@theme` (`obsidian`, `linen-light`, `sage`, `clay-gray`, `ritual-red`, `green-balance`, `rice-paper`, `font-inter`) instead of raw hex or default Tailwind palette colors.
- `src/lib/axios.ts` uses `/api` through the Vite proxy in dev and `VITE_API_URL` only in production.
- Avoid keycap/emoji sequences (digit + U+FE0F) in comments: frontend lint fails on `no-irregular-whitespace`.

## Workflow and docs

- Never commit directly to `main`. Use a feature branch and open a PR; the user performs merges. Branch prefixes in use: `feature/`, `feat/`, `fix/`, `chore/`, `setup/`.
- Commit messages use Conventional Commits in English, e.g. `feat(ui): ...`, `fix(hooks): ...`, `refactor(backend): ...`.
- Each feature/phase gets a numbered dev log at `docs/developer-logs/NN-<slug>.md` (next number: 25). Spanish prose with phase/objective headers and `<details>` sections; follow `docs/templates/dev-log-templates.md`.
- `frontend/README.md` is the untouched Vite template, not project documentation. Use the developer logs and the router/API code for architecture.
- Do not invent endpoints or environment variables; verify them in `backend/src/routes` and the config files.

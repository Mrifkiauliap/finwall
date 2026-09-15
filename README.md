# Finwall

A financial management application for tracking personal and shared finances
across multiple workspaces (personal, family, business).

Monorepo managed with **pnpm workspaces** + **Turborepo**.

---

## Requirements

|                | Version                                           |
| -------------- | ------------------------------------------------- |
| Node.js        | `^22.18.0` or `>=24.12.0`                         |
| pnpm           | `11.11.0` (enforced via `engines` + `devEngines`) |
| PostgreSQL     | for the database                                  |
| Valkey / Redis | for cache & session mirror                        |

`@node-rs/argon2` ships **prebuilt binaries** (Rust / napi-rs) so no C++ toolchain
is needed. Prefer it over the `argon2` package, which requires node-gyp.

---

## Quick start

```bash
# 1. Install dependencies
pnpm install

# 2. Create your env file and fill it in
cp .env.example .env        # Windows: copy .env.example .env

# 3. Prepare the database
pnpm db:migrate             # apply migrations
pnpm db:seed                # optional: demo users & workspaces

# 4. Run everything
pnpm dev
```

`pnpm dev` starts every app through Turbo. To run a single one:

```bash
pnpm dev:api        # NestJS API
pnpm dev:web        # Vue 3 SPA (Vite)
pnpm dev:web-nuxt   # Nuxt variant
```

---

## Project structure

### Apps

| App             | Stack                                          | Role                                               |
| --------------- | ---------------------------------------------- | -------------------------------------------------- |
| `apps/api`      | NestJS 12, Drizzle, ioredis                    | REST API, auth, email                              |
| `apps/web`      | Vue 3, Vite, Pinia, Tailwind 4, TanStack Query | Primary SPA                                        |
| `apps/web-nuxt` | Nuxt                                           | Nuxt variant (**not yet at parity** — see Caveats) |

### Packages

| Package           | Role                                                        |
| ----------------- | ----------------------------------------------------------- |
| `@finwall/shared` | Zod schemas & contracts shared between backend and frontend |
| `@finwall/db`     | Drizzle schema, client, seed                                |
| `@finwall/config` | Typed env loading & validation (`/api`, `/web`, `/base`)    |
| `@finwall/cache`  | Valkey/Redis client + session mirror                        |
| `@finwall/logger` | Structured logging                                          |
| `@finwall/ai`     | AI integration layer                                        |

### Other

| Path                     | Contents                                                |
| ------------------------ | ------------------------------------------------------- |
| `docs/`                  | Architecture notes, multi-tenant design, session resume |
| `infra/scripts/reset.js` | Hard database reset                                     |
| `plans/`                 | Planning documents                                      |

---

## Scripts

### Root

```bash
pnpm dev            # all apps in watch mode
pnpm dev:api        # API only
pnpm dev:web        # web only
pnpm dev:web-nuxt   # nuxt only

pnpm build          # build everything
pnpm lint           # lint everything
pnpm check-types    # type-check everything
pnpm format         # prettier over ts/tsx/md
pnpm clean          # remove build artifacts
```

### Database

```bash
pnpm db:generate    # generate a migration from schema changes
pnpm db:migrate     # apply migrations
pnpm db:push        # push schema directly (no migration file)
pnpm db:reset       # push + migrate
pnpm db:reset:hard  # destructive reset via infra/scripts/reset.js
pnpm db:seed        # seed demo data
pnpm db:studio      # Drizzle Studio
```

### Per app

```bash
pnpm --filter @finwall/api  run test          # vitest
pnpm --filter @finwall/web  run type-check    # vue-tsc
pnpm --filter @finwall/web  run build-only    # vite build, no type-check
pnpm --filter @finwall/web  run test:e2e      # playwright
```

---

## Environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env        # Windows cmd: copy .env.example .env
```

**A single `.env` at the repository root is enough.** The loader walks up from the
working directory until it finds one, so there is no need to duplicate it into every
app or package.

Everything is validated at boot by `@finwall/config` — a missing or malformed value
fails fast with a clear message instead of surfacing later as a runtime bug.

> `.env` is only auto-loaded when `NODE_ENV` is **not** `production`. In production
> the variables must come from the environment (container, systemd, etc).

### Core

| Key                                                | Notes                                                  |
| -------------------------------------------------- | ------------------------------------------------------ |
| `APP_PORT`                                         | API port (default `3001`)                              |
| `APP_SECRET`                                       | min 32 chars                                           |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`         | min 32 chars, **must differ** (enforced in production) |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | e.g. `15m`, `7d`                                       |
| `ENCRYPTION_KEY`                                   | base64-encoded 32-byte key, **exactly 44 chars**       |

### Database & cache

| Key                                                         | Notes                                   |
| ----------------------------------------------------------- | --------------------------------------- |
| `DATABASE_HOST` / `_PORT` / `_USER` / `_PASSWORD` / `_NAME` | required in production                  |
| `VALKEY_HOST` / `VALKEY_PORT`                               | Valkey/Redis for cache + session mirror |

### Web (Vite)

| Key                 | Notes               |
| ------------------- | ------------------- |
| `VITE_API_BASE_URL` | must be a valid URL |
| `VITE_BASE_URL`     | default `/`         |

### Email

Two providers are supported, and **`RESEND_API_KEY` wins over SMTP**:

1. **Resend** (recommended for production) — set `RESEND_API_KEY` + `EMAIL_FROM`.
2. **SMTP** — set `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASSWORD` / `EMAIL_SECURE`.

> `EMAIL_PASSWORD` is **required by the env schema even when using Resend**. Put any
> placeholder value if SMTP is unused.
>
> `EMAIL_FROM` must use a domain **verified in Resend**. It falls back to
> `EMAIL_USER` when empty.

---

## Authentication

### Password hashing — Argon2id

Passwords are hashed with **Argon2id** (`19 MiB`, 2 iterations, parallelism 1 —
OWASP minimums). `bcryptjs` has been **removed**.

> **Breaking:** bcrypt hashes from before this change **no longer verify**. Existing
> users must reset their password, or the database must be re-seeded. This was a
> deliberate choice while the project is pre-production — there is no bcrypt fallback.

`passwordNeedsRehash()` re-hashes on successful login whenever the parameters no
longer match, so raising `memoryCost` later migrates users one by one without a
mass reset.

The hashing module lives at the subpath **`@finwall/shared/password`** and is
deliberately **not** exported from the package barrel: `@node-rs/argon2` is a
native module that cannot be bundled for the browser.

### Email verification

New accounts start with `is_verified = false`. A 6-character code is emailed; a
banner in the app links to `/verify-email`. There is also a resend action with a
60-second cooldown.

Tokens are stored **in the database** (hashed with SHA-256), not in the cache.
The cache is used only for the resend cooldown — it is a performance layer that
may be lost at any time, whereas a one-time token has a lifecycle.

### Password reset

Two-step flow: request a code (`/forgot-password`) → enter code + new password
(`/forgot-password/reset`).

The same single-source-of-truth rule applies: verification and reset both read
from the database, and a used token is marked `usedAt` rather than deleted so
reuse is rejected explicitly.

---

## Keyboard shortcuts

Chords of **master + key**, registered once at the app root:

| Shortcut     | Action                                     |
| ------------ | ------------------------------------------ |
| `Ctrl` + `K` | Open/close the command shell               |
| `Ctrl` + `B` | Toggle the accounts panel                  |
| `Ctrl` + `D` | Go to dashboard                            |
| `Ctrl` + `S` | Go to account settings                     |
| `Ctrl` + `I` | Toggle light/dark theme                    |
| `Ctrl` + `O` | Cycle the shortcut master (`Ctrl` ⇄ `Alt`) |

Also works as a chord (VS Code style): press the master, release, then press the
second key within 1.8 s.

Master defaults to `Ctrl` on Windows/Linux and `⌘` on macOS. The master is
configurable and persisted.

> **`Win` + letter cannot be used on Windows.** `Win+I`, `Win+S`, and `Win+D` are
> captured by the operating system before the browser sees them, so
> `preventDefault()` is impossible. This is a platform limit, not a bug — that is
> why `Win` is not offered as a master outside macOS.

---

## Caveats & known issues

### `apps/web-nuxt` is behind

It still uses `bcryptjs`, has no email verification flow, and its layouts have not
received the app-shell scroll fix. Treat `apps/web` as the reference implementation.

### User enumeration in password reset

`forgotPassword()` throws `"User not found"` when the identifier does not exist,
which contradicts the deliberately generic message used by sign in. **Known and
left as-is** — should be fixed before production.

### Visual behaviour not yet verified in a browser

The app-shell scroll model and the accounts-panel animation were verified by build
and type-check only. Manual confirmation is still needed, including under
`prefers-reduced-motion: reduce`.

---

## Troubleshooting

### The shell is cmd.exe, not PowerShell

Despite running on Windows, the terminal is **cmd**. Chain commands with `&&` —
**not** `;`, or pnpm will treat the following arguments as extra parameters:

```bash
# correct
pnpm --filter @finwall/web run type-check && pnpm --filter @finwall/web run lint
```

Use `del` / `dir` rather than `Remove-Item` / `Get-ChildItem`.

### "Cannot find name…" right after editing a workspace package

Almost always a stale `dist`. Several packages are consumed as compiled output, so
rebuild before assuming a code bug:

```bash
pnpm --filter @finwall/shared run build
pnpm --filter @finwall/db run build
pnpm --filter @finwall/config run build
```

Note `@finwall/shared` is exposed to `apps/web` via `types: ./src/index.ts`, so the
web app type-checks the **source**. That is exactly why no native module may be
added to its barrel.

### `drizzle-kit generate` fails on env validation

Migration generation loads the full API config, so `EMAIL_PASSWORD` must be
present even though it is unrelated to the schema:

```bash
set "EMAIL_PASSWORD=dummy" && pnpm --filter @finwall/db run db:generate
```

### Sign-in works but the old password no longer does

Expected after the Argon2id migration — see [Authentication](#password-hashing--argon2id).
Re-seed the demo data or reset the password.

---

## Documentation

| Document                 | Contents                                             |
| ------------------------ | ---------------------------------------------------- |
| `docs/session-resume.md` | Handover notes: what changed, why, and how to verify |
| `docs/multi-tenant/`     | Multi-tenant design, in four phases                  |

Code comments in this repository are written in Indonesian; user-facing strings are
internationalised (`id` / `en`).

# CampusBlog

> This project is currently in active development (WIP). 

## Quick Start

1. Install dependencies

```bash
pnpm install
```

2. Configure local environment variables (based on `.env.example`)

```bash
cp .env.example .env
```

3. Log in to Cloudflare (required on first setup)

```bash
pnpm wrangler login
```

4. Start the development server

```bash
pnpm dev
```

5. Open the app

- Frontend: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

6. When you change Payload schema/content config, update generated artifacts

```bash
# 1) Create migration files for schema changes
pnpm payload migrate:create

# 2) Apply pending migrations locally
pnpm payload migrate

# 3) Regenerate Payload + Cloudflare types
pnpm run generate:types

# 4) Regenerate import map if admin components/paths changed
pnpm run generate:importmap
```

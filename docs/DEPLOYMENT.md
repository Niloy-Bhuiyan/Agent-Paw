# Deployment

## Build & run

```bash
npm install
npm run build     # typechecks, lints, prerenders all pages
npm start         # serves on :3000
```

All pages are static; `/api/chat` and `/api/providers` are Node runtime
routes (SSE streaming — ensure your host supports streaming responses).

## Environment

Set server-side provider vars (`ANTHROPIC_API_KEY`, …) in the host's
environment settings — never commit them. `NEXT_PUBLIC_*` vars are baked
at **build time**; set them before `npm run build`.

Recommended production vars:

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata/sitemap/robots |
| provider keys | See `../ENVIRONMENT.md` |

## Platform notes

- **Vercel**: zero config; SSE works on Node runtime routes.
- **Docker / self-host**: `node .next/standalone` not configured — use
  `npm start` behind a reverse proxy. Keep `Cache-Control` defaults;
  static assets are content-hashed.
- **HTTPS is required in production** for microphone access (the voice
  companion's real STT). Plain-HTTP LAN previews automatically fall back
  to typed input.

## Checks before release

`npm run typecheck && npm run lint && npm run build` — all must pass
clean. Security headers ship via `next.config.ts`. `.next/`,
`node_modules/`, `.env*` and `.reference/` are gitignored.

## Known operational gotcha

Never run `npm run build` while `npm run dev` is running — they share
`.next/` and the dev server's chunk cache gets corrupted (symptom:
`MODULE_NOT_FOUND`). Stop dev, build, restart.

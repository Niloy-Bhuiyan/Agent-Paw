# Contributing

## Setup

```bash
npm install
npm run dev
```

## Before you push

```bash
npm run typecheck   # strict TS, no errors
npm run lint        # ESLint flat config, no warnings
npm run build       # must prerender cleanly
npm run format      # prettier
```

## Ground rules

- **No copied assets or copy.** All art is procedural, all text original —
  see `ASSETS.md`. Don't add media from the reference site.
- **Extend via registries, not edits.** New emotions/reactions/metrics/
  personalities/tools/providers go through `register*()` — see
  `docs/PLUGIN_GUIDE.md`. If you're editing a `switch` to add a feature,
  there's probably a registry you should use instead.
- **Every adapter needs a mock twin.** A feature that only works with an
  API key or a permission is incomplete — the mock path is the default
  experience.
- **No secrets in code.** Env vars only; document new ones in
  `ENVIRONMENT.md` + `.env.example`.
- **i18n**: user-facing strings on site pages go through
  `src/lib/i18n/` (EN + KO). Pet dialogue lives in personality packs.
- **Respect reduced motion** and keep the cat engine's off-screen pause
  intact when touching animation code.
- Update `CHANGELOG.md` with user-visible changes.

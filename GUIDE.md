# GUIDE.md — Complete Setup Guide for This Project

This guide is for you, the project owner. It assumes you just moved the
project to a brand-new computer and remember nothing. Follow it from top
to bottom and the project will run. Every step is explained.

The project is called **comnyang-clone**. It is a website with:
- A landing page (a recreation of comnyang.com with a living pixel cat)
- An AI chat page (`/companion`)
- An AI Companion Pet with a Voice Companion (`/pet`)

Everything works **without any API keys or accounts**. Keys are only
needed if you want real AI answers instead of the built-in "mock cat".

---

## 1. Downloading the Project

### How to copy the project

The project is one folder named `comnyang-clone`. Copy that whole folder
to the new computer any way you like:

- **USB drive**: copy the `comnyang-clone` folder onto the drive, then
  copy it onto the new computer (for example into `C:\Users\<you>\`).
- **Zip file**: right-click the folder → "Compress to ZIP file", move
  the zip, then right-click → "Extract All" on the new computer.
- **Cloud drive**: upload the folder, download it on the other machine.

**Tip before copying:** you can delete the folders `node_modules` and
`.next` first. They are huge, and they are rebuilt automatically later.
This makes the copy about 100× smaller.

### Important folders and files

| Item | What it is |
| --- | --- |
| `src/` | **All the source code.** The most important folder. |
| `public/` | Static files served by the website. |
| `docs/` | All documentation (architecture, plugins, APIs, etc.). |
| `package.json` | The list of software packages the project needs. |
| `package-lock.json` | The exact versions of those packages. |
| `.env.example` | A template for your secret keys (safe to share). |
| `.env.local` | Your real secret keys (**never share this file**). |
| `next.config.ts`, `tsconfig.json`, `eslint.config.js`, `prettier.config.js`, `postcss.config.mjs` | Configuration. Do not delete. |
| `README.md`, `GUIDE.md`, `ENVIRONMENT.md`, `ASSETS.md`, `CHANGELOG.md`, `CONTRIBUTING.md` | Documentation. |

### Never delete these

- `src/`, `public/`, `package.json`, `package-lock.json`
- Any file ending in `.config.js`, `.config.ts`, `.config.mjs`, or `tsconfig.json`
- `.env.local` (if you already created it — it holds your keys)

### Safe to delete (they rebuild themselves)

- `node_modules/` (rebuilt by `npm install`)
- `.next/` (rebuilt by `npm run dev` or `npm run build`)
- `.reference/` (old research notes; not part of the app)

---

## 2. Software to Install

You need only **two** programs (plus a browser you already have).

### 2.1 Node.js (required)

- **What it is:** the program that runs JavaScript on your computer.
- **Why you need it:** the entire project runs on it. Nothing works
  without it. Installing Node.js also installs `npm`, the package
  manager used to download the project's dependencies.
- **Download:** https://nodejs.org — click the big **LTS** button.
- **Recommended version:** 20 or newer (any LTS version is fine).
- **Install:** run the downloaded installer. Click "Next" through all
  the steps. The default options are correct.
- **Verify it worked:** open a terminal (see section 3.2) and type:
  ```
  node --version
  npm --version
  ```
  You should see two version numbers, for example `v22.11.0` and
  `10.9.0`. If you see "not recognized", restart the computer and try
  again.

### 2.2 Visual Studio Code (recommended)

- **What it is:** a free code editor.
- **Why you need it:** to open the project, edit files, and use its
  built-in terminal. (Technically optional — any terminal works — but
  this guide assumes VS Code.)
- **Download:** https://code.visualstudio.com — click "Download".
- **Recommended version:** the latest one.
- **Verify it worked:** open it. If it opens, it works.

### 2.3 A browser (you already have this)

- **Chrome or Edge** is best. The Voice Companion's *real* microphone
  input only works in Chrome or Edge. In Firefox or Safari the voice
  feature automatically switches to typed input instead — nothing
  breaks, you just type instead of speak.

### 2.4 Git (optional)

- **What it is:** version-control software.
- **Why:** only needed if you want to track changes or push the project
  to GitHub. The project runs fine without it.
- **Download:** https://git-scm.com/downloads
- **Verify:** `git --version` in a terminal.

---

## 3. First-Time Setup

### 3.1 Open the project in VS Code

1. Open VS Code.
2. Click **File → Open Folder…**
3. Select the `comnyang-clone` folder (the one that contains
   `package.json`) and click "Select Folder".
4. If VS Code asks "Do you trust the authors?", click **Yes, I trust**.

**Important:** open the `comnyang-clone` folder itself, not the folder
above it and not a folder inside it. You know it is right when you can
see `package.json` in the file list on the left.

### 3.2 Open the terminal

In VS Code press **Ctrl + `** (the backtick key, under Esc), or use the
menu **Terminal → New Terminal**. A panel opens at the bottom. It is
already inside the project folder — you do not need to `cd` anywhere.

Any terminal type works (PowerShell, Command Prompt, Git Bash).

### 3.3 Install the dependencies

Type this and press Enter:

```
npm install
```

- **What it does:** reads `package.json` and downloads every package
  the project needs into a new `node_modules` folder.
- **How long:** 1–3 minutes on a normal connection.
- **Expected output:** lines of progress, then something like
  `added 380 packages in 90s`. Warnings in yellow are normal and safe
  to ignore. Only red `ERR!` lines are a problem (see Troubleshooting).

### 3.4 Create your environment file (optional but recommended)

```
copy .env.example .env.local
```

(on Mac/Linux/Git Bash: `cp .env.example .env.local`)

- **What it does:** makes your personal settings file from the template.
- You do **not** need to put anything in it yet. The project runs fully
  in mock mode with the file empty or even missing.

### 3.5 Start the project

```
npm run dev
```

- **What it does:** starts the development server.
- **Expected output:**
  ```
  ▲ Next.js 15.3.4
  - Local:    http://localhost:3000
  - Network:  http://192.168.x.x:3000
  ✓ Ready in 2.3s
  ```
- Now open **http://localhost:3000** in your browser. You should see
  the dark pixel-cat landing page. **Setup is done.**

---

## 4. Environment Variables

Environment variables are settings you give the app without changing
code. They live in the file **`.env.local`** in the project root (the
same folder as `package.json`). This is the ONLY place to paste keys.

The template `.env.example` already exists in the project and lists all
of them with comments. Here is what each one means:

| Variable | Required? | What it does | Where you get it |
| --- | --- | --- | --- |
| `ANTHROPIC_API_KEY` | Optional | Turns on real Claude AI replies | platform.claude.com (see section 5) |
| `ANTHROPIC_MODEL` | Optional | Choose which Claude model (default: `claude-opus-4-8`) | You just type it |
| `OPENAI_API_KEY` | Optional | Turns on real OpenAI replies | platform.openai.com |
| `OPENAI_MODEL` | Optional | Which OpenAI model (default: `gpt-4o-mini`) | You just type it |
| `OPENAI_BASE_URL` | Optional | Points the OpenAI adapter at OpenRouter or a local model server | The service's docs |
| `GOOGLE_API_KEY` (or `GEMINI_API_KEY`) | Optional | Turns on real Google Gemini replies | aistudio.google.com |
| `GOOGLE_MODEL` | Optional | Which Gemini model (default: `gemini-2.0-flash`) | You just type it |
| `AI_DEFAULT_PROVIDER` | Optional | Which provider answers by default (`anthropic`, `openai`, `google`, `mock`) | You just type it |
| `AI_SYSTEM_PROMPT` | Optional | Rewrites the cat's personality prompt | You write it |
| `AI_MAX_TOKENS` | Optional | Longest allowed reply (default 1024) | You just type it |
| `AI_MOCK_SIMULATE_ERRORS` | Optional | `true` makes the mock provider fail sometimes, to demo the error/retry screens | You just type it |
| `NEXT_PUBLIC_AGENT_WS_URL` | Optional | Connects the `/companion` agent panel to a real WebSocket feed | You build/host the feed |
| `NEXT_PUBLIC_PET_WS_URL` | Optional | Connects the pet to real dev events (builds, git, tokens) | You build/host the feed (recipes in `docs/COMPANION_PET.md`) |
| `NEXT_PUBLIC_SITE_URL` | Optional | Your public website address (used for SEO files) | Your own domain |

**Rules to remember:**

1. Every variable is optional. With none of them set, everything runs in
   mock mode.
2. After changing `.env.local`, **stop and restart** the dev server
   (section 7) — it only reads the file at startup.
3. Variables starting with `NEXT_PUBLIC_` are baked in at build time —
   for production you must set them *before* `npm run build`.
4. Never commit or share `.env.local`. It is already gitignored.

Full details also live in `ENVIRONMENT.md`.

---

## 5. API Setup

The project uses **no analytics, no notification service, and no speech
API accounts**. Speech uses your browser's built-in engines (free, no
key). The only external APIs are the optional AI providers below.

For each provider: paste the key into `.env.local`, save, restart the
dev server. The provider then shows as **LIVE** in the picker on
`/companion` and answers voice conversations on `/pet`.

### 5.1 Anthropic (Claude)

- **Why:** the best-quality companion replies; the default live provider.
- **Account:** go to https://platform.claude.com → sign up → add billing
  if required.
- **Get the key:** dashboard → API Keys → Create Key → copy the value
  starting with `sk-ant-`.
- **Paste:** `ANTHROPIC_API_KEY=sk-ant-...` in `.env.local`.
- **Works without it?** Yes — the mock cat answers instead.
- **Mock exists?** Yes, automatic.
- **Cost:** pay-per-use; a short cat chat costs a fraction of a cent.

### 5.2 OpenAI

- **Why:** alternative provider.
- **Account:** https://platform.openai.com → sign up → billing.
- **Get the key:** API Keys → Create new secret key (`sk-...`).
- **Paste:** `OPENAI_API_KEY=sk-...`
- **Works without it?** Yes. **Mock exists?** Yes.

### 5.3 Google Gemini

- **Why:** alternative provider with a generous free tier.
- **Account:** https://aistudio.google.com → sign in with Google →
  "Get API key".
- **Paste:** `GOOGLE_API_KEY=AIza...`
- **Works without it?** Yes. **Mock exists?** Yes.
- **Free tier:** yes — rate-limited free requests, good for testing.

### 5.4 OpenRouter (many models with one key)

- **Account:** https://openrouter.ai → sign up → Keys.
- **Paste (two lines):**
  ```
  OPENAI_API_KEY=sk-or-...
  OPENAI_BASE_URL=https://openrouter.ai/api/v1
  ```
  and optionally `OPENAI_MODEL=anthropic/claude-3.5-haiku` (any model
  id from their list).
- **Works without it?** Yes.

### 5.5 Local models (Ollama — free, no account, offline)

- **Install:** https://ollama.com → download → then in a terminal:
  `ollama pull llama3.2`
- **Paste:**
  ```
  OPENAI_API_KEY=local
  OPENAI_BASE_URL=http://localhost:11434/v1
  OPENAI_MODEL=llama3.2
  ```
- **Works without it?** Yes. Completely free and private when used.

---

## 6. Permissions

The app is a website, so it only ever asks for **browser** permissions.
It never touches your filesystem, never sends notifications, and needs
no desktop or admin permissions to run.

### 6.1 Microphone (optional)

- **Used by:** the Voice Companion on `/pet` (real speech input and the
  live waveform).
- **When asked:** the first time you click the 🎤 button, Chrome/Edge
  shows "localhost wants to use your microphone" — click **Allow**.
- **If you block it:** nothing breaks. The pet switches to a
  "type what you'd say" box automatically.
- **To un-block later:** click the padlock/tune icon left of the address
  bar → Site settings → Microphone → Allow → reload the page.
- **Rule to know:** browsers only allow microphones on `localhost` or
  HTTPS pages. That is why the mic works on your PC but not on a phone
  using the `http://192.168...` address.

### 6.2 Local storage (automatic)

- **Used by:** settings, companion memory, language choice.
- Nothing to enable — browsers allow it by default. In private/incognito
  windows it may reset when you close the tab; that is normal.

### 6.3 One Windows-only note (for phone preview)

If you want to open the site from your phone, Windows Firewall must
allow port 3000 on a Private network. See Troubleshooting item 8.7.

---

## 7. Running the Project

All commands are typed in the VS Code terminal, inside the project folder.

### Start development mode (daily use)

```
npm run dev
```
Expected: `✓ Ready in ...s` and the site at http://localhost:3000.
Changes you make to code appear instantly (hot reload).

### Stop the server

Click inside the terminal and press **Ctrl + C**. (On Windows it may ask
"Terminate batch job (Y/N)?" — type `Y` and Enter.)

### Restart the server

Stop it (Ctrl + C), then run `npm run dev` again. Do this every time you
change `.env.local`.

### Build for production

**First stop the dev server** (important — building while the dev server
runs corrupts its cache), then:

```
npm run build
```
Expected: a table of routes with ✓ marks and no red errors. Takes about
half a minute.

### Run the production build

```
npm start
```
Expected: `✓ Ready` and the site on http://localhost:3000, now running
the optimized build.

### Other useful commands

```
npm run typecheck   # checks the code for type errors
npm run lint        # checks code style — should print "No ESLint warnings or errors"
npm run format      # auto-formats the code
```

---

## 8. Troubleshooting

### 8.1 `node` or `npm` is "not recognized"
Node.js is not installed or the terminal is old. Install Node.js
(section 2.1), close VS Code completely, open it again, retry.

### 8.2 `npm install` fails with red ERR! lines
1. Check your internet connection.
2. Delete the `node_modules` folder and the file `package-lock.json`?
   — **No.** Keep `package-lock.json`. Only delete `node_modules`:
   close the dev server, delete `node_modules`, run `npm install` again.
3. If a company proxy/VPN blocks npm, disconnect it and retry.

### 8.3 "Port 3000 is already in use"
Another copy of the server is running.
- Easiest: restart the computer, or
- Find and stop it: `npx kill-port 3000`, or run the dev server on
  another port: `npm run dev -- -p 3001` and open http://localhost:3001.

### 8.4 Error mentions `MODULE_NOT_FOUND` and `.next`
The build cache is corrupted (usually from running `npm run build`
while `npm run dev` was running).
1. Stop the server (Ctrl + C).
2. Delete the `.next` folder.
3. `npm run dev` again. Fixed.

### 8.5 I added an API key but the provider still says "NO KEY"
1. The file must be called exactly `.env.local` and sit next to
   `package.json`.
2. No quotes needed: `ANTHROPIC_API_KEY=sk-ant-abc123`
3. The line must not start with `#` (that means "ignored").
4. Restart the dev server — keys are read only at startup.

### 8.6 The AI replies with an error / "rate limit"
Your key may be invalid, out of credit, or rate-limited. The app
auto-retries twice, then shows a RETRY button. Check the provider's
dashboard for billing/limits. Meanwhile the mock provider always works.

### 8.7 The phone cannot open the site (LAN preview)
1. Phone and PC must be on the **same Wi-Fi**.
2. Windows: Settings → Network & Internet → Wi-Fi → your network →
   set profile to **Private**.
3. In an **Administrator** PowerShell run:
   ```
   New-NetFirewallRule -DisplayName "Next.js dev server (port 3000)" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private
   ```
4. Open `http://<your-pc-ip>:3000` on the phone (the IP is printed by
   `npm run dev` as "Network").
5. Note: the microphone will NOT work on the phone over http — that is
   a browser security rule, not a bug. Typed input still works.

### 8.8 Microphone does not work on the PC
1. Use Chrome or Edge (Firefox/Safari do not support the speech API —
   the app falls back to typed input there on purpose).
2. Check the padlock icon → Microphone → Allow.
3. Check Windows: Settings → Privacy & security → Microphone →
   "Let apps access your microphone" is On.
4. Settings panel on `/pet` → VOICE → make sure "Speech recognition"
   is `webspeech` and the right microphone is selected.

### 8.9 The pet or animations look frozen
- Animations pause on purpose when the tab is hidden or off-screen.
- If you enabled "Force reduced motion" in the pet's settings (or your
  OS has reduced motion on), locomotion and particles are intentionally
  minimal. Turn it off in ⚙ → LOOK & MOTION.

### 8.10 Everything is broken and I want a fresh start
1. Stop the server.
2. Delete `node_modules` and `.next`.
3. `npm install`
4. `npm run dev`
This resets everything except your code and your `.env.local`.

---

## 9. Verification Checklist

Go through this after setup. Open http://localhost:3000.

**Landing page (`/`)**
- [ ] Dark pixel page loads with grid background and scanlines
- [ ] A cat walks around inside the hero window; it jumps when clicked
- [ ] Scrolling is smooth; a "BUY NOW" bar appears at the bottom after
      the hero and hides near the buy sections
- [ ] All 17 motion cards animate; dragging the "MOCHI DRAG" cat works;
      typing while the "KEYBOARD KNEADING" card is visible makes it knead
- [ ] The EN / 한국어 toggle switches the whole page language
- [ ] The LAUNCH price tag wobbles; the buy button pulses; clicking buy
      shows the demo notice

**Chat companion (`/companion`)**
- [ ] The provider panel lists Mock as LIVE-by-default ("MOCK") and the
      others as "NO KEY" (or LIVE if you added keys)
- [ ] Sending a message streams a reply word by word
- [ ] The cat thinks while waiting, kneads while streaming, hops when done
- [ ] The agent panel shows simulated agents changing status

**AI Companion Pet (`/pet`)**
- [ ] Cat is center stage; emotion name shows top-left; "SIMULATED" badge
- [ ] Within ~30 seconds: speech/thought bubbles appear, builds/tests
      happen, widgets update (tokens, latency chart, budget bar)
- [ ] XP bar fills; achievement toasts pop; level increases over time
- [ ] Leaving the mouse alone (default 3 min) makes it sleep; moving
      wakes it with a greeting
- [ ] ⚙ opens Settings; changing personality, fur, size, theme, bubbles
      applies instantly; reload the page — settings persisted

**Voice Companion (on `/pet`)**
- [ ] 🎤 button and "TAP TO TALK" indicator are visible under the cat
- [ ] Press **V** or click 🎤 → status becomes LISTENING with a waveform
- [ ] (Chrome/Edge + mic allowed) speaking shows your words live; the
      reply appears in the floating window and is spoken aloud
- [ ] (Any browser) the typed-input box works the same way
- [ ] Ask "how many tokens today?" → an instant table answers (tool)
- [ ] Say/type "my name is <name>" → later ask something; Settings →
      MEMORY shows your name was learned
- [ ] STOP interrupts speech immediately
- [ ] Code in replies shows highlighted, with a copy button

**Mock vs Live**
- [ ] With no keys: everything above works (mock mode)
- [ ] After adding a key + restart: the provider shows LIVE and replies
      change to real AI

**Production build**
- [ ] Stop dev → `npm run build` finishes with no errors → `npm start`
      serves the same site

---

## 10. Final Checklist — Zero to Working

1. Copy the `comnyang-clone` folder to the new computer.
2. Install Node.js LTS from https://nodejs.org (verify: `node --version`).
3. Install VS Code from https://code.visualstudio.com.
4. Open the `comnyang-clone` folder in VS Code (File → Open Folder).
5. Open the terminal (Ctrl + `).
6. Run `npm install` and wait for it to finish.
7. Run `copy .env.example .env.local` (optional now, needed later for keys).
8. Run `npm run dev`.
9. Open http://localhost:3000 — the site is running in full mock mode.
10. Visit `/pet`, click 🎤, click **Allow** on the microphone prompt
    (Chrome/Edge) — the Voice Companion is live.
11. (Optional) Get an AI key (section 5), paste it into `.env.local`,
    restart the dev server — real AI replies are on.
12. Run the Verification Checklist (section 9).

**What is NOT configured out of the box (and how to get it):**
- Real AI replies → need one provider key (section 5). Mock works meanwhile.
- Real microphone input → needs Chrome/Edge + clicking Allow (section 6.1).
- Real dev-event feeds for the pet/agents → need a WebSocket feed you
  host yourself; recipes in `docs/COMPANION_PET.md`. Simulators work meanwhile.
- Phone preview → firewall rule (section 8.7). Optional.
- Checkout/download buttons on the landing page are demo stubs by design.

That's everything. If all boxes in section 9 tick, the project is fully
working.

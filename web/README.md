# GembyAV portal

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS 4 · TypeScript.
No auth library, no ORM, no UI kit — sessions, hashing and the rate limiter are
hand-rolled on `node:crypto` / Web Crypto so the deploy has **zero required
configuration**.

> Product overview, detection pipeline and the full Vercel guide live in the
> [repository README](../README.md). This file is the working-notes version.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

`predev` / `prebuild` run `scripts/prepare-assets.mjs`, which stages the
installer into `public/downloads/` and writes both `manifest.json` and
`lib/generated/asset-manifest.ts`. Nothing is committed twice — `public/downloads/*`
is git-ignored, and the generated manifest is regenerated on every build.

```bash
npm run build      # production build
npm start          # serve it
npm run typecheck  # tsc --noEmit
```

## Layout

```
proxy.ts                    Next 16 middleware — guards app pages + the .exe
app/
  page.tsx                  landing
  signin/ signup/           auth screens (shared AuthShell + AuthForm)
  dashboard/ download/ chat/  signed-in area
  api/auth/{signup,signin,signout,session}/route.ts
  api/chat/route.ts         assistant endpoint (401 without a session)
  api/status/route.ts       public build facts
  robots.ts sitemap.ts not-found.tsx
components/
  chat-widget.tsx           floating assistant, on every page
  chat-thread.tsx           shared thread UI (widget + full page)
  chat-page-shell.tsx       /chat layout with topic browser
  markdown.tsx              tiny escaping Markdown renderer
  hero-scan.tsx             scripted scan replay for the hero
  download-panel.tsx        gated download card + checksum
  auth-form.tsx auth-shell.tsx session-provider.tsx nav.tsx footer.tsx ui.tsx
lib/
  auth/token.ts             Web-Crypto HMAC sessions (Edge + Node safe)
  auth/password.ts          scrypt N=16384 r=8 p=1
  auth/session.ts           cookies + signed account mirrors
  store/{upstash,file,memory,index}.ts   pluggable user store
  bot/knowledge.ts          ~30 articles written from gemby_av.py
  bot/retrieve.ts           scoring, synonyms, multi-turn topic tracking
  bot/hf.ts                 Hugging Face provider (3 endpoint shapes)
  bot/local.ts              offline answerer + refusal
  bot/safety.ts             offensive-request guard
  bot/index.ts              orchestrator: model → knowledge base
  config.ts                 single source of product truth
  manifest.ts               installer metadata
  ratelimit.ts              sliding-window abuse damping
```

## Notes worth knowing

**`proxy.ts`, not `middleware.ts`.** Next.js 16 renamed middleware to proxy; the
file exports `proxy(request)` and the same `config.matcher`. It runs *before*
the filesystem, which is what makes it possible to put a sign-in wall in front
of a static 13 MB binary. The matcher is deliberately narrow — never `_next/*`.

**Tokens must verify on the Edge.** `lib/auth/token.ts` uses only Web Crypto
(`crypto.subtle`, `btoa`/`atob`), so the identical implementation runs in the
proxy and in Node route handlers. Do not import `node:crypto` there.

**scrypt `maxmem`.** OpenSSL refuses to derive unless `maxmem` is strictly above
`128 * N * r * p`. `password.ts` computes it with headroom; too-tight values
fail with `ERR_CRYPTO_INVALID_SCRYPT_PARAMS`.

**Chat history lives in the browser** (`localStorage`, keyed by user id, capped
at 60 messages). The server is stateless per request — nothing about a
conversation is persisted server-side.

**The client never sets `role: "system"`.** `api/chat` strips anything that is
not `user`/`assistant`, caps turns at 24 and message length at 4000 chars.

**Markdown is rendered, not `dangerouslySetInnerHTML`.** `components/markdown.tsx`
implements only the subset the answers use, and every string goes through
React's escaping, so model output cannot inject markup.

## Enabling the chat model

```bash
HF_TOKEN=hf_xxx                       # router.huggingface.co / api-inference
GEMBY_CHAT_MODEL=Hwiiiiiiii/Gemby-2-agent   # already the default
# or point at your own OpenAI-compatible server:
HF_ENDPOINT_URL=https://your-endpoint/v1/chat/completions
```

Failures are logged as `[bot] <url> -> …` and fall through to the knowledge
base, so a bad token degrades rather than breaks. `GET /api/status` reports
`chat.providerEnabled` if you want to confirm which path is live.

## Enabling durable accounts

```bash
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AY...
AUTH_SECRET=$(openssl rand -base64 48)
```

Keys are `gembyav:user:email:<email>` and `gembyav:user:id:<id>`. The store is
probed once per instance and falls back on failure, so a bad token will not take
sign-in down.

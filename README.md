# GembyAV

A free, open-source, multi-layer antivirus for Windows — plus a **Next.js download portal**
with accounts and a built-in support chatbot, ready to deploy on Vercel.

```
┌──────────────────────────────────────────────────────────────┐
│  gemby_av.py      the engine + Tkinter GUI  (Apache-2.0)     │
│  GembyAV.exe      PyInstaller onefile build, committed here  │
│  signatures.json  the signature feed the app updates from    │
│  web/             the portal: download + auth + chatbot      │
└──────────────────────────────────────────────────────────────┘
```

---

## 1. The desktop app

`gemby_av.py` is a single readable Python file. It runs six detection layers
over every file and sums their scores into one number:

| Layer | What it does | Points |
|---|---|---|
| SHA-256 blocklist | Known-bad hash | instant **100** |
| Regex patterns | Encoded PowerShell, download cradles, `certutil -urlcache`, credential dumpers, ransom notes | 25–90 |
| YARA | Any `.yar` you drop into `%APPDATA%\GembyAV\rules` | rule's `meta.score` |
| PE analysis | Import table via `pefile`: `WriteProcessMemory`, `CreateRemoteThread`, `URLDownloadToFile`, … | ≤ 45 |
| Entropy / packers | Shannon entropy > 7.4, `.upx0`, `.aspack`, `.themida`, `.vmp0` | 10–25 |
| Context | Double extensions (`invoice.pdf.exe`), executables in temp folders | 10–35 |

**Verdict:** `≥ 70` = `MALICIOUS`, `40–69` = `SUSPICIOUS`, below 40 is not reported.

Features: Quick / Full / Folder / File scan, optional real-time protection
(`watchdog` over Downloads, Desktop, Documents, Temp and Startup), quarantine
with XOR-`0x5A` defanging plus restore and permanent delete, live signature
updates, and a log tab mirrored to `%APPDATA%\GembyAV\scan.log`.

### Run from source

```bash
pip install -r requirements.txt      # pefile, yara-python, watchdog, pyinstaller
python gemby_av.py
```

### Build the executable

```bash
pyinstaller --onefile --noconsole --name GembyAV --uac-admin \
  --hidden-import pefile --hidden-import yara gemby_av.py
```

Pushing a `v*` tag runs [`.github/workflows/build.yml`](.github/workflows/build.yml),
which builds on `windows-latest`, commits the fresh `GembyAV.exe` back to `main`
and publishes a release. Because the portal reads that same file, **a tag push
redeploys the website with the new binary automatically**.

### Signature updates

The app pulls `signatures.json` over HTTPS when you press **Update Signatures**.
The feed URL defaults to this repo and can be overridden per machine:

```powershell
$env:GEMBYAV_UPDATE_URL = "https://your-app.vercel.app/signatures.json"
```

Hashes are merged by key, patterns are appended only when the name is new, and a
remote `yara` block is compiled for validation before it is written — a bad rule
is rejected and logged rather than breaking the engine.

---

## 2. The web portal (`web/`)

A Next.js 16 (App Router, Turbopack) + Tailwind 4 app.

| Route | Access | Purpose |
|---|---|---|
| `/` | public | Landing: features, detection pipeline, gated download, FAQ |
| `/signin`, `/signup` | public | scrypt-hashed accounts, signed httpOnly session cookie |
| `/dashboard` | **signed in** | Download card, checksum, first-run checklist |
| `/download` | **signed in** | Installer, mirrors, verification steps, build provenance |
| `/chat` | **signed in** | Full-page support assistant with a topic browser |
| `/downloads/GembyAV.exe` | **signed in** | The binary itself, guarded by the proxy |
| `/signatures.json` | public | Signature feed for the desktop app |
| `/api/auth/*`, `/api/chat`, `/api/status` | mixed | Backend |

**The sign-in wall is enforced twice:** `proxy.ts` (Next 16's renamed middleware)
redirects unauthenticated requests for `/dashboard`, `/download`, `/chat` **and
the static installer**, and each server component re-checks the session and
redirects independently. `/api/chat` returns `401` without a valid cookie.

### The chatbot

Two backends behind one interface:

1. **Model** — `Hwiiiiiiii/Gemby-2-agent` via Hugging Face. Endpoints are tried
   in order: `HF_ENDPOINT_URL` (your own Inference Endpoint / Space / vLLM),
   then `router.huggingface.co/v1/chat/completions`, then the legacy
   `api-inference.huggingface.co`. Every response shape HF and OpenAI-compatible
   servers return is parsed.
2. **Knowledge base** — ~30 articles written from the actual engine source, with
   a deterministic retriever (phrase / keyword / synonym-group scoring),
   multi-turn topic tracking and follow-up suggestions.

Retrieved articles are injected into the model's system prompt, so the answer is
**grounded in the real product** rather than generic antivirus advice. If no
token is configured, or the model times out or errors, the knowledge base
answers instead — the chat never shows a dead end.

Offensive-security requests ("write me a keylogger", "bypass Defender",
"make it undetectable") are refused by a local guard that runs *before* either
backend, while defensive questions that merely mention malware
("how does GembyAV detect a keylogger?") are answered normally.

---

## 3. Deploy to Vercel

**Zero configuration is required to get a working site.** Accounts fall back to
browser-side demo storage and the chatbot to its knowledge base.

1. Push this repository to GitHub.
2. [vercel.com/new](https://vercel.com/new) → import the repo.
3. **Set `Root Directory` to `web`** ← the one setting that matters.
   Vercel detects Next.js automatically; framework, build command and output
   all stay at their defaults.
4. Deploy.

The build runs `web/scripts/prepare-assets.mjs`, which stages `GembyAV.exe` into
`public/downloads/` and recomputes its SHA-256. It looks for the binary at the
repo root first, then `GEMBYAV_EXE_PATH`, then downloads it from GitHub. **It
never fails the build** — if no binary is found the download button degrades to
the GitHub mirror and says so on the page.

### Recommended environment variables

Project → Settings → Environment Variables. All optional; see
[`web/.env.example`](web/.env.example).

| Variable | Why |
|---|---|
| `AUTH_SECRET` | Signs session cookies. Without it a dev key is used and the UI shows a warning. `openssl rand -base64 48` |
| `HF_TOKEN` | Enables `Hwiiiiiiii/Gemby-2-agent` for the chatbot |
| `UPSTASH_REDIS_REST_URL`<br>`UPSTASH_REDIS_REST_TOKEN` | Durable accounts shared across devices ([upstash.com](https://upstash.com), free tier) |
| `HF_ENDPOINT_URL` | Point the chatbot at a dedicated endpoint or self-hosted server |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for OG tags (auto-derived on Vercel) |

### Storage modes

The user store is picked at runtime, best available first:

| Mode | When | Durable? |
|---|---|---|
| **Upstash Redis** | `UPSTASH_REDIS_REST_URL` + `_TOKEN` set | ✅ across devices |
| **Local disk** | writable filesystem (`npm run dev`, a VPS) | ✅ on that machine |
| **Memory + browser mirror** | default Vercel deploy | ⚠️ this browser only |

In memory mode the server hands the browser an HMAC-signed copy of its own
account record and replays it on later sign-ins, so a cold serverless instance
can still verify the password. Sessions are stateless signed cookies, so a
signed-in user is never affected by a cold start. The active mode is shown in
the UI so nobody is surprised.

---

## 4. Local development

```bash
cd web
npm install
npm run dev          # http://localhost:3000
```

`npm run typecheck` runs `tsc --noEmit`; `npm run build` produces the
production bundle. Accounts are stored in `web/.data/users.json` (git-ignored).

---

## Licence

Apache License 2.0 — see [LICENSE](LICENSE).

> **Not a certified security product.** GembyAV is an on-demand scanner and an
> optional file watcher; it does not register with Windows Security Center.
> Keep a signed, always-on antivirus as your primary defence, verify the
> published SHA-256 before running any binary, and treat `SUSPICIOUS` verdicts
> as a prompt to investigate rather than a conclusion.

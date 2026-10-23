/**
 * GembyAV knowledge base.
 *
 * Every fact here is taken from the actual engine source (gemby_av.py) and the
 * build workflow, so the assistant cannot drift away from what the product
 * really does. It is used two ways:
 *   1. as retrieval context injected into the chat model's prompt
 *   2. as the standalone answer source when no model/token is available
 */

export type Group =
  | "Getting started"
  | "Scanning"
  | "Threats & quarantine"
  | "Real-time protection"
  | "Signatures & YARA"
  | "Troubleshooting"
  | "Portal & account";

export interface Article {
  id: string;
  title: string;
  group: Group;
  /** high-weight multi-word phrases */
  phrases: string[];
  /** single tokens */
  keywords: string[];
  answer: string;
  followUps?: string[];
}

export const GROUPS: Group[] = [
  "Getting started",
  "Scanning",
  "Threats & quarantine",
  "Real-time protection",
  "Signatures & YARA",
  "Troubleshooting",
  "Portal & account",
];

export const ARTICLES: Article[] = [
  /* ------------------------------------------------------- getting started */
  {
    id: "overview",
    title: "What is GembyAV?",
    group: "Getting started",
    phrases: ["what is gembyav", "what is gemby av", "about gembyav", "tell me about", "what does it do", "overview"],
    keywords: ["gembyav", "gemby", "antivirus", "overview", "about", "product", "what"],
    answer: `**GembyAV** is a free, open-source antivirus for Windows 10/11, written in Python with a Tkinter UI and shipped as a single \`.exe\`.

Instead of relying on one technique, it runs **six detection layers** and adds their scores together:

1. **SHA-256 hash blocklist** — an instant match scores 100 and is verdicted \`MALICIOUS\`.
2. **Behaviour regex patterns** — encoded PowerShell, download cradles, \`certutil -urlcache\`, credential dumpers, ransom notes.
3. **YARA rules** — anything you drop into \`%APPDATA%\\GembyAV\\rules\`.
4. **PE static analysis** — import-table inspection via \`pefile\` for injection/hooking/download APIs.
5. **Entropy & packer detection** — Shannon entropy above 7.4, or UPX/ASPack/Themida/VMProtect section names.
6. **Context clues** — double extensions like \`invoice.pdf.exe\`, executables living in temp folders.

The combined score decides the verdict: **≥ 70 = MALICIOUS**, **40–69 = SUSPICIOUS**, below 40 is silently ignored to keep noise down.

Everything is Apache-2.0 licensed — no accounts inside the app, no ads, no telemetry.`,
    followUps: ["How do I install it?", "How do I run a scan?", "Is it free?"],
  },
  {
    id: "install",
    title: "Downloading and installing",
    group: "Getting started",
    phrases: ["how do i install", "install gembyav", "download the exe", "where do i download", "get the installer", "setup"],
    keywords: ["install", "download", "setup", "exe", "installer", "run", "get"],
    answer: `**Getting the installer**

1. Sign in (or create a free account) on this portal — downloads are gated behind sign-in.
2. Open **Download** in the nav, or the download card on your dashboard.
3. Press **Download GembyAV.exe**. The file is served straight from the CDN, so it is quick.
4. *(Recommended)* Compare the SHA-256 shown on the download page with the file you received:
\`\`\`powershell
Get-FileHash .\\GembyAV.exe -Algorithm SHA256
\`\`\`

**Running it**

There is no installer — \`.exe\` is a self-contained PyInstaller onefile build. Just double-click it.

Windows will show a **UAC prompt** because the binary requests administrator privileges (\`--uac-admin\`). That is intentional: it lets the scanner read protected folders and quarantine files anywhere on disk.

On first launch it creates its working folder at \`%APPDATA%\\GembyAV\` containing \`signatures.json\`, \`scan.log\`, a \`quarantine\\\` folder and a \`rules\\\` folder.`,
    followUps: ["Windows SmartScreen blocked it", "What are the system requirements?", "How do I verify the checksum?"],
  },
  {
    id: "requirements",
    title: "System requirements",
    group: "Getting started",
    phrases: ["system requirements", "what are the requirements", "does it work on windows 7", "minimum specs", "supported os"],
    keywords: ["requirements", "specs", "windows", "os", "support", "version", "minimum"],
    answer: `**Requirements**

| | |
|---|---|
| **OS** | Windows 10 or 11, 64-bit |
| **Runtime** | None — Python is bundled into the \`.exe\` |
| **Privileges** | Administrator (UAC prompt at launch) |
| **Disk** | ~40 MB free for quarantine, logs and rules |
| **Network** | Optional — only needed for signature updates |
| **Installer size** | About 13 MB |

Optional Python packages add extra capability when you build from source:

- \`pefile\` — PE import-table analysis (strongly recommended)
- \`yara-python\` — YARA rule matching
- \`watchdog\` — required for **real-time protection**; without it the checkbox shows an error

The shipped \`.exe\` already bundles all three.`,
    followUps: ["Does it run on macOS or Linux?", "How do I build from source?"],
  },
  {
    id: "free",
    title: "Pricing and licence",
    group: "Getting started",
    phrases: ["is it free", "how much does it cost", "pricing", "licence", "license", "open source", "pay"],
    keywords: ["free", "cost", "price", "pricing", "license", "licence", "opensource", "pay", "money"],
    answer: `**Completely free.** GembyAV is released under the **Apache License 2.0**.

That means:

- No paid tiers, no trial countdown, no feature gating
- No advertising, no bundled offers, no telemetry
- You can read, modify and redistribute the source
- Commercial use is permitted

The engine source lives at \`gemby_av.py\` in the repository and the compiled \`GembyAV.exe\` is committed alongside it, rebuilt by a GitHub Action (\`pyinstaller --onefile --noconsole --uac-admin\`) whenever a \`v*\` tag is pushed.

An account on *this portal* is only used to gate the download and to keep your chat history — it is not a product licence.`,
    followUps: ["Where is the source code?", "How do I build from source?"],
  },
  {
    id: "platforms",
    title: "macOS and Linux support",
    group: "Getting started",
    phrases: ["macos", "mac os", "linux", "ubuntu", "other platforms", "not windows", "does it work on mac", "does it work on linux", "work on mac", "run on mac", "run on linux", "is there a mac version", "non windows"],
    keywords: ["mac", "macos", "linux", "ubuntu", "debian", "platform", "cross"],
    answer: `The **shipped binary is Windows-only** — \`GembyAV.exe\` is a PE executable produced by PyInstaller on \`windows-latest\`.

The **source is cross-platform** though. On macOS or Linux you can run it directly:

\`\`\`bash
git clone https://github.com/Ghanimsokaki/gemby-software.git
cd gemby-software
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python gemby_av.py
\`\`\`

Notes when running from source off Windows:

- You need a Tkinter-enabled Python (\`sudo apt install python-tk\` on Debian/Ubuntu)
- A **Quick Scan** targets your home \`Downloads\`, \`Desktop\`, \`Documents\` plus \`/tmp\`
- A **Full Scan** walks your home directory instead of drive letters
- \`yara-python\` may need \`libyara-dev\` and a C toolchain to build`,
    followUps: ["What are the system requirements?", "How do I build from source?"],
  },
  {
    id: "source-build",
    title: "Building from source",
    group: "Getting started",
    phrases: ["build from source", "compile it", "pyinstaller", "make my own exe", "rebuild"],
    keywords: ["build", "compile", "source", "pyinstaller", "python", "rebuild", "exe"],
    answer: `**Run from source**

\`\`\`bash
pip install -r requirements.txt   # pefile, yara-python, watchdog, pyinstaller
python gemby_av.py
\`\`\`

**Build a one-file .exe**

\`\`\`bash
pyinstaller --onefile --noconsole --name GembyAV --uac-admin \\
  --hidden-import pefile --hidden-import yara gemby_av.py
\`\`\`

The result lands in \`dist/GembyAV.exe\`. Flags explained:

- \`--onefile\` — single self-contained binary
- \`--noconsole\` — no console window behind the GUI
- \`--uac-admin\` — embeds a \`requireAdministrator\` manifest
- \`--hidden-import\` — \`pefile\` and \`yara\` are imported inside \`try/except\`, so PyInstaller cannot see them statically

**Automatic rebuilds**: pushing a \`v*\` tag triggers \`.github/workflows/build.yml\`, which builds on \`windows-latest\`, commits the fresh \`GembyAV.exe\` back to \`main\` and publishes a release.`,
    followUps: ["Where is the source code?", "How do signature updates work?"],
  },

  /* -------------------------------------------------------------- scanning */
  {
    id: "scan",
    title: "How to run a scan",
    group: "Scanning",
    phrases: ["how do i scan", "run a scan", "quick scan", "full scan", "scan a folder", "scan a file", "start scanning"],
    keywords: ["scan", "scanning", "quick", "full", "folder", "file", "check"],
    answer: `The toolbar has everything:

| Button | What it covers |
|---|---|
| **Quick Scan** | \`Downloads\`, \`Desktop\`, \`Documents\`, \`%TEMP%\` and the Startup folder |
| **Full Scan** | Every existing drive letter from \`C:\` to \`H:\` |
| **Scan Folder…** | A folder you pick in the dialog (recursive) |
| **Scan File…** | One specific file |
| **Stop** | Cancels the running scan at the next file boundary |
| **Update Signatures** | Pulls the latest hashes/patterns/YARA from the update URL |

Scanning runs on a **background thread** and reports progress into the status bar every 25 files, so the UI never freezes. Results stream into the **Threats** tab as they are found.

**What gets skipped**

- Files of **0 bytes** or larger than **200 MB**
- \`Windows\`, \`WinSxS\`, \`$Recycle.Bin\`, \`System Volume Information\`, \`node_modules\` and \`.git\` directories
- GembyAV's own data folder

Only the **first 8 MB** of each file is pattern-matched (the SHA-256 still covers the whole file), which keeps large archives fast.`,
    followUps: ["How long does a full scan take?", "What do the verdicts mean?", "Enable real-time protection"],
  },
  {
    id: "verdicts",
    title: "Verdicts and scoring",
    group: "Scanning",
    phrases: ["what does suspicious mean", "what does malicious mean", "verdict", "score", "threshold", "how is it scored", "what do the numbers mean", "what does the score mean", "is this bad", "should i worry", "is that a high score"],
    keywords: ["verdict", "score", "scores", "suspicious", "malicious", "threshold", "detection", "risk", "points", "numbers", "number", "bad", "high", "low", "dangerous", "worry"],
    answer: `Each file accumulates a **risk score from 0 to 100**:

| Score | Verdict | Meaning |
|---|---|---|
| **≥ 70** | \`MALICIOUS\` | Confident detection — quarantine recommended |
| **40–69** | \`SUSPICIOUS\` | Heuristic hit — worth a look, may be a false positive |
| **< 40** | *(no result)* | Dropped silently so the Threats list stays readable |

**Typical point values**

- Known-bad SHA-256 → immediate **100**
- \`Credential.Dumper\` (\`sekurlsa::logonpasswords\`, \`lsadump::sam\`) → **90**
- EICAR test file → **100**
- \`Generic Ransom Note\` / \`PS.DownloadCradle\` → **55**
- High entropy (> 7.4) → **25**
- Double extension disguise → **35**
- Suspicious imports → up to **45** (summed, capped)
- Packer section name → **15**
- Executable in a temp folder → **10**

The **Reasons** column in the Threats tab lists exactly which layers fired, so you can judge a \`SUSPICIOUS\` hit yourself.`,
    followUps: ["I think this is a false positive", "How do I quarantine a detection?", "Test it with EICAR"],
  },
  {
    id: "eicar",
    title: "Testing with EICAR",
    group: "Scanning",
    phrases: ["eicar", "test file", "test the antivirus", "does it detect eicar", "how do i test", "test that it works"],
    keywords: ["eicar", "test", "testing", "verify", "proof"],
    answer: `The industry-standard way to check any antivirus is the **EICAR test file** — a harmless string that every AV agrees to flag.

Create one yourself in Notepad and save it as \`eicar.com\`:

\`\`\`text
X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*
\`\`\`

Then run **Scan File…** on it, or drop it into your Downloads folder with real-time protection on.

GembyAV should report:

- **Verdict:** \`MALICIOUS\`
- **Score:** \`100\`
- **Reasons:** \`Pattern: EICAR-Test-File; YARA: EICAR_Test_File\`

⚠️ Your browser may refuse to download EICAR from the internet, and Windows Defender will also flag it — that is expected. Writing the file locally with Notepad is the reliable route.`,
    followUps: ["How do I run a scan?", "What do the verdicts mean?"],
  },

  /* ------------------------------------------------ threats and quarantine */
  {
    id: "quarantine",
    title: "Quarantine explained",
    group: "Threats & quarantine",
    phrases: ["quarantine", "where are quarantined files", "how does quarantine work", "isolated files"],
    keywords: ["quarantine", "quarantined", "isolate", "vault", "store"],
    answer: `When you quarantine something, GembyAV:

1. Generates a random id (\`uuid4().hex\`)
2. Reads the file and writes it to \`%APPDATA%\\GembyAV\\quarantine\\<id>.quar\` with **every byte XOR-ed against \`0x5A\`**
3. Writes \`<id>.json\` next to it holding the original path, verdict, reasons, SHA-256 and timestamp
4. **Deletes the original file**

The XOR step is the important part: the stored blob is not a valid executable, so nothing in the quarantine folder can ever be launched by accident, by another program, or by a careless double-click.

**Managing it** — open the **Quarantine** tab:

- **Restore** — XORs the bytes back and writes them to the recorded original path
- **Delete Permanently** — removes both the \`.quar\` and \`.json\` (asks for confirmation)
- **Refresh** — re-reads the folder from disk`,
    followUps: ["How do I restore a file?", "I think this is a false positive", "Where are the logs?"],
  },
  {
    id: "restore",
    title: "Restoring or deleting quarantined items",
    group: "Threats & quarantine",
    phrases: ["restore a file", "get my file back", "undo quarantine", "delete permanently", "unquarantine"],
    keywords: ["restore", "recover", "undo", "delete", "remove", "back"],
    answer: `**Restore**

1. Open the **Quarantine** tab
2. Select one or more rows (Ctrl/Shift-click for multi-select)
3. Press **Restore**

The file is decoded from its \`.quar\` blob and written back to the **exact original path** recorded in the metadata — parent folders are recreated if they were removed. The quarantine entries are then deleted.

⚠️ The restored file is *not* re-scanned or added to an allow-list, so a later scan will flag it again.

**Delete permanently**

Select the rows and press **Delete Permanently**, then confirm. This is unrecoverable.

**Manual inspection**

Everything is plain files, so you can look directly:

\`\`\`powershell
explorer $env:APPDATA\\GembyAV\\quarantine
type $env:APPDATA\\GembyAV\\quarantine\\<id>.json
\`\`\``,
    followUps: ["I think this is a false positive", "Quarantine explained", "Where are the logs?"],
  },
  {
    id: "false-positive",
    title: "Handling a false positive",
    group: "Threats & quarantine",
    phrases: ["false positive", "wrongly flagged", "flagged by mistake", "safe file detected", "ignore detection"],
    keywords: ["false", "positive", "mistake", "wrong", "safe", "ignore", "legit"],
    answer: `Heuristic scanners trade a little accuracy for coverage, so \`SUSPICIOUS\` hits on legitimate software are normal — especially on **packed** installers, which trip the entropy and packer-section rules by design.

**What to do**

1. Read the **Reasons** column. \`High entropy\` or \`Packer section: .upx0\` alone is weak evidence; \`Signature: <name>\` or \`Credential.Dumper\` is strong.
2. Check the **SHA-256** against the vendor's published hash.
3. If it is safe, select it in the Threats tab and press **Ignore Selected** — the row is dropped without quarantining.
4. If it was already quarantined, use **Quarantine → Restore**.

**Reduce repeat noise**

\`SUSPICIOUS\` (40–69) means heuristics only. \`MALICIOUS\` (≥ 70) means several layers agreed. If a file you trust keeps getting flagged, raise a GitHub issue with the Reasons list — the pattern scores are data in \`signatures.json\` and can be tuned.

There is no persistent allow-list yet; **Ignore Selected** is per-scan-session only.`,
    followUps: ["What do the verdicts mean?", "How do I report a bug?", "Restore a quarantined file"],
  },
  {
    id: "threats-actions",
    title: "The Threats tab",
    group: "Threats & quarantine",
    phrases: ["threats tab", "threat list", "what do i do with detections", "detection list"],
    keywords: ["threats", "threat", "detections", "list", "tab", "results"],
    answer: `The **Threats** tab is a table with four columns:

| Column | Contents |
|---|---|
| **Verdict** | \`MALICIOUS\` or \`SUSPICIOUS\` |
| **Score** | 0–100 risk score |
| **Path** | Full path of the flagged file |
| **Reason** | Every layer that fired, semicolon-separated |

Multi-select works with Ctrl-click and Shift-click. Buttons underneath:

- **Quarantine Selected** — defang and remove just the rows you picked
- **Quarantine All** — one click to clean the whole list
- **Ignore Selected** — dismiss without quarantining

Each detection is also appended to the **Log** tab and to \`%APPDATA%\\GembyAV\\scan.log\` with a timestamp, so you have an audit trail even after the window closes. Duplicate paths are de-duplicated — a file already in the list will not appear twice.`,
    followUps: ["Quarantine explained", "Where are the logs?", "What do the verdicts mean?"],
  },

  /* --------------------------------------------------- real-time protection */
  {
    id: "realtime",
    title: "Real-time protection",
    group: "Real-time protection",
    phrases: ["real-time protection", "real time", "realtime", "live protection", "background scanning", "watchdog"],
    keywords: ["realtime", "real", "time", "live", "background", "watchdog", "monitor", "protection"],
    answer: `Tick **Real-time protection** in the top-right of the toolbar.

Under the hood it starts a \`watchdog\` observer over the same folders a Quick Scan covers:

- \`Downloads\`, \`Desktop\`, \`Documents\`
- \`%TEMP%\`
- \`…\\Start Menu\\Programs\\Startup\` (Windows only)

Every **created** or **modified** file is scanned recursively. The watcher deliberately **sleeps 0.8 s** before scanning so the writer has finished flushing — otherwise a half-written file would be missed or mis-hashed.

If a threat is found it appears in the Threats tab exactly like a manual scan result. GembyAV's own data folder is excluded so quarantining never re-triggers itself.

**Requirements & limits**

- The \`watchdog\` package must be installed (it is bundled in the \`.exe\`). Without it, ticking the box shows an error and un-ticks itself.
- Untick the box to stop the observer thread.
- It watches **file events in those folders**, not kernel-level process behaviour. It complements Windows Defender; it does not replace it.`,
    followUps: ["Does it conflict with Defender?", "How do I run a scan?", "Startup folder and persistence"],
  },
  {
    id: "defender",
    title: "Running alongside Windows Defender",
    group: "Real-time protection",
    phrases: ["windows defender", "microsoft defender", "conflict", "two antiviruses", "other antivirus"],
    keywords: ["defender", "microsoft", "conflict", "together", "alongside", "other", "antivirus"],
    answer: `**Yes, they can run side by side safely.**

GembyAV deliberately does **not** register with the Windows Security Center as an antivirus provider. That means:

- Defender stays your primary, always-on antivirus
- Windows will not disable Defender or nag you about "two AV products"
- GembyAV behaves like an on-demand second-opinion scanner (similar to Malwarebytes Free)

The only overlap to be aware of: if both flag the same file, **Defender may delete or quarantine it first**, so GembyAV's scan can report the file as unreadable or already gone. That is harmless — the \`scan_file\` routine simply returns nothing when it cannot open the file.

Practical tip: if you want GembyAV to be the one that catches something, add its quarantine folder to Defender's exclusions so Defender does not touch items you intentionally stored there.`,
    followUps: ["Real-time protection", "Where is the quarantine folder?", "Is GembyAV free?"],
  },

  /* ------------------------------------------------- signatures and yara */
  {
    id: "signatures",
    title: "Signature updates",
    group: "Signatures & YARA",
    phrases: ["update signatures", "signature update", "how do updates work", "update definitions", "signatures.json"],
    keywords: ["signature", "signatures", "update", "updates", "definitions", "json", "refresh"],
    answer: `Press **Update Signatures** in the toolbar. The app fetches a JSON document over HTTPS and merges it into \`%APPDATA%\\GembyAV\\signatures.json\`.

**Merge rules**

- \`hashes\` — merged by key, so new SHA-256 entries are added and existing ones updated
- \`patterns\` — appended **only if the name is new** (existing regexes are never silently overwritten)
- \`version\` — taken from the remote document
- \`yara\` — compiled first as a validation step, and only written to \`rules\\remote.yar\` if compilation succeeds; a bad rule is logged and rejected

**Document shape**

\`\`\`json
{
  "version": 2,
  "hashes": { "<sha256hex>": "Threat.Name" },
  "patterns": [{ "name": "My.Rule", "regex": "…", "score": 60 }],
  "yara": "rule My_Rule { strings: $a = \\"…\\" condition: $a }"
}
\`\`\`

The update URL is \`UPDATE_URL\` near the top of \`gemby_av.py\`, and can be overridden with the \`GEMBYAV_UPDATE_URL\` environment variable. This portal publishes the current document at **\`/signatures.json\`**.

If \`UPDATE_URL\` is empty you will see *"UPDATE_URL is not set in gemby_av.py"* — set it and rebuild, or export the env var.`,
    followUps: ["Add my own YARA rules", "Where is signatures.json?", "Signatures fail to update"],
  },
  {
    id: "yara",
    title: "Adding your own YARA rules",
    group: "Signatures & YARA",
    phrases: ["yara", "custom rules", "add a rule", "write a rule", "yar file"],
    keywords: ["yara", "yar", "rule", "rules", "custom", "write", "add"],
    answer: `Drop any \`.yar\` or \`.yara\` file into:

\`\`\`text
%APPDATA%\\GembyAV\\rules
\`\`\`

On the next engine reload (app start, or pressing **Update Signatures**) every file in there is compiled and matched against the first 8 MB of each scanned file.

**Rule shape used by the engine**

\`\`\`yara
rule Suspicious_PowerShell_Download {
  meta:
    score = 55          // <- added to the risk score when this rule matches
  strings:
    $a = "DownloadString" nocase
    $b = "IEX" nocase
    $c = "-nop" nocase
  condition:
    $a and ($b or $c)
}
\`\`\`

The \`meta.score\` field is what feeds the risk score — if you omit it, the engine assumes **60**.

**Robustness**: each rule file is compiled individually before use. A file with a syntax error is **skipped and logged**, not fatal — the rest of your rules still load. A default \`default.yar\` (EICAR, PowerShell download, ransom note, PHP webshell) is written on first run.

Matching uses a 20-second timeout per file, so a pathological rule cannot hang a scan. Requires the \`yara-python\` package — bundled in the \`.exe\`.`,
    followUps: ["How do signature updates work?", "What do the verdicts mean?", "Where are the logs?"],
  },
  {
    id: "patterns",
    title: "Built-in detection patterns",
    group: "Signatures & YARA",
    phrases: ["built in patterns", "default signatures", "what does it detect", "detection list", "patterns", "does it detect", "does it catch", "detect ransomware", "detect keylogger", "detect trojan", "what does it catch"],
    keywords: ["patterns", "detect", "detections", "default", "builtin", "regex", "list"],
    answer: `Shipped regex patterns and their scores:

| Name | Catches | Score |
|---|---|---|
| \`EICAR-Test-File\` | The standard AV test string | 100 |
| \`Credential.Dumper\` | \`sekurlsa::logonpasswords\`, \`lsadump::sam\` | 90 |
| \`PS.DownloadCradle\` | \`iex\` / \`invoke-expression\` + \`downloadstring\`/\`webclient\` | 55 |
| \`Ransom.Note\` | "your files have been encrypted" | 55 |
| \`PS.EncodedCommand\` | \`powershell -enc <long base64>\` | 45 |
| \`Certutil.Download\` | \`certutil … -urlcache\` | 45 |
| \`Bitsadmin.Download\` | \`bitsadmin … /transfer\` | 40 |
| \`VBS.ShellExec\` | \`WScript.Shell\` + \`.run()\` / \`.exec()\` | 25 |

Bundled YARA rules add: **EICAR**, **Suspicious PowerShell Download**, **Generic Ransom Note** and **Webshell PHP Generic** (\`eval(base64_decode|gzinflate|str_rot13)\` with \`\$_POST\`/\`\$_REQUEST\`).

Suspicious PE imports watched for include \`VirtualAllocEx\`, \`WriteProcessMemory\`, \`CreateRemoteThread\`, \`NtUnmapViewOfSection\`, \`SetWindowsHookEx\`, \`GetAsyncKeyState\`, \`URLDownloadToFile\`, \`AdjustTokenPrivileges\` and \`IsDebuggerPresent\`.

All of it is editable — \`signatures.json\` is plain JSON.`,
    followUps: ["Add my own YARA rules", "What do the verdicts mean?", "How do signature updates work?"],
  },

  /* ------------------------------------------------------- troubleshooting */
  {
    id: "smartscreen",
    title: "Windows SmartScreen blocked the download",
    group: "Troubleshooting",
    phrases: ["smartscreen", "windows protected your pc", "blocked the download", "unknown publisher", "not signed", "code signing"],
    keywords: ["smartscreen", "blocked", "protected", "publisher", "signed", "signature", "warning", "unsafe"],
    answer: `This is the most common question, and it is **expected**.

GembyAV is **not code-signed** with a purchased Authenticode certificate — those cost money, and this project is free. SmartScreen therefore labels any unsigned, low-reputation binary as "unrecognised" regardless of whether it is safe.

**To run it**

1. On the SmartScreen dialog click **More info**
2. Click **Run anyway**

If the browser blocked the download entirely (Chrome/Edge "…isn't commonly downloaded"):

- Chrome → ⋮ menu → **Downloads** → keep the file
- Edge → ⋯ → **Downloads** → hover the file → **Keep** → **Keep anyway**

**Verify it yourself instead of trusting the dialog**

The download page shows the SHA-256 of the exact binary the build produced:

\`\`\`powershell
Get-FileHash .\\GembyAV.exe -Algorithm SHA256
\`\`\`

If your hash matches the one published here, you have the unmodified file from the repository. You can also inspect every line of the engine — it is a single Apache-2.0 licensed Python file.`,
    followUps: ["How do I verify the checksum?", "Is GembyAV free?", "How do I report a bug?"],
  },
  {
    id: "checksum",
    title: "Verifying the SHA-256 checksum",
    group: "Troubleshooting",
    phrases: ["verify checksum", "sha256", "check the hash", "is the file genuine", "verify download"],
    keywords: ["checksum", "hash", "sha256", "verify", "genuine", "integrity"],
    answer: `The download page publishes the **SHA-256** of the installer, computed from the exact binary at build time.

**Windows (PowerShell)**

\`\`\`powershell
Get-FileHash .\\GembyAV.exe -Algorithm SHA256 | Format-List
\`\`\`

**Windows (cmd, using certutil)**

\`\`\`cmd
certutil -hashfile GembyAV.exe SHA256
\`\`\`

**Linux / macOS**

\`\`\`bash
sha256sum GembyAV.exe      # Linux
shasum -a 256 GembyAV.exe  # macOS
\`\`\`

Compare the output with the value on the download page — case-insensitive, all 64 hex characters should match.

If it **does not** match, delete the file and re-download. A mismatch means the transfer was truncated or tampered with. If it reproduces, please open a GitHub issue.`,
    followUps: ["Windows SmartScreen blocked the download", "Downloading and installing"],
  },
  {
    id: "wont-start",
    title: "The app will not start",
    group: "Troubleshooting",
    phrases: ["won't start", "does not open", "crashes", "nothing happens", "app fails", "not launching"],
    keywords: ["start", "open", "launch", "crash", "freeze", "error", "fail", "nothing"],
    answer: `The \`.exe\` is built with \`--noconsole\`, so a startup crash shows **no error message** — it just silently does nothing. Work through these:

**1. Accept the UAC prompt.** The binary requests administrator rights. Clicking "No" aborts the launch with no dialog.

**2. Clear SmartScreen.** See *"Windows SmartScreen blocked the download"*.

**3. Run it from a terminal to see the traceback:**

\`\`\`powershell
cd $env:USERPROFILE\\Downloads
.\\GembyAV.exe
# no console output? try the interpreter route below
\`\`\`

**4. Run from source to get a real error** — this is the fastest way to diagnose:

\`\`\`powershell
git clone https://github.com/Ghanimsokaki/gemby-software.git
cd gemby-software
python -m pip install -r requirements.txt
python gemby_av.py
\`\`\`

**5. Check the log** at \`%APPDATA%\\GembyAV\\scan.log\` — if \`App started\` appears, the engine loaded and the problem is elsewhere.

**6. Missing Tkinter.** Running from source needs a Tk-enabled Python; the official installer from python.org includes it, some Microsoft Store builds do not.

Please open an issue with the traceback if you get one.`,
    followUps: ["Where are the logs?", "How do I report a bug?", "Build from source"],
  },
  {
    id: "logs",
    title: "Log and data file locations",
    group: "Troubleshooting",
    phrases: ["where are the logs", "log file", "data folder", "appdata", "scan.log", "config location"],
    keywords: ["log", "logs", "appdata", "data", "folder", "location", "path", "config"],
    answer: `Everything lives under one folder:

\`\`\`text
%APPDATA%\\GembyAV
\`\`\`

which expands to \`C:\\Users\\<you>\\AppData\\Roaming\\GembyAV\`. On non-Windows platforms it falls back to \`~/.config/GembyAV\`.

| Path | Purpose |
|---|---|
| \`scan.log\` | Timestamped audit trail — app start, every detection, quarantine, restore |
| \`signatures.json\` | Active hash blocklist + regex patterns + version |
| \`quarantine\\*.quar\` | Defanged file blobs (each byte XOR \`0x5A\`) |
| \`quarantine\\*.json\` | Metadata: original path, verdict, reasons, SHA-256, date |
| \`rules\\*.yar\` | Your YARA rules (\`default.yar\` is created on first run) |

Open it quickly:

\`\`\`powershell
explorer $env:APPDATA\\GembyAV
notepad $env:APPDATA\\GembyAV\\scan.log
\`\`\`

The in-app **Log** tab shows the same messages for the current session. Logging failures are swallowed silently, so a read-only \`APPDATA\` will not crash the app.`,
    followUps: ["Quarantine explained", "How do I uninstall?", "Add my own YARA rules"],
  },
  {
    id: "uninstall",
    title: "Uninstalling",
    group: "Troubleshooting",
    phrases: ["uninstall", "remove gembyav", "delete it", "clean up"],
    keywords: ["uninstall", "remove", "delete", "cleanup", "erase"],
    answer: `There is no installer, so there is nothing to uninstall — GembyAV writes no registry keys, no services and no drivers.

**To remove it completely:**

1. Close the app
2. Delete \`GembyAV.exe\` (usually in \`Downloads\`)
3. Delete its data folder:

\`\`\`powershell
Remove-Item -Recurse -Force $env:APPDATA\\GembyAV
\`\`\`

⚠️ That folder holds your **quarantine**. If something in there was a false positive, restore it *before* deleting, or the file is gone for good.

4. Untick **Real-time protection** first if you want a clean shutdown — otherwise the watchdog observer thread is simply killed with the process, which is harmless but less tidy.

Nothing else is left behind.`,
    followUps: ["Restore a quarantined file", "Where are the logs?"],
  },
  {
    id: "performance",
    title: "Scan speed and resource use",
    group: "Troubleshooting",
    phrases: ["how long does a scan take", "how long does a full scan take", "how long will it take", "scan takes too long", "slow scan", "performance", "cpu usage", "resource usage"],
    keywords: ["slow", "speed", "performance", "cpu", "memory", "long", "time", "fast"],
    answer: `Scans are I/O-bound and run on a background thread, so the UI stays responsive throughout.

**What keeps it fast**

- Only the **first 8 MB** of each file is pattern-matched and YARA-scanned (the full-file SHA-256 is still computed)
- Files over **200 MB** or of **0 bytes** are skipped outright
- \`Windows\`, \`WinSxS\`, \`$Recycle.Bin\`, \`System Volume Information\`, \`node_modules\` and \`.git\` are pruned from the walk — \`WinSxS\` and \`node_modules\` alone are usually the biggest time sinks
- PE parsing failures are caught per-file, never fatal
- YARA matching has a **20-second per-file timeout**

**What slows it down**

- A **Full Scan** enumerates every drive from \`C:\` to \`H:\` — expect it to be long on a large disk
- Encrypted or network-mounted volumes
- Very many small files (the SHA-256 open/read per file dominates)

Progress updates land in the status bar every **25 files**, so you can always see it moving. Use **Stop** to bail out — it cancels at the next file boundary and reports how many files it covered.

The real-time watcher adds a fixed **0.8 s** debounce per file event, which is negligible in practice.`,
    followUps: ["How do I run a scan?", "Real-time protection"],
  },
  {
    id: "report-bug",
    title: "Reporting a bug",
    group: "Troubleshooting",
    phrases: ["report a bug", "open an issue", "contact the developer", "feedback", "support email"],
    keywords: ["bug", "issue", "report", "contact", "feedback", "developer", "support"],
    answer: `Issues are tracked on GitHub:

**https://github.com/Ghanimsokaki/gemby-software/issues**

A useful report includes:

1. **GembyAV version** — shown in the window title, e.g. \`Gemby AV 1.0.0\`
2. **Windows version** — \`winver\`
3. **What you did** — which button, which folder
4. **What happened** vs what you expected
5. **The log tail**:

\`\`\`powershell
Get-Content $env:APPDATA\\GembyAV\\scan.log -Tail 50
\`\`\`

6. For a false positive: the **Reasons** column text and the file's SHA-256 (please do *not* attach the sample itself to a public issue)
7. For a crash: run from source with \`python gemby_av.py\` and paste the traceback

There is no telemetry, so nothing is reported automatically — everything you send is everything we get.`,
    followUps: ["Where are the logs?", "I think this is a false positive", "Build from source"],
  },

  /* ------------------------------------------------------ portal & account */
  {
    id: "portal-account",
    title: "Why do I need an account?",
    group: "Portal & account",
    phrases: ["why sign in", "create an account", "do i need an account", "sign up", "register", "login"],
    keywords: ["account", "signin", "signup", "register", "login", "password", "sign"],
    answer: `The **desktop app has no accounts at all** — the sign-in is only for *this download portal*.

An account gives you:

- The gated **download** of \`GembyAV.exe\`
- A persistent **chat history** with this support assistant
- Access to checksums and release metadata on your dashboard

**How it works**

- Passwords are hashed with **scrypt** (N=16384, r=8, p=1) and a unique 16-byte salt — never stored or logged in plain text
- Your session is a **signed httpOnly cookie** valid for 30 days
- The app itself never phones home: no telemetry, no licence checks, no activation

**Note on the default deployment**: with no database attached, accounts live in browser-side demo storage and work only in the browser you signed up with. Adding \`UPSTASH_REDIS_REST_URL\` + \`UPSTASH_REDIS_REST_TOKEN\` in Vercel switches to real, durable multi-device accounts — no code change needed.

You do **not** need an account to read the documentation or talk to the assistant about the product on the public pages.`,
    followUps: ["I forgot my password", "How do I download the exe?", "Is my data private?"],
  },
  {
    id: "forgot-password",
    title: "Forgotten password",
    group: "Portal & account",
    phrases: ["forgot my password", "reset password", "cannot sign in", "lost access", "change password"],
    keywords: ["forgot", "reset", "lost", "password", "recover", "change"],
    answer: `There is **no password reset flow yet** — the portal ships without an email provider, and there is no way to mail a reset link.

**What to do**

- Create a new account with a different email address. Your download access is identical; only the chat history from the old account is left behind.
- If the deployment uses browser-side demo storage, your account also lives in that browser's local storage — trying the same browser first often works.

**If you are running your own instance** and need a reset, accounts are plain JSON records:

- **Upstash Redis** → keys \`gembyav:user:email:<email>\` and \`gembyav:user:id:<id>\`
- **File store** → \`.data/users.json\` in the app directory

Delete the record and sign up again. Passwords are scrypt hashes, so they cannot be recovered or read by anyone — including whoever runs the site.`,
    followUps: ["Why do I need an account?", "Is my data private?"],
  },
  {
    id: "privacy",
    title: "Privacy and telemetry",
    group: "Portal & account",
    phrases: ["privacy", "telemetry", "what data do you collect", "is my data safe", "tracking", "gdpr"],
    keywords: ["privacy", "data", "telemetry", "tracking", "collect", "safe", "gdpr", "personal"],
    answer: `**The desktop app collects nothing.** There is no telemetry, no crash reporting, no licence check-in and no analytics. \`gemby_av.py\` makes exactly one kind of network call: fetching signature updates, and only when you press **Update Signatures**.

Everything the app writes stays on your machine under \`%APPDATA%\\GembyAV\`:

- \`scan.log\` — local audit trail of scans and quarantine actions
- \`signatures.json\` — the active detection data
- \`quarantine\\\` — defanged copies of files *you* chose to quarantine

⚠️ Quarantined files are copies of your real files, stored XOR-obfuscated but **not encrypted**. Anyone with access to your Windows account can read them back.

**This portal** stores only: your name, email and an scrypt password hash — plus your chat messages so the conversation persists. No third-party analytics or advertising scripts are loaded.`,
    followUps: ["Why do I need an account?", "Where are the logs?", "Uninstalling"],
  },
  {
    id: "bot-help",
    title: "What can this assistant do?",
    group: "Portal & account",
    phrases: ["what can you do", "help me", "what are your capabilities", "who are you", "commands", "what do you know"],
    keywords: ["help", "can", "you", "assistant", "bot", "capable", "commands", "who"],
    answer: `I am **Gemby**, the support assistant for this portal. I know the GembyAV engine in detail — my answers come from the actual source code, not generic antivirus advice.

**Ask me about**

- **Installing** — download, SmartScreen warnings, checksums, requirements
- **Scanning** — quick vs full, what gets skipped, how long it takes
- **Detections** — what the score means, verdict thresholds, false positives
- **Quarantine** — where files go, restoring, deleting permanently
- **Real-time protection** — the watchdog, which folders, Defender coexistence
- **Extending it** — custom YARA rules, signature updates, \`signatures.json\`
- **Troubleshooting** — won't start, logs, uninstalling, reporting bugs
- **The portal** — accounts, privacy, why sign-in is needed

**Try:**
- *"Windows blocked the download"*
- *"How do I add my own YARA rule?"*
- *"Where are quarantined files stored?"*
- *"Is it a false positive?"*

If I cannot answer from the knowledge base I will say so rather than guess — for anything security-critical, verify against the source or open a GitHub issue.`,
    followUps: ["How do I install it?", "Test it with EICAR", "Real-time protection"],
  },
];

/* ------------------------------------------------------------- small talk */

export const GREETINGS = [
  "Hey! I'm Gemby, the support assistant for GembyAV. Ask me about installing, scanning, quarantine, YARA rules or anything the engine does.",
  "Hello! I can help with GembyAV — downloads, SmartScreen warnings, detections, quarantine, real-time protection and custom rules. What do you need?",
  "Hi there. I know the GembyAV engine inside out. What are you trying to do?",
];

export const THANKS = [
  "Anytime! Anything else about GembyAV I can help with?",
  "Happy to help. Shout if something else comes up.",
  "No problem — good luck with the scan!",
];

export const FAREWELL = [
  "Take care! Come back any time you need a hand with GembyAV.",
  "Bye! Stay safe out there.",
];

/** Shown when nothing in the KB matches. */
export const FALLBACK = `I could not find that in the GembyAV knowledge base, and I would rather tell you than guess.

Try one of these, or rephrase with more detail:

- **Installing** — "Windows SmartScreen blocked the download", "how do I verify the checksum?"
- **Scanning** — "how do I run a quick scan?", "what does SUSPICIOUS mean?"
- **Quarantine** — "where are quarantined files stored?", "how do I restore a file?"
- **Extending** — "how do I add a YARA rule?", "how do signature updates work?"
- **Troubleshooting** — "the app won't start", "where are the logs?"

For anything I cannot cover, the source is a single readable file (\`gemby_av.py\`) and bugs go to the GitHub issue tracker.`;

/* Re-exported so server code can keep importing it from here. */
export { SUGGESTED_PROMPTS } from "./suggestions";

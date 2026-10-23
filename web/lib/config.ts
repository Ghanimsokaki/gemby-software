/**
 * Single source of truth for everything the portal says about the product.
 * The landing page, the dashboard and the support bot all read from here so
 * the copy can never drift apart.
 */

export const PRODUCT = {
  name: "GembyAV",
  fullName: "Gemby AV",
  tagline: "Multi-layer antivirus for Windows",
  version: process.env.GEMBYAV_VERSION || "1.0.0",
  exe: "GembyAV.exe",
  license: "Apache-2.0",
  repo: process.env.GEMBYAV_REPO || "Ghanimsokaki/gemby-software",
} as const;

export const LINKS = {
  repo: `https://github.com/${PRODUCT.repo}`,
  releases: `https://github.com/${PRODUCT.repo}/releases`,
  source: `https://github.com/${PRODUCT.repo}/blob/main/gemby_av.py`,
  license: `https://github.com/${PRODUCT.repo}/blob/main/LICENSE`,
  rawExe: `https://github.com/${PRODUCT.repo}/raw/main/GembyAV.exe`,
  issues: `https://github.com/${PRODUCT.repo}/issues`,
  localDownload: "/downloads/GembyAV.exe",
  signatures: "/signatures.json",
} as const;

/** Where the desktop app fetches signature updates from. */
export const UPDATE_ENDPOINTS = {
  site: "/signatures.json",
  github: `https://raw.githubusercontent.com/${PRODUCT.repo}/main/signatures.json`,
} as const;

/** The chat model the assistant talks to. Override with GEMBY_CHAT_MODEL. */
export const CHAT_MODEL =
  process.env.GEMBY_CHAT_MODEL || "Hwiiiiiiii/Gemby-2-agent";

export const REQUIREMENTS = [
  { label: "OS", value: "Windows 10 / 11 (64-bit)" },
  { label: "Runtime", value: "None — bundled (PyInstaller onefile)" },
  { label: "Privileges", value: "Administrator (UAC prompt on launch)" },
  { label: "Disk", value: "~40 MB free for quarantine + logs" },
  { label: "Network", value: "Optional — signature updates only" },
] as const;

export const FEATURES = [
  {
    icon: "layers",
    title: "Multi-layer detection",
    body: "Hash blocklists, regex behaviour patterns, YARA rules and static PE analysis vote together on a single 0–100 risk score.",
    accent: "brand",
  },
  {
    icon: "fingerprint",
    title: "PE static analysis",
    body: "Parses the import table with pefile and flags process injection, hooking and download APIs such as WriteProcessMemory or URLDownloadToFile.",
    accent: "brand",
  },
  {
    icon: "activity",
    title: "Entropy & packer spotting",
    body: "Shannon entropy above 7.4 plus UPX, ASPack, Themida or VMProtect section names mark a sample as packed or encrypted.",
    accent: "amber",
  },
  {
    icon: "zap",
    title: "Real-time protection",
    body: "A watchdog observer watches Downloads, Desktop, Documents, Temp and the Startup folder, scanning every file the moment it lands.",
    accent: "mint",
  },
  {
    icon: "lock",
    title: "Quarantine & restore",
    body: "Detections are XOR-defanged with 0x5A so they cannot execute, stored with JSON metadata, and can be restored or shredded.",
    accent: "mint",
  },
  {
    icon: "refresh",
    title: "Live signature updates",
    body: "Pulls hashes, regex patterns and compiled YARA rules from this site — no reinstall needed to pick up new detections.",
    accent: "brand",
  },
] as const;

/** Mirrors the scoring logic in gemby_av.py so the docs stay honest. */
export const PIPELINE = [
  {
    step: "01",
    title: "Hash lookup",
    detail: "SHA-256 is matched against the known-bad list. An instant hit scores 100 and is verdicted MALICIOUS.",
    weight: "100 pts",
  },
  {
    step: "02",
    title: "Behaviour patterns",
    detail: "Regex rules catch encoded PowerShell, download cradles, certutil abuse, credential dumpers and ransom notes.",
    weight: "25–90 pts",
  },
  {
    step: "03",
    title: "YARA rules",
    detail: "Any .yar file dropped into %APPDATA%\\GembyAV\\rules is compiled and matched against the first 8 MB.",
    weight: "meta score",
  },
  {
    step: "04",
    title: "PE heuristics",
    detail: "Entropy, suspicious imports, section count and known packer names add up, capped at 45 points.",
    weight: "≤45 pts",
  },
  {
    step: "05",
    title: "Context clues",
    detail: "Double-extension disguises (invoice.pdf.exe) and executables sitting in temp folders are penalised.",
    weight: "10–35 pts",
  },
  {
    step: "06",
    title: "Verdict",
    detail: "Score ≥ 70 is MALICIOUS, 40–69 is SUSPICIOUS, anything below is dropped silently to avoid noise.",
    weight: "threshold",
  },
] as const;

export const THRESHOLDS = { suspicious: 40, malicious: 70 } as const;

export const FAQ = [
  {
    q: "Is GembyAV free?",
    a: "Yes. The whole engine is Apache-2.0 licensed and the compiled installer is committed straight to the repository. There are no tiers, no trial clock and no telemetry.",
  },
  {
    q: "Why does Windows SmartScreen warn me?",
    a: "The build is not code-signed with a purchased certificate, so SmartScreen treats it as unknown. Click “More info” → “Run anyway”. You can verify the file yourself against the SHA-256 checksum published on the download page.",
  },
  {
    q: "Will it conflict with Microsoft Defender?",
    a: "GembyAV is an on-demand scanner plus an optional real-time file watcher — it does not register as a Windows Security Center antivirus provider, so Defender stays your primary AV. Running both is safe.",
  },
  {
    q: "How do I test that it actually works?",
    a: "Download the standard EICAR test file. GembyAV scores it 100 via both its regex pattern and the bundled YARA rule, so it should be flagged MALICIOUS immediately.",
  },
  {
    q: "Where are quarantined files kept?",
    a: "In %APPDATA%\\GembyAV\\quarantine. Each item is stored as a .quar blob XOR-ed with 0x5A next to a .json metadata file, so nothing in there can execute by accident.",
  },
  {
    q: "Can I add my own detections?",
    a: "Two ways: drop .yar / .yara rule files into %APPDATA%\\GembyAV\\rules, or edit signatures.json to add SHA-256 hashes and regex patterns. Both are picked up on the next reload.",
  },
  {
    q: "Does it run on macOS or Linux?",
    a: "The shipped binary is a Windows PE executable. The underlying Python source is cross-platform and can be run from source with `pip install -r requirements.txt && python gemby_av.py`.",
  },
] as const;

export const STATS = [
  { value: "6", label: "detection layers" },
  { value: "8 MB", label: "scanned per file" },
  { value: "0", label: "accounts, ads or telemetry" },
  { value: "100%", label: "open source" },
] as const;

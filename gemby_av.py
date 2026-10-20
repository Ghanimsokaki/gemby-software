import os, sys, re, json, math, time, uuid, shutil, hashlib, threading, queue, urllib.request
from pathlib import Path
from datetime import datetime
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

try:
    import pefile
except ImportError:
    pefile = None
try:
    import yara
except ImportError:
    yara = None
try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    Observer = None
    FileSystemEventHandler = object

APP, VERSION = "GembyAV", "1.0.0"
DATA = Path(os.environ.get("APPDATA", Path.home() / ".config")) / APP
QUAR, SIGFILE, LOGFILE = DATA / "quarantine", DATA / "signatures.json", DATA / "scan.log"
RULES_DIR = DATA / "rules"  # drop any .yar / .yara files here
UPDATE_URL = ""  # <- put the URL of your signatures.json (hosted on your Arena site) here
MAX_READ = 8 * 1024 * 1024
EXEC_EXT = {".exe", ".dll", ".scr", ".sys", ".com", ".msi", ".bat", ".cmd", ".ps1", ".vbs", ".js", ".jse", ".wsf", ".hta", ".lnk", ".jar"}
SKIP_DIRS = {"windows", "$recycle.bin", "system volume information", "winsxs", "node_modules", ".git"}

DEFAULT_SIGS = {
    "version": 1,
    "hashes": {},  # "sha256hex": "Threat.Name"
    "patterns": [
        {"name": "EICAR-Test-File", "regex": "EICAR-STANDARD-ANTIVIRUS-TEST-FILE", "score": 100},
        {"name": "PS.EncodedCommand", "regex": r"powershell(\.exe)?\s+.{0,80}-(enc|encodedcommand)\s+[A-Za-z0-9+/=]{40,}", "score": 45},
        {"name": "PS.DownloadCradle", "regex": r"(iex|invoke-expression).{0,60}(downloadstring|webclient|downloadfile)", "score": 55},
        {"name": "Certutil.Download", "regex": r"certutil.{0,40}-urlcache", "score": 45},
        {"name": "Credential.Dumper", "regex": r"sekurlsa::logonpasswords|lsadump::sam", "score": 90},
        {"name": "Ransom.Note", "regex": r"your files (have been|are) encrypted", "score": 55},
        {"name": "VBS.ShellExec", "regex": r"wscript\.shell.{0,120}\.(run|exec)\(", "score": 25},
        {"name": "Bitsadmin.Download", "regex": r"bitsadmin.{0,40}/transfer", "score": 40},
    ],
}
DEFAULT_YARA = r'''
rule EICAR_Test_File { meta: score = 100
  strings: $e = "EICAR-STANDARD-ANTIVIRUS-TEST-FILE" condition: $e }
rule Suspicious_PowerShell_Download { meta: score = 55
  strings: $a = "DownloadString" nocase $b = "IEX" nocase $c = "-nop" nocase $d = "-w hidden" nocase
  condition: $a and ($b or $c or $d) }
rule Generic_Ransom_Note { meta: score = 55
  strings: $a = "your files have been encrypted" nocase $b = "bitcoin" nocase $c = "decrypt" nocase
  condition: $a and ($b or $c) }
rule Webshell_PHP_Generic { meta: score = 70
  strings: $a = /eval\s*\(\s*(base64_decode|gzinflate|str_rot13)/ nocase $b = "$_POST" $c = "$_REQUEST"
  condition: $a and ($b or $c) }
'''

SUSPICIOUS_IMPORTS = {
    "VirtualAllocEx": 12, "WriteProcessMemory": 15, "CreateRemoteThread": 20,
    "SetWindowsHookExA": 10, "SetWindowsHookExW": 10, "NtUnmapViewOfSection": 20,
    "IsDebuggerPresent": 5, "URLDownloadToFileA": 12, "URLDownloadToFileW": 12,
    "AdjustTokenPrivileges": 8, "GetAsyncKeyState": 10, "CryptEncrypt": 6,
}


def log(msg):
    try:
        DATA.mkdir(parents=True, exist_ok=True)
        with open(LOGFILE, "a", encoding="utf-8") as f:
            f.write(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] {msg}\n")
    except OSError:
        pass


def load_sigs():
    DATA.mkdir(parents=True, exist_ok=True)
    if not SIGFILE.exists():
        SIGFILE.write_text(json.dumps(DEFAULT_SIGS, indent=2))
    try:
        return json.loads(SIGFILE.read_text())
    except Exception:
        return DEFAULT_SIGS


def entropy(data: bytes) -> float:
    if not data:
        return 0.0
    counts = [0] * 256
    for b in data:
        counts[b] += 1
    n = len(data)
    return -sum((c / n) * math.log2(c / n) for c in counts if c)


class Engine:
    def __init__(self):
        self.reload()

    def load_yara(self):
        self.yara_rules = None
        if not yara:
            return
        RULES_DIR.mkdir(parents=True, exist_ok=True)
        default = RULES_DIR / "default.yar"
        if not default.exists():
            default.write_text(DEFAULT_YARA)
        files = {}
        for f in list(RULES_DIR.glob("*.yar")) + list(RULES_DIR.glob("*.yara")):
            try:
                yara.compile(filepath=str(f))  # skip files with errors instead of failing everything
                files[f.stem] = str(f)
            except yara.Error as e:
                log(f"YARA rule file skipped {f.name}: {e}")
        if files:
            self.yara_rules = yara.compile(filepaths=files)

    def reload(self):
        self.load_yara()
        s = load_sigs()
        self.hashes = {k.lower(): v for k, v in s.get("hashes", {}).items()}
        self.patterns = []
        for p in s.get("patterns", []):
            try:
                self.patterns.append((p["name"], re.compile(p["regex"].encode(), re.I | re.S), int(p.get("score", 50))))
            except re.error:
                pass

    def scan_file(self, path):
        path = Path(path)
        score, reasons = 0, []
        try:
            size = path.stat().st_size
            if size == 0 or size > 200 * 1024 * 1024:
                return None
            h = hashlib.sha256()
            sample = b""
            with open(path, "rb") as f:
                while chunk := f.read(1024 * 1024):
                    h.update(chunk)
                    if len(sample) < MAX_READ:
                        sample += chunk[: MAX_READ - len(sample)]
            digest = h.hexdigest()
        except (OSError, PermissionError):
            return None

        if digest in self.hashes:
            return {"path": str(path), "score": 100, "verdict": "MALICIOUS", "reasons": [f"Signature: {self.hashes[digest]}"], "sha256": digest}

        for name, rx, sc in self.patterns:
            if rx.search(sample):
                score += sc
                reasons.append(f"Pattern: {name}")

        if self.yara_rules:
            try:
                for m in self.yara_rules.match(data=sample, timeout=20):
                    score += int(m.meta.get("score", 60))
                    reasons.append(f"YARA: {m.rule}")
            except Exception:
                pass

        ext = path.suffix.lower()
        low = str(path).lower()
        parts = path.name.lower().split(".")
        if len(parts) > 2 and ext in EXEC_EXT and parts[-2] in {"pdf", "doc", "docx", "jpg", "png", "txt", "xls", "xlsx"}:
            score += 35; reasons.append("Double extension disguise")
        if ext in EXEC_EXT and any(x in low for x in ("\\temp\\", "/tmp/", "\\appdata\\local\\temp")):
            score += 10; reasons.append("Executable in temp folder")

        is_pe = sample[:2] == b"MZ"
        if is_pe:
            ent = entropy(sample[:2 * 1024 * 1024])
            if ent > 7.4:
                score += 25; reasons.append(f"High entropy ({ent:.2f}) - packed/encrypted")
            if pefile:
                try:
                    pe = pefile.PE(data=sample, fast_load=False)
                    imps = set()
                    for entry in getattr(pe, "DIRECTORY_ENTRY_IMPORT", []):
                        for imp in entry.imports:
                            if imp.name:
                                imps.add(imp.name.decode(errors="ignore"))
                    hit = [(n, w) for n, w in SUSPICIOUS_IMPORTS.items() if n in imps]
                    if hit:
                        score += min(sum(w for _, w in hit), 45)
                        reasons.append("Suspicious APIs: " + ", ".join(n for n, _ in hit))
                    if len(pe.sections) <= 2 and ent > 7.0:
                        score += 10; reasons.append("Few sections + high entropy")
                    for s in pe.sections:
                        nm = s.Name.rstrip(b"\x00").decode(errors="ignore").lower()
                        if nm in {".upx0", "upx0", ".aspack", ".themida", ".vmp0"}:
                            score += 15; reasons.append(f"Packer section: {nm}"); break
                    pe.close()
                except Exception:
                    pass

        if score <= 0:
            return None
        verdict = "MALICIOUS" if score >= 70 else "SUSPICIOUS" if score >= 40 else None
        if not verdict:
            return None
        return {"path": str(path), "score": min(score, 100), "verdict": verdict, "reasons": reasons, "sha256": digest}


def quarantine(path, info):
    QUAR.mkdir(parents=True, exist_ok=True)
    qid = uuid.uuid4().hex
    data = Path(path).read_bytes()
    (QUAR / f"{qid}.quar").write_bytes(bytes(b ^ 0x5A for b in data))  # defanged so it can't execute
    meta = {"id": qid, "original": str(path), "verdict": info["verdict"], "reasons": info["reasons"], "sha256": info["sha256"], "date": datetime.now().isoformat(timespec="seconds")}
    (QUAR / f"{qid}.json").write_text(json.dumps(meta))
    os.remove(path)
    log(f"QUARANTINED {path} ({info['verdict']}: {'; '.join(info['reasons'])})")
    return qid


def restore(qid):
    meta = json.loads((QUAR / f"{qid}.json").read_text())
    data = bytes(b ^ 0x5A for b in (QUAR / f"{qid}.quar").read_bytes())
    dest = Path(meta["original"])
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    (QUAR / f"{qid}.quar").unlink(); (QUAR / f"{qid}.json").unlink()
    log(f"RESTORED {dest}")


def delete_quarantined(qid):
    for ext in (".quar", ".json"):
        try: (QUAR / f"{qid}{ext}").unlink()
        except OSError: pass


def update_signatures():
    if not UPDATE_URL:
        raise RuntimeError("UPDATE_URL is not set in gemby_av.py")
    req = urllib.request.Request(UPDATE_URL, headers={"User-Agent": f"{APP}/{VERSION}"})
    with urllib.request.urlopen(req, timeout=20) as r:
        new = json.loads(r.read().decode())
    cur = load_sigs()
    cur["hashes"].update(new.get("hashes", {}))
    names = {p["name"] for p in cur["patterns"]}
    cur["patterns"] += [p for p in new.get("patterns", []) if p["name"] not in names]
    cur["version"] = new.get("version", cur.get("version", 1))
    if new.get("yara") and yara:
        try:
            yara.compile(source=new["yara"])  # validate before saving
            RULES_DIR.mkdir(parents=True, exist_ok=True)
            (RULES_DIR / "remote.yar").write_text(new["yara"])
        except yara.Error as e:
            log(f"Remote YARA rejected: {e}")
    SIGFILE.write_text(json.dumps(cur, indent=2))
    return len(cur["hashes"]), len(cur["patterns"])


def quick_targets():
    home = Path.home()
    t = [home / "Downloads", home / "Desktop", home / "Documents", Path(os.environ.get("TEMP", "/tmp"))]
    if os.name == "nt":
        t.append(Path(os.environ.get("APPDATA", "")) / "Microsoft/Windows/Start Menu/Programs/Startup")
    return [p for p in t if p.exists()]


def full_targets():
    if os.name == "nt":
        return [Path(f"{d}:\\") for d in "CDEFGH" if Path(f"{d}:\\").exists()]
    return [Path.home()]


class Watcher(FileSystemEventHandler):
    def __init__(self, engine, callback):
        self.engine, self.callback = engine, callback

    def _check(self, p):
        time.sleep(0.8)  # let the writer finish
        if Path(p).is_file() and DATA not in Path(p).parents:
            r = self.engine.scan_file(p)
            if r:
                self.callback(r)

    def on_created(self, e):
        if not e.is_directory:
            threading.Thread(target=self._check, args=(e.src_path,), daemon=True).start()

    on_modified = on_created


class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title(f"Gemby AV {VERSION}")
        self.geometry("920x600")
        self.engine = Engine()
        self.q = queue.Queue()
        self.stop = threading.Event()
        self.observer = None
        self.threats = {}
        self._ui()
        self.after(100, self._pump)
        log("App started")

    def _ui(self):
        top = ttk.Frame(self); top.pack(fill="x", padx=10, pady=8)
        for txt, cmd in [("Quick Scan", lambda: self.start(quick_targets())), ("Full Scan", lambda: self.start(full_targets())),
                         ("Scan Folder...", self.pick_folder), ("Scan File...", self.pick_file), ("Stop", self.stop.set),
                         ("Update Signatures", self.update_sigs)]:
            ttk.Button(top, text=txt, command=cmd).pack(side="left", padx=3)
        self.rt = tk.BooleanVar()
        ttk.Checkbutton(top, text="Real-time protection", variable=self.rt, command=self.toggle_rt).pack(side="right")

        self.status = tk.StringVar(value="Ready")
        ttk.Label(self, textvariable=self.status).pack(fill="x", padx=12)
        self.bar = ttk.Progressbar(self, mode="indeterminate"); self.bar.pack(fill="x", padx=12, pady=4)

        nb = ttk.Notebook(self); nb.pack(fill="both", expand=True, padx=10, pady=6)
        f1 = ttk.Frame(nb); nb.add(f1, text="Threats")
        self.tree = ttk.Treeview(f1, columns=("verdict", "score", "path", "reason"), show="headings", selectmode="extended")
        for c, w in [("verdict", 90), ("score", 50), ("path", 380), ("reason", 330)]:
            self.tree.heading(c, text=c.title()); self.tree.column(c, width=w)
        self.tree.pack(fill="both", expand=True)
        bf = ttk.Frame(f1); bf.pack(fill="x", pady=4)
        ttk.Button(bf, text="Quarantine Selected", command=lambda: self.quar(self.tree.selection())).pack(side="left", padx=3)
        ttk.Button(bf, text="Quarantine All", command=lambda: self.quar(self.tree.get_children())).pack(side="left", padx=3)
        ttk.Button(bf, text="Ignore Selected", command=self.ignore).pack(side="left", padx=3)

        f2 = ttk.Frame(nb); nb.add(f2, text="Quarantine")
        self.qtree = ttk.Treeview(f2, columns=("date", "verdict", "orig"), show="headings", selectmode="extended")
        for c, w in [("date", 140), ("verdict", 90), ("orig", 600)]:
            self.qtree.heading(c, text=c.title()); self.qtree.column(c, width=w)
        self.qtree.pack(fill="both", expand=True)
        qb = ttk.Frame(f2); qb.pack(fill="x", pady=4)
        ttk.Button(qb, text="Restore", command=self.q_restore).pack(side="left", padx=3)
        ttk.Button(qb, text="Delete Permanently", command=self.q_delete).pack(side="left", padx=3)
        ttk.Button(qb, text="Refresh", command=self.refresh_q).pack(side="left", padx=3)

        f3 = ttk.Frame(nb); nb.add(f3, text="Log")
        self.logbox = tk.Text(f3, state="disabled", height=10); self.logbox.pack(fill="both", expand=True)
        self.refresh_q()

    def say(self, m):
        self.logbox.config(state="normal"); self.logbox.insert("end", f"[{datetime.now():%H:%M:%S}] {m}\n")
        self.logbox.see("end"); self.logbox.config(state="disabled"); log(m)

    def pick_folder(self):
        d = filedialog.askdirectory()
        if d: self.start([Path(d)])

    def pick_file(self):
        f = filedialog.askopenfilename()
        if f: self.start([Path(f)])

    def start(self, targets):
        if getattr(self, "worker", None) and self.worker.is_alive():
            return messagebox.showinfo(APP, "A scan is already running.")
        self.stop.clear(); self.engine.reload(); self.bar.start(12)
        self.worker = threading.Thread(target=self._scan, args=(targets,), daemon=True); self.worker.start()

    def _scan(self, targets):
        n = found = 0
        for t in targets:
            files = [t] if t.is_file() else self._walk(t)
            for f in files:
                if self.stop.is_set():
                    break
                n += 1
                if n % 25 == 0:
                    self.q.put(("status", f"Scanned {n} files - {f}"))
                r = self.engine.scan_file(f)
                if r:
                    found += 1; self.q.put(("threat", r))
        self.q.put(("done", f"Scan {'stopped' if self.stop.is_set() else 'complete'}: {n} files, {found} threats"))

    def _walk(self, root):
        for dp, dns, fns in os.walk(root, onerror=lambda e: None):
            dns[:] = [d for d in dns if d.lower() not in SKIP_DIRS and Path(dp, d) != DATA]
            for fn in fns:
                yield Path(dp, fn)

    def _pump(self):
        try:
            while True:
                k, v = self.q.get_nowait()
                if k == "status": self.status.set(v)
                elif k == "threat": self.add_threat(v)
                elif k == "done": self.bar.stop(); self.status.set(v); self.say(v)
        except queue.Empty:
            pass
        self.after(100, self._pump)

    def add_threat(self, r):
        if r["path"] in self.threats: return
        iid = self.tree.insert("", "end", values=(r["verdict"], r["score"], r["path"], "; ".join(r["reasons"])))
        self.threats[r["path"]] = (iid, r); self.say(f"{r['verdict']}: {r['path']}")

    def quar(self, iids):
        for iid in list(iids):
            path = self.tree.item(iid)["values"][2]
            r = self.threats.get(path)
            if not r: continue
            try:
                quarantine(path, r[1]); self.tree.delete(iid); self.threats.pop(path, None)
            except Exception as e:
                self.say(f"Quarantine failed for {path}: {e}")
        self.refresh_q()

    def ignore(self):
        for iid in self.tree.selection():
            self.threats.pop(self.tree.item(iid)["values"][2], None); self.tree.delete(iid)

    def refresh_q(self):
        self.qtree.delete(*self.qtree.get_children())
        if QUAR.exists():
            for j in sorted(QUAR.glob("*.json")):
                try:
                    m = json.loads(j.read_text()); self.qtree.insert("", "end", iid=m["id"], values=(m["date"], m["verdict"], m["original"]))
                except Exception: pass

    def q_restore(self):
        for i in self.qtree.selection():
            try: restore(i)
            except Exception as e: self.say(f"Restore failed: {e}")
        self.refresh_q()

    def q_delete(self):
        if self.qtree.selection() and messagebox.askyesno(APP, "Permanently delete selected items?"):
            for i in self.qtree.selection(): delete_quarantined(i)
            self.refresh_q()

    def toggle_rt(self):
        if self.rt.get():
            if not Observer:
                self.rt.set(False); return messagebox.showerror(APP, "Install 'watchdog' for real-time protection.")
            self.engine.reload(); self.observer = Observer()
            w = Watcher(self.engine, lambda r: self.q.put(("threat", r)))
            for t in quick_targets():
                self.observer.schedule(w, str(t), recursive=True)
            self.observer.start(); self.say("Real-time protection ON")
        elif self.observer:
            self.observer.stop(); self.observer = None; self.say("Real-time protection OFF")

    def update_sigs(self):
        def job():
            try:
                h, p = update_signatures(); self.engine.reload(); self.q.put(("done", f"Signatures updated: {h} hashes, {p} patterns"))
            except Exception as e:
                self.q.put(("done", f"Update failed: {e}"))
        threading.Thread(target=job, daemon=True).start()


if __name__ == "__main__":
    App().mainloop()

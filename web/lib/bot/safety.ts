/**
 * Guard rail for offensive-security requests.
 *
 * The assistant explains DETECTION in depth (that is the product) but will not
 * help anyone create, pack or conceal malware. This runs before both the model
 * and the offline answerer so the behaviour does not depend on which backend
 * happens to be configured.
 */

const CREATION_VERB =
  "(?:write|create|make|build|generate|code|develop|program|script|craft|produce|give me|help me (?:write|create|make|build|craft))";

const MALWARE_NOUN =
  "(?:keylogger|key\\s?logger|ransomware|ransom\\s?ware|trojan|virus|worm|rootkit|malware|spyware|botnet|backdoor|bootkit|infostealer|info\\s?stealer|stealer|crypter|loader|dropper|exploit|payload|shellcode|rat|banking\\s?trojan)";

const PATTERNS: RegExp[] = [
  // "write me a keylogger", "create ransomware in python", ...
  new RegExp(`${CREATION_VERB}[^.?!\\n]{0,80}${MALWARE_NOUN}`, "i"),
  new RegExp(`${MALWARE_NOUN}[^.?!\\n]{0,40}(?:in|using|with)\\s+(?:python|c\\+\\+|c#|golang|rust|powershell|java)`, "i"),
  // evasion / disabling defences
  /\b(?:make|keep|render)\b[^.?!\n]{0,40}\b(?:undetectable|undetected|fud|fully undetectable)\b/i,
  /\b(?:bypass|evade|beat|defeat|disable|blind)\b[^.?!\n]{0,50}\b(?:defender|antivirus|av|amsi|edr|detection|sandbox)\b/i,
  /\bcrypter\b|\bpack(?:er|ing)?\b[^.?!\n]{0,30}\b(?:malware|virus|trojan|payload)\b/i,
  /\b(?:steal|exfiltrate|harvest)\b[^.?!\n]{0,40}\b(?:passwords?|credentials?|cookies|wallet|session tokens?)\b/i,
];

/** Questions that merely *mention* malware defensively must not be blocked. */
const ALLOW = /\b(detect|detected|detection|scan|scanned|flag|flagged|quarantine|remove|clean|protect|prevention|defend|analyse|analyze|how does .*(?:catch|find|spot)|yara|signature|false positive)\b/i;

export const REFUSAL = `I can go deep on how GembyAV **detects** keyloggers, ransomware, credential dumpers and download cradles — but I will not help create, pack, obfuscate or hide malware, or defeat another product's protection.

What I *can* do, in detail:

- **Detection patterns** — the exact regex and YARA rules behind \`Credential.Dumper\`, \`PS.DownloadCradle\`, \`Ransom.Note\` and the rest, with their scores
- **PE heuristics** — which imports (\`WriteProcessMemory\`, \`CreateRemoteThread\`, \`GetAsyncKeyState\`, \`URLDownloadToFile\`) add points and why
- **Packer & entropy detection** — how a \`.upx0\` section or entropy above 7.4 raises the score
- **Defensive rules** — write your own YARA rule to catch a behaviour you are worried about
- **Incident response** — quarantine, restore, and reading \`scan.log\`

If you are doing authorised security research or responding to an infection, ask me about any of those and I will give you the specifics.`;

export function detectHarmful(query: string): boolean {
  if (!query) return false;
  // Defensive questions that happen to contain a scary word are fine.
  const offensive = PATTERNS.some((re) => re.test(query));
  if (!offensive) return false;
  // "how do I detect a keylogger" -> allowed
  if (ALLOW.test(query) && !/\b(?:bypass|evade|undetectable|fud|crypter)\b/i.test(query)) {
    return false;
  }
  return true;
}

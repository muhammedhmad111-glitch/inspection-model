// Writes the paste-into-ElevenLabs script from scripts/narration.json.
//
//   node scripts/make-vo-script.mjs
//
// Lines are separated by an explicit <break time="1.5s" /> tag. That matters:
// a natural paragraph pause is ~0.35s, indistinguishable from the pause between
// two sentences of the same line, which makes splitting one continuous take
// guesswork. A 1.5s break is unmistakable, so split-narration.mjs can cut on it
// exactly instead of estimating.
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "audio");
const { lines } = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts", "narration.json"), "utf8"));

const BREAK = '<break time="1.5s" />';

// The one to paste. Breaks between lines, none at either end.
const tagged = lines.map((l) => l.text).join(`\n${BREAK}\n`);

// Fallback for tools that render the tag literally instead of honouring it.
const plain = lines.map((l) => l.text).join("\n\n");

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, "ELEVENLABS-SCRIPT.txt"), tagged.replace(/\n/g, "\r\n"), "utf8");
fs.writeFileSync(path.join(OUT_DIR, "ELEVENLABS-SCRIPT-plain.txt"), plain.replace(/\n/g, "\r\n"), "utf8");

const words = lines.reduce((n, l) => n + l.text.split(/\s+/).length, 0);
console.log(`${lines.length} lines, ${words} words, ${tagged.length} characters (ElevenLabs bills characters).`);
console.log("Breaks add", lines.length - 1, "× 1.5s =", ((lines.length - 1) * 1.5).toFixed(1) + "s of silence.");
console.log("\nwrote:");
console.log("  public/audio/ELEVENLABS-SCRIPT.txt        <- paste this one");
console.log("  public/audio/ELEVENLABS-SCRIPT-plain.txt  <- only if break tags are ignored");

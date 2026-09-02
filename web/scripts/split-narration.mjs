// Splits one continuous voice-over recording into per-line clips in
// public/audio/lines/, ready for build-narration.mjs to place on the timeline.
//
//   node scripts/split-narration.mjs "C:\path\to\voiceover.mp3"
//
// The recording is expected to contain every line of scripts/narration.json,
// read in order. Pauses alone cannot say where one line ends and the next
// begins — sentence breaks inside a line sound identical — so this aligns the
// detected pauses against how long each line *should* take (estimated from its
// syllable count) and picks the split points that fit best overall.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const FFMPEG = path.join(ROOT, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe");
const LINES_DIR = path.join(ROOT, "public", "audio", "lines");
const SR = 48000;
const FRAME = 0.02; // 20ms analysis window

const input = process.argv[2];
if (!input) {
  console.error('usage: node scripts/split-narration.mjs "path/to/voiceover.mp3"');
  process.exit(1);
}

const { lines } = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts", "narration.json"), "utf8"));

// ── Decode to mono PCM ─────────────────────────────────────────────────
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cpiis-split-"));
const wav = path.join(tmp, "src.wav");
execFileSync(FFMPEG, ["-v", "error", "-y", "-i", input, "-ac", "1", "-ar", String(SR), "-c:a", "pcm_s16le", wav], {
  stdio: ["ignore", "ignore", "ignore"],
});
const raw = fs.readFileSync(wav).subarray(44);
const total = Math.floor(raw.length / 2);
const sampleAt = (i) => raw.readInt16LE(i * 2) / 32768;

// ── Energy envelope → silence runs ─────────────────────────────────────
const win = Math.round(FRAME * SR);
const env = [];
for (let i = 0; i + win <= total; i += win) {
  let sum = 0;
  for (let j = 0; j < win; j++) sum += sampleAt(i + j) ** 2;
  env.push(Math.sqrt(sum / win));
}
const peak = Math.max(...env);
const threshold = peak * 0.02;

const silences = [];
let runStart = null;
env.forEach((v, i) => {
  if (v < threshold) {
    if (runStart === null) runStart = i;
  } else if (runStart !== null) {
    silences.push({ start: runStart * FRAME, end: i * FRAME });
    runStart = null;
  }
});
if (runStart !== null) silences.push({ start: runStart * FRAME, end: env.length * FRAME });

const speechStart = silences.length && silences[0].start === 0 ? silences[0].end : 0;
const speechEnd =
  silences.length && Math.abs(silences.at(-1).end - env.length * FRAME) < 1e-6
    ? silences.at(-1).start
    : env.length * FRAME;

// Interior pauses long enough to be a possible line break.
const candidates = silences
  .filter((s) => s.start > speechStart + 0.1 && s.end < speechEnd - 0.1 && s.end - s.start >= 0.18)
  .map((s) => ({ at: (s.start + s.end) / 2, gap: s.end - s.start, start: s.start, end: s.end }));

console.log(`speech ${speechStart.toFixed(2)}s → ${speechEnd.toFixed(2)}s, ${candidates.length} candidate breaks`);
if (candidates.length < lines.length - 1) {
  console.error(`Need at least ${lines.length - 1} breaks to make ${lines.length} clips. Re-record with clearer pauses.`);
  process.exit(1);
}

// ── Exact path: the recording used <break> tags ────────────────────────
// A tagged break dwarfs any natural pause, so if exactly the right number of
// long gaps is present the boundaries are known rather than inferred.
const LONG_BREAK = 0.9;
const longGaps = candidates.filter((c) => c.gap >= LONG_BREAK);
const exact = longGaps.length === lines.length - 1;

if (exact) {
  console.log(`found ${longGaps.length} tagged breaks — cutting on them exactly.\n`);
} else if (longGaps.length > 0) {
  console.log(
    `found ${longGaps.length} long pauses but expected ${lines.length - 1} — falling back to estimated alignment.\n`
  );
} else {
  console.log(
    `no tagged breaks found — falling back to estimated alignment, which can cut mid-sentence.\n` +
      `  For an exact split, regenerate using public/audio/ELEVENLABS-SCRIPT.txt.\n`
  );
}

// ── Expected share of the recording per line ───────────────────────────
const ONES = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
const TENS = ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
/** Spell integers so digits weigh what they actually take to say. */
function spell(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
  return ONES[Math.floor(n / 100)] + " hundred" + (n % 100 ? " " + spell(n % 100) : "");
}
/** Vowel groups approximate syllables, which track speaking time far better than words. */
function syllables(text) {
  const spoken = text.replace(/\d+/g, (m) => spell(Number(m)));
  return (spoken.toLowerCase().match(/[aeiouy]+/g) ?? []).length;
}

/** Sentence breaks cost real time in TTS, on top of the syllables themselves. */
const sentenceBreaks = (text) => Math.max(0, (text.match(/[.!?]/g) ?? []).length - 1);

// Solve for speaking rate and per-sentence pause that together explain the
// whole recording, so a line of many short sentences is not underestimated.
const PAUSE = 0.32;
const syl = lines.map((l) => syllables(l.text));
const pauses = lines.map((l) => sentenceBreaks(l.text) * PAUSE);
const speechSpan = speechEnd - speechStart;
const rate = (speechSpan - pauses.reduce((a, b) => a + b, 0)) / syl.reduce((a, b) => a + b, 0);
const expected = syl.map((s, i) => s * rate + pauses[i]);

// ── Choose breaks: fit expected durations, favouring the longer pauses ──
// A paragraph break is read with a longer pause than a comma, so reward gap
// length; without it the fit alone will happily cut mid-line.
const GAP_BONUS = 12;
const bounds = [
  { at: speechStart, gap: 0 },
  ...candidates,
  { at: speechEnd, gap: 0 },
];
const N = bounds.length;
const L = lines.length;
const INF = Infinity;
const dp = Array.from({ length: L + 1 }, () => new Float64Array(N).fill(INF));
const from = Array.from({ length: L + 1 }, () => new Int32Array(N).fill(-1));
dp[0][0] = 0;

for (let i = 1; i <= L; i++) {
  for (let j = i; j < N; j++) {
    // Line i-1 must end at bounds[j]; it started at some earlier boundary k.
    for (let k = i - 1; k < j; k++) {
      if (dp[i - 1][k] === INF) continue;
      const err = bounds[j].at - bounds[k].at - expected[i - 1];
      // Reward cutting at a long pause; the final boundary has no gap to score.
      const bonus = j === N - 1 ? 0 : GAP_BONUS * bounds[j].gap;
      const cost = dp[i - 1][k] + err * err - bonus;
      if (cost < dp[i][j]) {
        dp[i][j] = cost;
        from[i][j] = k;
      }
    }
  }
}

if (dp[L][N - 1] === INF) {
  console.error("Could not align the recording to the script.");
  process.exit(1);
}

const cuts = new Array(L + 1);
cuts[L] = N - 1;
for (let i = L; i >= 1; i--) cuts[i - 1] = from[i][cuts[i]];

// With tagged breaks the boundaries are known outright; ignore the estimate.
// Each clip then runs from the end of the preceding break to the start of the
// next one, so the tagged silence is dropped rather than baked into the clips.
const spans = exact
  ? lines.map((_, i) => ({
      start: i === 0 ? speechStart : longGaps[i - 1].end,
      end: i === lines.length - 1 ? speechEnd : longGaps[i].start,
    }))
  : lines.map((_, i) => ({ start: bounds[cuts[i]].at, end: bounds[cuts[i + 1]].at }));

// ── Write one clip per line ────────────────────────────────────────────
fs.mkdirSync(LINES_DIR, { recursive: true });
for (const f of fs.readdirSync(LINES_DIR)) fs.unlinkSync(path.join(LINES_DIR, f));

const PAD = 0.08; // keep a breath either side so words are never clipped
let warnings = 0;

lines.forEach((line, i) => {
  const start = Math.max(0, spans[i].start - PAD);
  const end = Math.min(speechEnd + PAD, spans[i].end + PAD);
  const seconds = end - start;
  const over = seconds > line.budget + 0.25;
  if (over) warnings++;

  const out = path.join(LINES_DIR, `${String(i).padStart(2, "0")}.wav`);
  execFileSync(
    FFMPEG,
    ["-v", "error", "-y", "-i", wav, "-ss", start.toFixed(3), "-to", end.toFixed(3), "-c:a", "pcm_s16le", out],
    { stdio: ["ignore", "ignore", "ignore"] }
  );

  console.log(
    `  ${String(i).padStart(2, "0")} ${line.scene.padEnd(11)} ` +
      `${start.toFixed(2)}–${end.toFixed(2)}s  ${seconds.toFixed(1)}s / ${line.budget.toFixed(1)}s` +
      `${over ? "  ⚠ OVER BUDGET" : ""}`
  );
});

fs.rmSync(tmp, { recursive: true, force: true });
console.log(
  `\n${warnings ? `${warnings} clip(s) overrun their scene — check those cuts before rendering.` : "all clips fit their scenes."}`
);
console.log("done ->", LINES_DIR);

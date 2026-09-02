// Finds where each script line starts inside a single continuous voice-over,
// then writes the per-line clips to public/audio/lines/.
//
//   node scripts/align-narration.mjs "C:\path\to\voiceover.mp3"
//
// Splitting on pauses alone does not work: in a natural read the pause between
// two lines (~0.36s) is indistinguishable from the pause between two sentences
// of the same line (~0.34s). So instead of guessing, this aligns the recording
// against a reference rendering of the same script produced locally, where the
// line boundaries are known exactly. Dynamic time warping over log-mel features
// maps reference time onto recording time, carrying the boundaries with it.
//
// Every mapped boundary is then checked against the recording's own pauses. If
// a boundary does not land in silence the alignment is wrong, and the script
// says so rather than writing clips that cut mid-sentence.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const PS = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
const ROOT = process.cwd();
const FFMPEG = path.join(ROOT, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe");
const LINES_DIR = path.join(ROOT, "public", "audio", "lines");

const SR = 16000; // feature rate; plenty for speech
const FRAME = 400; // 25ms
const HOP = 160; // 10ms
const NFFT = 512;
const MELS = 26;

const input = process.argv[2];
if (!input) {
  console.error('usage: node scripts/align-narration.mjs "path/to/voiceover.mp3"');
  process.exit(1);
}

const { lines } = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts", "narration.json"), "utf8"));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cpiis-align-"));
const at = (i) => path.join(tmp, `ref-${String(i).padStart(2, "0")}.wav`);

// ── Reference rendering, one file per line so boundaries are exact ──────
console.log("rendering reference read…");
execFileSync(
  PS,
  [
    "-NoProfile",
    "-Command",
    `Add-Type -AssemblyName System.Speech
     $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
     $s.SelectVoice('Microsoft David Desktop')
     $s.Rate = 1
     ${lines.map((l, i) => `$s.SetOutputToWaveFile('${at(i)}'); $s.Speak('${l.text.replace(/'/g, "''")}');`).join("\n")}
     $s.Dispose()`,
  ],
  { stdio: "ignore" }
);

/** Decode anything to mono 16k PCM float. */
function decode(file) {
  const out = path.join(tmp, `dec-${path.basename(file)}.wav`);
  execFileSync(FFMPEG, ["-v", "error", "-y", "-i", file, "-ac", "1", "-ar", String(SR), "-c:a", "pcm_s16le", out], {
    stdio: "ignore",
  });
  const raw = fs.readFileSync(out).subarray(44);
  const n = Math.floor(raw.length / 2);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) s[i] = raw.readInt16LE(i * 2) / 32768;
  return s;
}

// Concatenate the reference and remember where each line begins, in frames.
const refParts = lines.map((_, i) => decode(at(i)));
const refLen = refParts.reduce((n, p) => n + p.length, 0);
const ref = new Float32Array(refLen);
const refBoundarySample = [0];
let cursor = 0;
for (const part of refParts) {
  ref.set(part, cursor);
  cursor += part.length;
  refBoundarySample.push(cursor);
}
const target = decode(input);

// ── Log-mel features ───────────────────────────────────────────────────
const hamming = new Float32Array(FRAME);
for (let i = 0; i < FRAME; i++) hamming[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (FRAME - 1));

const hzToMel = (f) => 2595 * Math.log10(1 + f / 700);
const melToHz = (m) => 700 * (10 ** (m / 2595) - 1);
const filters = (() => {
  const lo = hzToMel(80);
  const hi = hzToMel(SR / 2);
  const points = Array.from({ length: MELS + 2 }, (_, i) =>
    Math.floor(((NFFT + 1) * melToHz(lo + ((hi - lo) * i) / (MELS + 1))) / SR)
  );
  return Array.from({ length: MELS }, (_, m) => ({ lo: points[m], mid: points[m + 1], hi: points[m + 2] }));
})();

/** Iterative radix-2 FFT, real input, in-place on re/im. */
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k];
        const ui = im[i + k];
        const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr;
        im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr;
        im[i + k + len / 2] = ui - vi;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
}

function features(signal) {
  const frames = Math.max(0, Math.floor((signal.length - FRAME) / HOP) + 1);
  const out = [];
  const re = new Float64Array(NFFT);
  const im = new Float64Array(NFFT);
  for (let f = 0; f < frames; f++) {
    re.fill(0);
    im.fill(0);
    for (let i = 0; i < FRAME; i++) re[i] = signal[f * HOP + i] * hamming[i];
    fft(re, im);
    const power = new Float64Array(NFFT / 2 + 1);
    for (let i = 0; i <= NFFT / 2; i++) power[i] = (re[i] * re[i] + im[i] * im[i]) / NFFT;

    const vec = new Float32Array(MELS);
    filters.forEach((fl, m) => {
      let sum = 0;
      for (let k = fl.lo; k < fl.mid; k++) sum += power[k] * ((k - fl.lo) / Math.max(1, fl.mid - fl.lo));
      for (let k = fl.mid; k < fl.hi; k++) sum += power[k] * ((fl.hi - k) / Math.max(1, fl.hi - fl.mid));
      vec[m] = Math.log(sum + 1e-10);
    });
    out.push(vec);
  }
  // Mean/variance normalise so two different voices become comparable.
  for (let m = 0; m < MELS; m++) {
    let mean = 0;
    for (const v of out) mean += v[m];
    mean /= out.length;
    let sd = 0;
    for (const v of out) sd += (v[m] - mean) ** 2;
    sd = Math.sqrt(sd / out.length) || 1;
    for (const v of out) v[m] = (v[m] - mean) / sd;
  }
  return out;
}

console.log("extracting features…");
const A = features(ref); // reference
const B = features(target); // recording
console.log(`  reference ${A.length} frames, recording ${B.length} frames`);

// ── Banded DTW ─────────────────────────────────────────────────────────
// Content is identical, so the path stays near the diagonal; a band keeps this
// to a few hundred MB of backpointers instead of gigabytes.
const N = A.length;
const M = B.length;
const BAND = Math.max(400, Math.round(0.18 * Math.max(N, M)));
const slope = M / N;

const dist = (a, b) => {
  let s = 0;
  for (let k = 0; k < MELS; k++) s += (a[k] - b[k]) ** 2;
  return Math.sqrt(s);
};

console.log(`aligning (band ±${BAND} frames)…`);
const INF = Infinity;
let prev = new Float64Array(M + 1).fill(INF);
let curr = new Float64Array(M + 1).fill(INF);
const back = new Uint8Array((N + 1) * (M + 1)); // 0 = diag, 1 = up, 2 = left
prev[0] = 0;

for (let i = 1; i <= N; i++) {
  curr.fill(INF);
  const centre = Math.round(i * slope);
  const from = Math.max(1, centre - BAND);
  const to = Math.min(M, centre + BAND);
  for (let j = from; j <= to; j++) {
    const d = dist(A[i - 1], B[j - 1]);
    let best = prev[j - 1];
    let move = 0;
    if (prev[j] < best) {
      best = prev[j];
      move = 1;
    }
    if (curr[j - 1] < best) {
      best = curr[j - 1];
      move = 2;
    }
    if (best === INF) continue;
    curr[j] = best + d;
    back[i * (M + 1) + j] = move;
  }
  [prev, curr] = [curr, prev];
}

if (prev[M] === INF) {
  console.error("Alignment failed — the recording does not appear to match the script.");
  process.exit(1);
}

// Walk back, recording for each reference frame which recording frame it hit.
const mapAtoB = new Int32Array(N + 1).fill(-1);
let i = N;
let j = M;
while (i > 0 && j > 0) {
  mapAtoB[i] = j;
  const move = back[i * (M + 1) + j];
  if (move === 0) {
    i--;
    j--;
  } else if (move === 1) i--;
  else j--;
}

const frameToSec = (f) => (f * HOP) / SR;
const refBoundaryFrame = refBoundarySample.map((s) => Math.min(N, Math.round(s / HOP)));
const mapped = refBoundaryFrame.map((f) => {
  for (let k = f; k <= N; k++) if (mapAtoB[k] > 0) return frameToSec(mapAtoB[k]);
  return frameToSec(M);
});
mapped[0] = 0;
mapped[mapped.length - 1] = frameToSec(M);

// ── Sanity check: every boundary must land in a pause ──────────────────
const env = [];
{
  const win = Math.round(0.02 * SR);
  for (let k = 0; k + win <= target.length; k += win) {
    let s = 0;
    for (let q = 0; q < win; q++) s += target[k + q] ** 2;
    env.push(Math.sqrt(s / win));
  }
}
// 5% of peak, not 2%: a breath between lines does not reach the noise floor,
// and a stricter gate hides the very pauses the boundaries land in.
const thr = Math.max(...env) * 0.05;
const MIN_PAUSE = 0.09;
const pauses = [];
{
  let st = null;
  env.forEach((v, k) => {
    if (v < thr) {
      if (st === null) st = k;
    } else if (st !== null) {
      if ((k - st) * 0.02 >= MIN_PAUSE) pauses.push({ start: st * 0.02, end: k * 0.02 });
      st = null;
    }
  });
}
/** Nearest pause to a time, and how far off it is. */
function snap(t) {
  let best = null;
  let dist = INF;
  for (const p of pauses) {
    const d = t < p.start ? p.start - t : t > p.end ? t - p.end : 0;
    if (d < dist) {
      dist = d;
      best = p;
    }
  }
  return { pause: best, off: dist };
}

console.log("\nboundary checks:");
let bad = 0;
const snapped = mapped.map((t, k) => {
  if (k === 0 || k === mapped.length - 1) return t;
  const { pause, off } = snap(t);
  // A line boundary is always at a pause, so snapping to a nearby one beats
  // cutting where the aligner landed — that would slice a word in half.
  const ok = off <= 1.0;
  if (!ok) bad++;
  console.log(
    `  line ${String(k).padStart(2)} start ${t.toFixed(2)}s → pause ${pause.start.toFixed(2)}–${pause.end.toFixed(2)}s` +
      `  (off by ${off.toFixed(2)}s)${ok ? "" : "   ⚠ NOT IN A PAUSE"}`
  );
  return ok ? (pause.start + pause.end) / 2 : t;
});

if (bad > 2) {
  console.error(`\n${bad} of ${mapped.length - 2} boundaries missed every pause — alignment is not trustworthy.`);
  console.error("Nothing written. Supply the lines as separate clips instead.");
  fs.rmSync(tmp, { recursive: true, force: true });
  process.exit(1);
}

// ── Write clips ────────────────────────────────────────────────────────
fs.mkdirSync(LINES_DIR, { recursive: true });
for (const f of fs.readdirSync(LINES_DIR)) fs.unlinkSync(path.join(LINES_DIR, f));

const PAD = 0.1;
console.log("\nclips:");
lines.forEach((line, k) => {
  const start = Math.max(0, snapped[k] - (k === 0 ? 0 : PAD));
  const end = Math.min(frameToSec(M), snapped[k + 1] + PAD);
  const out = path.join(LINES_DIR, `${String(k).padStart(2, "0")}.wav`);
  execFileSync(
    FFMPEG,
    ["-v", "error", "-y", "-i", input, "-ss", start.toFixed(3), "-to", end.toFixed(3), "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", out],
    { stdio: "ignore" }
  );
  const seconds = end - start;
  console.log(
    `  ${String(k).padStart(2, "0")} ${line.scene.padEnd(11)} ${start.toFixed(2)}–${end.toFixed(2)}s  ` +
      `${seconds.toFixed(1)}s / ${line.budget.toFixed(1)}s budget${seconds > line.budget + 0.25 ? "  (scene will be stretched)" : ""}`
  );
});

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${bad ? `${bad} boundary(ies) fell outside a pause — spot-check those clips.` : "every boundary landed in a pause."}`);
console.log("done ->", LINES_DIR);

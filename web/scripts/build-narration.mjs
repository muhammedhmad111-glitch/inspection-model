// Assembles public/audio/narration.wav from scripts/narration.json, placing
// each line at its scene's start time so the voice-over stays locked to the cuts.
//
//   node scripts/build-narration.mjs                 # use public/audio/lines/NN.*
//   node scripts/build-narration.mjs --source sapi   # scratch track via Windows TTS
//   node scripts/build-narration.mjs --rate 2        # SAPI speed, -10..10
//
// "lines" mode expects one clip per entry in narration.json, named by index —
// 00, 01, 02 … in public/audio/lines/, any format ffmpeg reads (mp3/wav/m4a).
// That is the ElevenLabs path: generate each line separately and drop them in.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const PS = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
const ROOT = process.cwd();
const FFMPEG = path.join(ROOT, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe");
const FFPROBE = path.join(ROOT, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffprobe.exe");

/** Each video keeps its own script, clips, narration track and scene timings. */
const VIDEOS = {
  overview: {
    script: "narration.json",
    lines: path.join("public", "audio", "lines"),
    out: path.join("public", "audio", "narration.wav"),
    timing: path.join("src", "remotion", "system-overview", "timing.json"),
  },
  scheduling: {
    script: "narration-scheduling.json",
    lines: path.join("public", "audio", "lines-scheduling"),
    out: path.join("public", "audio", "narration-scheduling.wav"),
    timing: path.join("src", "remotion", "scheduling", "timing.json"),
  },
  "scheduling-ar": {
    script: "narration-scheduling-ar.json",
    lines: path.join("public", "audio", "lines-scheduling-ar"),
    out: path.join("public", "audio", "narration-scheduling-ar.wav"),
    timing: path.join("src", "remotion", "scheduling", "timing-ar.json"),
  },
};

const argOf = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i === -1 ? fallback : process.argv[i + 1];
};
const source = argOf("--source", "lines");
const voice = argOf("--voice", "Microsoft Zira Desktop");
const rate = Number(argOf("--rate", "2"));

const videoKey = argOf("--video", "overview");
const video = VIDEOS[videoKey];
if (!video) {
  console.error(`unknown --video "${videoKey}". Expected one of: ${Object.keys(VIDEOS).join(", ")}`);
  process.exit(1);
}
const LINES_DIR = path.join(ROOT, video.lines);
const OUT = path.join(ROOT, video.out);

const { lines } = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts", video.script), "utf8"));
const idx = (i) => String(i).padStart(2, "0");

/** Seconds of audio in a file, via ffprobe. */
const durationOf = (file) =>
  Number(
    execFileSync(FFPROBE, [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      file,
    ]).toString().trim()
  );

// ── Resolve one audio file per line ────────────────────────────────────
let clips;
let tmp = null;

if (source === "sapi") {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cpiis-vo-"));
  console.log(`synthesising ${lines.length} lines with "${voice}" (rate ${rate})…`);
  const speak = lines
    .map((l, i) => {
      const text = l.text.replace(/'/g, "''");
      return `$s.SetOutputToWaveFile('${path.join(tmp, idx(i) + ".wav")}'); $s.Speak('${text}');`;
    })
    .join("\n");
  execFileSync(
    PS,
    [
      "-NoProfile",
      "-Command",
      `Add-Type -AssemblyName System.Speech
       $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
       $s.SelectVoice('${voice}')
       $s.Rate = ${rate}
       ${speak}
       $s.Dispose()`,
    ],
    { stdio: "inherit" }
  );
  clips = lines.map((_, i) => path.join(tmp, idx(i) + ".wav"));
} else {
  const available = fs.existsSync(LINES_DIR) ? fs.readdirSync(LINES_DIR) : [];
  const missing = [];
  clips = lines.map((l, i) => {
    const match = available.find((f) => path.parse(f).name === idx(i));
    if (!match) missing.push(`  ${idx(i)}.mp3  →  ${l.scene}: "${l.text.slice(0, 60)}…"`);
    return match ? path.join(LINES_DIR, match) : null;
  });
  if (missing.length) {
    console.error(`Missing ${missing.length} clip(s) in ${video.lines}:\n${missing.join("\n")}`);
    console.error("\nGenerate one file per line (any format) named by index, then re-run.");
    process.exit(1);
  }
}

// ── Fit the scenes to the narration ────────────────────────────────────
// A scene is stretched when its line needs longer, never shortened below the
// length its animation was designed for. LEAD lets the visuals establish before
// the voice comes in; TAIL stops the next cut landing on the final word.
const FPS = 30;
const LEAD = 0.35;
const TAIL = 0.45;

const clipSeconds = clips.map(durationOf);
const sceneSeconds = lines.map((l, i) => Math.max(l.budget, clipSeconds[i] + LEAD + TAIL));

const starts = [];
let cursor = 0;
for (const seconds of sceneSeconds) {
  starts.push(cursor);
  cursor += seconds;
}
const totalSeconds = cursor;

lines.forEach((line, i) => {
  const stretched = sceneSeconds[i] > line.budget + 0.01;
  console.log(
    `  ${line.scene.padEnd(11)} voice ${clipSeconds[i].toFixed(1)}s → scene ` +
      `${sceneSeconds[i].toFixed(1)}s${stretched ? ` (stretched from ${line.budget.toFixed(1)}s)` : ""}`
  );
});
console.log(
  `\ntotal ${totalSeconds.toFixed(1)}s (${lines.reduce((t, l) => t + l.budget, 0).toFixed(1)}s as designed)`
);

// Hand the scene lengths to the composition, in frames.
const timingPath = path.join(ROOT, video.timing);
fs.writeFileSync(
  timingPath,
  JSON.stringify(
    {
      _comment:
        "Scene lengths in frames, written by scripts/build-narration.mjs so every scene is at least as long as the line spoken over it. Empty means the designed lengths in scenes.tsx are used as-is.",
      scenes: Object.fromEntries(lines.map((l, i) => [l.scene, Math.ceil(sceneSeconds[i] * FPS)])),
    },
    null,
    2
  ) + "\n"
);

// ── Lay every clip onto one timeline at its scene start ────────────────
// adelay shifts each input; amix sums them. normalize=0 keeps levels intact
// (clips never overlap, so summing cannot clip).
const filter =
  lines
    .map((_, i) => {
      const ms = Math.round((starts[i] + LEAD) * 1000);
      return `[${i}:a]aresample=48000,aformat=channel_layouts=mono,adelay=${ms}[d${i}]`;
    })
    .join(";") +
  ";" +
  lines.map((_, i) => `[d${i}]`).join("") +
  `amix=inputs=${lines.length}:normalize=0,apad,atrim=0:${totalSeconds.toFixed(3)}[out]`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
execFileSync(
  FFMPEG,
  [
    "-y",
    ...clips.flatMap((c) => ["-i", c]),
    "-filter_complex", filter,
    "-map", "[out]",
    "-c:a", "pcm_s16le",
    OUT,
  ],
  { stdio: ["ignore", "ignore", "pipe"] }
);

if (tmp) fs.rmSync(tmp, { recursive: true, force: true });

console.log(`\nwrote scene lengths -> ${video.timing}`);
console.log("done ->", OUT);

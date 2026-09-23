// Renders a Remotion composition to disk. Run from web/:
//   node scripts/render-video.mjs                    -> full MP4 into ../out
//   node scripts/render-video.mjs stills 60 400 800  -> PNG frames for review
//   node scripts/render-video.mjs --range 0-300      -> short clip, for checking audio sync
import path from "node:path";
import fs from "node:fs/promises";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia, renderStill } from "@remotion/renderer";

const COMPOSITION_ID = process.env.COMPOSITION ?? "SystemOverview";
const ROOT = process.cwd();
// Default lands in the repo's out/. Override with VIDEO_OUT_DIR when that path is
// inside a synced folder — OneDrive has been observed removing the finished MP4.
const OUT_DIR = process.env.VIDEO_OUT_DIR ?? path.join(ROOT, "..", "out");
await fs.mkdir(OUT_DIR, { recursive: true });

/** Pass an audio path only if the file is really there — the composition
 *  renders silent otherwise instead of failing on a missing staticFile. */
async function ifPresent(publicRelative) {
  try {
    await fs.access(path.join(ROOT, "public", publicRelative));
    return publicRelative;
  } catch {
    return null;
  }
}
const NARRATION = {
  SystemOverview: "audio/narration.wav",
  Scheduling: "audio/narration-scheduling.wav",
  SchedulingAR: "audio/narration-scheduling-ar.wav",
};
const audio = {
  voiceover: await ifPresent(NARRATION[COMPOSITION_ID] ?? "audio/narration.wav"),
  music: await ifPresent("audio/track.mp3"),
};
console.log(
  `audio: voice-over ${audio.voiceover ? "yes" : "none"}, music ${audio.music ? "yes" : "none"}`
);

console.log("bundling…");
let last = -1;
const serveUrl = await bundle({
  entryPoint: path.join(ROOT, "src", "remotion", "index.ts"),
  onProgress: (p) => {
    if (p - last >= 25) {
      last = p;
      console.log(`  bundle ${p}%`);
    }
  },
});

const composition = await selectComposition({ serveUrl, id: COMPOSITION_ID, inputProps: audio });
console.log(
  `${COMPOSITION_ID}: ${composition.width}x${composition.height} @${composition.fps}fps · ` +
    `${composition.durationInFrames} frames (${(composition.durationInFrames / composition.fps).toFixed(1)}s)`
);

if (process.argv[2] === "stills") {
  for (const frame of process.argv.slice(3).map(Number)) {
    const output = path.join(OUT_DIR, `frame-${frame}.png`);
    await renderStill({ composition, serveUrl, output, frame, overwrite: true, inputProps: audio });
    console.log("still", output);
  }
} else {
  const rangeArg = process.argv[process.argv.indexOf("--range") + 1];
  const frameRange = process.argv.includes("--range")
    ? rangeArg.split("-").map(Number)
    : undefined;
  const output = path.join(
    OUT_DIR,
    frameRange ? `${COMPOSITION_ID}-${frameRange.join("-")}.mp4` : `${COMPOSITION_ID}.mp4`
  );
  let shown = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    crf: 17,
    // renderMedia wants `outputLocation`; `output` (renderStill's name) is
    // silently ignored and the render is thrown away.
    outputLocation: output,
    overwrite: true,
    inputProps: audio,
    frameRange,
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 100);
      if (pct - shown >= 10) {
        shown = pct;
        console.log(`  render ${pct}%`);
      }
    },
  });
  console.log("done ->", output);
}

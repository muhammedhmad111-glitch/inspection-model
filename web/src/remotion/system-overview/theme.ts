import { loadFont as loadInterTight } from "@remotion/google-fonts/InterTight";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

// Fonts are requested once at module load; Remotion blocks the render until ready.
// Only the weights/subset this video actually uses — the default pulls 126 files.
export const display = loadInterTight("normal", {
  subsets: ["latin"],
  weights: ["400", "600", "700"],
}).fontFamily;
export const body = loadInter("normal", {
  subsets: ["latin"],
  weights: ["400", "600", "700"],
}).fontFamily;

// Palette lifted from the app's own identity (web/src/app/globals.css).
export const C = {
  navy: "#252a5e",
  navyDeep: "#191d45",
  ink: "#0b0d24",
  indigo: "#6366f1",
  indigoBright: "#818cf8",
  white: "#ffffff",
  mist: "#c7cbe8",
  muted: "#8b90bd",
  line: "rgba(255,255,255,0.10)",
  panel: "rgba(255,255,255,0.045)",
  green: "#34d399",
  amber: "#fbbf24",
  red: "#f87171",
} as const;

export const FPS = 30;
export const W = 1920;
export const H = 1080;

/** Seconds → frames, so scene lengths read as time in the storyboard. */
export const s = (seconds: number) => Math.round(seconds * FPS);

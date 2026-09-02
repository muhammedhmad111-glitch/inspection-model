import { loadFont } from "@remotion/google-fonts/Cairo";
import { DAYS_AR, type Locale } from "./parts";

// Cairo is what the product itself is set in, so the Arabic cut carries the
// same identity as the app on screen.
const cairo = loadFont("normal", {
  subsets: ["arabic", "latin"],
  weights: ["400", "600", "700"],
}).fontFamily;

export const ARABIC: Locale = { display: cairo, body: cairo, dir: "rtl", days: DAYS_AR };

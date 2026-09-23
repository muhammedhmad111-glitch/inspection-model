import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, body, display } from "./theme";

/**
 * Eased 0→1 entrance value, delayed by `delay` frames.
 * Pure — safe to call inside a `.map()` where a hook would break the rules.
 */
export const enterAt = (frame: number, fps: number, delay = 0, damping = 200) =>
  spring({ frame: frame - delay, fps, config: { damping }, durationInFrames: 24 });

/**
 * Lay scenes end to end so each carries the frame it starts on. Module level on
 * purpose: walking the cursor inside a composition's body would be a variable
 * reassignment during render.
 */
export function layOutCues<T extends { d: number }>(scenes: T[]): (T & { from: number })[] {
  let cursor = 0;
  return scenes.map((sc) => {
    const cue = { ...sc, from: cursor };
    cursor += sc.d;
    return cue;
  });
}

/** Hook flavour of {@link enterAt} for use at the top level of a component. */
export function useEnter(delay = 0, damping = 200) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return enterAt(frame, fps, delay, damping);
}

/** Fade the whole scene in and out so cuts never feel abrupt. */
export function SceneFade({
  children,
  durationInFrames,
  hold = 12,
}: {
  children: React.ReactNode;
  durationInFrames: number;
  hold?: number;
}) {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, hold, durationInFrames - hold, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
}

/** Deep-navy stage with a slow-drifting grid and two soft indigo glows. */
export function Stage({ children, tint = 0 }: { children: React.ReactNode; tint?: number }) {
  const frame = useCurrentFrame();
  const drift = (frame * 0.15) % 60;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1200px 700px at ${20 + tint * 30}% -10%, #2a2f6b 0%, ${C.navyDeep} 45%, ${C.ink} 100%)`,
        fontFamily: body,
        color: C.white,
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          backgroundPosition: `${drift}px ${drift}px`,
          opacity: 0.5,
          maskImage: "radial-gradient(90% 70% at 50% 45%, #000 30%, transparent 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(520px 520px at 88% 84%, rgba(99,102,241,0.30), transparent 70%)`,
        }}
      />
      {children}
    </AbsoluteFill>
  );
}

/** Small indigo kicker above a headline. */
export function Kicker({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const e = useEnter(delay);
  return (
    <div
      style={{
        opacity: e,
        transform: `translateY(${interpolate(e, [0, 1], [14, 0])}px)`,
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        fontFamily: display,
        fontSize: 22,
        fontWeight: 600,
        letterSpacing: 4,
        textTransform: "uppercase",
        color: C.indigoBright,
      }}
    >
      <span style={{ width: 44, height: 3, background: C.indigo, borderRadius: 2 }} />
      {children}
    </div>
  );
}

export function Headline({
  children,
  delay = 0,
  size = 78,
}: {
  children: React.ReactNode;
  delay?: number;
  size?: number;
}) {
  const e = useEnter(delay);
  return (
    <div
      style={{
        opacity: e,
        transform: `translateY(${interpolate(e, [0, 1], [26, 0])}px)`,
        fontFamily: display,
        fontSize: size,
        fontWeight: 700,
        lineHeight: 1.05,
        letterSpacing: -1.5,
      }}
    >
      {children}
    </div>
  );
}

export function Bullet({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const e = useEnter(delay);
  return (
    <div
      style={{
        opacity: e,
        transform: `translateX(${interpolate(e, [0, 1], [-22, 0])}px)`,
        display: "flex",
        alignItems: "flex-start",
        gap: 18,
        fontSize: 29,
        lineHeight: 1.45,
        color: C.mist,
      }}
    >
      <span
        style={{
          marginTop: 13,
          width: 10,
          height: 10,
          borderRadius: 10,
          background: C.indigo,
          boxShadow: `0 0 18px ${C.indigo}`,
          flexShrink: 0,
        }}
      />
      <span>{children}</span>
    </div>
  );
}

/** A macOS-ish window chrome wrapped around a real product screenshot. */
export function BrowserFrame({
  src,
  width,
  url = "cpiis.amreyahcement.com",
  delay = 0,
  offsetY = 0,
  rotate = 0,
  /** Crop from the top of the image, 0–1, to focus on content instead of chrome. */
  crop = 0,
}: {
  src: string;
  width: number;
  url?: string;
  delay?: number;
  offsetY?: number;
  rotate?: number;
  crop?: number;
}) {
  const e = useEnter(delay, 180);
  // Source screenshots are 1600x1000 CSS px (captured at 2x).
  const imgH = (width * 1000) / 1600;
  const visibleH = imgH * (1 - crop);

  return (
    <div
      style={{
        opacity: e,
        transform: `translateY(${interpolate(e, [0, 1], [40, offsetY])}px) scale(${interpolate(
          e,
          [0, 1],
          [0.94, 1]
        )}) rotate(${rotate}deg)`,
        width,
        borderRadius: 18,
        overflow: "hidden",
        border: `1px solid rgba(255,255,255,0.14)`,
        boxShadow: "0 50px 120px rgba(0,0,0,0.55)",
        background: "#0f1233",
      }}
    >
      <div
        style={{
          height: 42,
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "0 18px",
          background: "rgba(255,255,255,0.06)",
          borderBottom: `1px solid rgba(255,255,255,0.08)`,
        }}
      >
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <span key={c} style={{ width: 12, height: 12, borderRadius: 12, background: c, opacity: 0.9 }} />
        ))}
        <div
          style={{
            marginInlineStart: 16,
            flex: 1,
            height: 24,
            borderRadius: 12,
            background: "rgba(0,0,0,0.28)",
            color: C.muted,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            paddingInline: 14,
          }}
        >
          {url}
        </div>
      </div>
      <div style={{ height: visibleH, overflow: "hidden" }}>
        <Img src={staticFile(src)} style={{ width, height: imgH, display: "block", objectFit: "cover" }} />
      </div>
    </div>
  );
}

/** Phone shell for the mobile-execution screenshot. */
export function PhoneFrame({
  src,
  height,
  delay = 0,
  rotate = 0,
  /** Fraction of the phone's own height to show, 0–1 — trims trailing empty page. */
  visible = 1,
}: {
  src: string;
  height: number;
  delay?: number;
  rotate?: number;
  visible?: number;
}) {
  const e = useEnter(delay, 180);
  const fullHeight = height / visible; // scale so `height` shows `visible` of the page
  const width = (fullHeight * 430) / 932; // capture viewport aspect

  return (
    <div
      style={{
        opacity: e,
        transform: `translateY(${interpolate(e, [0, 1], [60, 0])}px) rotate(${rotate}deg)`,
        width,
        height,
        borderRadius: 46,
        padding: 12,
        background: "linear-gradient(160deg, #3a3f7d, #14173a)",
        boxShadow: "0 50px 110px rgba(0,0,0,0.6)",
        border: "1px solid rgba(255,255,255,0.16)",
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 36, overflow: "hidden" }}>
        <Img src={staticFile(src)} style={{ width: "100%", height: fullHeight - 24, display: "block" }} />
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            width: 96,
            height: 22,
            borderRadius: 20,
            background: "#0b0d24",
          }}
        />
      </div>
    </div>
  );
}

/** Number that counts up as it enters. */
export function Counter({
  value,
  suffix = "",
  label,
  delay = 0,
}: {
  value: number;
  suffix?: string;
  label: string;
  delay?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 40 });
  const shown = Math.round(interpolate(e, [0, 1], [0, value]));

  return (
    <div
      style={{
        opacity: e,
        transform: `translateY(${interpolate(e, [0, 1], [24, 0])}px)`,
        textAlign: "center",
        width: 320,
      }}
    >
      <div
        style={{
          fontFamily: display,
          fontSize: 108,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: -3,
          background: `linear-gradient(180deg, #ffffff, ${C.indigoBright})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {shown.toLocaleString("en-US")}
        {suffix}
      </div>
      <div style={{ marginTop: 14, fontSize: 22, color: C.muted, letterSpacing: 1 }}>{label}</div>
    </div>
  );
}

/** The AC roundel from the app's login screen. */
export function ACMark({ size = 120, delay = 0 }: { size?: number; delay?: number }) {
  const e = useEnter(delay, 140);
  return (
    <div
      style={{
        opacity: e,
        transform: `scale(${interpolate(e, [0, 1], [0.7, 1])})`,
        width: size,
        height: size,
        borderRadius: size,
        background: C.white,
        color: C.navy,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: display,
        fontWeight: 700,
        fontSize: size * 0.36,
        letterSpacing: -1,
        boxShadow: `0 0 90px rgba(99,102,241,0.55)`,
      }}
    >
      AC
    </div>
  );
}

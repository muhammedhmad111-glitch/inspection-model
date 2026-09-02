import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, body, display } from "../system-overview/theme";
import { enterAt, useEnter } from "../system-overview/ui";

export const PAD = 120;
export const WORKDAYS = 5; // Sun–Thu; Fri/Sat are the weekend here

export const DAYS_EN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
export const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

/**
 * Fonts and reading direction for the language being rendered. The Arabic cut
 * needs Cairo and right-to-left flow; everything else about the scenes is
 * identical, so the visual parts read this instead of taking a `lang` prop.
 */
export type Locale = { display: string; body: string; dir: "ltr" | "rtl"; days: string[] };

export const LATIN: Locale = { display, body, dir: "ltr", days: DAYS_EN };

const LocaleContext = React.createContext<Locale>(LATIN);
export const useLocale = () => React.useContext(LocaleContext);

export function LocaleProvider({ value, children }: { value: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/* ───────────────────────────── typography ───────────────────────────── */

export function Kicker({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const e = useEnter(delay);
  const L = useLocale();
  return (
    <div
      style={{
        opacity: e,
        transform: `translateY(${interpolate(e, [0, 1], [14, 0])}px)`,
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        fontFamily: L.display,
        fontSize: 22,
        fontWeight: 600,
        // Arabic letterforms join; tracking and uppercasing both break them.
        letterSpacing: L.dir === "rtl" ? 0 : 4,
        textTransform: L.dir === "rtl" ? "none" : "uppercase",
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
  const L = useLocale();
  return (
    <div
      style={{
        opacity: e,
        transform: `translateY(${interpolate(e, [0, 1], [26, 0])}px)`,
        fontFamily: L.display,
        fontSize: size,
        fontWeight: 700,
        lineHeight: L.dir === "rtl" ? 1.3 : 1.05,
        letterSpacing: L.dir === "rtl" ? 0 : -1.5,
      }}
    >
      {children}
    </div>
  );
}

/** Centred title block used at the top of most scenes. */
export function Head({
  kicker,
  headline,
  sub,
}: {
  kicker: string;
  headline: React.ReactNode;
  sub?: string;
}) {
  const e = useEnter(10);
  const L = useLocale();
  return (
    <div style={{ textAlign: "center" }}>
      <Kicker>{kicker}</Kicker>
      <div style={{ marginTop: 22 }}>
        <Headline delay={4} size={64}>
          {headline}
        </Headline>
      </div>
      {sub ? (
        <div
          style={{
            marginTop: 20,
            opacity: e,
            fontFamily: L.body,
            fontSize: 28,
            color: C.muted,
            maxWidth: 1100,
            marginInline: "auto",
            lineHeight: 1.55,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

/** Monospace code-ish chip. Always LTR — identifiers are not translated. */
export function Mono({ children, tone = C.indigoBright }: { children: React.ReactNode; tone?: string }) {
  return (
    <span
      dir="ltr"
      style={{
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "0.92em",
        color: tone,
        background: "rgba(99,102,241,0.13)",
        border: `1px solid rgba(99,102,241,0.28)`,
        borderRadius: 8,
        padding: "3px 10px",
        display: "inline-block",
      }}
    >
      {children}
    </span>
  );
}

/* ─────────────────────────────── charts ─────────────────────────────── */

/** A month grid. `mark(dayOfMonth, dow)` decides how each cell is painted. */
export function MonthGrid({
  mark,
  delay = 0,
  cell = 88,
  gap = 12,
  weeks = 4,
}: {
  mark: (dayOfMonth: number, dow: number) => { fill?: string; glow?: string; dim?: boolean } | null;
  delay?: number;
  cell?: number;
  gap?: number;
  weeks?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLocale();

  return (
    <div style={{ display: "inline-block", direction: L.dir }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(7, ${cell}px)`, gap, marginBottom: 14 }}>
        {L.days.map((d, i) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontFamily: L.display,
              fontSize: L.dir === "rtl" ? 19 : 17,
              fontWeight: 600,
              letterSpacing: L.dir === "rtl" ? 0 : 2,
              color: i >= WORKDAYS ? C.red : C.muted,
              opacity: i >= WORKDAYS ? 0.9 : 0.75,
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(7, ${cell}px)`, gap }}>
        {Array.from({ length: weeks * 7 }, (_, k) => {
          const dow = k % 7;
          const weekend = dow >= WORKDAYS;
          const m = mark(k + 1, dow);
          const e = enterAt(frame, fps, delay + k * 0.8, 200);
          return (
            <div
              key={k}
              dir="ltr"
              style={{
                width: cell,
                height: cell,
                borderRadius: 16,
                background: m?.fill ?? (weekend ? "rgba(248,113,113,0.07)" : C.panel),
                border: `1px solid ${m?.fill ? "transparent" : weekend ? "rgba(248,113,113,0.20)" : C.line}`,
                boxShadow: m?.glow ? `0 0 26px ${m.glow}` : "none",
                opacity: (m?.dim ? 0.25 : 1) * e,
                transform: `scale(${interpolate(e, [0, 1], [0.85, 1])})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: display,
                fontSize: 22,
                fontWeight: 600,
                color: m?.fill ? C.white : weekend ? "rgba(248,113,113,0.55)" : C.muted,
              }}
            >
              {k + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Horizontal bar chart of tasks per weekday. */
export function DayBars({
  values,
  delay = 0,
  max,
  danger,
  width = 760,
}: {
  values: number[];
  delay?: number;
  max: number;
  danger?: (i: number) => boolean;
  width?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLocale();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width, direction: L.dir }}>
      {values.map((v, i) => {
        const e = enterAt(frame, fps, delay + i * 5, 200);
        const hot = danger?.(i) ?? false;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: L.dir === "rtl" ? 86 : 62,
                fontFamily: L.display,
                fontSize: L.dir === "rtl" ? 21 : 20,
                fontWeight: 600,
                letterSpacing: L.dir === "rtl" ? 0 : 2,
                color: i >= WORKDAYS ? C.red : C.mist,
              }}
            >
              {L.days[i]}
            </div>
            <div style={{ flex: 1, height: 40, borderRadius: 10, background: C.panel, overflow: "hidden" }}>
              <div
                style={{
                  width: `${(v / max) * 100 * e}%`,
                  height: "100%",
                  borderRadius: 10,
                  background: hot
                    ? `linear-gradient(90deg, ${C.red}, #fca5a5)`
                    : `linear-gradient(90deg, ${C.indigo}, ${C.indigoBright})`,
                  boxShadow: hot ? `0 0 24px rgba(248,113,113,0.5)` : `0 0 24px rgba(99,102,241,0.4)`,
                  float: L.dir === "rtl" ? "right" : "left",
                }}
              />
            </div>
            <div
              dir="ltr"
              style={{
                width: 76,
                textAlign: L.dir === "rtl" ? "left" : "right",
                fontFamily: display,
                fontSize: 26,
                fontWeight: 700,
                color: hot ? C.red : C.white,
                opacity: e,
              }}
            >
              {Math.round(v * e)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

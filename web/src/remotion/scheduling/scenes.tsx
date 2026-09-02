import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, body, display, s } from "../system-overview/theme";
import { ACMark, BrowserFrame, Headline, Kicker, Stage, enterAt, useEnter } from "../system-overview/ui";

const PAD = 120;
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const WORKDAYS = 5; // Sun–Thu; Fri/Sat are the weekend here

/* ─────────────────────────── shared bits ─────────────────────────── */

/** Centred title block used at the top of most scenes. */
function Head({ kicker, headline, sub }: { kicker: string; headline: React.ReactNode; sub?: string }) {
  const e = useEnter(10);
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
            fontSize: 28,
            color: C.muted,
            maxWidth: 1100,
            marginInline: "auto",
            lineHeight: 1.45,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

/** A month grid. `mark(dayIndex)` decides how each cell is painted. */
function MonthGrid({
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

  return (
    <div style={{ display: "inline-block" }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(7, ${cell}px)`, gap, marginBottom: 14 }}>
        {DAYS.map((d, i) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontFamily: display,
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: 2,
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
function DayBars({
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width }}>
      {values.map((v, i) => {
        const e = enterAt(frame, fps, delay + i * 5, 200);
        const hot = danger?.(i) ?? false;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 62,
                fontFamily: display,
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: 2,
                color: i >= WORKDAYS ? C.red : C.mist,
              }}
            >
              {DAYS[i]}
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
                }}
              />
            </div>
            <div
              style={{
                width: 76,
                textAlign: "right",
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

/** Monospace code-ish chip. */
function Mono({ children, tone = C.indigoBright }: { children: React.ReactNode; tone?: string }) {
  return (
    <span
      style={{
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "0.92em",
        color: tone,
        background: "rgba(99,102,241,0.13)",
        border: `1px solid rgba(99,102,241,0.28)`,
        borderRadius: 8,
        padding: "3px 10px",
      }}
    >
      {children}
    </span>
  );
}

/* ───────────────────────────── 1. hook ───────────────────────────── */

export const HOOK = s(6);
export function Hook() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = useEnter(6);
  const e2 = useEnter(38);

  return (
    <Stage>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: PAD }}>
        <div
          style={{
            opacity: e,
            transform: `translateY(${interpolate(e, [0, 1], [30, 0])}px)`,
            fontFamily: display,
            fontSize: 92,
            fontWeight: 700,
            letterSpacing: -2,
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          744 recurring inspections.
        </div>
        <div
          style={{
            marginTop: 26,
            opacity: e2,
            transform: `scale(${interpolate(e2, [0, 1], [0.9, 1])})`,
            fontFamily: display,
            fontSize: 92,
            fontWeight: 700,
            letterSpacing: -2,
            background: `linear-gradient(180deg, #ffffff, ${C.indigoBright})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          None of them on a weekend.
        </div>
        <div
          style={{
            marginTop: 40,
            opacity: enterAt(frame, fps, 66, 200),
            fontSize: 30,
            color: C.muted,
          }}
        >
          Getting there took more than a loop over dates.
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

/* ──────────────────────── 2. the naive version ────────────────────── */

export const NAIVE = s(9);
export function Naive() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Every 5 days from day 2. Any cadence that is not a multiple of 7 walks across
  // the week, so it lands on the weekend roughly two days in seven.
  const hits = new Set([2, 7, 12, 17, 22, 27]);
  const flag = enterAt(frame, fps, 100, 200);

  return (
    <Stage>
      <AbsoluteFill style={{ alignItems: "center", padding: PAD, paddingTop: 90 }}>
        <Head
          kicker="the naive version"
          headline={<>Add N days. Repeat.</>}
          sub="An inspection every 5 days. The obvious implementation — and it quietly books work for days nobody is on site."
        />
        <div style={{ marginTop: 46, display: "flex", alignItems: "center", gap: 70 }}>
          <MonthGrid
            delay={26}
            mark={(day, dow) => {
              if (!hits.has(day)) return null;
              const weekend = dow >= WORKDAYS;
              return weekend
                ? { fill: `linear-gradient(160deg, ${C.red}, #b91c1c)`, glow: "rgba(248,113,113,0.55)" }
                : { fill: `linear-gradient(160deg, ${C.indigo}, ${C.navy})` };
            }}
          />
          <div style={{ width: 420, opacity: flag, transform: `translateX(${interpolate(flag, [0, 1], [30, 0])}px)` }}>
            <div style={{ fontFamily: display, fontSize: 78, fontWeight: 700, color: C.red, lineHeight: 1 }}>2 of 6</div>
            <div style={{ marginTop: 14, fontSize: 27, color: C.mist, lineHeight: 1.45 }}>
              inspections landed on <strong style={{ color: C.red }}>Friday or Saturday</strong> — the weekend in Egypt.
            </div>
            <div style={{ marginTop: 22, fontSize: 24, color: C.muted, lineHeight: 1.5 }}>
              They do not get done. They just become overdue.
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

/* ─────────────────────── 3. the naive fix fails ───────────────────── */

export const PILEUP = s(9);
export function Pileup() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const label = enterAt(frame, fps, 110, 200);

  return (
    <Stage tint={0.4}>
      <AbsoluteFill style={{ alignItems: "center", padding: PAD, paddingTop: 90 }}>
        <Head
          kicker="the obvious fix"
          headline={
            <>
              &ldquo;If it&rsquo;s a weekend, push to Sunday.&rdquo;
            </>
          }
          sub="Now nothing is scheduled on a weekend — and Sunday is unworkable."
        />
        <div style={{ marginTop: 54, display: "flex", alignItems: "center", gap: 80 }}>
          <DayBars
            delay={30}
            values={[381, 92, 88, 95, 88, 0, 0]}
            max={381}
            danger={(i) => i === 0}
            width={800}
          />
          <div style={{ width: 380, opacity: label }}>
            <div style={{ fontFamily: display, fontSize: 74, fontWeight: 700, color: C.red, lineHeight: 1 }}>381</div>
            <div style={{ marginTop: 14, fontSize: 27, color: C.mist, lineHeight: 1.45 }}>
              tasks stacked onto one morning.
            </div>
            <div style={{ marginTop: 22, fontSize: 24, color: C.muted, lineHeight: 1.5 }}>
              You moved the problem. You did not solve it.
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

/* ──────────────────── 4. a stable weekday per activity ────────────── */

export const HASH = s(10);
export function Hash() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rows = [
    { id: "a3f1…9c", day: "SUN", i: 0 },
    { id: "7b20…41", day: "WED", i: 3 },
    { id: "e5c8…d2", day: "TUE", i: 2 },
  ];

  return (
    <Stage>
      <AbsoluteFill style={{ alignItems: "center", padding: PAD, paddingTop: 84 }}>
        <Head
          kicker="step 1 — spread the load"
          headline={
            <>
              Every activity gets its own weekday.
            </>
          }
        />
        <div style={{ marginTop: 24, fontSize: 27, color: C.muted, textAlign: "center" }}>
          Derived from a hash of the activity&rsquo;s id — not a counter, not random.
        </div>

        <div style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: 20 }}>
          {rows.map((r, k) => {
            const e = enterAt(frame, fps, 45 + k * 42, 200);
            return (
              <div
                key={r.id}
                style={{
                  opacity: e,
                  transform: `translateY(${interpolate(e, [0, 1], [22, 0])}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 26,
                  fontSize: 27,
                }}
              >
                <Mono tone={C.mist}>{r.id}</Mono>
                <span style={{ color: C.muted, fontSize: 30 }}>→</span>
                <Mono>hashtextextended()</Mono>
                <span style={{ color: C.muted, fontSize: 30 }}>→</span>
                <span style={{ color: C.muted }}>mod 5</span>
                <span style={{ color: C.muted, fontSize: 30 }}>→</span>
                <span
                  style={{
                    fontFamily: display,
                    fontSize: 30,
                    fontWeight: 700,
                    letterSpacing: 2,
                    color: C.white,
                    background: `linear-gradient(160deg, ${C.indigo}, ${C.navy})`,
                    borderRadius: 12,
                    padding: "8px 20px",
                    boxShadow: `0 0 26px rgba(99,102,241,0.45)`,
                  }}
                >
                  {r.day}
                </span>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 40,
            opacity: enterAt(frame, fps, 185, 200),
            fontSize: 28,
            color: C.mist,
            textAlign: "center",
            maxWidth: 1080,
            lineHeight: 1.5,
          }}
        >
          Deterministic, so the same activity keeps the same weekday for ever.
        </div>

        {/* The payoff: 381 activities dividing themselves across the week, with
            nobody assigning anything. Lands late, under the tail of the line. */}
        <div style={{ marginTop: 34, display: "flex", gap: 16 }}>
          {[
            { d: "SUN", n: 78 },
            { d: "MON", n: 76 },
            { d: "TUE", n: 75 },
            { d: "WED", n: 77 },
            { d: "THU", n: 75 },
          ].map((c, k) => {
            const e = enterAt(frame, fps, 250 + k * 18, 200);
            return (
              <div
                key={c.d}
                style={{
                  opacity: e,
                  transform: `translateY(${interpolate(e, [0, 1], [18, 0])}px)`,
                  width: 150,
                  padding: "18px 0",
                  borderRadius: 18,
                  textAlign: "center",
                  background: C.panel,
                  border: `1px solid ${C.line}`,
                }}
              >
                <div style={{ fontFamily: display, fontSize: 17, letterSpacing: 2, color: C.muted }}>{c.d}</div>
                <div
                  style={{
                    marginTop: 6,
                    fontFamily: display,
                    fontSize: 40,
                    fontWeight: 700,
                    color: C.white,
                  }}
                >
                  {Math.round(c.n * e)}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

/* ────────────────────────── 5. snap vs roll ───────────────────────── */

export const SNAP = s(10);
export function Snap() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const arrow = enterAt(frame, fps, 60, 200);
  const rule = enterAt(frame, fps, 110, 200);

  return (
    <Stage tint={0.6}>
      <AbsoluteFill style={{ alignItems: "center", padding: PAD, paddingTop: 84 }}>
        <Head
          kicker="step 2 — land it"
          headline={<>Snap to the nearest one. Never the next one.</>}
        />

        <div style={{ marginTop: 40 }}>
          <MonthGrid
            delay={22}
            weeks={2}
            mark={(day) => {
              if (day === 13) return { fill: `linear-gradient(160deg, ${C.red}, #b91c1c)`, glow: "rgba(248,113,113,0.5)" };
              if (day === 11) return { fill: `linear-gradient(160deg, ${C.green}, #059669)`, glow: "rgba(52,211,153,0.5)" };
              return null;
            }}
          />
          <div
            style={{
              marginTop: 24,
              opacity: arrow,
              transform: `translateY(${interpolate(arrow, [0, 1], [12, 0])}px)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
              fontSize: 27,
            }}
          >
            <span style={{ color: C.red, fontWeight: 600 }}>Fri 13 — where the cadence landed</span>
            <span style={{ color: C.green, fontSize: 34 }}>→</span>
            <span style={{ color: C.green, fontWeight: 600 }}>Wed 11 — this activity&rsquo;s weekday, 2 days back</span>
          </div>
        </div>

        <div
          style={{
            marginTop: 40,
            opacity: rule,
            display: "flex",
            gap: 26,
            fontSize: 26,
            color: C.mist,
            lineHeight: 1.5,
          }}
        >
          <div
            style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              borderRadius: 18,
              padding: "22px 30px",
              maxWidth: 560,
            }}
          >
            <div style={{ fontFamily: display, fontSize: 24, fontWeight: 700, color: C.white, marginBottom: 10 }}>
              Interval ≥ 7 days
            </div>
            Snap to that activity&rsquo;s weekday, up to ±3 days. Weekly stays on the same day;
            monthly and quarterly land on it too.
          </div>
          <div
            style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              borderRadius: 18,
              padding: "22px 30px",
              maxWidth: 560,
            }}
          >
            <div style={{ fontFamily: display, fontSize: 24, fontWeight: 700, color: C.white, marginBottom: 10 }}>
              Interval &lt; 7 days
            </div>
            Daily work cannot be moved three days. It only rolls off the weekend:
            Friday and Saturday become Sunday.
          </div>
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

/* ─────────────────────────── 6. the trap ──────────────────────────── */

export const DRIFT = s(11);
export function Drift() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Wrong: each cycle measured from the corrected date, so the error compounds.
  const wrong = [1, 31, 62, 94, 127];
  const right = [1, 31, 61, 91, 121];
  const reveal = enterAt(frame, fps, 150, 200);

  const Timeline = ({
    label,
    days,
    tone,
    delay,
    note,
  }: {
    label: string;
    days: number[];
    tone: string;
    delay: number;
    note: string;
  }) => (
    <div style={{ width: 1400 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 14 }}>
        <span style={{ fontFamily: display, fontSize: 26, fontWeight: 700, color: tone }}>{label}</span>
        <span style={{ fontSize: 22, color: C.muted }}>{note}</span>
      </div>
      <div style={{ position: "relative", height: 76 }}>
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 0,
            right: 0,
            height: 3,
            background: C.line,
            borderRadius: 3,
          }}
        />
        {days.map((d, k) => {
          const e = enterAt(frame, fps, delay + k * 12, 200);
          const x = ((d - 1) / 130) * 1340;
          return (
            <div
              key={k}
              style={{
                position: "absolute",
                left: x,
                top: 18,
                opacity: e,
                transform: `scale(${interpolate(e, [0, 1], [0.5, 1])})`,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 40,
                  background: tone,
                  boxShadow: `0 0 22px ${tone}`,
                }}
              />
              <div style={{ marginTop: 8, fontSize: 18, color: C.muted, fontFamily: display }}>d{d}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <Stage>
      <AbsoluteFill style={{ alignItems: "center", padding: PAD, paddingTop: 78 }}>
        <Head
          kicker="the trap"
          headline={<>Snapping is where monthly quietly becomes something else.</>}
        />
        <div style={{ marginTop: 46, display: "flex", flexDirection: "column", gap: 34 }}>
          <Timeline
            label="Next cycle from the snapped date"
            note="every correction is carried forward"
            days={wrong}
            tone={C.red}
            delay={30}
          />
          <Timeline
            label="Next cycle from the untouched base date"
            note="corrections never accumulate"
            days={right}
            tone={C.green}
            delay={90}
          />
        </div>
        <div
          style={{
            marginTop: 34,
            opacity: reveal,
            fontSize: 30,
            color: C.mist,
            textAlign: "center",
            maxWidth: 1200,
            lineHeight: 1.5,
          }}
        >
          Four cycles in, a monthly inspection is <strong style={{ color: C.red }}>six days late</strong>.
          Compute the cadence from the base date, then snap — never snap and then measure from that.
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

/* ────────────────────────── 7. the result ─────────────────────────── */

export const RESULT = s(9);
export function Result() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const zero = enterAt(frame, fps, 120, 200);

  return (
    <Stage tint={0.3}>
      <AbsoluteFill style={{ alignItems: "center", padding: PAD, paddingTop: 90 }}>
        <Head kicker="the result" headline={<>744 tasks, spread by themselves.</>} />
        <div style={{ marginTop: 50, display: "flex", alignItems: "center", gap: 90 }}>
          <DayBars delay={28} values={[152, 165, 138, 158, 131, 0, 0]} max={200} width={820} />
          <div style={{ width: 360, opacity: zero }}>
            <div
              style={{
                fontFamily: display,
                fontSize: 108,
                fontWeight: 700,
                lineHeight: 1,
                background: `linear-gradient(180deg, #ffffff, ${C.green})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              0
            </div>
            <div style={{ marginTop: 14, fontSize: 28, color: C.mist, lineHeight: 1.45 }}>
              tasks on a Friday or Saturday.
            </div>
            <div style={{ marginTop: 22, fontSize: 24, color: C.muted, lineHeight: 1.5 }}>
              131–165 per working day, with no one assigning anything by hand.
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

/* ────────────────────────── 8. in the app ─────────────────────────── */

export const SCREEN = s(8);
export function Screen() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Stage>
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", padding: PAD, gap: 70 }}>
        <div style={{ width: 620, flexShrink: 0 }}>
          <Kicker>in the product</Kicker>
          <div style={{ marginTop: 24 }}>
            <Headline delay={4} size={58}>
              One button. A 30-day horizon.
            </Headline>
          </div>
          <div style={{ marginTop: 26, fontSize: 27, color: C.mist, lineHeight: 1.55 }}>
            The engine runs as a Postgres function, so the rules live next to the data — not in
            a job server that can quietly stop.
          </div>
          <div
            style={{
              marginTop: 30,
              opacity: enterAt(frame, fps, 50, 200),
              fontSize: 25,
              color: C.muted,
              lineHeight: 1.6,
            }}
          >
            Completing a task spawns its next cycle on the spot, already snapped to the right
            weekday.
          </div>
        </div>
        <BrowserFrame src="video/scheduling.png" width={1010} delay={14} crop={0.05} />
      </AbsoluteFill>
    </Stage>
  );
}

/* ───────────────────────────── 9. outro ───────────────────────────── */

export const OUTRO = s(6);
export function Outro({ author }: { author: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = useEnter(20);

  return (
    <Stage tint={0.5}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: PAD }}>
        <ACMark size={112} delay={4} />
        <div
          style={{
            marginTop: 34,
            opacity: e,
            fontFamily: display,
            fontSize: 66,
            fontWeight: 700,
            letterSpacing: -1.5,
            textAlign: "center",
            lineHeight: 1.15,
            maxWidth: 1300,
          }}
        >
          A scheduler is not a loop over dates.
        </div>
        <div
          style={{
            marginTop: 22,
            opacity: enterAt(frame, fps, 46, 200),
            fontSize: 29,
            color: C.mist,
            textAlign: "center",
          }}
        >
          It is a set of decisions about the week people actually work.
        </div>
        <div
          style={{
            marginTop: 46,
            opacity: enterAt(frame, fps, 74, 200),
            fontSize: 23,
            color: C.muted,
            letterSpacing: 3,
            textTransform: "uppercase",
            fontFamily: display,
          }}
        >
          CPIIS · {author}
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, body, display, s } from "./theme";
import {
  ACMark,
  BrowserFrame,
  Bullet,
  Counter,
  Headline,
  Kicker,
  PhoneFrame,
  Stage,
  enterAt,
  useEnter,
} from "./ui";

/* ─────────────────────────── shared bits ─────────────────────────── */

const PAD = 120;

/** Standard split layout: copy on the left, product shot on the right. */
function Split({
  kicker,
  headline,
  bullets,
  children,
  copyWidth = 700,
}: {
  kicker: string;
  headline: React.ReactNode;
  bullets: string[];
  children: React.ReactNode;
  copyWidth?: number;
}) {
  return (
    <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", padding: PAD, gap: 70 }}>
      <div style={{ width: copyWidth, flexShrink: 0 }}>
        <Kicker>{kicker}</Kicker>
        <div style={{ marginTop: 26 }}>
          <Headline delay={4} size={68}>
            {headline}
          </Headline>
        </div>
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 24 }}>
          {bullets.map((b, i) => (
            <Bullet key={b} delay={16 + i * 8}>
              {b}
            </Bullet>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </AbsoluteFill>
  );
}

/* ─────────────────────────── 01 · hook ─────────────────────────── */

export const HOOK = s(5);
export function Hook() {
  const lines = [
    ["133", "critical assets."],
    ["381", "inspection activities."],
    ["744", "recurring tasks."],
  ];
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = useEnter(72);

  return (
    <Stage>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {lines.map(([n, t], i) => {
            const le = enterAt(frame, fps, i * 11);
            return (
              <div
                key={n}
                style={{
                  opacity: le,
                  transform: `translateX(${interpolate(le, [0, 1], [-40, 0])}px)`,
                  display: "flex",
                  alignItems: "baseline",
                  gap: 26,
                  fontFamily: display,
                  fontSize: 86,
                  fontWeight: 700,
                  letterSpacing: -2,
                }}
              >
                <span style={{ color: C.indigoBright, minWidth: 200 }}>{n}</span>
                <span style={{ color: "rgba(255,255,255,0.92)" }}>{t}</span>
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 54,
            opacity: e,
            transform: `translateY(${interpolate(e, [0, 1], [18, 0])}px)`,
            fontSize: 40,
            color: C.mist,
          }}
        >
          One cement plant. <span style={{ color: C.white, fontWeight: 600 }}>Zero paper checklists.</span>
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

/* ─────────────────────────── 02 · title ─────────────────────────── */

export const TITLE = s(5);
export function Title() {
  const e = useEnter(14);
  const e2 = useEnter(26);
  return (
    <Stage tint={1}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <ACMark size={132} />
        <div
          style={{
            marginTop: 40,
            opacity: e,
            transform: `translateY(${interpolate(e, [0, 1], [22, 0])}px)`,
            fontFamily: display,
            fontSize: 150,
            fontWeight: 700,
            letterSpacing: 6,
            lineHeight: 1,
          }}
        >
          CPIIS
        </div>
        <div
          style={{
            marginTop: 24,
            opacity: e2,
            fontSize: 40,
            color: C.mist,
            letterSpacing: 1,
          }}
        >
          Cement Plant Inspection Intelligence System
        </div>
        <div
          style={{
            marginTop: 34,
            opacity: e2,
            display: "flex",
            gap: 14,
            fontSize: 21,
            letterSpacing: 2,
            color: C.indigoBright,
            textTransform: "uppercase",
            fontFamily: display,
            fontWeight: 600,
          }}
        >
          {["Amreyah Cement", "Arabic-first · RTL", "Built end-to-end"].map((t) => (
            <span
              key={t}
              style={{
                padding: "10px 20px",
                border: `1px solid rgba(129,140,248,0.4)`,
                borderRadius: 999,
                background: "rgba(99,102,241,0.10)",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

/* ─────────────────────────── 03 · the problem ─────────────────────────── */

export const PROBLEM = s(6);
export function Problem() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = [
    { icon: "📋", t: "Paper checklists", d: "Filled on the floor, filed in a drawer, never analysed." },
    { icon: "💬", t: "Findings in chat", d: "A photo in a group thread is not a maintenance backlog." },
    { icon: "🕳️", t: "No traceability", d: "Who inspected what, when — and what happened next?" },
  ];

  return (
    <Stage>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD }}>
        <Kicker>The problem</Kicker>
        <div style={{ marginTop: 26 }}>
          <Headline delay={4} size={64}>
            Inspections generate data.
            <br />
            Most plants throw it away.
          </Headline>
        </div>
        <div style={{ marginTop: 62, display: "flex", gap: 30 }}>
          {items.map((it, i) => {
            const e = enterAt(frame, fps, 30 + i * 10);
            const strike = interpolate(frame, [120 + i * 8, 150 + i * 8], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={it.t}
                style={{
                  opacity: e,
                  transform: `translateY(${interpolate(e, [0, 1], [30, 0])}px)`,
                  flex: 1,
                  padding: 38,
                  borderRadius: 22,
                  background: C.panel,
                  border: `1px solid ${C.line}`,
                }}
              >
                <div style={{ fontSize: 44 }}>{it.icon}</div>
                <div
                  style={{
                    marginTop: 20,
                    fontFamily: display,
                    fontSize: 36,
                    fontWeight: 700,
                    position: "relative",
                    display: "inline-block",
                  }}
                >
                  {it.t}
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "55%",
                      height: 4,
                      width: `${strike * 100}%`,
                      background: C.red,
                      borderRadius: 3,
                    }}
                  />
                </div>
                <div style={{ marginTop: 16, fontSize: 24, lineHeight: 1.5, color: C.muted }}>{it.d}</div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

/* ─────────────────────────── 04 · asset hierarchy ─────────────────────────── */

export const HIERARCHY = s(8);
export function Hierarchy() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const levels = [
    { t: "Areas", n: "Raw mill · Kiln · Cement mill · Packing" },
    { t: "Sections", n: "Functional groups inside each area" },
    { t: "Equipment", n: "133 machines, each with its own location code" },
    { t: "Parts", n: "The component an inspector actually touches" },
  ];

  return (
    <Stage>
      <Split
        kicker="01 · Master data"
        headline={
          <>
            The whole plant,
            <br />
            in one tree.
          </>
        }
        bullets={[
          "Duplicates stay distinguishable — name + functional location + description.",
          "Criticality and status carried on every asset.",
        ]}
        copyWidth={560}
      >
        <div style={{ display: "flex", gap: 34, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {levels.map((l, i) => {
              const e = enterAt(frame, fps, 20 + i * 9);
              return (
                <div
                  key={l.t}
                  style={{
                    opacity: e,
                    transform: `translateX(${interpolate(e, [0, 1], [30, 0])}px)`,
                    marginInlineStart: i * 26,
                    padding: "15px 22px",
                    borderRadius: 16,
                    background: "rgba(99,102,241,0.14)",
                    border: `1px solid rgba(129,140,248,0.35)`,
                    width: 360,
                  }}
                >
                  <div style={{ fontFamily: display, fontSize: 27, fontWeight: 700 }}>{l.t}</div>
                  <div style={{ fontSize: 17, color: C.muted, marginTop: 4, lineHeight: 1.3 }}>{l.n}</div>
                </div>
              );
            })}
          </div>
          <BrowserFrame src="video/equipment.png" width={430} delay={40} rotate={1.5} crop={0.06} />
        </div>
      </Split>
    </Stage>
  );
}

/* ─────────────────────────── 05 · library + scheduling ─────────────────────────── */

export const LIBRARY = s(8.5);
export function Library() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const frame = useCurrentFrame();

  return (
    <Stage tint={1}>
      <Split
        kicker="02 · Library & scheduling"
        headline={
          <>
            Write the checklist once.
            <br />
            It schedules itself forever.
          </>
        }
        bullets={[
          "Templates → activities → tasks → checklist items.",
          "Daily, weekly, monthly, quarterly or custom cadence.",
          "Completing a task spawns the next cycle automatically.",
        ]}
        copyWidth={660}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 26, alignItems: "center" }}>
          <BrowserFrame src="video/scheduling.png" width={720} delay={22} crop={0.08} />
          <div
            style={{
              display: "flex",
              gap: 12,
              padding: "20px 24px",
              borderRadius: 18,
              background: C.panel,
              border: `1px solid ${C.line}`,
            }}
          >
            {days.map((d, i) => {
              const off = i > 4;
              const fill = interpolate(frame, [60 + i * 6, 84 + i * 6], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <div key={d} style={{ textAlign: "center", width: 78 }}>
                  <div style={{ fontSize: 18, color: off ? C.muted : C.mist, marginBottom: 10 }}>{d}</div>
                  <div
                    style={{
                      height: 90,
                      borderRadius: 12,
                      background: off ? "rgba(255,255,255,0.05)" : "rgba(99,102,241,0.16)",
                      border: `1px solid ${off ? C.line : "rgba(129,140,248,0.4)"}`,
                      display: "flex",
                      alignItems: "flex-end",
                      overflow: "hidden",
                    }}
                  >
                    {!off && (
                      <div
                        style={{
                          width: "100%",
                          height: `${fill * (62 + ((i * 13) % 22))}%`,
                          background: `linear-gradient(180deg, ${C.indigoBright}, ${C.indigo})`,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 22, color: C.muted }}>
            Work week Sun–Thu — tasks spread evenly, never piled on one day, never on a weekend.
          </div>
        </div>
      </Split>
    </Stage>
  );
}

/* ─────────────────────────── 06 · execution ─────────────────────────── */

export const EXECUTION = s(8.5);
export function Execution() {
  return (
    <Stage>
      <Split
        kicker="03 · Execution"
        headline={
          <>
            The inspector works
            <br />
            from a phone, on the floor.
          </>
        }
        bullets={[
          "42-item checklists, one tap per component.",
          "Record condition, notes and photo evidence in place.",
          "Same app, same data — no separate mobile build.",
        ]}
        copyWidth={620}
      >
        <div style={{ position: "relative", width: 880, height: 560 }}>
          <div style={{ position: "absolute", right: 0, top: 60 }}>
            <BrowserFrame src="video/tasks.png" width={480} delay={16} rotate={-1.5} crop={0.14} />
          </div>
          <div style={{ position: "absolute", left: 0, top: 10 }}>
            <PhoneFrame src="video/task-mobile.png" height={500} delay={34} rotate={-3} visible={0.62} />
          </div>
        </div>
      </Split>
    </Stage>
  );
}

/* ─────────────────────────── 07 · findings → actions ─────────────────────────── */

export const FINDINGS = s(8);
export function Findings() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = useEnter(46);
  return (
    <Stage tint={1}>
      <AbsoluteFill style={{ justifyContent: "center", padding: PAD }}>
        <Kicker>04 · Findings → maintenance</Kicker>
        <div style={{ marginTop: 22 }}>
          <Headline delay={4} size={62}>
            A finding is not a note. It&apos;s a work item with an owner.
          </Headline>
        </div>
        <div
          style={{
            marginTop: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 44,
          }}
        >
          <BrowserFrame src="video/findings.png" width={640} delay={20} crop={0.42} />
          <div
            style={{
              opacity: e,
              transform: `scale(${interpolate(e, [0, 1], [0.6, 1])})`,
              fontSize: 64,
              color: C.indigoBright,
            }}
          >
            →
          </div>
          <BrowserFrame src="video/actions.png" width={640} delay={54} crop={0.42} />
        </div>
        <div style={{ marginTop: 40, display: "flex", gap: 16, justifyContent: "center" }}>
          {["Severity", "Priority", "Owner", "Due date", "MTTR tracked"].map((t, i) => {
            const ce = enterAt(frame, fps, 70 + i * 6);
            return (
              <span
                key={t}
                style={{
                  opacity: ce,
                  padding: "12px 24px",
                  borderRadius: 999,
                  border: `1px solid rgba(129,140,248,0.4)`,
                  background: "rgba(99,102,241,0.12)",
                  fontSize: 23,
                  color: C.mist,
                }}
              >
                {t}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

/* ─────────────────────────── 08 · dashboards ─────────────────────────── */

export const DASHBOARDS = s(9);
export function Dashboards() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shots = ["video/dashboard.png", "video/dashboard-tab1.png", "video/dashboard-tab2.png", "video/dashboard-tab3.png"];
  const tabs = ["Overview", "Equipment reliability", "Maintenance performance", "Compliance & coverage"];
  const per = 56;
  const active = Math.min(shots.length - 1, Math.floor(Math.max(0, frame - 24) / per));

  return (
    <Stage>
      <AbsoluteFill style={{ alignItems: "center", padding: 70 }}>
        <Kicker>05 · Analytics</Kicker>
        <div style={{ marginTop: 18, textAlign: "center" }}>
          <Headline delay={4} size={60}>
            Four dashboards. Every KPI a plant manager asks for.
          </Headline>
        </div>

        <div style={{ marginTop: 26, display: "flex", gap: 12 }}>
          {tabs.map((t, i) => (
            <span
              key={t}
              style={{
                padding: "11px 22px",
                borderRadius: 999,
                fontSize: 21,
                border: `1px solid ${i === active ? "rgba(129,140,248,0.7)" : C.line}`,
                background: i === active ? "rgba(99,102,241,0.25)" : "transparent",
                color: i === active ? C.white : C.muted,
              }}
            >
              {t}
            </span>
          ))}
        </div>

        <div style={{ marginTop: 26, position: "relative", width: 1140, height: 480 }}>
          {shots.map((src, i) => {
            const start = 24 + i * per;
            const o = interpolate(frame, [start - 10, start + 8, start + per - 6, start + per + 8], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div key={src} style={{ position: "absolute", inset: 0, opacity: i === 0 ? Math.max(o, frame < 24 ? 0 : 0) : o }}>
                <div
                  style={{
                    width: 1140,
                    borderRadius: 18,
                    overflow: "hidden",
                    border: `1px solid rgba(255,255,255,0.14)`,
                    boxShadow: "0 50px 120px rgba(0,0,0,0.55)",
                  }}
                >
                  <div
                    style={{
                      height: 480,
                      overflow: "hidden",
                      // Soften the hard crop so it reads as a viewport, not a cut-off image.
                      maskImage: "linear-gradient(180deg, #000 86%, transparent 100%)",
                    }}
                  >
                    <Img
                      src={staticFile(src)}
                      style={{ width: 1140, height: 712, display: "block", objectPosition: "top" }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 26, display: "flex", gap: 14 }}>
          {["Schedule compliance", "Inspection coverage", "MTTR", "Backlog aging", "Criticality-weighted risk"].map(
            (t, i) => {
              const ce = enterAt(frame, fps, 30 + i * 6);
              return (
                <span
                  key={t}
                  style={{
                    opacity: ce,
                    padding: "12px 22px",
                    borderRadius: 999,
                    background: C.panel,
                    border: `1px solid ${C.line}`,
                    fontSize: 22,
                    color: C.mist,
                  }}
                >
                  {t}
                </span>
              );
            }
          )}
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

/* ─────────────────────────── 09 · reports ─────────────────────────── */

export const REPORTS = s(7.5);
export function Reports() {
  const frame = useCurrentFrame();
  const fly = interpolate(frame, [90, 140], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <Stage tint={1}>
      <Split
        kicker="06 · Reporting"
        headline={
          <>
            The daily report
            <br />
            writes and sends itself.
          </>
        }
        bullets={[
          "One click builds a formatted PDF of today's inspections, findings and actions.",
          "Recipients resolved from the manager roster, plus any manual address.",
          "Delivered by an edge function over SMTP — attachment included.",
        ]}
        copyWidth={680}
      >
        <div style={{ position: "relative", width: 700, height: 560 }}>
          <BrowserFrame src="video/reports.png" width={620} delay={18} crop={0.3} />
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 250,
              transform: `translate(${fly * 180}px, ${-fly * 120}px) scale(${1 - fly * 0.15})`,
              opacity: interpolate(fly, [0, 0.1, 0.85, 1], [0, 1, 1, 0]),
              width: 260,
              padding: 26,
              borderRadius: 18,
              background: "linear-gradient(160deg, #ffffff, #dfe2f5)",
              color: C.navyDeep,
              boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ fontFamily: display, fontWeight: 700, fontSize: 26 }}>Daily Report</div>
            <div style={{ fontSize: 17, opacity: 0.7, marginTop: 6 }}>PDF · completed · findings · actions</div>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 7 }}>
              {[1, 0.8, 0.92, 0.6].map((w, i) => (
                <div key={i} style={{ height: 8, width: `${w * 100}%`, background: "rgba(37,42,94,0.18)", borderRadius: 4 }} />
              ))}
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              right: -20,
              top: 150,
              opacity: fly,
              transform: `scale(${0.8 + fly * 0.2})`,
              fontSize: 88,
            }}
          >
            ✉️
          </div>
        </div>
      </Split>
    </Stage>
  );
}

/* ─────────────────────────── 10 · roles & permissions ─────────────────────────── */

export const RBAC = s(8);
const ROLES = [
  "Inspection Manager",
  "Inspection Section Head",
  "Inspection Engineer",
  "Maintenance Manager",
  "Maintenance Engineer",
  "Preparation Engineer",
];
const PERMS = ["Master data", "Execute", "Findings", "Maint.", "Escalate", "Reports", "Audit"];
// Which cells light up — mirrors the seeded matrix shape in the app.
const GRANTS: boolean[][] = [
  [true, true, true, false, true, true, true],
  [false, true, true, false, true, true, false],
  [false, true, true, false, false, true, false],
  [false, false, true, true, true, true, true],
  [false, false, true, true, false, true, false],
  [true, true, false, false, false, true, false],
];

export function Rbac() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Stage>
      <Split
        kicker="07 · Access control"
        headline={
          <>
            11 roles. 8 permissions.
            <br />
            One live matrix.
          </>
        }
        bullets={[
          "The GM ticks a box — access changes instantly, no redeploy.",
          "Enforced by row-level security in Postgres, not just hidden buttons.",
          "New sign-ups land as Pending until the GM approves them.",
        ]}
        copyWidth={600}
      >
        <div
          style={{
            padding: 30,
            borderRadius: 22,
            background: C.panel,
            border: `1px solid ${C.line}`,
            fontSize: 18,
          }}
        >
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 230 }} />
            {PERMS.map((p) => (
              <div
                key={p}
                style={{
                  width: 84,
                  fontSize: 15,
                  color: C.muted,
                  textAlign: "center",
                  lineHeight: 1.2,
                }}
              >
                {p}
              </div>
            ))}
          </div>
          {ROLES.map((r, ri) => {
            const e = enterAt(frame, fps, 14 + ri * 7);
            return (
              <div
                key={r}
                style={{
                  opacity: e,
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  padding: "9px 0",
                  borderTop: `1px solid ${C.line}`,
                }}
              >
                <div style={{ width: 230, fontSize: 20, color: C.mist }}>{r}</div>
                {PERMS.map((p, pi) => {
                  const on = GRANTS[ri][pi];
                  const at = 40 + ri * 7 + pi * 4;
                  const lit = on ? interpolate(frame, [at, at + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
                  return (
                    <div
                      key={p}
                      style={{
                        width: 84,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 9,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: on ? `rgba(99,102,241,${0.15 + lit * 0.6})` : "rgba(255,255,255,0.04)",
                          border: `1px solid ${on ? `rgba(129,140,248,${0.2 + lit * 0.7})` : C.line}`,
                          color: C.white,
                          fontSize: 19,
                          opacity: on ? 0.4 + lit * 0.6 : 1,
                        }}
                      >
                        {on ? "✓" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </Split>
    </Stage>
  );
}

/* ─────────────────────────── 11 · user journey ─────────────────────────── */

export const JOURNEY = s(10);
const STEPS = [
  { n: "01", t: "Sign up", d: "Engineer requests access" },
  { n: "02", t: "GM approves", d: "Role + permissions granted" },
  { n: "03", t: "Task appears", d: "Auto-scheduled on a work day" },
  { n: "04", t: "Inspect", d: "Checklist + photos on a phone" },
  { n: "05", t: "Raise finding", d: "Severity, part, evidence" },
  { n: "06", t: "Close action", d: "Maintenance completes the fix" },
  { n: "07", t: "KPIs update", d: "Dashboard + daily report" },
];

export function Journey() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = interpolate(frame, [30, 250], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <Stage tint={1}>
      <AbsoluteFill style={{ justifyContent: "center", padding: 90 }}>
        <Kicker>How a user actually works</Kicker>
        <div style={{ marginTop: 22 }}>
          <Headline delay={4} size={62}>
            From sign-up to closed finding.
          </Headline>
        </div>

        <div style={{ marginTop: 80, position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: 46,
              left: 40,
              right: 40,
              height: 3,
              background: C.line,
              borderRadius: 3,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 46,
              left: 40,
              width: `calc((100% - 80px) * ${progress})`,
              height: 3,
              background: `linear-gradient(90deg, ${C.indigo}, ${C.indigoBright})`,
              borderRadius: 3,
              boxShadow: `0 0 22px ${C.indigo}`,
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {STEPS.map((st, i) => {
              const at = 34 + i * 30;
              const e = enterAt(frame, fps, at, 160);
              return (
                <div key={st.n} style={{ width: 200, textAlign: "center", opacity: 0.35 + e * 0.65 }}>
                  <div
                    style={{
                      width: 92,
                      height: 92,
                      margin: "0 auto",
                      borderRadius: 92,
                      background: `rgba(99,102,241,${0.1 + e * 0.35})`,
                      border: `2px solid rgba(129,140,248,${0.25 + e * 0.65})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: display,
                      fontSize: 30,
                      fontWeight: 700,
                      transform: `scale(${0.85 + e * 0.15})`,
                      boxShadow: e > 0.5 ? `0 0 40px rgba(99,102,241,0.45)` : "none",
                    }}
                  >
                    {st.n}
                  </div>
                  <div style={{ marginTop: 22, fontFamily: display, fontSize: 28, fontWeight: 700 }}>{st.t}</div>
                  <div style={{ marginTop: 8, fontSize: 19, color: C.muted, lineHeight: 1.4 }}>{st.d}</div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

/* ─────────────────────────── 12 · numbers ─────────────────────────── */

export const NUMBERS = s(6.5);
export function Numbers() {
  return (
    <Stage>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: PAD }}>
        <Kicker>Live in production</Kicker>
        <div style={{ marginTop: 60, display: "flex", gap: 74 }}>
          <Counter value={133} label="Equipment tracked" delay={10} />
          <Counter value={381} label="Inspection activities" delay={22} />
          <Counter value={744} label="Scheduled tasks" delay={34} />
        </div>
        <div style={{ marginTop: 74, display: "flex", gap: 74 }}>
          <Counter value={11} label="Roles" delay={46} />
          <Counter value={8} label="Permission keys" delay={56} />
          <Counter value={5} label="Working days / week" delay={66} />
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

/* ─────────────────────────── 13 · stack ─────────────────────────── */

export const STACK = s(5.5);
export function Stack() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rows = [
    ["Next.js 16", "React 19", "TypeScript", "Tailwind"],
    ["Supabase", "Postgres + RLS", "Edge Functions", "Storage"],
    ["Vercel", "Remotion", "jsPDF", "shadcn/ui"],
  ];
  return (
    <Stage tint={1}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: PAD }}>
        <Kicker>Built with</Kicker>
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 20 }}>
          {rows.map((row, ri) => (
            <div key={ri} style={{ display: "flex", gap: 20, justifyContent: "center" }}>
              {row.map((t, i) => {
                const e = enterAt(frame, fps, 10 + ri * 8 + i * 5);
                return (
                  <div
                    key={t}
                    style={{
                      opacity: e,
                      transform: `translateY(${interpolate(e, [0, 1], [24, 0])}px)`,
                      padding: "24px 44px",
                      borderRadius: 18,
                      background: C.panel,
                      border: `1px solid ${C.line}`,
                      fontFamily: display,
                      fontSize: 34,
                      fontWeight: 600,
                    }}
                  >
                    {t}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 52, fontSize: 26, color: C.muted }}>
          Row-level security, audit trail and attachments included — not bolted on later.
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

/* ─────────────────────────── 14 · outro ─────────────────────────── */

export const OUTRO = s(6);
export function Outro({ author }: { author: string }) {
  const e = useEnter(16);
  const e2 = useEnter(32);
  return (
    <Stage>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <ACMark size={110} />
        <div
          style={{
            marginTop: 34,
            opacity: e,
            fontFamily: display,
            fontSize: 108,
            fontWeight: 700,
            letterSpacing: 5,
          }}
        >
          CPIIS
        </div>
        <div style={{ marginTop: 18, opacity: e, fontSize: 34, color: C.mist }}>
          Inspection, findings, maintenance and reporting — end to end.
        </div>
        <div
          style={{
            marginTop: 54,
            opacity: e2,
            paddingTop: 34,
            borderTop: `1px solid ${C.line}`,
            fontSize: 26,
            color: C.muted,
            fontFamily: body,
          }}
        >
          Designed &amp; built by <span style={{ color: C.white, fontWeight: 600 }}>{author}</span> · Amreyah Cement
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

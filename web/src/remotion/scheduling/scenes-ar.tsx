import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, s } from "../system-overview/theme";
import { ACMark, BrowserFrame, Stage, enterAt, useEnter } from "../system-overview/ui";
import { DayBars, Head, Headline, Kicker, MonthGrid, Mono, PAD, useLocale } from "./parts";

/* ─────────────────────────────── 1. hook ─────────────────────────────── */

export const HOOK = s(6);
export function Hook() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLocale();
  const e = useEnter(6);
  const e2 = useEnter(38);

  return (
    <Stage>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: PAD }}>
        <div
          style={{
            opacity: e,
            transform: `translateY(${interpolate(e, [0, 1], [30, 0])}px)`,
            fontFamily: L.display,
            fontSize: 82,
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          744 مهمة فحص دورية.
        </div>
        <div
          style={{
            marginTop: 20,
            opacity: e2,
            transform: `scale(${interpolate(e2, [0, 1], [0.9, 1])})`,
            fontFamily: L.display,
            fontSize: 82,
            fontWeight: 700,
            lineHeight: 1.3,
            background: `linear-gradient(180deg, #ffffff, ${C.indigoBright})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          ولا واحدة في يوم إجازة.
        </div>
        <div
          style={{
            marginTop: 40,
            opacity: enterAt(frame, fps, 66, 200),
            fontFamily: L.body,
            fontSize: 30,
            color: C.muted,
          }}
        >
          الوصول لده احتاج أكتر من لوب على التواريخ.
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

/* ────────────────────────── 2. the naive version ─────────────────────── */

export const NAIVE = s(9);
export function Naive() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLocale();
  const hits = new Set([2, 7, 12, 17, 22, 27]);
  const flag = enterAt(frame, fps, 100, 200);

  return (
    <Stage>
      <AbsoluteFill style={{ alignItems: "center", padding: PAD, paddingTop: 84 }}>
        <Head
          kicker="الطريقة البديهية"
          headline={<>زوّد عدد أيام. وكرّر.</>}
          sub="فحص كل 5 أيام. أبسط تنفيذ ممكن — وبيحجز شغل في أيام محدش فيها في الموقع."
        />
        <div style={{ marginTop: 42, display: "flex", alignItems: "center", gap: 70 }}>
          <MonthGrid
            delay={26}
            mark={(day, dow) => {
              if (!hits.has(day)) return null;
              return dow >= 5
                ? { fill: `linear-gradient(160deg, ${C.red}, #b91c1c)`, glow: "rgba(248,113,113,0.55)" }
                : { fill: `linear-gradient(160deg, ${C.indigo}, ${C.navy})` };
            }}
          />
          <div
            style={{
              width: 430,
              opacity: flag,
              transform: `translateX(${interpolate(flag, [0, 1], [-30, 0])}px)`,
            }}
          >
            <div style={{ fontFamily: L.display, fontSize: 74, fontWeight: 700, color: C.red, lineHeight: 1.2 }}>
              2 من 6
            </div>
            <div style={{ marginTop: 14, fontFamily: L.body, fontSize: 27, color: C.mist, lineHeight: 1.6 }}>
              فحوصات وقعت يوم <strong style={{ color: C.red }}>جمعة أو سبت</strong> — إجازة المصنع.
            </div>
            <div style={{ marginTop: 22, fontFamily: L.body, fontSize: 24, color: C.muted, lineHeight: 1.6 }}>
              مش بتتعمل. بتتحول لمتأخرات وبس.
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

/* ───────────────────────── 3. the naive fix fails ────────────────────── */

export const PILEUP = s(9);
export function Pileup() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLocale();
  const label = enterAt(frame, fps, 110, 200);

  return (
    <Stage tint={0.4}>
      <AbsoluteFill style={{ alignItems: "center", padding: PAD, paddingTop: 84 }}>
        <Head
          kicker="الحل الأول اللي بييجي في البال"
          headline={<>«لو وقع في إجازة، رحّله للأحد».</>}
          sub="دلوقتي مفيش حاجة في الويك إند — والأحد بقى مستحيل."
        />
        <div style={{ marginTop: 50, display: "flex", alignItems: "center", gap: 80 }}>
          <DayBars delay={30} values={[381, 92, 88, 95, 88, 0, 0]} max={381} danger={(i) => i === 0} width={800} />
          <div style={{ width: 380, opacity: label }}>
            <div style={{ fontFamily: L.display, fontSize: 72, fontWeight: 700, color: C.red, lineHeight: 1.2 }}>
              381
            </div>
            <div style={{ marginTop: 14, fontFamily: L.body, fontSize: 27, color: C.mist, lineHeight: 1.6 }}>
              مهمة مكوّمة على صباح واحد.
            </div>
            <div style={{ marginTop: 22, fontFamily: L.body, fontSize: 24, color: C.muted, lineHeight: 1.6 }}>
              نقلت المشكلة. ما حليتهاش.
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

/* ──────────────────── 4. a stable weekday per activity ───────────────── */

export const HASH = s(10);
export function Hash() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLocale();

  const rows = [
    { id: "a3f1…9c", day: "الأحد" },
    { id: "7b20…41", day: "الأربعاء" },
    { id: "e5c8…d2", day: "الثلاثاء" },
  ];

  return (
    <Stage>
      <AbsoluteFill style={{ alignItems: "center", padding: PAD, paddingTop: 78 }}>
        <Head
          kicker="الخطوة 1 — وزّع الحمل"
          headline={<>كل نشاط بياخد يومه الثابت.</>}
          sub="محسوب من بصمة رقم النشاط — مش عدّاد، ومش عشوائي."
        />

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
                  gap: 24,
                  fontFamily: L.body,
                  fontSize: 26,
                }}
              >
                <Mono tone={C.mist}>{r.id}</Mono>
                <span style={{ color: C.muted, fontSize: 30 }}>←</span>
                <Mono>hash</Mono>
                <span style={{ color: C.muted, fontSize: 30 }}>←</span>
                <span style={{ color: C.muted }}>باقي القسمة على 5</span>
                <span style={{ color: C.muted, fontSize: 30 }}>←</span>
                <span
                  style={{
                    fontFamily: L.display,
                    fontSize: 28,
                    fontWeight: 700,
                    color: C.white,
                    background: `linear-gradient(160deg, ${C.indigo}, ${C.navy})`,
                    borderRadius: 12,
                    padding: "8px 22px",
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
            marginTop: 38,
            opacity: enterAt(frame, fps, 185, 200),
            fontFamily: L.body,
            fontSize: 28,
            color: C.mist,
            textAlign: "center",
          }}
        >
          حتمي — فالنشاط بيفضل على نفس اليوم للأبد.
        </div>

        <div style={{ marginTop: 32, display: "flex", gap: 16, direction: "rtl" }}>
          {[
            { d: "الأحد", n: 78 },
            { d: "الاثنين", n: 76 },
            { d: "الثلاثاء", n: 75 },
            { d: "الأربعاء", n: 77 },
            { d: "الخميس", n: 75 },
          ].map((c, k) => {
            const e = enterAt(frame, fps, 250 + k * 18, 200);
            return (
              <div
                key={c.d}
                style={{
                  opacity: e,
                  transform: `translateY(${interpolate(e, [0, 1], [18, 0])}px)`,
                  width: 160,
                  padding: "16px 0",
                  borderRadius: 18,
                  textAlign: "center",
                  background: C.panel,
                  border: `1px solid ${C.line}`,
                }}
              >
                <div style={{ fontFamily: L.display, fontSize: 19, color: C.muted }}>{c.d}</div>
                <div dir="ltr" style={{ marginTop: 4, fontFamily: L.display, fontSize: 38, fontWeight: 700, color: C.white }}>
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

/* ─────────────────────────── 5. snap vs roll ─────────────────────────── */

export const SNAP = s(10);
function SnapCard({ title, children }: { title: string; children: React.ReactNode }) {
  const L = useLocale();

  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderRadius: 18,
        padding: "22px 30px",
        maxWidth: 560,
        fontFamily: L.body,
        fontSize: 25,
        color: C.mist,
        lineHeight: 1.65,
      }}
    >
      <div style={{ fontFamily: L.display, fontSize: 24, fontWeight: 700, color: C.white, marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export function Snap() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLocale();
  const arrow = enterAt(frame, fps, 60, 200);

  return (
    <Stage tint={0.6}>
      <AbsoluteFill style={{ alignItems: "center", padding: PAD, paddingTop: 78 }}>
        <Head kicker="الخطوة 2 — نزّله صح" headline={<>لأقرب يوم. مش لليوم اللي بعده.</>} />

        <div style={{ marginTop: 38 }}>
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
              marginTop: 22,
              opacity: arrow,
              transform: `translateY(${interpolate(arrow, [0, 1], [12, 0])}px)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
              fontFamily: L.body,
              fontSize: 26,
            }}
          >
            <span style={{ color: C.red, fontWeight: 600 }}>الجمعة 13 — هنا وقع التكرار</span>
            <span style={{ color: C.green, fontSize: 32 }}>←</span>
            <span style={{ color: C.green, fontWeight: 600 }}>الأربعاء 11 — يوم النشاط، بيومين لورا</span>
          </div>
        </div>

        <div style={{ marginTop: 34, display: "flex", gap: 26 }}>
          <SnapCard title="التكرار 7 أيام أو أكتر">
            بيترحّل ليوم النشاط، في حدود 3 أيام في أي اتجاه. الأسبوعي بيفضل على يومه، والشهري والربع
            سنوي بيقعوا عليه كمان.
          </SnapCard>
          <SnapCard title="التكرار أقل من 7 أيام">
            الشغل اليومي مينفعش يتحرك 3 أيام. بيتزحلق بره الويك إند وبس: الجمعة والسبت يبقوا أحد.
          </SnapCard>
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

/* ──────────────────────────────── 6. trap ────────────────────────────── */

export const DRIFT = s(11);

function DriftTimeline({
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
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLocale();

  return (
    <div style={{ width: 1400 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 14 }}>
        <span style={{ fontFamily: L.display, fontSize: 26, fontWeight: 700, color: tone }}>{label}</span>
        <span style={{ fontFamily: L.body, fontSize: 22, color: C.muted }}>{note}</span>
      </div>
      <div style={{ position: "relative", height: 76, direction: "ltr" }}>
        <div style={{ position: "absolute", top: 36, left: 0, right: 0, height: 3, background: C.line, borderRadius: 3 }} />
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
              <div style={{ width: 40, height: 40, borderRadius: 40, background: tone, boxShadow: `0 0 22px ${tone}` }} />
              <div style={{ marginTop: 8, fontSize: 18, color: C.muted, fontFamily: L.display }}>
                {"يوم " + d}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Drift() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLocale();

  const wrong = [1, 31, 62, 94, 127];
  const right = [1, 31, 61, 91, 121];
  const reveal = enterAt(frame, fps, 150, 200);

  return (
    <Stage>
      <AbsoluteFill style={{ alignItems: "center", padding: PAD, paddingTop: 72 }}>
        <Head kicker="الفخ" headline={<>هنا «الشهري» بيبطّل يبقى شهري.</>} />
        <div style={{ marginTop: 42, display: "flex", flexDirection: "column", gap: 34 }}>
          <DriftTimeline
            label="الدورة الجاية من التاريخ المرحّل"
            note="كل تصحيح بينتقل لقدام"
            days={wrong}
            tone={C.red}
            delay={30}
          />
          <DriftTimeline
            label="الدورة الجاية من التاريخ الأصلي"
            note="التصحيحات مبتتراكمش"
            days={right}
            tone={C.green}
            delay={90}
          />
        </div>
        <div
          style={{
            marginTop: 30,
            opacity: reveal,
            fontFamily: L.body,
            fontSize: 29,
            color: C.mist,
            textAlign: "center",
            maxWidth: 1250,
            lineHeight: 1.6,
          }}
        >
          بعد 4 دورات، الفحص الشهري بقى <strong style={{ color: C.red }}>متأخر 6 أيام</strong>.
          احسب التكرار من التاريخ الأصلي، وبعدين رحّل — مش العكس.
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

/* ─────────────────────────────── 7. result ───────────────────────────── */

export const RESULT = s(9);
export function Result() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLocale();
  const zero = enterAt(frame, fps, 120, 200);

  return (
    <Stage tint={0.3}>
      <AbsoluteFill style={{ alignItems: "center", padding: PAD, paddingTop: 84 }}>
        <Head kicker="النتيجة" headline={<>744 مهمة، بتوزّع نفسها.</>} />
        <div style={{ marginTop: 46, display: "flex", alignItems: "center", gap: 90 }}>
          <DayBars delay={28} values={[152, 165, 138, 158, 131, 0, 0]} max={200} width={820} />
          <div style={{ width: 360, opacity: zero }}>
            <div
              dir="ltr"
              style={{
                fontFamily: L.display,
                fontSize: 108,
                fontWeight: 700,
                lineHeight: 1.1,
                textAlign: "right",
                background: `linear-gradient(180deg, #ffffff, ${C.green})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              0
            </div>
            <div style={{ marginTop: 10, fontFamily: L.body, fontSize: 28, color: C.mist, lineHeight: 1.6 }}>
              مهمة يوم جمعة أو سبت.
            </div>
            <div style={{ marginTop: 20, fontFamily: L.body, fontSize: 24, color: C.muted, lineHeight: 1.6 }}>
              من 131 لـ165 في كل يوم عمل، ومحدش بيوزّع حاجة بإيده.
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

/* ─────────────────────────────── 8. screen ───────────────────────────── */

export const SCREEN = s(8);
export function Screen() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLocale();

  return (
    <Stage>
      {/* `row` under an RTL container puts the first child on the right, so the
          copy is what the eye lands on first. */}
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", padding: PAD, gap: 70 }}>
        <div style={{ width: 620, flexShrink: 0 }}>
          <Kicker>جوه النظام</Kicker>
          <div style={{ marginTop: 24 }}>
            <Headline delay={4} size={54}>
              زرار واحد. وأفق 30 يوم.
            </Headline>
          </div>
          <div style={{ marginTop: 26, fontFamily: L.body, fontSize: 26, color: C.mist, lineHeight: 1.7 }}>
            المحرك دالة في قاعدة البيانات، فالقواعد قاعدة جنب الداتا — مش في سيرفر مهام ممكن يقف من
            غير ما حد ياخد باله.
          </div>
          <div
            style={{
              marginTop: 28,
              opacity: enterAt(frame, fps, 50, 200),
              fontFamily: L.body,
              fontSize: 24,
              color: C.muted,
              lineHeight: 1.7,
            }}
          >
            وإقفال أي مهمة بيولّد دورتها الجاية على طول، مرحّلة لليوم الصح.
          </div>
        </div>
        <BrowserFrame src="video/scheduling.png" width={1010} delay={14} crop={0.05} />
      </AbsoluteFill>
    </Stage>
  );
}

/* ─────────────────────────────── 9. outro ────────────────────────────── */

export const OUTRO = s(6);
export function Outro({ author }: { author: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLocale();
  const e = useEnter(20);

  return (
    <Stage tint={0.5}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: PAD }}>
        <ACMark size={112} delay={4} />
        <div
          style={{
            marginTop: 34,
            opacity: e,
            fontFamily: L.display,
            fontSize: 60,
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.35,
            maxWidth: 1300,
          }}
        >
          الجدولة مش لوب على تواريخ.
        </div>
        <div
          style={{
            marginTop: 18,
            opacity: enterAt(frame, fps, 46, 200),
            fontFamily: L.body,
            fontSize: 29,
            color: C.mist,
            textAlign: "center",
          }}
        >
          هي قرارات عن الأسبوع اللي الناس بتشتغل فيه فعلاً.
        </div>
        <div
          style={{
            marginTop: 44,
            opacity: enterAt(frame, fps, 74, 200),
            fontFamily: L.display,
            fontSize: 23,
            color: C.muted,
          }}
        >
          CPIIS · {author}
        </div>
      </AbsoluteFill>
    </Stage>
  );
}

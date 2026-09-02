import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SceneFade } from "../system-overview/ui";
import * as S from "./scenes-ar";
import { LocaleProvider } from "./parts";
import { ARABIC } from "./arabic";
import timing from "./timing-ar.json";

export type SchedulingArProps = {
  author: string;
  voiceover: string | null;
};

export const SCHEDULING_AR_DEFAULTS: SchedulingArProps = {
  author: "محمد سعد",
  voiceover: null,
};

const measured = (timing as { scenes: Record<string, number> }).scenes ?? {};
const lengthOf = (id: string, designed: number) => Math.max(designed, measured[id] ?? 0);

function storyboard(props: SchedulingArProps) {
  return [
    { id: "hook", d: lengthOf("hook", S.HOOK), el: <S.Hook /> },
    { id: "naive", d: lengthOf("naive", S.NAIVE), el: <S.Naive /> },
    { id: "pileup", d: lengthOf("pileup", S.PILEUP), el: <S.Pileup /> },
    { id: "hash", d: lengthOf("hash", S.HASH), el: <S.Hash /> },
    { id: "snap", d: lengthOf("snap", S.SNAP), el: <S.Snap /> },
    { id: "drift", d: lengthOf("drift", S.DRIFT), el: <S.Drift /> },
    { id: "result", d: lengthOf("result", S.RESULT), el: <S.Result /> },
    { id: "screen", d: lengthOf("screen", S.SCREEN), el: <S.Screen /> },
    { id: "outro", d: lengthOf("outro", S.OUTRO), el: <S.Outro author={props.author} /> },
  ];
}

export const SCHEDULING_AR_DURATION = storyboard(SCHEDULING_AR_DEFAULTS).reduce((t, sc) => t + sc.d, 0);

export function SchedulingVideoAr(props: SchedulingArProps) {
  let at = 0;
  return (
    <LocaleProvider value={ARABIC}>
      <AbsoluteFill style={{ background: "#0b0d24", direction: "rtl" }}>
        {props.voiceover ? <Audio src={staticFile(props.voiceover)} /> : null}
        {storyboard(props).map((sc) => {
          const from = at;
          at += sc.d;
          return (
            <Sequence key={sc.id} from={from} durationInFrames={sc.d} name={sc.id}>
              <SceneFade durationInFrames={sc.d}>{sc.el}</SceneFade>
            </Sequence>
          );
        })}
      </AbsoluteFill>
    </LocaleProvider>
  );
}

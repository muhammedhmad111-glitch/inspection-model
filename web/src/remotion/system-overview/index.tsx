import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { SceneFade, layOutCues } from "./ui";
import * as S from "./scenes";
import timing from "./timing.json";

export type SystemOverviewProps = {
  /** Credited in the closing card. */
  author: string;
  /**
   * Narration, relative to public/ (e.g. "audio/narration.wav"), already laid
   * out on the scene timeline by scripts/build-narration.mjs. Null renders
   * silent — the render script only passes a path when the file exists, so a
   * missing track never fails the render.
   */
  voiceover: string | null;
  /** Optional bed under the narration, relative to public/. */
  music: string | null;
  /** 0–1, applied to the music bed. Kept low so speech stays intelligible. */
  musicVolume: number;
};

export const SYSTEM_OVERVIEW_DEFAULTS: SystemOverviewProps = {
  author: "Mohamed Saad",
  voiceover: null,
  music: null,
  musicVolume: 0.18,
};

/**
 * Scene lengths measured from the narration, if it has been built. A scene is
 * never shortened below its designed length — only stretched, so a long line is
 * never cut off mid-word by the next cut.
 */
const measured = (timing as { scenes: Record<string, number> }).scenes ?? {};
const lengthOf = (id: string, designed: number) => Math.max(designed, measured[id] ?? 0);

/** The storyboard: one entry per scene, in order. */
function storyboard(props: SystemOverviewProps) {
  return [
    { id: "hook", d: lengthOf("hook", S.HOOK), el: <S.Hook /> },
    { id: "title", d: lengthOf("title", S.TITLE), el: <S.Title /> },
    { id: "problem", d: lengthOf("problem", S.PROBLEM), el: <S.Problem /> },
    { id: "hierarchy", d: lengthOf("hierarchy", S.HIERARCHY), el: <S.Hierarchy /> },
    { id: "library", d: lengthOf("library", S.LIBRARY), el: <S.Library /> },
    { id: "execution", d: lengthOf("execution", S.EXECUTION), el: <S.Execution /> },
    { id: "findings", d: lengthOf("findings", S.FINDINGS), el: <S.Findings /> },
    { id: "dashboards", d: lengthOf("dashboards", S.DASHBOARDS), el: <S.Dashboards /> },
    { id: "reports", d: lengthOf("reports", S.REPORTS), el: <S.Reports /> },
    { id: "rbac", d: lengthOf("rbac", S.RBAC), el: <S.Rbac /> },
    { id: "journey", d: lengthOf("journey", S.JOURNEY), el: <S.Journey /> },
    { id: "numbers", d: lengthOf("numbers", S.NUMBERS), el: <S.Numbers /> },
    { id: "stack", d: lengthOf("stack", S.STACK), el: <S.Stack /> },
    { id: "outro", d: lengthOf("outro", S.OUTRO), el: <S.Outro author={props.author} /> },
  ];
}

export const SYSTEM_OVERVIEW_DURATION = storyboard(SYSTEM_OVERVIEW_DEFAULTS).reduce((t, sc) => t + sc.d, 0);

const FADE_IN = 45;
const FADE_OUT = 75;

/** Music bed — eases in at the top and resolves under the closing card. */
function MusicBed({ src, volume }: { src: string; volume: number }) {
  const frame = useCurrentFrame();
  const envelope = interpolate(
    frame,
    [0, FADE_IN, SYSTEM_OVERVIEW_DURATION - FADE_OUT, SYSTEM_OVERVIEW_DURATION],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return <Audio src={staticFile(src)} volume={envelope * volume} loop />;
}

export function SystemOverview(props: SystemOverviewProps) {
  const cues = layOutCues(storyboard(props));

  return (
    <AbsoluteFill style={{ background: "#0b0d24" }}>
      {props.music ? <MusicBed src={props.music} volume={props.musicVolume} /> : null}
      {/* Narration is pre-timed to the cuts, so it plays flat from frame 0. */}
      {props.voiceover ? <Audio src={staticFile(props.voiceover)} /> : null}
      {cues.map((sc) => (
        <Sequence key={sc.id} from={sc.from} durationInFrames={sc.d} name={sc.id}>
          <SceneFade durationInFrames={sc.d}>{sc.el}</SceneFade>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

/**
 * Motor de linha do tempo do vídeo de produto (showcase).
 *
 * Porta enxuta de `design_handoff_trackerr/animations-v3.jsx`: mantém apenas
 * o que a composição usa (easings, interpolate, clamp, derivação de cues e o
 * "warp" entre tempo de reprodução e tempo autoral). Tudo é função pura de
 * tempo, sem estado global.
 */

export type EaseFn = (t: number) => number;

export const Easing = {
  linear: (t: number) => t,
  easeOutCubic: (t: number) => {
    const u = t - 1;
    return u * u * u + 1;
  },
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
} satisfies Record<string, EaseFn>;

export const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

/** interpolate([0, 1], [a, b], ease)(t) — mapeia keyframes com easing por segmento. */
export function interpolate(
  input: readonly number[],
  output: readonly number[],
  ease: EaseFn = Easing.linear,
): (t: number) => number {
  return (t) => {
    if (t <= input[0]) return output[0];
    if (t >= input[input.length - 1]) return output[output.length - 1];
    for (let i = 0; i < input.length - 1; i++) {
      if (t >= input[i] && t <= input[i + 1]) {
        const span = input[i + 1] - input[i];
        const local = span === 0 ? 0 : (t - input[i]) / span;
        return output[i] + (output[i + 1] - output[i]) * ease(local);
      }
    }
    return output[output.length - 1];
  };
}

// ── Cenas ─────────────────────────────────────────────────────────────────

export type SceneName =
  | 'Abertura'
  | 'Carteira'
  | 'Graficos'
  | 'Copiloto'
  | 'RI'
  | 'Encerramento';

export interface Scene {
  name: SceneName;
  /** Duração de reprodução (segundos). */
  dur: number;
  /** Duração autoral; quando difere de `dur`, a cena é reproduzida acelerada/desacelerada. */
  nat?: number;
}

/** Espelha `window.OM_SCENES` de `Trackerr Showcase Video.dc.html`. */
export const SHOWCASE_SCENES: readonly Scene[] = [
  {name: 'Abertura', dur: 2.6},
  {name: 'Carteira', dur: 2.6, nat: 5.2},
  {name: 'Graficos', dur: 5},
  {name: 'Copiloto', dur: 2.5, nat: 5},
  {name: 'RI', dur: 3.5, nat: 4.6},
  {name: 'Encerramento', dur: 2.9, nat: 3},
];

interface Section {
  playStart: number;
  dur: number;
  authStart: number;
  nat: number;
}

export type Cues = Record<SceneName, number>;

export interface Timeline {
  sections: Section[];
  cues: Cues;
  /** Duração total de reprodução (segundos). */
  total: number;
  /** Duração total autoral (segundos). */
  authoredTotal: number;
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

export function deriveTimeline(scenes: readonly Scene[]): Timeline {
  let playStart = 0;
  let authStart = 0;
  const sections: Section[] = [];
  const cues = {} as Cues;
  for (const s of scenes) {
    const nat =
      typeof s.nat === 'number' && Number.isFinite(s.nat) && s.nat > 0
        ? s.nat
        : s.dur;
    sections.push({playStart, dur: s.dur, authStart, nat});
    if (!(s.name in cues)) cues[s.name] = round3(authStart);
    playStart += s.dur;
    authStart += nat;
  }
  return {
    sections,
    cues,
    total: round3(playStart),
    authoredTotal: round3(authStart),
  };
}

/** Converte tempo de reprodução em tempo autoral (T), cena a cena. */
export function warpTime(timeline: Timeline, t: number): number {
  const ss = timeline.sections;
  if (ss.length === 0) return 0;
  let idx = ss.length - 1;
  for (let i = 0; i < ss.length; i++) {
    if (t < ss[i].playStart + ss[i].dur) {
      idx = i;
      break;
    }
  }
  const s = ss[idx];
  const local = Math.min(Math.max(t - s.playStart, 0), s.dur);
  const T = s.authStart + (s.dur > 0 ? local * (s.nat / s.dur) : 0);
  return Math.min(T, timeline.authoredTotal);
}

export const SHOWCASE_TIMELINE = deriveTimeline(SHOWCASE_SCENES);

// ── Os três helpers de movimento da composição ─────────────────────────────

type Stop = readonly [time: number, value: number];

function kf(T: number, stops: readonly Stop[], ease: EaseFn): number {
  if (T <= stops[0][0]) return stops[0][1];
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (T >= a[0] && T <= b[0]) {
      const p = b[0] === a[0] ? 1 : (T - a[0]) / (b[0] - a[0]);
      return interpolate([0, 1], [a[1], b[1]], ease)(p);
    }
  }
  return stops[stops.length - 1][1];
}

export const MOTION = {
  enter: (T: number, stops: readonly Stop[]) => kf(T, stops, Easing.easeOutCubic),
  draw: (T: number, start: number, end: number) =>
    kf(T, [[start, 0], [end, 1]], Easing.easeInOutCubic),
  pop: (T: number, start: number, end: number) =>
    kf(T, [[start, 0], [end, 1]], Easing.easeOutBack),
};

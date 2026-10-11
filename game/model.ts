

export const TAU = Math.PI * 2;

export const PX = 4;
export const HUD_H = 44;

export const GROUND_Y = 344;

export const FEET_OFFSET = 32;

export const GRAVITY = 900;
export const BASE_POWER = 520;
export const MIN_POWER = 460;
export const MAX_POWER = 980;

export const PERFECT_WINDOW = 0.3;
export const CLEAN_WINDOW = 0.75;
export const WOBBLE_WINDOW = 1.3;

export const TRAIL_MAX = 14;
export const COMBO_CAP = 9;

export type Shape = 'tuck' | 'pike' | 'straddle' | 'layout';

export const SHAPE_ORDER: Shape[] = ['tuck', 'pike', 'straddle', 'layout'];

export const SHAPE_RATE: Record<Shape, number> = {
  tuck: 7.5,
  pike: 5.2,
  straddle: 4.4,
  layout: 3.0
};

export const SHAPE_POINTS: Record<Shape, number> = {
  tuck: 100,
  pike: 170,
  straddle: 220,
  layout: 320
};

export const SHAPE_COLOR: Record<Shape, string> = {
  tuck: '#ffd23f',
  pike: '#7ec8ff',
  straddle: '#6ef2a3',
  layout: '#ff9ec7'
};

export const SHAPE_UNLOCK = [0, 2, 6, 12];

export const VARIETY_MULT = [1, 1, 1.4, 1.8, 2.2];

export const RELEASE_ARM = 0.12;

export const SPEED_GAIN = 0.008;
export const SPEED_CAP = 0.45;

export const ZOOM_START = 140;
export const ZOOM_END = 460;
export const ZOOM_MIN = 0.8;

export type Grade = 'perfect' | 'clean' | 'wobble' | 'flat' | 'crash';

export type Ghost = { alt: number; rot: number; life: number; shape: Shape | null };

export type Landing = { grade: Grade; spins: number; points: number; err: number; variety: number };

export type Round = {
  
  alt: number;
  vy: number;
  
  rot: number;
  
  spinTotal: number;
  
  radBy: number[];
  
  shapeMask: number;
  shapeIndex: number;
  grabs: number;
  holding: boolean;
  
  armed: boolean;
  releaseTime: number;
  spinning: boolean;
  power: number;
  speedScale: number;
  camAlt: number;
  zoom: number;
  
  flex: number;
  score: number;
  combo: number;
  bestCombo: number;
  saltos: number;
  jumps: number;
  peak: number;
  best: number;
  unlockedCount: number;
  unlockBanner: Shape | null;
  unlockAge: number;
  grade: Grade | null;
  gradeAge: number;
  gradeSpins: number;
  gradePoints: number;
  gradeVariety: number;
  ghosts: Ghost[];
  flash: number;
  time: number;
};

export function wrapAngle(a: number): number {
  let v = a % TAU;
  if (v > Math.PI) v -= TAU;
  if (v < -Math.PI) v += TAU;
  return v;
}

export function speedScaleFor(saltos: number): number {
  return 1 + Math.min(saltos * SPEED_GAIN, SPEED_CAP);
}

export function unlockedShapes(saltos: number): number {
  let n = 1;
  for (let i = 1; i < SHAPE_UNLOCK.length; i++) {
    if (saltos >= SHAPE_UNLOCK[i]) n = i + 1;
  }
  return n;
}

export function currentShape(round: Round): Shape {
  return SHAPE_ORDER[round.shapeIndex];
}

export function nextShape(round: Round): Shape | null {
  const limit = unlockedShapes(round.saltos) - 1;
  if (round.grabs === 0) return SHAPE_ORDER[0];
  if (round.shapeIndex >= limit) return null;
  return SHAPE_ORDER[round.shapeIndex + 1];
}

export function distinctShapes(mask: number): number {
  let n = 0;
  for (let i = 0; i < SHAPE_ORDER.length; i++) {
    if (mask & (1 << i)) n += 1;
  }
  return n;
}

export function comboMultiplier(combo: number): number {
  return 1 + Math.min(combo, COMBO_CAP) * 0.5;
}

export function zoomFor(alt: number): number {
  const t = Math.max(0, Math.min(1, (alt - ZOOM_START) / (ZOOM_END - ZOOM_START)));
  const eased = t * t * (3 - 2 * t);
  return 1 - (1 - ZOOM_MIN) * eased;
}

function resetFlight(round: Round) {
  round.rot = 0;
  round.spinTotal = 0;
  round.radBy = [0, 0, 0, 0];
  round.shapeMask = 0;
  round.shapeIndex = 0;
  round.grabs = 0;
  round.armed = false;
  round.releaseTime = 0;
}

export function createRound(): Round {
  return {
    alt: 0,
    vy: BASE_POWER,
    rot: 0,
    spinTotal: 0,
    radBy: [0, 0, 0, 0],
    shapeMask: 0,
    shapeIndex: 0,
    grabs: 0,
    holding: false,
    armed: false,
    releaseTime: 0,
    spinning: false,
    power: BASE_POWER,
    speedScale: 1,
    camAlt: 0,
    zoom: 1,
    flex: 0.6,
    score: 0,
    combo: 0,
    bestCombo: 0,
    saltos: 0,
    jumps: 0,
    peak: 0,
    best: 0,
    unlockedCount: 1,
    unlockBanner: null,
    unlockAge: 99,
    grade: null,
    gradeAge: 99,
    gradeSpins: 0,
    gradePoints: 0,
    gradeVariety: 0,
    ghosts: [],
    flash: 0,
    time: 0
  };
}

function gradeFor(spins: number, err: number): Grade {
  if (spins === 0) return 'flat';
  if (err < PERFECT_WINDOW) return 'perfect';
  if (err < CLEAN_WINDOW) return 'clean';
  if (err < WOBBLE_WINDOW) return 'wobble';
  return 'crash';
}

function pointsPerSalto(round: Round): number {
  const total = round.spinTotal;
  if (total <= 0) return 0;
  let weighted = 0;
  for (let i = 0; i < SHAPE_ORDER.length; i++) {
    weighted += round.radBy[i] * SHAPE_POINTS[SHAPE_ORDER[i]];
  }
  return weighted / total;
}

export function resolveLanding(round: Round): Landing {
  round.alt = 0;
  const err = Math.abs(wrapAngle(round.rot));
  const spins = Math.floor(round.spinTotal / TAU + 0.15);
  const grade = gradeFor(spins, err);
  const variety = distinctShapes(round.shapeMask);

  round.gradeSpins = spins;
  round.gradeVariety = variety;
  round.grade = grade;
  round.gradeAge = 0;
  round.flex = 1;
  if (round.peak > round.best) round.best = round.peak;

  if (grade === 'crash') {
    round.combo = 0;
    round.gradePoints = 0;
    return { grade, spins, points: 0, err, variety };
  }

  let points = 0;
  if (grade === 'flat') {
    round.combo = 0;
    round.power = Math.max(MIN_POWER, round.power - 40);
  } else if (grade === 'wobble') {
    round.combo = 0;
    round.power = Math.max(MIN_POWER, round.power - 70);
    points = Math.round(spins * pointsPerSalto(round) * 0.25);
  } else {
    round.combo += 1;
    round.saltos += spins;
    if (round.combo > round.bestCombo) round.bestCombo = round.combo;
    const bonus = grade === 'perfect' ? 40 : 0;
    points = Math.round(
      (spins * pointsPerSalto(round) + bonus) * VARIETY_MULT[variety] * comboMultiplier(round.combo)
    );
    round.power = Math.min(MAX_POWER, round.power + (grade === 'perfect' ? 60 : 40));
  }

  round.score += points;
  round.gradePoints = points;
  round.peak = 0;
  round.jumps += 1;
  resetFlight(round);
  round.speedScale = speedScaleFor(round.saltos);
  round.vy = round.power;
  return { grade, spins, points, err, variety };
}

export function screenY(alt: number, camAlt: number): number {
  return GROUND_Y - (alt - camAlt);
}

import {
  GRAVITY, RELEASE_ARM, SHAPE_MIN_RAD, SHAPE_ORDER, SHAPE_RATE, TAU,
  PERFECT_WINDOW, CLEAN_WINDOW, wrapAngle, unlockedShapes, resolveLanding,
  type Round, type Landing
} from './model.ts';

// Kept separate from audio and rendering so keyboard and touch share one simulation.
export function stepFlight(round: Round, holding: boolean, dt: number): {
  landing: Landing | null; shapeChanged: boolean
} {
  const unlocked = unlockedShapes(round.saltos);
  let shapeChanged = false;
  if (round.practice && round.practiceLocked && holding) return { landing: null, shapeChanged: false };
  if (holding) {
    round.started = true;
    // A continuous hold across a bounce starts a fresh tuck on the next flight.
    if (!round.holding || round.grabs === 0) {
      if (round.grabs > 0 && round.armed) {
        const previous = round.shapeIndex;
        round.shapeIndex = Math.min(previous + 1, unlocked - 1);
        shapeChanged = previous !== round.shapeIndex;
        if (shapeChanged) round.learnedShapes = true;
      } else if (round.grabs === 0) round.shapeIndex = 0;
      round.grabs += 1;
      round.armed = false;
      round.releaseTime = 0;
    }
    const step = Math.min(SHAPE_RATE[SHAPE_ORDER[round.shapeIndex]] * round.speedScale * dt,
      round.practice ? TAU - round.rot : Infinity);
    round.rot += step;
    round.spinTotal += step;
    round.radBy[round.shapeIndex] += step;
    // Tapping a shape without rotating in it cannot farm a variety multiplier.
    if (round.radBy[round.shapeIndex] >= SHAPE_MIN_RAD) round.shapeMask |= 1 << round.shapeIndex;
  } else {
    if (round.holding) {
      round.releaseTime = 0;
      round.releaseAir = timeToLand(round);
    }
    round.releaseTime += dt;
    if (round.grabs > 0 && round.releaseTime >= RELEASE_ARM && round.shapeIndex < unlocked - 1) {
      round.armed = true;
    }
  }
  round.spinning = holding;
  round.holding = holding;
  if (round.practice && holding && round.rot >= TAU) {
    round.practiceLocked = true;
    return { landing: null, shapeChanged };
  }
  round.vy -= GRAVITY * dt;
  round.alt += round.vy * dt;
  round.peak = Math.max(round.peak, round.alt);
  return { shapeChanged, landing: round.alt < 0 && round.vy < 0 ? resolveLanding(round) : null };
}

export function timeToLand(round: Round): number {
  return (round.vy + Math.sqrt(round.vy * round.vy + 2 * GRAVITY * Math.max(0, round.alt))) / GRAVITY;
}

export function landingCue(round: Round): 'hold' | 'release' | 'safe' | 'danger' {
  const err = Math.abs(wrapAngle(round.rot));
  const hasTurn = round.spinTotal >= TAU * 0.85;
  if (hasTurn && err < PERFECT_WINDOW) return round.spinning ? 'release' : 'safe';
  if (!round.spinning && hasTurn && err < CLEAN_WINDOW) return 'safe';
  const remaining = (TAU - (round.rot % TAU)) % TAU;
  const rate = SHAPE_RATE[SHAPE_ORDER[round.shapeIndex]] * round.speedScale;
  if (round.vy < 0 && remaining / rate > timeToLand(round) && err >= CLEAN_WINDOW) return 'danger';
  return 'hold';
}

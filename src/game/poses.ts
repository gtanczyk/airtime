

import { SHAPE_COLOR, type Shape } from './model.ts';
import { HAIR, SHOES, SKIN, SUIT, SUIT_DARK, q } from './art.ts';

type Pose = {
  lean: number;
  hipL: number;
  hipR: number;
  kneeL: number;
  kneeR: number;
  thigh: number;
  shin: number;
  armL: number;
  armR: number;
  elbowL: number;
  elbowR: number;
  upper: number;
  fore: number;
};

const LAYOUT: Pose = {
  lean: 0,
  hipL: 1.66,
  hipR: 1.52,
  kneeL: 1.62,
  kneeR: 1.56,
  thigh: 14,
  shin: 13,
  armL: 3.3,
  armR: -0.16,
  elbowL: 3.2,
  elbowR: -0.06,
  upper: 13,
  fore: 11
};

export const POSES: Record<Shape, Pose> = {
  tuck: {
    lean: 0.35,
    hipL: -0.5,
    hipR: -0.38,
    kneeL: 2.15,
    kneeR: 2.05,
    thigh: 15,
    shin: 14,
    armL: 0.82,
    armR: 0.7,
    elbowL: 1.6,
    elbowR: 1.5,
    upper: 8,
    fore: 7
  },
  // Jack-knife: torso forward, legs out
  pike: {
    lean: 0.25,
    hipL: -0.04,
    hipR: 0.04,
    kneeL: -0.04,
    kneeR: 0.04,
    thigh: 16,
    shin: 15,
    armL: -0.1,
    armR: -0.18,
    elbowL: -0.15,
    elbowR: -0.22,
    upper: 12,
    fore: 11
  },
  // Legs split into a wide V, arms reaching between them.
  straddle: {
    lean: 0,
    hipL: 2.34,
    hipR: 0.80,
    kneeL: 2.34,
    kneeR: 0.80,
    thigh: 16,
    shin: 15,
    armL: -0.05,
    armR: -0.12,
    elbowL: -0.05,
    elbowR: -0.12,
    upper: 12,
    fore: 11
  },
  layout: { ...LAYOUT, armL: -1.72, armR: -1.42, elbowL: -1.72, elbowR: -1.42, upper: 14, fore: 12 }
};

function segment(
  draw: GameKitDraw,
  ox: number,
  oy: number,
  angle: number,
  len: number,
  thick: number,
  fill: string
) {
  draw.with({ x: ox, y: oy, rot: angle }, () => {
    draw.rect(-1, -thick / 2 - 1, len + 2, thick + 2, { fill: '#dceaf4' });
    draw.rect(0, -thick / 2, len, thick, { fill });
  });
}

function tipOf(ox: number, oy: number, angle: number, len: number) {
  return { x: ox + Math.cos(angle) * len, y: oy + Math.sin(angle) * len };
}

function leg(draw: GameKitDraw, pose: Pose, hip: number, knee: number, fill: string) {
  segment(draw, 0, 0, hip, pose.thigh, 10, fill);
  const joint = tipOf(0, 0, hip, pose.thigh);
  segment(draw, joint.x, joint.y, knee, pose.shin, 9, fill);
  const foot = tipOf(joint.x, joint.y, knee, pose.shin);
  draw.with({ x: foot.x, y: foot.y, rot: knee }, () => {
    draw.rect(-1, -5, 8, 10, { fill: SHOES });
  });
}

function arm(draw: GameKitDraw, pose: Pose, sx: number, sy: number, sh: number, elbow: number, fill: string) {
  segment(draw, sx, sy, sh, pose.upper, 7, fill);
  const joint = tipOf(sx, sy, sh, pose.upper);
  segment(draw, joint.x, joint.y, elbow, pose.fore, 6, fill);
}

export function paintAcrobat(
  draw: GameKitDraw,
  x: number,
  y: number,
  rot: number,
  shape: Shape | null
) {
  const pose = shape ? POSES[shape] : LAYOUT;
  const trim = SHAPE_COLOR[shape ?? 'layout'];
  // Shoulder position after the torso leans, still expressed in hip space.
  const sx = Math.sin(pose.lean) * 16;
  const sy = -Math.cos(pose.lean) * 16;

  draw.with({ x: q(x), y: q(y), rot }, () => {
    leg(draw, pose, pose.hipL, pose.kneeL, '#cc4967');
    arm(draw, pose, sx, sy, pose.armL, pose.elbowL, '#dba875');

    draw.with({ rot: pose.lean }, () => {
      draw.rect(-11, -22, 22, 24, { fill: '#dceaf4' });
      draw.rect(-9, -20, 18, 20, { fill: SUIT });
      draw.rect(-7, -18, 4, 6, { fill: '#ff8995' });
      draw.rect(-9, -12, 18, 4, { fill: trim });
      draw.rect(-7, -34, 14, 14, { fill: SKIN });
      draw.rect(-11, -39, 22, 8, { fill: '#dceaf4' });
      draw.rect(-10, -38, 20, 6, { fill: HAIR });
      draw.rect(-10, -31, 4, 7, { fill: HAIR });
      draw.rect(0, -27, 4, 4, { fill: '#2b2a45' });
    });

    leg(draw, pose, pose.hipR, pose.kneeR, SUIT_DARK);
    arm(draw, pose, sx, sy, pose.armR, pose.elbowR, SKIN);
  });
}

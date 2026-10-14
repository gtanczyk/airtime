

import { SHAPE_COLOR, type Shape } from './model.ts';
import { HAIR, SHOES, SKIN, SUIT, SUIT_DARK } from './art.ts';

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
  armL: 2.55,
  armR: 0.59,
  elbowL: 2.2,
  elbowR: 0.94,
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
    draw.rect(-thick / 2, -thick / 2, len + thick, thick, { fill, radius: thick / 2 });
    draw.line(0, -thick * 0.22, len, -thick * 0.22,
      { stroke: 'rgba(255,240,219,0.18)', lineWidth: 1 });
  });
}

function tipOf(ox: number, oy: number, angle: number, len: number) {
  return { x: ox + Math.cos(angle) * len, y: oy + Math.sin(angle) * len };
}

function leg(draw: GameKitDraw, pose: Pose, hip: number, knee: number, fill: string, offset: number) {
  segment(draw, offset, 0, hip, pose.thigh, 7, fill);
  const joint = tipOf(offset, 0, hip, pose.thigh);
  segment(draw, joint.x, joint.y, knee, pose.shin, 6, fill);
  const foot = tipOf(joint.x, joint.y, knee, pose.shin);
  draw.with({ x: foot.x, y: foot.y, rot: knee }, () => {
    draw.rect(-2, -4, 8, 7, { fill: SHOES, radius: 3 });
  });
}

function arm(draw: GameKitDraw, pose: Pose, sx: number, sy: number, sh: number, elbow: number, fill: string) {
  segment(draw, sx, sy, sh, pose.upper, 5, fill);
  const joint = tipOf(sx, sy, sh, pose.upper);
  segment(draw, joint.x, joint.y, elbow, pose.fore, 4, fill);
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

  draw.with({ x, y, rot }, () => {
    leg(draw, pose, pose.hipL, pose.kneeL, '#bb355e', -3);
    arm(draw, pose, sx - 5, sy, pose.armL, pose.elbowL, '#d9996e');

    draw.with({ rot: pose.lean }, () => {
      draw.ellipse(-9, -32, 5, 7, { fill: HAIR });
      draw.rect(-3, -25, 6, 8, { fill: SKIN, radius: 2 });
      draw.rect(-8, -20, 16, 23, { fill: SUIT, radius: 6 });
      draw.poly([{ x: -7, y: -18 }, { x: -3, y: -18 }, { x: 5, y: 0 }, { x: 1, y: 1 }],
        { fill: '#ff889e', close: true });
      draw.rect(-7, -8, 14, 3, { fill: trim, radius: 1 });
      draw.circle(0, -29, 7, { fill: SKIN });
      draw.ellipse(-1, -34, 8, 4, { fill: HAIR });
      draw.ellipse(-6, -30, 3, 6, { fill: HAIR });
      draw.circle(3, -29, 1.2, { fill: '#30243c' });
      draw.circle(4, -25, 1.6, { fill: '#eb997c' });
    });

    leg(draw, pose, pose.hipR, pose.kneeR, SUIT_DARK, 3);
    arm(draw, pose, sx + 5, sy, pose.armR, pose.elbowR, SKIN);
  });
}

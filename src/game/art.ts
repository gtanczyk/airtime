import { PX, SHAPE_COLOR, SHAPE_ORDER, wrapAngle, PERFECT_WINDOW, CLEAN_WINDOW, type Round, type Shape } from './model.ts';

export const SKIN = '#f6c48d';
export const SUIT = '#ff4d5e';
export const SUIT_DARK = '#e85474';
export const TRIM = '#ffd23f';
export const HAIR = '#3b2416';
export const SHOES = '#dceaf4';
export const TRAIL = '#ff9ec7';

export const FRAME = '#37305e';
export const FRAME_DARK = '#241f42';
export const PAD_A = '#e2404a';
export const PAD_B = '#f6e7c8';
export const BED = '#101c34';
export const SPRING = '#8f97c0';

export const GOOD = '#6ef2a3';
export const WARN = '#ffd23f';
export const BAD = '#ff5a6a';

export function q(v: number): number {
  return Math.round(v / PX) * PX;
}

function block(draw: GameKitDraw, x: number, y: number, w: number, h: number, fill: string) {
  draw.rect(q(x), q(y), q(w), q(h), { fill });
}

export function paintTrail(draw: GameKitDraw, round: Round, x: number, toScreen: (alt: number) => number) {
  for (let i = 2; i < round.ghosts.length; i += 3) {
    const ghost = round.ghosts[i];
    if (ghost.life <= 0) continue;
    const gy = toScreen(ghost.alt) - 32;
    const tint = ghost.shape ? SHAPE_COLOR[ghost.shape] : TRAIL;
    draw.with({ alpha: ghost.life * 0.26, x: q(x), y: q(gy), rot: ghost.rot }, () => {
      draw.rect(-3, -6, 6, 12, { fill: tint });
    });
  }
}

export function paintLandingRing(draw: GameKitDraw, x: number, y: number, rot: number, hasTurn: boolean) {
  const err = Math.abs(wrapAngle(rot));
  const color = !hasTurn ? '#7795ba' : err < PERFECT_WINDOW ? GOOD : err < CLEAN_WINDOW ? WARN : '#7795ba';
  draw.circle(q(x), q(y), 43, { stroke: color, lineWidth: hasTurn && err < CLEAN_WINDOW ? 3 : 1 });
  draw.line(x - 7, y - 49, x + 7, y - 49, { stroke: GOOD, lineWidth: 3 });
  const a = wrapAngle(rot);
  draw.circle(x + Math.sin(a) * 43, y - Math.cos(a) * 43, 4, { fill: hasTurn ? '#eef4ff' : '#7795ba' });
}

export function paintShapeTag(
  draw: GameKitDraw,
  x: number,
  y: number,
  label: string,
  color: string,
  armed: boolean
) {
  const w = 104;
  draw.rect(q(x - w / 2), q(y), w, 20, { fill: 'rgba(9,17,34,0.9)', radius: 5 });
  draw.text(armed ? `> ${label}` : label, q(x), q(y + 10), {
    fill: color,
    font: '800 12px monospace',
    align: 'center',
    baseline: 'middle'
  });
}

export function paintVarietyPips(draw: GameKitDraw, x: number, y: number, mask: number, unlocked: number) {
  for (let i = 0; i < SHAPE_ORDER.length; i++) {
    const px = x + i * 14;
    const locked = i >= unlocked;
    const used = (mask & (1 << i)) !== 0;
    const fill = locked ? 'rgba(255,255,255,0.10)' : used ? SHAPE_COLOR[SHAPE_ORDER[i]] : 'rgba(255,255,255,0.22)';
    draw.rect(q(px), q(y), 10, 10, { fill });
  }
}

export function paintDial(draw: GameKitDraw, cx: number, cy: number, rot: number, shape: Shape) {
  const r = 20;
  draw.circle(cx, cy, r + 6, { fill: 'rgba(16,10,32,0.72)' });
  const wedge: Array<{ x: number; y: number }> = [{ x: cx, y: cy }];
  for (let i = -6; i <= 6; i++) {
    const a = (PERFECT_WINDOW / 6) * i;
    wedge.push({ x: cx + Math.sin(a) * r, y: cy - Math.cos(a) * r });
  }
  draw.poly(wedge, { fill: 'rgba(110,242,163,0.45)', close: true });
  draw.circle(cx, cy, r, { stroke: '#6b6392', lineWidth: 2 });
  draw.line(cx, cy - r - 5, cx, cy - r + 1, { stroke: GOOD, lineWidth: 3 });

  const a = wrapAngle(rot);
  const nx = cx + Math.sin(a) * (r - 3);
  const ny = cy - Math.cos(a) * (r - 3);
  draw.line(cx, cy, nx, ny, { stroke: SHAPE_COLOR[shape], lineWidth: 3 });
  draw.circle(nx, ny, 3, { fill: SHAPE_COLOR[shape] });
}

export function paintTrampoline(draw: GameKitDraw, cx: number, bedY: number, flex: number) {
  const halfW = 104;
  const sag = flex * 26;
  const legTop = bedY + 6;

  // legs
  block(draw, cx - halfW + 6, legTop, 10, 46, FRAME_DARK);
  block(draw, cx + halfW - 16, legTop, 10, 46, FRAME_DARK);
  block(draw, cx - halfW + 12, legTop + 42, halfW * 2 - 24, 8, FRAME);

  // bed, drawn as a chunky sagging strip with a lit top edge
  const steps = 12;
  const cell = (halfW * 2) / steps + PX;
  for (let i = 0; i < steps; i++) {
    const mid = (i + 0.5) / steps;
    const dip = Math.sin(mid * Math.PI) * sag;
    const x0 = cx - halfW + (i / steps) * halfW * 2;
    block(draw, x0, bedY + dip - 6, cell, 12, BED);
    block(draw, x0, bedY + dip - 6, cell, 3, '#3d5a92');
  }

  // springs pulling in from both rails, just inside the pads
  for (let i = 0; i < 3; i++) {
    block(draw, cx - halfW + 44, bedY - 2 + i * 4, 10, 3, SPRING);
    block(draw, cx + halfW - 54, bedY - 2 + i * 4, 10, 3, SPRING);
  }

  for (let i = 0; i < 4; i++) {
    const w = 12;
    block(draw, cx - halfW - 4 + i * w, bedY - 8, w, 14, i % 2 === 0 ? PAD_A : PAD_B);
    block(draw, cx + halfW - 44 + i * w, bedY - 8, w, 14, i % 2 === 0 ? PAD_B : PAD_A);
  }
}

export function paintBounceRings(draw: GameKitDraw, cx: number, bedY: number, flex: number) {
  if (flex <= 0.05) return;
  const spread = (1 - flex) * 120;
  draw.with({ alpha: flex * 0.5 }, () => {
    draw.ellipse(cx, bedY - 2, 40 + spread, 8 + spread * 0.12, { stroke: '#9fd7ff', lineWidth: 2 });
  });
}

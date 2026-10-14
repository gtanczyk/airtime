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
  draw.ellipse(cx, bedY + 49, 116, 7, { fill: 'rgba(8,13,28,0.35)' });
  for (const side of [-1, 1]) {
    const x = cx + side * 88;
    draw.line(x, bedY + 5, x + side * 13, bedY + 44, { stroke: '#303e59', lineWidth: 8 });
    draw.line(x - side * 1.5, bedY + 6, x + side * 11, bedY + 43,
      { stroke: '#8299ad', lineWidth: 3 });
    draw.rect(x + side * 13 - 13, bedY + 42, 26, 5, { fill: '#37445d', radius: 2 });
  }
  draw.line(cx - 92, bedY + 36, cx + 92, bedY + 36, { stroke: '#536581', lineWidth: 3 });
  const points = [];
  for (let i = 0; i <= 20; i++) points.push({
    x: cx - halfW + i / 20 * halfW * 2,
    y: bedY - 3 + Math.sin(i / 20 * Math.PI) * sag
  });
  draw.poly([...points, ...points.map(point => ({ x: point.x, y: point.y + 8 })).reverse()],
    { fill: '#16243c', close: true });
  draw.poly(points, { stroke: '#9dbbd2', lineWidth: 2 });
  for (const side of [-1, 1]) {
    const x = cx + side * 82 - 24;
    draw.rect(x, bedY - 9, 48, 16, { fill: '#a52843', radius: 5 });
    draw.rect(x, bedY - 9, 48, 10, { fill: '#ee5266', radius: 5 });
    for (let i = 0; i < 2; i++) draw.rect(x + 8 + i * 22, bedY - 9, 8, 16,
      { fill: '#f3d9ad', radius: 2 });
    draw.line(x + 5, bedY - 7, x + 43, bedY - 7, { stroke: '#ff9b96', lineWidth: 1 });
  }
}

export function paintBounceRings(draw: GameKitDraw, cx: number, bedY: number, flex: number) {
  if (flex <= 0.05) return;
  const spread = (1 - flex) * 120;
  draw.with({ alpha: flex * 0.5 }, () => {
    draw.ellipse(cx, bedY - 2, 40 + spread, 8 + spread * 0.12, { stroke: '#9fd7ff', lineWidth: 2 });
  });
}

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
  for (let i=0;i<80;i++) {
    const a=i/80*Math.PI*2;
    const px=Math.round((x+Math.sin(a)*43)/2)*2;
    const py=Math.round((y-Math.cos(a)*43)/2)*2;
    draw.rect(px,py,2,2,{fill:color});
  }
  draw.rect(Math.round(x/2)*2-6,Math.round((y-49)/2)*2,12,4,{fill:GOOD});
  const a=wrapAngle(rot);
  draw.rect(Math.round((x+Math.sin(a)*43)/2)*2-2,Math.round((y-Math.cos(a)*43)/2)*2-2,
    6,6,{fill:hasTurn?'#eef4ff':'#7795ba'});

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
  const sag = flex * 20;
  for (const side of [-1,1]) {
    for (let y=8;y<48;y+=4) {
      const x=q(cx+side*(88+y/4));
      draw.rect(x,q(bedY+y),8,4,{fill:FRAME_DARK});
      draw.rect(x,q(bedY+y),4,4,{fill:SPRING});
    }
    block(draw,cx+side*98-12,bedY+44,24,8,FRAME);
  }
  block(draw,cx-96,bedY+36,192,4,FRAME);
  for (let x=-halfW;x<halfW;x+=4) {
    const dip=q(Math.sin((x+halfW)/(halfW*2)*Math.PI)*sag);
    draw.rect(q(cx+x),q(bedY+dip),4,8,{fill:BED});
    draw.rect(q(cx+x),q(bedY+dip),4,2,{fill:'#8299ad'});
  }
  for (const side of [-1,1]) {
    const x=cx+side*82-24;
    block(draw,x,bedY-8,48,16,PAD_A);
    block(draw,x,bedY+4,48,4,'#9e3150');
    for (let i=0;i<2;i++) block(draw,x+8+i*24,bedY-8,8,16,PAD_B);
    block(draw,x+4,bedY-8,40,4,'#ff8995');
  }

}

export function paintBounceRings(draw: GameKitDraw, cx: number, bedY: number, flex: number) {
  if (flex <= 0.05) return;
  const spread = Math.round((1-flex)*12/2)*2;
  for (const side of [-1,1]) for (let i=0;i<3;i++) {
    const x=q(cx+side*(24+i*12+spread));
    const y=q(bedY-12-i*4);
    draw.rect(x,y,4,4,{fill:i===0?'#fff3d6':'#9fd7ff'});
    if(i===1)draw.rect(x+side*4,y-4,4,4,{fill:'#6ef2a3'});
  }
}

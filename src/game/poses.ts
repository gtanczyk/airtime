

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

type PixelRun = { x: number; y: number; w: number; color: string };
const SPRITE_PIXEL = 2;
const TURN_FRAMES = 64;
const spriteCache = new Map<string, PixelRun[]>();

export function acrobatPixels(shape: Shape | null, frame: number): PixelRun[] {
  frame = ((Math.round(frame) % TURN_FRAMES) + TURN_FRAMES) % TURN_FRAMES;
  const key = `${shape ?? 'open'}:${frame}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;
  const pose = shape ? POSES[shape] : LAYOUT;
  const angle = frame * Math.PI * 2 / TURN_FRAMES;
  const pixels = new Map<string, string>();
  const turn = (x: number, y: number, a: number) => ({ x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a) });
  const stamp = (points: Array<{ x: number; y: number }>, color: string) => {
    const poly = points.map(p => turn(p.x,p.y,angle));
    const minX = Math.floor(Math.min(...poly.map(p => p.x)) / SPRITE_PIXEL);
    const maxX = Math.ceil(Math.max(...poly.map(p => p.x)) / SPRITE_PIXEL);
    const minY = Math.floor(Math.min(...poly.map(p => p.y)) / SPRITE_PIXEL);
    const maxY = Math.ceil(Math.max(...poly.map(p => p.y)) / SPRITE_PIXEL);
    for (let y = minY; y < maxY; y++) for (let x = minX; x < maxX; x++) {
      const px = (x + 0.5) * SPRITE_PIXEL, py = (y + 0.5) * SPRITE_PIXEL;
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[i], b = poly[j];
        if ((a.y > py) !== (b.y > py) && px < (b.x-a.x)*(py-a.y)/(b.y-a.y)+a.x) inside = !inside;
      }
      if (inside) pixels.set(`${x},${y}`,color);
    }
  };
  const rect = (x: number,y: number,w: number,h: number,color: string, lean = 0) =>
    stamp([{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}].map(p => turn(p.x,p.y,lean)),color);
  const limb = (x: number,y: number,a: number,length: number,width: number,color: string) => {
    const points = [{x:-2,y:-width/2},{x:length+2,y:-width/2},{x:length+2,y:width/2},{x:-2,y:width/2}];
    stamp(points.map(p => {const r=turn(p.x,p.y,a);return {x:r.x+x,y:r.y+y}}),color);
    return {x:x+Math.cos(a)*length,y:y+Math.sin(a)*length};
  };
  const leg = (hip: number,knee: number,offset: number,color: string) => {
    const joint = limb(offset,0,hip,pose.thigh,8,color);
    const foot = limb(joint.x,joint.y,knee,pose.shin,6,color);
    rect(foot.x-3,foot.y-2,8,4,SHOES);
  };
  const sx = Math.sin(pose.lean)*16, sy = -Math.cos(pose.lean)*16;
  const arm = (offset: number,a: number,b: number,color: string) => {
    const elbow = limb(sx+offset,sy,a,pose.upper,5,color);
    limb(elbow.x,elbow.y,b,pose.fore,4,color);
  };
  leg(pose.hipL,pose.kneeL,-3,'#9e3150');
  arm(-5,pose.armL,pose.elbowL,'#bd875d');
  rect(-13,-35,6,10,HAIR,pose.lean);
  rect(-3,-24,6,7,SKIN,pose.lean);
  rect(-8,-20,16,22,SUIT,pose.lean);
  rect(-8,-20,4,16,'#ff8995',pose.lean);
  rect(4,-16,4,18,'#b93253',pose.lean);
  rect(-8,-8,16,4,SHAPE_COLOR[shape ?? 'layout'],pose.lean);
  rect(-6,-34,12,12,SKIN,pose.lean);
  rect(-8,-38,14,6,HAIR,pose.lean);
  rect(-8,-34,4,8,HAIR,pose.lean);
  rect(-6,-38,8,2,'#84533d',pose.lean);
  rect(2,-30,2,2,'#17213d',pose.lean);
  leg(pose.hipR,pose.kneeR,3,SUIT_DARK);
  arm(5,pose.armR,pose.elbowR,SKIN);
  const outlined = new Map(pixels);
  for (const key of pixels.keys()) {
    const [x,y] = key.split(',').map(Number);
    for (const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const neighbor = `${x+dx},${y+dy}`;
      if (!pixels.has(neighbor)) outlined.set(neighbor,'#13182d');
    }
  }
  const rows = [...outlined].map(([key,color]) => {const [x,y]=key.split(',').map(Number);return {x,y,color}})
    .sort((a,b) => a.y-b.y || a.x-b.x);
  const runs: PixelRun[] = [];
  for (const p of rows) {
    const last = runs[runs.length-1];
    if (last && last.y === p.y*2 && last.x+last.w === p.x*2 && last.color === p.color) last.w += 2;
    else runs.push({x:p.x*2,y:p.y*2,w:2,color:p.color});
  }
  spriteCache.set(key,runs);
  return runs;
}

export function paintAcrobat(draw: GameKitDraw,x: number,y: number,rot: number,shape: Shape | null) {
  const frame = Math.round(rot / (Math.PI*2) * TURN_FRAMES);
  const ox = Math.round(x/2)*2, oy = Math.round(y/2)*2;
  for (const p of acrobatPixels(shape,frame)) draw.rect(ox+p.x,oy+p.y,p.w,2,{fill:p.color});
}

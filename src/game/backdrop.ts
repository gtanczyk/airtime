

import { HUD_H, GROUND_Y, screenY, type Round } from './model.ts';
import { q } from './art.ts';

const TENT_A = 'rgba(45,45,88,0.19)';
const TENT_B = 'rgba(8,17,35,0.16)';
const BUNTING = ['#ff4d5e', '#ffd23f', '#6ef2a3', '#7ec8ff'];

export function paintSky(draw: GameKitDraw, width: number, height: number, act: number) {
  draw.clear(
    draw.linearGradient(0, 0, 0, height, [
      [0, act === 2 ? '#1b1029' : act === 1 ? '#101e32' : '#0b1227'],
      [0.55, act === 2 ? '#331d38' : act === 1 ? '#153c48' : '#17213d'],
      [1, act === 2 ? '#4b2438' : act === 1 ? '#1f3b48' : '#302348']
    ])
  );
  // vertical tent stripes
  const stripe = 80;
  for (let x = 0; x < width; x += stripe) {
    draw.rect(x, HUD_H, stripe / 2, height - HUD_H, { fill: TENT_A });
    draw.rect(x + stripe / 2, HUD_H, stripe / 2, height - HUD_H, { fill: TENT_B });
  }
}

export function paintSpotlights(draw: GameKitDraw, width: number, height: number, time: number, act: number) {
  const sway = Math.sin(time * 0.6) * 46;
  draw.with({ alpha: 0.065 }, () => {
    draw.poly(
      [
        { x: 70, y: HUD_H },
        { x: 110, y: HUD_H },
        { x: width / 2 + 90 + sway, y: height },
        { x: width / 2 - 70 + sway, y: height }
      ],
      { fill: act === 2 ? '#ffcb78' : '#ffe9a8', close: true }
    );
    draw.poly(
      [
        { x: width - 110, y: HUD_H },
        { x: width - 70, y: HUD_H },
        { x: width / 2 + 70 - sway, y: height },
        { x: width / 2 - 90 - sway, y: height }
      ],
      { fill: act === 1 ? '#99ffdd' : '#a8e6ff', close: true }
    );
  });
}

export function paintBunting(draw: GameKitDraw, width: number, camAlt: number, height: number, zoom: number) {
  const spacing = 160;
  const first = Math.max(40, Math.floor((camAlt - 200) / spacing) * spacing);
  for (let alt = first; alt < camAlt + height + 200; alt += spacing) {
    const y = screenY(alt, camAlt) - 120;
    const sy = height - 70 + (y - GROUND_Y) * zoom;
    if (sy < HUD_H + 70 || sy > height - 80) continue;
    // Overdrawn past both edges: the camera pull-back would otherwise leave the
    // Decorations frame the flight corridor instead of crossing the athlete.
    draw.line(-140, q(y), width / 2 - 70, q(y), { stroke: '#5a3d7d', lineWidth: 2 });
    draw.line(width / 2 + 70, q(y), width + 140, q(y), { stroke: '#5a3d7d', lineWidth: 2 });
    for (let i = -3; i < 19; i++) {
      const x = i * 44 + 14;
      if (Math.abs(x + 9 - width / 2) < 80) continue;
      draw.poly(
        [
          { x, y: q(y) },
          { x: x + 18, y: q(y) },
          { x: x + 9, y: q(y) + 14 }
        ],
        { fill: BUNTING[((i % BUNTING.length) + BUNTING.length) % BUNTING.length], close: true }
      );
    }
  }
}

export function paintRuler(draw: GameKitDraw, camAlt: number, height: number, best: number) {
  const spacing = 100;
  const first = Math.max(0, Math.floor((camAlt - 60) / spacing) * spacing);
  for (let alt = first; alt < camAlt + height; alt += spacing) {
    const y = screenY(alt, camAlt);
    if (y < HUD_H + 8 || y > height - 4) continue;
    draw.line(8, q(y), 30, q(y), { stroke: '#6b5a99', lineWidth: 2 });
    draw.text(`${Math.round(alt / 20)}m`, 34, q(y), {
      fill: '#8f7fc0',
      font: '700 10px monospace',
      baseline: 'middle'
    });
  }
  if (best > 40) {
    const y = screenY(best, camAlt);
    if (y > HUD_H + 8 && y < height - 4) {
      draw.line(8, q(y), 76, q(y), { stroke: '#ffd23f', lineWidth: 2, dash: [6, 4] });
      draw.text(GameKit.t({ en: 'BEST', pl: 'REKORD' }), 80, q(y), { fill: '#ffd23f', font: '700 10px monospace', baseline: 'middle' });
    }
  }
}

export function paintCrowd(draw: GameKitDraw, width: number, bedY: number, height: number, round: Round) {
  const floorY = bedY + 50;
  if (floorY > height + 160) return;
  draw.rect(-140, q(floorY), width + 280, height - floorY + 220, { fill: '#180e2c' });
  draw.rect(-140, q(floorY), width + 280, 6, { fill: '#4a2f75' });
  for (let i = -4; i < 26; i++) {
    const x = 6 + i * 30;
    const cheer = round.show.encore > 0 ? 1 : round.show.heat / 100;
    const bob = (i % 3) * 4 + Math.sin(round.time * 6 + i) * cheer * 5;
    draw.rect(q(x), q(floorY - 20 - bob), 16, 20 + bob, { fill: round.show.encore > 0 ? '#33475b' : '#241542' });
    draw.circle(q(x + 8), q(floorY - 26 - bob), 7, { fill: round.show.encore > 0 ? '#65817d' : '#2e1b52' });
    if (cheer > 0.5) {
      draw.line(x, floorY - 10, x - 7, floorY - 31 - bob, { stroke: '#65817d', lineWidth: 4 });
      draw.line(x + 16, floorY - 10, x + 23, floorY - 31 - bob, { stroke: '#65817d', lineWidth: 4 });
    }
  }
}

export function paintGradePopup(
  draw: GameKitDraw,
  round: Round,
  x: number,
  y: number,
  label: string,
  color: string,
  trick: string
) {
  if (!round.grade || round.gradeAge > 1.1) return;
  const rise = round.gradeAge * 18;
  const top = y - rise;
  const scored = round.gradePoints > 0;
  draw.with({ alpha: Math.max(0, 1 - round.gradeAge / 1.1) }, () => {
    draw.rect(q(x - 78), q(top - 15), 156, scored ? 65 : 44, {
      fill: 'rgba(9,17,34,0.94)',
      radius: 6
    });
    draw.text(label, x, q(top), {
      fill: color,
      font: '800 15px monospace',
      align: 'center',
      baseline: 'middle'
    });
    if (trick) draw.text(trick, x, q(top + 17), { fill: '#a6b8d7', font: '700 9px monospace', align: 'center', baseline: 'middle' });
    if (scored) {
      draw.text(`+${round.gradePoints}`, x, q(top + 37), {
        fill: '#fff3d6',
        font: '800 14px monospace',
        align: 'center',
        baseline: 'middle'
      });
    }
  });
}



import { HUD_H, screenY, type Round } from './model.ts';
import { q } from './art.ts';

const TENT_A = '#3a1e59';
const TENT_B = '#2d1745';
const BUNTING = ['#ff4d5e', '#ffd23f', '#6ef2a3', '#7ec8ff'];

export function paintSky(draw: GameKitDraw, width: number, height: number) {
  draw.clear(
    draw.linearGradient(0, 0, 0, height, [
      [0, '#150c26'],
      [0.55, '#241242'],
      [1, '#3a1c5c']
    ])
  );
  // vertical tent stripes
  const stripe = 48;
  for (let x = 0; x < width; x += stripe) {
    draw.rect(x, HUD_H, stripe / 2, height - HUD_H, { fill: TENT_A });
    draw.rect(x + stripe / 2, HUD_H, stripe / 2, height - HUD_H, { fill: TENT_B });
  }
}

export function paintSpotlights(draw: GameKitDraw, width: number, height: number, time: number) {
  const sway = Math.sin(time * 0.6) * 46;
  draw.with({ alpha: 0.16 }, () => {
    draw.poly(
      [
        { x: 70, y: HUD_H },
        { x: 110, y: HUD_H },
        { x: width / 2 + 90 + sway, y: height },
        { x: width / 2 - 70 + sway, y: height }
      ],
      { fill: '#ffe9a8', close: true }
    );
    draw.poly(
      [
        { x: width - 110, y: HUD_H },
        { x: width - 70, y: HUD_H },
        { x: width / 2 + 70 - sway, y: height },
        { x: width / 2 - 90 - sway, y: height }
      ],
      { fill: '#a8e6ff', close: true }
    );
  });
}

export function paintBunting(draw: GameKitDraw, width: number, camAlt: number, height: number) {
  const spacing = 160;
  const first = Math.max(120, Math.floor((camAlt - 200) / spacing) * spacing);
  for (let alt = first; alt < camAlt + height + 200; alt += spacing) {
    const y = screenY(alt, camAlt) - 120;
    if (y < HUD_H - 20 || y > height) continue;
    // Overdrawn past both edges: the camera pull-back would otherwise leave the
    draw.line(-140, q(y), width + 140, q(y), { stroke: '#5a3d7d', lineWidth: 2 });
    for (let i = -3; i < 19; i++) {
      const x = i * 44 + 14;
      draw.poly(
        [
          { x, y: q(y) },
          { x: x + 18, y: q(y) },
          { x: x + 9, y: q(y) + 14 }
        ],
        { fill: BUNTING[i % BUNTING.length], close: true }
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
      draw.text('BEST', 80, q(y), { fill: '#ffd23f', font: '700 10px monospace', baseline: 'middle' });
    }
  }
}

export function paintCrowd(draw: GameKitDraw, width: number, bedY: number, height: number) {
  const floorY = bedY + 50;
  if (floorY > height + 160) return;
  draw.rect(-140, q(floorY), width + 280, height - floorY + 220, { fill: '#180e2c' });
  draw.rect(-140, q(floorY), width + 280, 6, { fill: '#4a2f75' });
  for (let i = -4; i < 26; i++) {
    const x = 6 + i * 30;
    const bob = (i % 3) * 4;
    draw.rect(q(x), q(floorY - 20 - bob), 16, 20 + bob, { fill: '#241542' });
    draw.circle(q(x + 8), q(floorY - 26 - bob), 7, { fill: '#2e1b52' });
  }
}

export function paintGradePopup(
  draw: GameKitDraw,
  round: Round,
  x: number,
  y: number,
  label: string,
  color: string
) {
  if (!round.grade || round.gradeAge > 1.1) return;
  const rise = round.gradeAge * 46;
  const top = Math.max(HUD_H + 26, y - 62 - rise);
  const scored = round.gradePoints > 0;
  draw.with({ alpha: Math.max(0, 1 - round.gradeAge / 1.1) }, () => {
    draw.rect(q(x - 78), q(top - 15), 156, scored ? 48 : 28, {
      fill: 'rgba(21,12,38,0.78)',
      radius: 6
    });
    draw.text(label, x, q(top), {
      fill: color,
      font: '800 20px monospace',
      align: 'center',
      baseline: 'middle'
    });
    if (scored) {
      draw.text(`+${round.gradePoints}`, x, q(top + 22), {
        fill: '#fff3d6',
        font: '800 14px monospace',
        align: 'center',
        baseline: 'middle'
      });
    }
  });
}

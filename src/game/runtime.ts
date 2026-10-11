

import {
  FEET_OFFSET,
  GRAVITY,
  HUD_H,
  RELEASE_ARM,
  SHAPE_ORDER,
  SHAPE_RATE,
  TRAIL_MAX,
  VARIETY_MULT,
  comboMultiplier,
  createRound,
  currentShape,
  resolveLanding,
  screenY,
  speedScaleFor,
  unlockedShapes,
  wrapAngle,
  zoomFor,
  type Round
} from './model.ts';
import { GOOD, TRAIL, WARN } from './art.ts';
import { paintForeground, paintWorld, shapeLabel } from './render.ts';

const { t } = GameKit;

export function startGame() {
  GameKit.defineGame<Round>()
    .input({
      steer: false,
      touch: { dpad: false, buttons: [{ keys: [' '], label: 'Spin' }] }
    })
    .audio({ volume: 0.62 })
    .init(() => {
      GameKit.progress('round-start');
      return createRound();
    })
    .restartAnnounce({
      en: 'New routine. Hold Space in the air to tuck, release upright to land.',
      pl: 'Nowy układ. Przytrzymaj spację w powietrzu, puść na pionie, by wylądować.'
    })
    .lose({
      title: { en: 'CRASH!', pl: 'UPADEK!' },
      subtitle: (round) =>
        t(
          { en: '{score} points · {saltos} saltos', pl: '{score} punktów · {saltos} salt' },
          { score: round.score, saltos: round.saltos }
        ),
      color: '#ff5a6a',
      sfx: 'lose',
      shake: 12,
      burst: { color: '#ff5a6a', count: 26 },
      announce: (round) =>
        t(
          { en: 'Crashed. Final score {score}.', pl: 'Upadek. Wynik końcowy {score}.' },
          { score: round.score }
        )
    })
    .hud((round) => ({
      bar: { height: HUD_H, fill: '#150c26' },
      left: { text: `${t({ en: 'SCORE', pl: 'WYNIK' })} ${round.score}`, color: '#fff3d6' },
      center: {
        text:
          round.combo > 0
            ? `${t({ en: 'COMBO', pl: 'COMBO' })} ${round.combo}  x${comboMultiplier(round.combo).toFixed(1)}`
            : t({ en: 'NO COMBO', pl: 'BRAK COMBO' }),
        color: round.combo > 0 ? GOOD : '#8f7fc0'
      },
      right: {
        text: `${t({ en: 'SALTOS', pl: 'SALTA' })} ${round.saltos}`,
        color: WARN
      }
    }))
    .update((round, kit, dt) => {
      const { input, audio, particles, shake, end, width, height } = kit;
      const holding = input.down(' ') || input.held();
      const unlocked = unlockedShapes(round.saltos);

      if (holding) {
        if (!round.holding) {
          if (round.grabs > 0 && round.armed) {
            round.shapeIndex = Math.min(round.shapeIndex + 1, unlocked - 1);
            audio.play('rustle', { rate: 0.9 - round.shapeIndex * 0.08 });
          } else if (round.grabs === 0) {
            round.shapeIndex = 0;
          }
          round.shapeMask |= 1 << round.shapeIndex;
          round.grabs += 1;
          round.armed = false;
          round.releaseTime = 0;
        }
        const step = SHAPE_RATE[SHAPE_ORDER[round.shapeIndex]] * round.speedScale * dt;
        round.rot += step;
        round.spinTotal += step;
        round.radBy[round.shapeIndex] += step;
        round.spinning = true;
      } else {
        if (round.holding) round.releaseTime = 0;
        round.releaseTime += dt;
        if (round.grabs > 0 && round.releaseTime >= RELEASE_ARM && round.shapeIndex < unlocked - 1) {
          round.armed = true;
        }
        round.spinning = false;
      }
      round.holding = holding;

      round.vy -= GRAVITY * dt;
      round.alt += round.vy * dt;
      if (round.alt > round.peak) round.peak = round.alt;

      round.ghosts.unshift({
        alt: round.alt,
        rot: round.rot,
        life: 1,
        shape: round.spinning ? currentShape(round) : null
      });
      if (round.ghosts.length > TRAIL_MAX) round.ghosts.length = TRAIL_MAX;

      if (round.alt > 0 || round.vy >= 0) return;

      const bedY = Math.min(height - 40, screenY(0, round.camAlt));
      const landing = resolveLanding(round);

      if (landing.grade === 'crash') {
        particles.burst(width / 2, bedY - FEET_OFFSET, '#ff5a6a', 24, { maxSpeed: 260 });
        end('lost', { at: { x: width / 2, y: Math.min(height - 20, bedY - 20) } });
        return;
      }

      if (landing.grade === 'perfect') {
        audio.play('bell', { rate: 1 + Math.min(round.combo, 8) * 0.05 });
        particles.burst(width / 2, bedY, GOOD, 20, { maxSpeed: 220 });
        round.flash = 1;
        shake.add(4);
      } else if (landing.grade === 'clean') {
        audio.play('coin', { rate: 0.95 + Math.min(round.combo, 8) * 0.04 });
        particles.burst(width / 2, bedY, TRAIL, 14);
      } else if (landing.grade === 'wobble') {
        audio.play('buzzer', { rate: 1.15 });
        shake.add(6);
      }
      audio.play('jump', { rate: 0.85 + round.power / 1600 });

      // unlock earned; show banner once per shape
      const nowUnlocked = unlockedShapes(round.saltos);
      if (nowUnlocked > round.unlockedCount) {
        round.unlockBanner = SHAPE_ORDER[nowUnlocked - 1];
        round.unlockAge = 0;
        audio.play('bell', { rate: 1.4 });
        GameKit.progress(`shape-${SHAPE_ORDER[nowUnlocked - 1]}`);
      }
      round.unlockedCount = nowUnlocked;
      round.speedScale = speedScaleFor(round.saltos);

      if (round.saltos >= 1 && round.jumps === 1) GameKit.progress('first-salto');
      if (landing.variety >= 2 && landing.grade !== 'flat') GameKit.progress('shape-combo');
      if (round.combo === 5) GameKit.progress('combo-5');
    })
    .ambient((round, _kit, dt) => {
      // Runs at every lifecycle state, so the crash screen keeps breathing.
      round.time += dt;
      round.gradeAge += dt;
      round.unlockAge += dt;
      round.flash = Math.max(0, round.flash - dt * 3);
      round.flex = Math.max(0, round.flex - dt * 3.4);
      for (const ghost of round.ghosts) ghost.life = Math.max(0, ghost.life - dt * 2.4);

      const target = Math.max(0, round.alt - 150);
      round.camAlt += (target - round.camAlt) * Math.min(1, dt * 6);
      round.zoom += (zoomFor(round.alt) - round.zoom) * Math.min(1, dt * 5);
    })
    .render(paintWorld)
    .foreground(paintForeground)
    .snapshot((round) => ({
      score: round.score,
      combo: round.combo,
      bestCombo: round.bestCombo,
      saltos: round.saltos,
      jumps: round.jumps,
      height: Math.round(round.alt),
      best: Math.round(round.best),
      power: Math.round(round.power),
      tilt: Number(Math.abs(wrapAngle(round.rot)).toFixed(2)),
      shape: currentShape(round),
      shapeName: shapeLabel(currentShape(round)),
      grabs: round.grabs,
      variety: round.gradeVariety,
      varietyMult: VARIETY_MULT[round.gradeVariety],
      unlocked: round.unlockedCount,
      zoom: Number(round.zoom.toFixed(2)),
      grade: round.grade ?? 'none'
    }))
    .start();
}



import {
  FEET_OFFSET,
  GROUND_Y,
  HUD_H,
  TAU,
  SHAPE_ORDER,
  TRAIL_MAX,
  comboMultiplier,
  createRound,
  failureAdvice,
  currentShape,
  speedScaleFor,
  unlockedShapes,
  wrapAngle,
  type Round
} from './model.ts';
import { stepFlight, timeToLand, landingCue } from './flight.ts';
import { cameraAltitude } from './coaching.ts';
import { MISSIONS, isClean } from './show.ts';
import { GOOD, TRAIL, WARN } from './art.ts';
import { paintForeground, paintWorld, shapeLabel } from './render.ts';

const { t } = GameKit;

export function startGame() {
  GameKit.defineGame<Round>()
    .orientation('adaptive')
    .input({
      steer: false,
      touch: { dpad: false, buttons: [{ keys: [' '], label: t({ en: 'Spin', pl: 'Obrót' }) }] }
    })
    .audio({ volume: 0.62 })
    .menu({ accent: '#fff3d6' })
    .init(() => {
      GameKit.progress('round-start');
      return createRound();
    })
    .restartAnnounce({
      en: 'New routine. Hold Space in the air to tuck, release upright to land.',
      pl: 'Nowy układ. Przytrzymaj spację w powietrzu, puść na pionie, by wylądować.'
    })
    .lose({
      title: { en: 'SHOW COMPLETE', pl: 'KONIEC POKAZU' },
      subtitle: (round) =>
        t(
          { en: '{score} pts · {hint}', pl: '{score} pkt · {hint}' },
          { score: round.score, hint: t(failureAdvice(round)) }
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
      bar: { height: HUD_H, fill: '#0c1427' },
      left: { text: `${t({ en: 'SCORE', pl: 'WYNIK' })} ${round.score}`, color: '#fff3d6' },
      center: {
        text:
          round.combo > 0
            ? `${t({ en: 'COMBO', pl: 'COMBO' })} ${round.combo} ×${comboMultiplier(round.combo).toFixed(1)}`
            : t({ en: 'NO COMBO', pl: 'BRAK COMBO' }),
        color: round.combo > 0 ? GOOD : '#8f7fc0'
      },
      right: {
        text: `${t({ en: 'SALTOS', pl: 'SALTA' })} ${round.saltos}`,
        color: WARN
      }
    }))
    .update((round, kit, dt) => {
      const { input, audio, particles, shake, end, width } = kit;
      const holding = input.down(' ') || input.held();
      if (!round.started && !holding) return;
      const bedY = GROUND_Y;
      const { landing, shapeChanged } = stepFlight(round, holding, dt);
      if (shapeChanged) audio.play('rustle', { rate: 0.9 - round.shapeIndex * 0.08 });
      round.ghosts.unshift({
        alt: round.alt, rot: round.rot, life: 1,
        shape: round.spinning ? currentShape(round) : null
      });
      if (round.ghosts.length > TRAIL_MAX) round.ghosts.length = TRAIL_MAX;
      if (!landing) return;

      if (landing.grade === 'crash') {
        particles.burst(width / 2, bedY - FEET_OFFSET, '#ff5a6a', 24, { maxSpeed: 260 });
        end('lost', { at: { x: width / 2, y: bedY - 20 } });
        return;
      }
      if (landing.grade === 'retry') return;

      if (landing.grade === 'perfect') {
        audio.play('bell', { rate: 1 + Math.min(round.combo, 8) * 0.05 });
        particles.burst(width / 2, bedY, GOOD, 20, { maxSpeed: 220 });
        round.flash = 1;
        shake.add(3);
      } else if (landing.grade === 'clean') {
        audio.play('coin', { rate: 0.95 + Math.min(round.combo, 8) * 0.04 });
        particles.burst(width / 2, bedY, TRAIL, 14);
      } else if (landing.grade === 'save') {
        audio.play('bell', { rate: 0.75 });
        particles.burst(width / 2, bedY, '#7ec8ff', 24, { maxSpeed: 200 });
        shake.add(4);
      } else if (landing.grade === 'wobble') {
        audio.play('buzzer', { rate: 1.15 });
        shake.add(6);
      }
      if (round.show.lastBonus > 0) {
        audio.play('bell', { rate: 1.4 });
        GameKit.progress(`mission-${round.show.lastMission + 1}`);
      }
      if (round.show.dareReward > 0) {
        audio.play('bell', { rate: 1.3 });
        GameKit.progress('crowd-call');
      }
      if (round.show.encoreStarted) {
        audio.play('bell', { rate: 1.6 });
        particles.burst(width / 2, bedY, WARN, 32, { maxSpeed: 280 });
        GameKit.progress('encore');
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

      if (round.saltos >= 1 && !round.firstSalto) {
        round.firstSalto = true;
        GameKit.progress('first-salto');
      }
      if (landing.variety >= 2 && isClean(landing.grade)) GameKit.progress('shape-combo');
      if (round.combo === 5) GameKit.progress('combo-5');
    })
    .ambient((round, kit, dt) => {
      // Runs at every lifecycle state, so the crash screen keeps breathing.
      round.time += dt;
      round.gradeAge += dt;
      round.practiceAge += dt;
      round.unlockAge += dt;
      round.show.toastAge += dt;
      round.show.dareAge += dt;
      round.flash = Math.max(0, round.flash - dt * 3);
      round.flex = Math.max(0, round.flex - dt * 3.4);
      round.camAlt = cameraAltitude(round, kit.height);
      for (const ghost of round.ghosts) ghost.life = Math.max(0, ghost.life - dt * 2.4);


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
      rotations: Number((round.spinTotal / TAU).toFixed(3)),
      armed: round.armed,
      spinning: round.spinning,
      variety: round.gradeVariety,
      unlocked: round.unlockedCount,
      zoom: 1,
      cameraAltitude: Number(round.camAlt.toFixed(2)),
      grade: round.grade ?? 'none',
      landingError: Number(round.gradeError.toFixed(2)),
      remainingAir: Number(timeToLand(round).toFixed(2)),
      cue: landingCue(round),
      hype: round.show.heat,
      encore: round.show.encore,
      encoreRuns: round.show.encoreRuns,
      mission: round.show.mission,
      missionProgress: round.show.missionProgress,
      missionsTotal: MISSIONS.length,
      safety: round.show.safety,
      saves: round.show.saves,
      perfects: round.show.perfects,
      bestTrick: round.show.bestTrick,
      bestSpins: round.show.bestSpins,
      started: round.started,
      learnedShapes: round.learnedShapes,
      dare: round.show.dare,
      dareFlights: round.show.dareFlights,
      daresWon: round.show.daresWon,
      releaseAir: Number(round.releaseAir.toFixed(2)),
      practice: round.practice,
      practiceLocked: round.practiceLocked,
      practiceTries: round.practiceTries,
      failureHint: round.failureHint ?? 'none'
    }))
    .start();
}

import { HUD_H, FEET_OFFSET, TAU, SHAPE_NAMES, SHAPE_RATE, failureAdvice, currentShape, nextShape, type Round } from './model.ts';
import { GOOD, WARN, BAD } from './art.ts';
import { landingCue, timeToLand } from './flight.ts';

export function cameraAltitude(round: Round, height: number): number {
  const followY = Math.max(HUD_H + 90, height * 0.43);
  return Math.max(0, round.alt - (height - 70 - FEET_OFFSET - followY));
}

export function stagePoint(round: Round, height: number, alt: number): number {
  return height - 70 + round.camAlt - alt - FEET_OFFSET;
}

export function guideBox(round: Round, width: number, height: number): { x: number; y: number; w: number; h: number } {
  const ay = stagePoint(round, height, round.alt);
  if (height > width) {
    const below = Math.max(HUD_H + 180, ay + 60);
    return { x: width / 2 - 112, y: below + 64 < height - 65 ? below : ay - 112, w: 224, h: 64 };
  }
  return { x: width / 2 + 62, y: Math.max(HUD_H + 67, Math.min(height - 144, ay - 24)), w: 228, h: 64 };
}

export function guideLines(round: Round): { title: { en: string; pl: string }; detail: string; color: string } {
  const cue = landingCue(round);
  const turns = Math.floor(round.spinTotal / TAU + 0.15);
  let title = { en: 'HOLD SPACE / SPIN', pl: 'TRZYMAJ SPACJĘ / OBRÓT' };
  let detail = GameKit.t({ en: 'Release on green: rotation stops', pl: 'Puść na zielonym: zatrzymasz obrót' });
  let color = WARN;
  if (cue === 'release') {
    title = { en: 'RELEASE SPACE / SPIN', pl: 'PUŚĆ SPACJĘ / OBRÓT' };
    detail = GameKit.t({ en: 'Upright — lock this angle', pl: 'Pion — zablokuj ten kąt' });
    if (!round.practice && round.learnedShapes && timeToLand(round) > TAU / (SHAPE_RATE[currentShape(round)] * round.speedScale) + 0.1) {
      title = { en: 'BANK OR KEEP SPINNING', pl: 'BANKUJ LUB KRĘĆ DALEJ' };
      detail = GameKit.t({ en: 'Release: safe / hold: extra flip', pl: 'Puść: bezpiecznie / trzymaj: salto' });
    }
    if (round.practice) detail = GameKit.t(round.practiceLocked
      ? { en: 'Practice paused upright — release', pl: 'Próba zatrzymana w pionie — puść' }
      : { en: 'Practice will stop upright', pl: 'Próba zatrzyma się na pionie' });
    color = GOOD;
  } else if (cue === 'safe') {
    title = { en: 'POSITION LOCKED', pl: 'POZYCJA ZABLOKOWANA' };
    detail = round.vy < 0
      ? GameKit.t({ en: 'Landing in {n}s — keep released', pl: 'Lądowanie za {n}s — nie trzymaj' }, { n: timeToLand(round).toFixed(1) })
      : GameKit.t({ en: 'Keep released until landing', pl: 'Nie trzymaj aż do lądowania' });
    if (round.armed && !round.learnedShapes && round.unlockedCount > 1) detail = GameKit.t({
      en: 'Wait or hold: change shape', pl: 'Czekaj lub trzymaj: zmień figurę'
    });
    color = GOOD;
  } else if (cue === 'danger') {
    title = { en: 'UNSAFE LANDING ANGLE', pl: 'ZŁY KĄT LĄDOWANIA' };
    detail = GameKit.t({ en: 'Return upright before landing', pl: 'Wróć do pionu przed lądowaniem' });
    color = BAD;
  } else if (round.unlockedCount > 1 && !round.learnedShapes) {
    detail = GameKit.t(round.armed
      ? { en: 'Hold again: switch shape', pl: 'Przytrzymaj ponownie: zmień figurę' }
      : { en: 'Release, then hold: switch shape', pl: 'Puść i przytrzymaj: zmień figurę' });
  }
  if (turns > 0 && cue === 'hold' && round.learnedShapes) {
    detail = GameKit.t({ en: '{n} flips · release on green', pl: '{n} salta · puść na zielonym' }, { n: turns });
  }
  return { title, detail, color };
}

export function paintCoaching(round: Round, kit: GameKitGameContext) {
  if (!round.started) return;
  const { draw, width, height } = kit;
  const box = guideBox(round, width, height);
  const guide = guideLines(round);
  const text = (label: string, y: number, color: string, size: number) => draw.text(label, box.x + 10, y,
    { fill: color, font: `700 ${size}px monospace`, baseline: 'middle' });
  draw.rect(box.x, box.y, box.w, box.h, { fill: 'rgba(12,23,42,0.78)' });
  draw.rect(box.x, box.y + 8, 3, box.h - 16, { fill: guide.color });
  text(GameKit.t(guide.title), box.y + 15, guide.color, 12);
  text(guide.detail, box.y + 34, '#eef4ff', 10);
  const upcoming = round.armed ? nextShape(round) : null;
  const name = GameKit.t(SHAPE_NAMES[upcoming ?? currentShape(round)]);
  const footer = upcoming ? GameKit.t({ en: 'Next: {name} · slower', pl: 'Następna: {name} · wolniej' }, { name })
    : GameKit.t({ en: 'Shape: {name}', pl: 'Figura: {name}' }, { name });
  text(round.practiceAge < 3 && !round.practice
    ? GameKit.t({ en: 'Now you stop the spin yourself', pl: 'Teraz sam zatrzymujesz obrót' }) : footer,
    box.y + 52, round.practiceAge < 3 ? '#fff3d6' : '#a9c5e8', round.practiceAge < 3 ? 10 : 11);
  const ay = stagePoint(round, height, round.alt);
  if (round.spinTotal >= TAU * 0.85) {
    draw.text(`${Math.floor(round.spinTotal / TAU + 0.15)} ${GameKit.t(Math.floor(round.spinTotal / TAU + 0.15) === 1 ? { en: 'FLIP', pl: 'SALTO' } : { en: 'FLIPS', pl: 'SALTA' })}`, width / 2, ay - 59,
      { fill: '#eef4ff', font: '800 11px monospace', align: 'center', baseline: 'middle' });
  }
  const grade = round.grade;
  if (grade && round.gradeAge < 2.1 && grade !== 'crash' && grade !== 'retry' && !round.spinning) {
    const labels = {
      perfect: { en: 'PERFECT', pl: 'IDEALNIE' }, clean: { en: 'CLEAN', pl: 'CZYSTO' },
      wobble: { en: 'WOBBLE', pl: 'CHWIEJNIE' }, flat: { en: 'NO TRICK', pl: 'BEZ TRIKU' },
      save: { en: 'AUTO RESCUE USED', pl: 'RATUNEK AUTO' }
    };
    const alpha = Math.min(1, (2.1 - round.gradeAge) / 0.4);
    draw.with({ alpha }, () => {
      const y = height > width && box.y < ay ? box.y - 32 : box.y + box.h + 7;
      draw.rect(box.x, y, box.w, 25, { fill: 'rgba(12,23,42,0.45)' });
      draw.text(`${GameKit.t({ en: 'LAST:', pl: 'OSTATNI:' })} ${GameKit.t(labels[grade])}${round.gradePoints ? ` +${round.gradePoints}` : ''}`, box.x + 10, y + 13,
        { fill: grade === 'wobble' ? WARN : '#8fffc2', font: '700 11px monospace', baseline: 'middle' });
    });
  }
}

export function paintOnboarding(round: Round, kit: GameKitGameContext) {
  if (round.started) return;
  const { draw, width, height } = kit;
  const w = Math.min(390, width - 44);
  const x = (width - w) / 2;
  const y = HUD_H + (height - HUD_H) * 0.19;
  draw.rect(0, HUD_H, width, height - HUD_H, { fill: 'rgba(5,12,26,0.65)' });
  draw.rect(x, y, w, 216, { fill: '#0d1c34', stroke: '#7ec8ff', lineWidth: 2 });
  const line = (label: { en: string; pl: string }, dy: number, size = 13, color = '#eef4ff') => draw.text(GameKit.t(label), width / 2, y + dy,
    { fill: color, font: `800 ${size}px monospace`, align: 'center', baseline: 'middle' });
  line(round.practiceTries > 0 ? { en: 'TRY AGAIN — NO PENALTY', pl: 'SPRÓBUJ — BEZ KARY' } : { en: 'YOUR FIRST SALTO', pl: 'TWOJE PIERWSZE SALTO' }, 27, 19, '#fff3d6');
  line({ en: '1  Hold SPACE or the SPIN button', pl: '1  Przytrzymaj SPACJĘ lub OBRÓT' }, 63);
  line({ en: '2  Release when the halo is GREEN', pl: '2  Puść, gdy pierścień jest ZIELONY' }, 93, 13, '#8fffc2');
  line({ en: 'Release freezes your angle.', pl: 'Puszczenie zatrzymuje obrót.' }, 120, 12);
  line(round.practiceTries > 0 ? failureAdvice(round) : { en: 'First attempt is a safe practice.', pl: 'Pierwszy skok to bezkarna próba.' }, 142, 12, '#9fd7ff');
  line({ en: 'We pause upright until you release.', pl: 'Zatrzymamy próbę w pionie do puszczenia.' }, 164, 11);
  line({ en: 'HOLD TO START', pl: 'PRZYTRZYMAJ, ABY ZACZĄĆ' }, 194, 14, '#ffd23f');
}

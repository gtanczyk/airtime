import { HUD_H, SHAPE_COLOR, SHAPE_NAMES, type Round } from './model.ts';
import { MISSIONS, DARES, ENCORE_LANDINGS, dareRewardFor } from './show.ts';

function showText(draw: GameKitDraw, label: string, x: number, y: number, color: string, size = 10, align: CanvasTextAlign = 'left') {
  draw.text(label, x, y, { fill: color, font: `800 ${size}px monospace`, align, baseline: 'middle' });
}

export function paintVenue(round: Round, kit: GameKitGameContext) {
  const { draw, width, height } = kit;
  const active = round.show.encore > 0;
  const heat = active ? 1 : round.show.heat / 100;
  const color = active ? '#ffd23f' : '#7ec8ff';
  // Architecture and footlights give the tent depth without crossing the flight path.
  for (const side of [0, 1]) {
    const x = side === 0 ? 7 : width - 18;
    draw.rect(x, HUD_H + 5, 11, height - HUD_H - 5, { fill: '#13182d' });
    for (let y = HUD_H + 24; y < height - 35; y += 24) {
      draw.rect(x + 3, y, 4, 4, { fill: heat > 0.5 ? color : '#4a4055' });
    }
    draw.ellipse(side === 0 ? 30 : width - 30, height - 77, 26, 6, { fill: `rgba(126,200,255,${0.08 + heat * 0.12})` });
  }
  const top = height - 68;
  draw.ellipse(width / 2, top + 4, width * 0.33, 11, { fill: `rgba(126,200,255,${0.05 + heat * 0.08})` });
  for (let i = 0; i < 12; i++) {
    const x = 36 + i * (width - 72) / 11;
    draw.rect(x, height - 65, 5, 3, { fill: active ? '#ffd23f' : '#506a96' });
  }
  if (!active) return;
  draw.rect(20, HUD_H + 4, width - 40, height - HUD_H - 8, { stroke: 'rgba(255,210,63,0.3)', lineWidth: 1, radius: 8 });
  for (let i = 0; i < 22; i++) {
    const lane = i % 2 === 0 ? 0.08 : 0.72;
    const x = width * (lane + ((i * 17) % 18) / 100);
    const y = HUD_H + 100 + ((round.time * (20 + i % 6) + i * 31) % Math.max(1, height - HUD_H - 165));
    draw.with({ alpha: 0.35, x, y, rot: round.time + i }, () => {
      draw.rect(-2, -2, 4, 4, { fill: i % 3 === 0 ? '#ffd23f' : '#6ef2a3' });
    });
  }
}

export function paintShowHUD(round: Round, kit: GameKitGameContext) {
  const { draw, width, height } = kit;
  const show = round.show;
  const mission = MISSIONS[show.mission];
  const dare = show.dare >= 0 ? DARES[show.dare] : null;
  const timing = round.spinning && round.alt > 20 && round.started;
  const toast = !timing && show.toastAge < 2.6;
  const dareToast = !timing && show.dareAge < 2.6;
  const cardY = HUD_H + 10;
  const cardH = timing ? 65 : toast && show.lastMission === 0 ? 102 : 88;
  const wrap = (label: string, y: number, size = 13) => {
    const lines = [''];
    for (const word of label.split(' ')) {
      const last = lines.length - 1;
      if (lines[last] && (lines[last] + ' ' + word).length > 20) lines.push(word);
      else lines[last] += (lines[last] ? ' ' : '') + word;
    }
    lines.forEach((line, i) => showText(draw, line, 22, y + i * 17, '#eef4ff', size));
  };
  draw.rect(14, cardY, 180, cardH, { fill: '#0b172d', radius: 7 });
  if (toast) {
    showText(draw, GameKit.t({ en: 'MISSION COMPLETE', pl: 'MISJA UKOŃCZONA' }), 22, cardY + 16, '#8fffc2', 11);
    showText(draw, `+${MISSIONS[show.lastMission].reward} ${GameKit.t({ en: 'PTS', pl: 'PKT' })}`, 22, cardY + 41, '#fff3d6', 20);
    wrap(GameKit.t(show.lastMission === 0
      ? { en: 'Next crash is rescued automatically', pl: 'Następny upadek uratuje Cię automatycznie' }
      : { en: 'Bonus banked', pl: 'Premia dopisana' }), cardY + 65, 11);
  } else if (dareToast && show.dareReward > 0) {
    showText(draw, GameKit.t({ en: 'CROWD CALL COMPLETE', pl: 'WEZWANIE SPEŁNIONE' }), 22, cardY + 16, '#8fffc2', 11);
    showText(draw, `+${show.dareReward}`, 22, cardY + 42, '#fff3d6', 21);
    wrap(GameKit.t({ en: 'A new optional call awaits', pl: 'Nowe opcjonalne wezwanie' }), cardY + 66, 11);
  } else {
    showText(draw, mission ? GameKit.t({ en: 'MISSION {n}/6', pl: 'MISJA {n}/6' }, { n: show.mission + 1 })
      : GameKit.t({ en: 'OPTIONAL CROWD CALL', pl: 'WEZWANIE PUBLICZNOŚCI' }), 22, cardY + 16, '#9fd7ff', 11);
    wrap(GameKit.t(mission ?? dare ?? { en: 'Chase the high score', pl: 'Pobij swój wynik' }), cardY + 37);
    if (!timing) {
    const reward = mission ? mission.reward : dareRewardFor(show);
    const progress = mission ? `${show.missionProgress}/${mission.goal}`
      : GameKit.t({ en: 'Flights: {n}', pl: 'Skoki: {n}' }, { n: show.dareFlights });
    showText(draw, `+${reward} ${GameKit.t({ en: 'PTS', pl: 'PKT' })}`, 22, cardY + 74, '#ffd23f', 11);
    showText(draw, progress, 180, cardY + 74, '#cadbf1', 11, 'right');
    if (mission?.goal === 3) {
      draw.rect(22, cardY + 82, 156, 3, { fill: '#3a5071' });
      draw.rect(22, cardY + 82, 156 * show.missionProgress / mission.goal, 3, { fill: '#8fffc2' });
    }
  }
  }
  let railY = cardY + cardH + 17;
  if (!timing && (show.perfects >= 2 || show.encore > 0)) {
    const active = show.encore > 0;
    draw.rect(14, railY - 9, 180, 40, { fill: '#0b172d', radius: 6 });
    showText(draw, active ? GameKit.t({ en: 'ENCORE: POINTS ×1.5', pl: 'BIS: PUNKTY ×1.5' })
      : GameKit.t({ en: 'APPLAUSE TO ENCORE', pl: 'APLAUZ DO BISU' }), 22, railY + 3, active ? '#ffd23f' : '#9fd7ff', 11);
    showText(draw, active ? GameKit.t({ en: 'Landings left: {n}', pl: 'Lądowania do końca: {n}' }, { n: show.encore })
      : `${show.heat}/100%`, 22, railY + 20, '#cadbf1', 10);
    draw.rect(160, railY + 17, 20, 4, { fill: '#3a5071' });
    draw.rect(160, railY + 17, 20 * (active ? show.encore / ENCORE_LANDINGS : show.heat / 100), 4,
      { fill: active ? '#ffd23f' : '#7ec8ff' });
    railY += 47;
  }
  if (!timing && show.safety) showText(draw, GameKit.t({ en: '1 AUTOMATIC RESCUE', pl: '1 RATUNEK AUTOMATYCZNY' }), 18, railY, '#8fffc2', 10);
  if (!timing && dare && !toast) showText(draw, GameKit.t({ en: 'Skip without penalty', pl: 'Możesz pominąć bez kary' }), 18, railY + (show.safety ? 18 : 0), '#cadbf1', 10);
  if (round.alt > 180) showText(draw, `${(round.alt / 20).toFixed(1)} ${GameKit.t({ en: 'm HIGH', pl: 'm WYSOKOŚCI' })}`,
    width - 22, HUD_H + 26, '#cadbf1', 12, 'right');
  if (round.alt < 150) {
    draw.with({ alpha: Math.max(0, 1 - round.alt / 170) }, () => {
      showText(draw, 'AIRTIME', width / 2, HUD_H + 25, '#fff3d6', 18, 'center');
      showText(draw, GameKit.t(show.mission >= 6 ? { en: 'FINALE', pl: 'FINAŁ' }
        : show.mission >= 3 ? { en: 'SHOWTIME', pl: 'POKAZ' } : { en: 'WARM-UP', pl: 'ROZGRZEWKA' }), width / 2, HUD_H + 44, '#cadbf1', 10, 'center');
    });
  }
  if (!timing && round.unlockBanner && round.unlockAge < 3) {
    draw.rect(14, height - 54, width - 28, 42, { fill: '#0b172d', radius: 7 });
    const name = GameKit.t(SHAPE_NAMES[round.unlockBanner]);
    showText(draw, GameKit.t({ en: '{name} UNLOCKED', pl: 'ODBLOKOWANO: {name}' }, { name }), width / 2, height - 39,
      SHAPE_COLOR[round.unlockBanner], 12, 'center');
    showText(draw, GameKit.t({ en: 'Release, then hold SPACE / SPIN to change shape', pl: 'Puść, potem przytrzymaj SPACJĘ / OBRÓT, aby zmienić figurę' }),
      width / 2, height - 22, '#eef4ff', width < 500 ? 10 : 11, 'center');
  }
}

export function trickName(round: Round): string {
  if (round.grade === 'save') return GameKit.t({ en: 'SECOND CHANCE', pl: 'DRUGA SZANSA' });
  if (round.gradeSpins < 1) return '';
  const base = GameKit.t(round.gradeSpins >= 3 ? { en: 'TRIPLE', pl: 'POTRÓJNE' }
    : round.gradeSpins >= 2 ? { en: 'DOUBLE', pl: 'PODWÓJNE' } : { en: 'SALTO', pl: 'SALTO' });
  return round.gradeVariety >= 2 ? `${base} · FLOW ${round.gradeVariety}` : base;
}

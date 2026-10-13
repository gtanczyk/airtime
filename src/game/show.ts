import type { Grade, Landing } from './model.ts';

export const ENCORE_LANDINGS = 4;
export const ENCORE_MULTIPLIER = 1.5;
export const MISSIONS = [
  { en: '3 perfect in a row', pl: '3 idealne z rzędu', goal: 3, reward: 250 },
  { en: 'Mix 2 shapes', pl: 'Połącz 2 figury', goal: 1, reward: 500 },
  { en: 'Land a double flip', pl: 'Wyląduj podwójne salto', goal: 1, reward: 800 },
  { en: 'Mix 3 shapes', pl: 'Połącz 3 figury', goal: 1, reward: 1000 },
  { en: 'Land with Layout', pl: 'Salto z wyprostem', goal: 1, reward: 1500 },
  { en: '3 perfect in Encore', pl: '3 idealne w bisie', goal: 3, reward: 2000 }
];
export const DARES = [
  { en: 'Double in Tuck', pl: 'Podwójne w grupie', reward: 2000 },
  { en: 'Flow: 3 shapes', pl: 'Flow: trzy figury', reward: 1000 },
  { en: 'Perfect Layout', pl: 'Idealny wyprost', reward: 1500 },
  { en: 'Release in last 0.4s', pl: 'Puść w ostatnich 0,4 s', reward: 2000 }
];

export type Show = {
  heat: number; encore: number; encoreRuns: number; encoreLandings: number;
  encoreStarted: boolean; perfectStreak: number; perfects: number; cleanLandings: number;
  mission: number; missionProgress: number; lastMission: number; lastBonus: number; toastAge: number;
  safety: boolean; saves: number; lastMask: number; bestTrick: number; bestSpins: number;
  dare: number; dareFlights: number; daresWon: number; lastDare: number;
  dareReward: number; dareAge: number; dareExpired: boolean;
};

export function createShow(): Show {
  return {
    heat: 0, encore: 0, encoreRuns: 0, encoreLandings: 0, encoreStarted: false,
    perfectStreak: 0, perfects: 0, cleanLandings: 0, mission: 0, missionProgress: 0,
    lastMission: -1, lastBonus: 0, toastAge: 99, safety: false, saves: 0,
    lastMask: 0, bestTrick: 0, bestSpins: 0,
    dare: -1, dareFlights: 3, daresWon: 0, lastDare: -1, dareReward: 0, dareAge: 99, dareExpired: false
  };
}

export function isClean(grade: Grade): boolean {
  return grade === 'perfect' || grade === 'clean';
}

export function judgeShow(show: Show, landing: Landing, mask: number): { multiplier: number; bonus: number } {
  show.encoreStarted = false;
  show.lastBonus = 0;
  show.lastMask = mask;
  const active = show.encore > 0;
  const dareBonus = judgeDare(show, landing, mask);
  if (!isClean(landing.grade)) {
    show.perfectStreak = 0;
    if (show.mission === 0) show.missionProgress = 0;
    show.heat = Math.max(0, show.heat - 30);
    show.encore = 0;
    return { multiplier: 1, bonus: 0 };
  }
  show.cleanLandings += 1;
  show.perfectStreak = landing.grade === 'perfect' ? show.perfectStreak + 1 : 0;
  if (landing.grade === 'perfect') show.perfects += 1;
  show.bestSpins = Math.max(show.bestSpins, landing.spins);
  if (active) {
    show.encore -= 1;
    show.encoreLandings += 1;
    if (show.encore === 0) show.heat = 0;
  } else {
    show.heat = Math.min(100, show.heat + (landing.grade === 'perfect' ? 12 : 8)
      + Math.max(0, landing.variety - 1) * 6 + Math.max(0, landing.spins - 1) * 8);
    if (show.heat === 100) {
      show.heat = 0;
      show.encore = ENCORE_LANDINGS;
      show.encoreRuns += 1;
      show.encoreStarted = true;
    }
  }
  const mission = MISSIONS[show.mission];
  if (!mission) return { multiplier: active ? ENCORE_MULTIPLIER : 1, bonus: dareBonus };
  switch (show.mission) {
    case 0: show.missionProgress = Math.min(mission.goal, show.perfectStreak); break;
    case 1: if (landing.variety >= 2) show.missionProgress = 1; break;
    case 2: if (landing.spins >= 2) show.missionProgress = 1; break;
    case 3: if (landing.variety >= 3) show.missionProgress = 1; break;
    case 4: if ((mask & 8) !== 0) show.missionProgress = 1; break;
    case 5: if (active && landing.grade === 'perfect') show.missionProgress += 1; break;
  }
  if (show.missionProgress < mission.goal) return { multiplier: active ? ENCORE_MULTIPLIER : 1, bonus: 0 };
  if (show.mission === 0) show.safety = true;
  show.lastMission = show.mission;
  show.mission += 1;
  if (show.mission === MISSIONS.length) { show.dare = 0; show.dareFlights = 3; }
  show.missionProgress = 0;
  show.lastBonus = mission.reward;
  show.toastAge = 0;
  return { multiplier: active ? ENCORE_MULTIPLIER : 1, bonus: mission.reward };
}

function judgeDare(show: Show, landing: Landing, mask: number): number {
  show.dareReward = 0;
  if (show.dare < 0) return 0;
  const win = isClean(landing.grade) && [
    landing.spins >= 2 && mask === 1,
    landing.variety >= 3,
    landing.grade === 'perfect' && (mask & 8) !== 0,
    landing.grade === 'perfect' && (landing.releaseAir ?? Infinity) > 0 && (landing.releaseAir ?? Infinity) <= 0.4
  ][show.dare];
  show.dareFlights -= 1;
  if (!win && show.dareFlights > 0) return 0;
  const reward = win ? dareRewardFor(show) : 0;
  show.lastDare = show.dare;
  show.dare = (show.dare + 1) % DARES.length;
  show.dareFlights = 3;
  show.dareReward = reward;
  show.dareExpired = !win;
  show.dareAge = 0;
  if (win) show.daresWon += 1;
  return reward;
}

export function dareRewardFor(show: Show): number {
  return show.dare < 0 ? 0 : Math.round(DARES[show.dare].reward * (1 + Math.min(3, Math.floor(show.daresWon / 4)) * 0.25));
}

export function rankFor(score: number): { en: string; pl: string } {
  if (score >= 50000) return { en: 'LEGEND', pl: 'LEGENDA' };
  if (score >= 20000) return { en: 'HEADLINER', pl: 'GWIAZDA' };
  if (score >= 5000) return { en: 'ACROBAT', pl: 'AKROBATA' };
  return { en: 'ROOKIE', pl: 'DEBIUTANT' };
}

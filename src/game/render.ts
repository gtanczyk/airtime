

import {
  FEET_OFFSET,
  GROUND_Y,
  HUD_H,
  TAU,
  currentShape,
  screenY,
  type Grade,
  type Round,
  type Shape
} from './model.ts';
import {
  BAD,
  GOOD,
  WARN,
  paintBounceRings,
  paintLandingRing,
  paintTrail,
  paintTrampoline,
} from './art.ts';
import { paintVenue, paintShowHUD } from './show-art.ts';
import { paintCoaching, paintOnboarding } from './coaching.ts';
import { paintAcrobat } from './poses.ts';
import { paintBunting, paintCrowd, paintSky, paintSpotlights } from './backdrop.ts';

const GRADE_TEXT: Record<Grade, { en: string; pl: string }> = {
  perfect: { en: 'PERFECT!', pl: 'IDEALNIE!' },
  clean: { en: 'CLEAN', pl: 'CZYSTO' },
  wobble: { en: 'WOBBLE', pl: 'CHWIEJNIE' },
  flat: { en: 'NO TRICK', pl: 'BEZ TRIKU' },
  crash: { en: 'CRASH!', pl: 'UPADEK!' },
  save: { en: 'SAVED!', pl: 'RATUNEK!' },
  retry: { en: 'TRY AGAIN', pl: 'SPRÓBUJ PONOWNIE' }
};

const GRADE_COLOR: Record<Grade, string> = {
  perfect: GOOD,
  clean: WARN,
  wobble: '#ffa45c',
  flat: '#b9aee0',
  crash: BAD,
  save: '#7ec8ff',
  retry: '#7ec8ff'
};

const SHAPE_TEXT: Record<Shape, { en: string; pl: string }> = {
  tuck: { en: 'TUCK', pl: 'GRUPA' },
  pike: { en: 'PIKE', pl: 'PÓŁGRUPA' },
  straddle: { en: 'STRADDLE', pl: 'ROZKROK' },
  layout: { en: 'LAYOUT', pl: 'WYPROST' }
};

export function gradeLabel(grade: Grade): string {
  return GameKit.t(GRADE_TEXT[grade]);
}

export function shapeLabel(shape: Shape): string {
  return GameKit.t(SHAPE_TEXT[shape]);
}

export function gradeColor(grade: Grade): string {
  return GRADE_COLOR[grade];
}

function paintScene(round: Round, kit: GameKitGameContext) {
  const { draw, width, height, particles } = kit;
  const cx = width / 2;
  const bedY = GROUND_Y + round.camAlt;
  const toScreen = (alt: number) => screenY(alt, round.camAlt);

  paintBunting(draw, width, round.camAlt, height, round.zoom);
  paintCrowd(draw, width, bedY, height, round);

  if (bedY < height + 200) {
    paintBounceRings(draw, cx, bedY, round.flex);
    paintTrampoline(draw, cx, bedY, round.flex);
  }

  paintTrail(draw, round, cx, toScreen);
  particles.draw();

}

export function paintWorld(round: Round, kit: GameKitGameContext) {
  const { draw, width, height } = kit;
  const cx = width / 2;
  const ay = screenY(round.alt, round.camAlt) - FEET_OFFSET;
  const zoom = round.zoom;
  const anchorY = height - 70;

  const act = round.show.mission >= 6 ? 2 : round.show.mission >= 3 ? 1 : 0;
  paintSky(draw, width, height, act);
  paintSpotlights(draw, width, height, round.time, act);
  paintVenue(round, kit);

  draw.with({ x: cx, y: anchorY, scale: zoom }, () => {
    draw.with({ x: -cx, y: -GROUND_Y }, () => {
      paintScene(round, kit);
    });
  });

  // Readouts are drawn unscaled at the zoomed position, so they stay legible.
  const ayz = anchorY + (ay - GROUND_Y) * zoom;
  const shape = currentShape(round);
  // Keep the athlete and release halo readable while the venue pulls back.
  paintLandingRing(draw, cx, ayz, round.rot, round.spinTotal >= TAU * 0.85);
  paintAcrobat(draw, cx, ayz, round.rot, round.spinning && !round.practiceLocked ? shape : null);

  paintShowHUD(round, kit);
  paintCoaching(round, kit);
  draw.rect(0, HUD_H, width, 3, { fill: 'rgba(255,210,63,0.25)' });
}

export function paintForeground(round: Round, kit: GameKitGameContext) {
  const { draw, width, height } = kit;
  if (round.flash > 0.01) {
    draw.with({ alpha: Math.min(0.08, round.flash * 0.08) }, () => {
      draw.rect(0, 0, width, height, { fill: '#fff3d6' });
    });
  }
  paintOnboarding(round, kit);
}

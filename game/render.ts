

import {
  FEET_OFFSET,
  GROUND_Y,
  HUD_H,
  SHAPE_COLOR,
  currentShape,
  nextShape,
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
  paintDial,
  paintLandingRing,
  paintShapeTag,
  paintTrail,
  paintTrampoline,
  paintVarietyPips,
  q
} from './art.ts';
import { paintAcrobat } from './poses.ts';
import { paintBunting, paintCrowd, paintGradePopup, paintRuler, paintSky, paintSpotlights } from './backdrop.ts';

const GRADE_TEXT: Record<Grade, { en: string; pl: string }> = {
  perfect: { en: 'PERFECT!', pl: 'IDEALNIE!' },
  clean: { en: 'CLEAN', pl: 'CZYSTO' },
  wobble: { en: 'WOBBLE', pl: 'CHWIEJNIE' },
  flat: { en: 'NO TRICK', pl: 'BEZ TRIKU' },
  crash: { en: 'CRASH!', pl: 'UPADEK!' }
};

const GRADE_COLOR: Record<Grade, string> = {
  perfect: GOOD,
  clean: WARN,
  wobble: '#ffa45c',
  flat: '#b9aee0',
  crash: BAD
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

function paintScene(round: Round, kit: GameKitGameContext, ay: number) {
  const { draw, width, height, particles } = kit;
  const cx = width / 2;
  const bedY = GROUND_Y + round.camAlt;
  const toScreen = (alt: number) => screenY(alt, round.camAlt);

  paintBunting(draw, width, round.camAlt, height);
  paintCrowd(draw, width, bedY, height);
  paintRuler(draw, round.camAlt, height, round.best);

  if (bedY < height + 200) {
    paintBounceRings(draw, cx, bedY, round.flex);
    paintTrampoline(draw, cx, bedY, round.flex);
  }

  paintTrail(draw, round, cx, toScreen);
  particles.draw();

  paintLandingRing(draw, cx, ay, round.rot);
  paintAcrobat(draw, cx, ay, round.rot, round.spinning ? currentShape(round) : null);
}

export function paintWorld(round: Round, kit: GameKitGameContext) {
  const { draw, width, height } = kit;
  const cx = width / 2;
  const ay = screenY(round.alt, round.camAlt) - FEET_OFFSET;
  const zoom = round.zoom;
  const anchorY = HUD_H + (height - HUD_H) / 2;

  paintSky(draw, width, height);
  paintSpotlights(draw, width, height, round.time);

  draw.with({ x: cx, y: anchorY, scale: zoom }, () => {
    draw.with({ x: -cx, y: -anchorY }, () => {
      paintScene(round, kit, ay);
    });
  });

  // Readouts are drawn unscaled at the zoomed position, so they stay legible.
  const ayz = anchorY + (ay - anchorY) * zoom;
  const shape = currentShape(round);

  if (round.alt > 8) {
    const upcoming = round.armed ? nextShape(round) : null;
    const shown = upcoming ?? shape;
    paintShapeTag(
      draw,
      cx,
      Math.min(height - 62, ayz + 46),
      shapeLabel(shown),
      SHAPE_COLOR[shown],
      upcoming !== null
    );
  }

  if (round.grade) {
    paintGradePopup(draw, round, cx, ayz, gradeLabel(round.grade), gradeColor(round.grade));
  }

  paintDial(draw, width - 46, height - 66, round.rot, shape);
  // Directly under the dial: which shapes this flight has already touched.
  paintVarietyPips(draw, width - 72, height - 30, round.shapeMask, round.unlockedCount);

  draw.rect(0, HUD_H, width, 3, { fill: 'rgba(255,210,63,0.25)' });
}

export function paintForeground(round: Round, kit: GameKitGameContext) {
  const { draw, width, height } = kit;
  if (round.flash > 0.01) {
    draw.with({ alpha: Math.min(0.2, round.flash * 0.2) }, () => {
      draw.rect(0, 0, width, height, { fill: '#fff3d6' });
    });
  }

  if (round.unlockBanner && round.unlockAge < 3.2) {
    const shape = round.unlockBanner;
    draw.with({ alpha: Math.max(0, Math.min(1, (3.2 - round.unlockAge) / 0.7)) }, () => {
      draw.rect(0, HUD_H + 8, width, 44, { fill: 'rgba(21,12,38,0.92)' });
      draw.text(
        GameKit.t({ en: '{name} UNLOCKED', pl: 'ODBLOKOWANO: {name}' }, { name: shapeLabel(shape) }),
        q(width / 2),
        q(HUD_H + 22),
        { fill: SHAPE_COLOR[shape], font: '800 15px monospace', align: 'center', baseline: 'middle' }
      );
      draw.text(
        GameKit.t({
          en: 'let go in mid-air, then grab again — slower spin, more points',
          pl: 'puść w locie i chwyć ponownie — wolniejszy obrót, więcej punktów'
        }),
        q(width / 2),
        q(HUD_H + 40),
        { fill: '#d9cff5', font: '700 11px monospace', align: 'center', baseline: 'middle' }
      );
    });
    return;
  }

  if (round.jumps < 2 && round.saltos === 0) {
    draw.rect(0, HUD_H + 8, width, 28, { fill: 'rgba(21,12,38,0.9)' });
    draw.text(
      GameKit.t({
        en: 'HOLD SPACE TO TUCK — RELEASE UPRIGHT',
        pl: 'PRZYTRZYMAJ SPACJĘ — PUŚĆ NA PIONIE'
      }),
      q(width / 2),
      q(HUD_H + 22),
      { fill: '#fff3d6', font: '700 13px monospace', align: 'center', baseline: 'middle' }
    );
  }
}

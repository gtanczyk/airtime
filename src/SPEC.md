---
title: Airtime
slug: airtime
genre: arcade
controls: Hold Space (or hold the Spin button / the canvas) to grip; release to open out. Release and grab again in the same flight to change body shape. M or sound button to mute.
submitted_by: null
---
## Concept
A one-button trampoline routine. You are an acrobat bouncing on a circus trampoline,
gripping into saltos in mid-air and opening out again in time to land upright. Every clean
landing kicks you higher, which buys more air, which buys more rotations — and a tighter
release window.

## How it plays
The first launch waits for input behind a short, explicit SPACE / SPIN tutorial.
The first successful salto is a guided rehearsal: holding stops the flight upright at
one full turn until release. Bad practice attempts return to the tutorial with actionable
advice, without ending the show, spending rescue or earning points. A successful landing
ends the rehearsal; subsequent flights use ordinary timing and failure rules.
There is exactly one input, and it never needs aiming: hold it while airborne and the
acrobat grips and rotates; release and she snaps open, frozen at whatever angle she
reached. Release stops rotation immediately. Landing is safe only at an upright angle, so the
player watches the halo and releases on green.

**Body shapes.** The first grab of a flight is a Tuck. Release for at least 0.12 s and grab
again in the same flight and she advances to the next shape. Later shapes rotate slower —
which costs airtime, but pays more per salto and makes the last few degrees before a
landing much easier to place, so switching late is both the greedy line and the safe one.

| Shape | Rotation | Points per salto |
| --- | --- | --- |
| Tuck | 7.5 rad/s | 100 |
| Pike | 5.2 rad/s | 170 |
| Straddle | 4.4 rad/s | 220 |
| Layout | 3.0 rad/s | 320 |

Shapes are earned, not dumped on the player: Pike unlocks at 2 saltos, Straddle at 6,
Layout at 12, each announced with a banner. A player who never releases mid-flight simply
plays the one-shape game and is never shown a control they have not earned.

**Landing.** Judged on how close the body angle is to upright:

- within 0.30 rad — **PERFECT**: full points plus a bonus, extra bounce power
- within 0.75 rad — **CLEAN**: full points, extra bounce power
- within 1.30 rad — **WOBBLE**: quarter points, combo lost, bounce power drops
- beyond that — **CRASH**: the run ends

The angle is checked even before a full rotation: a dangerous partial flip is a **CRASH**,
a tilted partial flip is a **WOBBLE**, and a safe partial flip is **NO TRICK** (no points,
combo lost, and reduced bounce power). Idling on the trampoline goes nowhere.

**Scoring.** A salto is worth the weighted average of the shapes it was actually spent in,
so half a turn held in Straddle pays more than the same half turn in Tuck. A perfect stick
adds 40. That total is multiplied by the variety bonus for distinct shapes used in the
flight (each shape must accumulate at least 0.18 rad; x1 / x1.4 / x1.8 / x2.2 for 1 / 2 / 3 / 4) and then by the combo multiplier
(x1.5 at one clean landing, rising to x5.5 at nine). Bounce power climbs from 520 toward a
980 ceiling; the grip also spins faster the more saltos you have banked, so the release
window narrows as the score grows.

## Winning and losing
Endless high-score chase. There is no win state — an unprotected crash ends the show.
The overlay shows score and specific advice for incomplete, early, late or unreleased turns.
Best combo and completed missions remain available in the recorded show statistics. Replay with Enter, R, or a tap.

## Look and feel
Pixel art with a limited palette in a night-circus hall: warm lamps and side curtains frame
striped tent walls behind drifting spotlights,
bunting rows pinned to world altitudes so the climb is legible, a crowd silhouette on the
floor, and a red-and-cream pixel trampoline whose bed sags on every landing. The acrobat is a
pixel sprite with cached rotations on a two-pixel grid, a distinct silhouette per shape — curled for Tuck, jack-knifed for
Pike, a wide V for Straddle, a straight line for Layout — and a leotard stripe colour-coded
to the shape, which also tints her after-image trail and the dial needle. A tag under her
names the current shape, and switches to `> NEXT SHAPE` the moment a release has armed the
change. The control cluster names the current or next shape, avoiding anonymous pips and a
second corner dial. A halo marks upright at its top and carries an angle dot, turning
amber then green inside the landing window.

**The camera follows vertical jumps at constant scale.** It starts at the trampoline,
then scrolls upward when the athlete reaches the upper part of the playfield. During
high jumps the trampoline leaves the bottom of the view and returns on descent.
Athlete, trampoline, trail and decorations share the same translation without zoom.
HUD and control panels stay in screen space. Adaptive orientation switches between
640×400 on desktop and 480×640 in portrait.

**Coaching and progression.** A single cluster beside the athlete (above or below in
portrait) names SPACE / SPIN, explains that release freezes orientation, and distinguishes
locked position from approaching touchdown. The landing countdown is explicitly labelled
and appears only when descending with a safe locked angle. Evaluation is explicitly labelled LAST and is shown while released, solid for 1.7 seconds
then fading over 0.4 seconds inside the same cluster. Shape changes are
introduced at the first unlock, including release + hold and the slower rotation tradeoff.
While rotating, the mission card folds to its target and auxiliary panels disappear.
They return while the angle is locked and there is time to read. Applause appears after two perfect landings; rescue is labelled automatic only when earned.
Duplicate multipliers, raw timers, unlabeled pips and the corner dial are removed. The
athlete has brighter limb outlines, light shoes and distinct Pike, Straddle and overhead
Layout silhouettes. Warm-up, Showtime and Finale change the tent and spotlight palette.

**Scoring integrity.** A hold spanning a landing registers a fresh tuck on the next bounce.
Release-and-regrab shape changes still require 0.12 seconds released. Variety counts actual
rotation in a shape, so briefly touching an extra shape cannot farm the multiplier.

## Show missions and risk / reward
Six sequential missions add 250, 500, 800, 1000, 1500 and 2000 bonus points: three
consecutive perfects; two shapes in one clean flight; a clean double flip; three shapes;
a clean flight including Layout; and three perfect landings during Encore. Bonuses apply
once, and only to successful landings. All completed missions leave an endless score chase.

The first mission earns one rescue for the entire show. A dangerous landing consumes it,
awards zero points, resets combo and reduces bounce power to 72% (minimum 460), then launches
again. A subsequent unprotected crash ends the run. Restarts reset all missions and rescues.

Applause gains 12 for perfect or 8 for clean, plus 6 per extra shape and 8 per extra flip.
At 100 applause the following four clean landings score ×1.5; mission rewards stay additive.
Encore begins after the triggering landing. A flat, wobble or rescue cancels Encore and
reduces applause by 30. The audience cheers and lights/confetti respond to Encore; physics
and the release window remain unchanged. Ranks progress from Rookie to Acrobat (5000),
Headliner (20000) and Legend (50000). Progress is local to the current show.

After the six missions, optional crowd calls rotate through: a clean Tuck double (+2000),
three-shape Flow (+1000), perfect Layout (+1500), and a perfect release during the final
0.4 seconds (+2000). Each allows three flights. Ignoring it changes the call without
removing score or breaking combo; attempted tricks still follow ordinary landing rules.
Rewards grow 25% every four successes, capped at +75%, and are additive outside Encore.
A call cannot award its bonus twice on one landing. These goals encourage trading a safe
early lock for extra rotations, style or a later release. They do not add new controls.

## Audio
A carnival loop plays under the routine. Each bounce plays a soft launch cue pitched by
bounce power, a shape change a short cloth rustle pitched down as she opens out, clean
landings a coin chime, perfect landings a bright bell pitched up by the combo, wobbles a
short buzzer, and a shape unlock its own high bell. The crash plays the terminal cue after
the music stops. A visible sound button and the M key toggle all audio.

## Out of scope
No persistence, network access, external assets, twist axis, screen-zone or multi-button
controls, or difficulty selection. Everything is driven by one hold-and-release input.
Conserved-momentum rotation was prototyped and rejected: being unable to stop the spin made
the early game, where only Tuck is unlocked and no braking shape is available yet, far too
punishing.

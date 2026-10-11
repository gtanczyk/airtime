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
There is exactly one input, and it never needs aiming: hold it while airborne and the
acrobat grips and rotates; release and she snaps open, frozen at whatever angle she
reached. Releasing is always safe — the angle stops where you left it, so the player can
watch the halo and let go the moment it turns green.

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

Landing without completing a rotation is a **NO TRICK**: no points, combo lost, and the
bounce power bleeds away, so idling on the trampoline goes nowhere.

**Scoring.** A salto is worth the weighted average of the shapes it was actually spent in,
so half a turn held in Straddle pays more than the same half turn in Tuck. A perfect stick
adds 40. That total is multiplied by the variety bonus for distinct shapes used in the
flight (x1 / x1.4 / x1.8 / x2.2 for 1 / 2 / 3 / 4) and then by the combo multiplier
(x1.5 at one clean landing, rising to x5.5 at nine). Bounce power climbs from 520 toward a
980 ceiling; the grip also spins faster the more saltos you have banked, so the release
window narrows as the score grows.

## Winning and losing
Endless high-score chase. There is no win state — the run ends on a crash landing and the
overlay shows the final score and salto count. Replay with Enter, R, or a tap.

## Look and feel
Chunky pixel art in a night-circus hall: striped tent walls behind drifting spotlights,
bunting rows pinned to world altitudes so the climb is legible, a crowd silhouette on the
floor, and a red-and-cream trampoline whose bed sags on every landing. The acrobat is a
jointed figure with a distinct silhouette per shape — curled for Tuck, jack-knifed for
Pike, a wide V for Straddle, a straight line for Layout — and a leotard stripe colour-coded
to the shape, which also tints her after-image trail and the dial needle. A tag under her
names the current shape, and switches to `> NEXT SHAPE` the moment a release has armed the
change. Four pips under the dial show which shapes the flight has already used. A halo
turns amber then green as she passes through the landing window.

**The camera pulls back on the big bounces.** Above roughly 7 m the whole hall eases down
to 0.8 scale, so the trampoline and bunting shrink away beneath her and real height reads
as spectacle. The sky, spotlights, HUD and readouts stay unscaled so nothing becomes
illegible and no edge is ever exposed.

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

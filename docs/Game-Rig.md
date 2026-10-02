# Game Rig

The shell and game behind `/demos/candlelight`: Candlelight, a dark fantasy survival
horror platformer that runs in any browser and is built to be added to an
iPhone home screen. On a phone it is a handheld, screen above and controls
below. On a desktop the screen fills the window and a translucent key overlay
shows what the game is hearing. One area, five serpents: kill them all and
the belfry gate opens on the final boss, SOCIETY. Fell it to win. Lose five
candles of health and the run restarts, or, against the boss, restarts at
its gate.

## Files

| File                                        | Job                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/app/demos/candlelight/page.tsx`        | Metadata: manifest, `black-translucent` status bar, launch images, `viewport-fit=cover`    |
| `src/app/demos/candlelight/game-client.tsx` | Client-only import, with a shell-coloured placeholder so launch never flashes white        |
| `src/components/game/Handheld.tsx`          | Layout switching, canvas scaling, on-screen controls, key overlay, wake lock, fullscreen   |
| `src/components/game/input.ts`              | Keyboard map, gamepad map, D-pad and face-diamond geometry, `Controls` aggregation         |
| `src/components/game/haptics.ts`            | Rumble on a pad, vibration on a phone, for a hit taken or landed                           |
| `src/components/game/loop.ts`               | Fixed 60 Hz update with a capped backlog, render on every animation frame                  |
| `src/components/game/sandbox/game.ts`       | The `Game` contract (`step`, `draw`, `pause`) and the title, play, death and win scenes    |
| `src/components/game/sandbox/title.ts`      | The title screen: CANDLELIGHT in dripping candle wax, lit wicks, PRESS START               |
| `src/components/game/sandbox/ending.ts`     | The defeat (blood wave) and victory (fade to white) transitions and screens                |
| `src/components/game/sandbox/world.ts`      | One run with no canvas: player, snakes, torches, health, camera, particles                 |
| `src/components/game/sandbox/render.ts`     | Draws a `World`: scene, the darkness layer and its lights, bloom, HUD, debug boxes         |
| `src/components/game/sandbox/snake.ts`      | The serpent: slither, climb walls, coil and lunge, strike, burn. `SNAKE` holds its numbers |
| `src/components/game/sandbox/boss.ts`       | SOCIETY, the final boss: its attacks, thrown letters and art. `BOSS` holds its numbers     |
| `src/components/game/sandbox/torch.ts`      | The thrown torch and the brand it leaves burning on the floor                              |
| `src/components/game/sandbox/light.ts`      | The darkness layer that lights cut holes in                                                |
| `src/components/game/sandbox/font.ts`       | A 5×7 pixel font for the title and end screens                                             |
| `src/components/game/sandbox/qa.ts`         | The beta-test script: scenarios, light, layout and frame checks. See Candlelight-Beta.md   |
| `src/components/game/sandbox/player.ts`     | Movement physics and its `TUNING` table                                                    |
| `src/components/game/sandbox/level.ts`      | The map as text, tile collision queries, and `move` for enemies and thrown things          |
| `src/components/game/sandbox/hero.ts`       | The hero, drawn from pixel-grid parts and a pose rig, plus the verlet scarf                |
| `src/components/game/sandbox/tiles.ts`      | Stone, beam and backdrop tiles, baked once into one canvas with auto-shaded edges          |
| `src/components/game/sandbox/background.ts` | Dithered sky, moon and two parallax silhouette layers, all generated at load               |
| `src/components/game/sandbox/pixels.ts`     | The palette, the grid painter, dither and stepped lines                                    |
| `src/components/game/splash-screens.json`   | iPhone sizes that get a launch image, read by the page and by the generator                |
| `scripts/game-assets.mjs`                   | Regenerates `public/icons/game/*`. Run `node scripts/game-assets.mjs` after art changes    |

## Layout

The layout follows the last input used. A touch device starts as the
handheld, anything else starts full screen, and a key press or real controller
input switches to full screen while a touch anywhere switches back.

- **Handheld.** The picture sits in a glass lens with its own bezel, apart
  from the cast-iron control plate. Two matching diamonds of round buttons:
  arrows on the left, Y X B A on the right in the Xbox layout, each diamond
  leaning toward its own edge. Portrait puts a square screen across the full
  width above and the diamonds low, where thumbs rest. The game then shows a
  180×180 view, the full height cropped at the sides, scaled to whole device
  pixels. Landscape puts the diamonds either side of a 320×180 screen.
- **Presses.** A thumb anywhere on a drawn cap presses that button alone.
  Only the gaps between D-pad arms read as diagonals, and only the gaps
  between face buttons press two. Every fresh press bounces its cap on the
  frame it lands, and a lift and retap between two updates still counts.
- **Full screen.** The picture meets every edge of the window. Its 180-pixel
  height fills the window top to bottom, and the view widens or narrows to
  the window's shape (see Screen). The exit link, the Keys button and the key
  overlay sit over the picture's bottom corners. The overlay lights each key
  as the game receives it, from any source, so a controller shows up there
  too. F toggles browser fullscreen.

## Input

Every source feeds one `Controls` object, read once per fixed update:

| Button | WASD layout | Arrows layout | Controller (standard) | Action                                 |
| ------ | ----------- | ------------- | --------------------- | -------------------------------------- |
| D-pad  | WASD        | Arrows        | D-pad or left stick   | Move, down + A drops a beam            |
| A      | K or Space  | S or Space    | Bottom face (0)       | Jump, hold for height                  |
| B      | L or Shift  | A or Shift    | Right face (1)        | Roll on ground, dash in air            |
| X      | J           | D             | Left face (2)         | Sword swing, overhead while up is held |
| Y      | I           | W             | Top face (3)          | Throw a torch (one a second)           |
| Start  | Enter, Esc  | Enter, Esc    | Start (9)             | Pause                                  |
| Select | Backspace   | Backspace     | Back (8)              | Menu: about, install steps, debug view |

Any button but select leaves the title. Select opens the menu over the
screen, pausing a run, and any pad button closes it. Its Debug view checkbox
works by tap or keyboard and draws every hitbox, the player's pose and
velocity, and over each serpent its state and the updates spent in it.

One keyboard layout is live at a time, because W moves in one and throws the
torch in the other. Arrows + WASD is the default: the arrows move and WASD is
the face diamond mirrored for the left hand, so W throws the torch, D attacks,
A rolls and S jumps. WASD + IJKL moves on WASD with IJKL as the diamond. The
Keys button bottom left switches between them, typing never does, and the
switch lets go of every held key. The choice is kept in `localStorage` under
`game:layout`.

On touch the D-pad reads the thumb's angle in eight sectors, so diagonals work
and sliding changes direction without lifting. On the face diamond a thumb on
the gap between two neighbours presses both, and the centre presses nothing. A
press shorter than one update still reaches the game, because presses latch
until the next read.

A lost finger cannot hold a button past the next touch. The shell rebuilds
the held set from the browser's own list of fingers down
(`TouchEvent.touches`) on every touch event, instead of adding on touchstart
and removing on touchend. iOS drops a touchend when a system gesture, an
alert or the app switcher takes the screen. Losing focus releases every
finger and key, and hiding the page or `pagehide` releases every finger. A
finger is read on the control it started on, wherever it slides. A mouse or
pen still uses pointer events with capture.

## Haptics

The world reports `hurt` when the player takes a hit and `hit` when the sword
lands on a serpent or SOCIETY. The shell turns each into a buzz on whatever is
in the player's hands:

| Device          | Hit taken and landed                          | Tick on each on-screen press    |
| --------------- | --------------------------------------------- | ------------------------------- |
| Android browser | `navigator.vibrate`, longer for a hit taken   | 8ms vibration                   |
| iPhone Safari   | None: Safari has no Vibration API             | Invisible switch under each cap |
| Controller      | `dual-rumble` in Chrome, Edge, desktop Safari | None                            |
| Keyboard        | None                                          | None                            |

Since iOS 26.5 a script cannot make an iPhone tick. Only a real tap on the
label of an `<input type=checkbox switch>` does, so each cap carries an
invisible one. A tap ticks, a slide or long hold likely does not. The menu's
"Haptic tick on every press (experimental)" checkbox, on by default, turns the
per-press tick and the switches off (`game:tap-haptics`). A native wrapper is
the only route to hit haptics on an iPhone.

## Movement

All numbers live in `TUNING` in `player.ts`, in pixels per 60 Hz update. A
full jump rises 40px, measured. The formula gives 42, but fall gravity starts at the apex. So the 3-tile wall needs a ledge grab or a wall jump, and a beam must sit 32px above the one below it to be reachable. The kit: acceleration and friction, variable jump
height, coyote time (6 updates), jump buffering (7), faster falling, one-way
beams, wall slide and wall jump, ledge grab and climb, a ground roll with a
12px-tall hitbox that fits the 16px tunnel, one air dash per airtime, and a
sword swing with active frames, hit-pause and screen shake on the breakable
urns.

## Enemies, torch and health

Five serpents, placed with `s` (open air) or `S` (in front of a backdrop wall)
in the map. Each patrols until the player comes within 112px, then chases,
climbs walls toward a player above, coils and lunges from up to 76px, or
strikes from close range. A sword hit takes 1 of 3 HP. A torch sets one
burning for 2 HP over 1.5s. Torches fly flat and fall, so they are for enemies
below and ahead, and keep burning on the floor for 2.5s as a light.

The player has 5 HP, shown as candles. A bite knocks the player back and
grants a second of mercy. At 0 the dark takes you and the run restarts. A
roll dodges bites.

## Health candles

Two candles drawn like the HUD's stand dark in the map, placed with `h` (open
air) or `H` (in front of a backdrop wall): one on the stone block floating
over the roll tunnel, where a serpent patrols, and one in the far right
corner of the boss's hall. A torch that touches one lights it. Walking into a
lit one below full health gives back a candle of health. It then burns down to
a grey stub and stands again, dark, 5 seconds later (`PICKUP.recharge`). A
lit candle is never taken at full health, so it is never wasted. An unlit
wick smoulders so it can be found in the dark.

From the third death to the boss in a row, the defeat screen adds THROW A
TORCH AT THE CANDLE IN THE FAR CORNER FOR HEALTH. A win or a fresh run resets
the count (`bossDeaths`).

## The boss

The fifth serpent's death opens the portcullis (`G` in the map) at the
belfry's right wall, announces it, and puts SOCIETY's name and health bar at
the top centre of the HUD. Behind the gate is the hall marked by `B`: a sill,
a flat floor, two low beams and one high one. `Level` finds the hall's walls,
ceiling and floor from the `B`. Until the fight the camera never shows the
hall. Stepping onto the sill slams the gate shut, relights all five candles,
locks the camera on the hall, and wakes the boss.

The boss is the word SOCIETY in the pixel font at 3×, each letter moving on
its own. Its O is a face: a top hat, a monocle over an eye that follows the
player, a brow that arches at rest and scowls mid-attack, and a white
handlebar moustache. The letters drop in one by one, then it announces WE
LIVE IN A SOCIETY. It is drawn after the darkness so it glows, and it lights
the hall around it.

It hovers above the player and picks an attack, never the same one twice in
a row, naming each in a banner:

| Attack                   | Kind       | Tell and answer                                                                                      |
| ------------------------ | ---------- | ---------------------------------------------------------------------------------------------------- |
| BRING YOU DOWN           | Melee      | Rises and tracks, then hangs strobing. Run at the strobe and jump the shockwaves, or roll the impact |
| BREAK YOUR SPIRIT        | Projectile | Fires those fifteen letters from the monocle at where the player is. Keep moving, or cut them        |
| PEER PRESSURE            | Melee      | Splits into SOC and IETY at the walls, strobes, then they hop inward. Jump one, roll, or take a beam |
| UNREALISTIC EXPECTATIONS | Projectile | EXPECTATIONS falls from the ceiling, every third letter over the player's head                       |

After a slam it sits dazed on the floor and safe to touch: the best time to
hit it. Otherwise its letters hurt to touch, except for half a second after
it reforms. A sword hit takes 1 of its 24 HP and a torch burns 2. Every
third hit it complains (HOW RUDE, THE AUDACITY). At half health it stops
taking damage for a beat to say SOCIETY IS DISAPPOINTED, then turns crimson.
From then on it attacks sooner and drifts, throws and squeezes faster. Each
of those numbers sits halfway between phase 1 and the original rage, and it
slams once, as in phase 1. At 0 its letters fall apart, SOCIETY HAS FALLEN, and the run is
won.

Dying to it names the attack on the death screen (SOCIETY BROKE YOUR
SPIRIT), and rising again starts a fresh `World` with `atBoss`, on the sill
with the serpents still slain and the clock still running. A map with no `B`
keeps the old rule: the last serpent wins the run.

## Light

`render.ts` draws two darkness layers. The sky and skyline keep half their
brightness, and the moon lights only them. The foreground (tiles, props,
serpents, the hero) keeps a quarter. Each layer has holes cut for every
light: candles, torches, burning serpents, the open gate, the boss and its
thrown letters, and the visor, which lights only
the side the player faces, at full brightness for about one body height
ahead. Tune it in the `LIGHT` table. The beta script measures the falloff on
every run.

Torches burn tall (`TORCH.flame`, 9px on the floor), add a bloom over the
dark, and trail sparks that are drawn after the darkness so they glow. In
debug view torch boxes are orange and health candle boxes yellow.

Every light sprite, the tiles and the vignette bake once, while the title is
up (`Renderer.prepare`), so starting a run, the first torch, the gate and the
boss's entrance draw without a stall. Per-pixel art is written through one
`ImageData` (`bakePixels` in `pixels.ts`), not a `fillRect` per pixel. The
pixel font keeps at most 256 baked strings, since debug labels change every
frame.

Serpents wear crimson and gold bands so they read in the dark, and strobe
flame white while coiled, the tell that a lunge is coming.

## Screen

The view is always 180 game pixels tall. Its width depends on where it runs:

| Where                | View width                     | Scale                                    |
| -------------------- | ------------------------------ | ---------------------------------------- |
| Handheld, landscape  | 320                            | Whole numbers from 2×, fractional below  |
| Handheld, portrait   | 180                            | Whole device pixels, filling the width   |
| Keyboard, controller | 180 to 432, the window's shape | The window's height over 180, fractional |

On a desktop the width is the window's width over that scale, so the picture
meets every edge, the last fraction of a game pixel stretched to fit. Past
2.4:1 the view stops at 432 and the sides keep bars, and narrower than a
square it stops at 180 with bars top and bottom. The darkness layers and the
scene buffer follow the view's width, and the sky is baked 432 wide and drawn
against the right edge, so the moon keeps its place. In the boss fight a view
wider than the hall shows more of the belfry, never past the map's edge.
Views from 268 wide (`WIDE_VIEW`) take the big title and end-screen text.

## Home screen

The Demos page links here with a plain `<a>`, never `next/link`. A client-side
navigation keeps the previous page's head, so iOS would save the site's
manifest (`start_url: /`) and the icon would open the homepage. The manifest's
scope is `/demos/candlelight`, and the exit link is hidden in standalone mode,
so an installed copy reaches no other page. `/demos/game` redirects here.

The icon files carry a version in their names (`apple-touch-icon-v2.png`).
iOS keeps a home-screen icon per URL, a failed fetch included, and from then
on draws the title's first letter instead: that is how an install came to
show a "C" in place of the handheld. The page also declares the icon's
`sizes`. A new name forces a fresh fetch, so bump `REV` in
`scripts/game-assets.mjs`, regenerate, and update the manifest and page to
match whenever the art changes or an install shows the letter again.

## Title and end screens

The game opens on its title, and a launch from the home screen opens there
too unless a run is still live in memory. The title is its own screen, with
no world drawn behind it: CANDLELIGHT cast in bone wax on black, each letter
a candle with a flickering wick, and a blinking PRESS START. Wax drips swell
under the strokes and run straight down, each at its own pace, then the tail
drains in after them. Nothing ever moves up (`dripAt` in `title.ts`). Drips
off the letters' foot run to the pool 4 font pixels below. Drips off higher
strokes give out 2 or 3 font pixels down and hang as a bead, unless a stroke
below catches them first. Under PRESS START two lines, each with a pixel
icon, say CONTROLLER SUPPORTED and PLAYS ON IPHONE. Any button but select
starts. The install steps live in the select menu.

A run ends on one of two screens, timed by `ENDING` in `ending.ts`. The world
holds for half a second, the transition takes a second, and the word fades
in over half a second. Only then does a press count (`SCREEN_DELAY`), so a
held button cannot skip it.

- **Defeat.** A wave of blood with drips running ahead of it wipes the screen
  top to bottom. Then DEFEAT and KILLED BY: SERPENT or SOCIETY fade in, and
  for SOCIETY the attack that did it (SOCIETY BROKE YOUR SPIRIT).
- **Victory.** The screen fades to white, then VICTORY, YOU DEFEATED
  SOCIETY. and, in fine print, THIS MAKES YOU ENLIGHTENED. fade in, with the
  run's time.

## Art

Everything is pixel data in code: palette-keyed string grids for tiles, props
and the hero's helm, torso and tuck, with limbs, sword, smear and scarf drawn
procedurally from a per-pose rig. The backgrounds are generated from seeded
noise at load, so they are identical every visit.

## Offline

`scripts/build-sw.mjs` bundles `src/sw.js` with webpack and precaches the
`/demos/candlelight` HTML, revisioned by the build id.

## Beta testing

See [Candlelight-Beta.md](./Candlelight-Beta.md).

## Testing on a phone

Chromium device emulation covers layout and input but not iOS itself. Launch
images, the status bar and home-screen install need Safari on a real iPhone:
open the preview deployment's `/demos/candlelight`, Share, Add to Home Screen, then
launch it with the phone in airplane mode.

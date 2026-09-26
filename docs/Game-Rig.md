# Game Rig

The shell and player sandbox behind `/demos/game`: a dark fantasy platformer
that runs in any browser and is built to be added to an iPhone home screen. On
a phone it is a handheld, screen above and controls below. On a desktop the
screen fills the window and a translucent key overlay shows what the game is
hearing. The sandbox is one small area for feeling out movement, with no
levels yet.

## Files

| File                                        | Job                                                                                      |
| ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/app/demos/game/page.tsx`               | Metadata: manifest, `black-translucent` status bar, launch images, `viewport-fit=cover`  |
| `src/app/demos/game/game-client.tsx`        | Client-only import, with a shell-coloured placeholder so launch never flashes white      |
| `src/components/game/Handheld.tsx`          | Layout switching, canvas scaling, on-screen controls, key overlay, wake lock, fullscreen |
| `src/components/game/input.ts`              | Keyboard map, gamepad map, D-pad and face-diamond geometry, `Controls` aggregation       |
| `src/components/game/loop.ts`               | Fixed 60 Hz update with a capped backlog, render on every animation frame                |
| `src/components/game/sandbox/game.ts`       | The `Game` contract (`step`, `draw`, `pause`), camera, effects, props, lighting          |
| `src/components/game/sandbox/player.ts`     | Movement physics and its `TUNING` table                                                  |
| `src/components/game/sandbox/level.ts`      | The sandbox map as text, and tile collision queries                                      |
| `src/components/game/sandbox/hero.ts`       | The hero, drawn from pixel-grid parts and a pose rig, plus the verlet scarf              |
| `src/components/game/sandbox/tiles.ts`      | Stone, beam and backdrop tiles, baked once into one canvas with auto-shaded edges        |
| `src/components/game/sandbox/background.ts` | Dithered sky, moon and two parallax silhouette layers, all generated at load             |
| `src/components/game/sandbox/pixels.ts`     | The palette, the grid painter, dither and stepped lines                                  |
| `src/components/game/splash-screens.json`   | iPhone sizes that get a launch image, read by the page and by the generator              |
| `scripts/game-assets.mjs`                   | Regenerates `public/icons/game/*`. Run `node scripts/game-assets.mjs` after art changes  |

## Layout

The layout follows the last input used. A touch device starts as the
handheld, anything else starts full screen, and a key press or real controller
input switches to full screen while a touch anywhere switches back.

- **Handheld.** The picture sits in a glass lens with its own bezel, apart
  from the cast-iron control plate. Two matching diamonds of round buttons:
  arrows on the left, Y X B A on the right in the Xbox layout. Portrait puts
  the screen above and the diamonds low, where thumbs rest. Landscape puts the
  diamonds either side of the screen.
- **Full screen.** The canvas fills the window at the largest whole-number
  scale. The overlay in the corner lights each key as the game receives it,
  from any source, so a controller shows up there too. F toggles browser
  fullscreen.

## Input

Every source feeds one `Controls` object, read once per fixed update:

| Button | Keys           | Controller (standard) | Sandbox action              |
| ------ | -------------- | --------------------- | --------------------------- |
| D-pad  | WASD or arrows | D-pad or left stick   | Move, down + A drops a beam |
| A      | K or Space     | Bottom face (0)       | Jump, hold for height       |
| B      | L or Shift     | Right face (1)        | Roll on ground, dash in air |
| X      | J              | Left face (2)         | Sword swing                 |
| Y      | I              | Top face (3)          | Unassigned                  |
| Start  | Enter or Esc   | Start (9)             | Pause                       |
| Select | Backspace      | Back (8)              | Hitbox debug view           |

On touch the D-pad reads the thumb's angle in eight sectors, so diagonals work
and sliding changes direction without lifting. On the face diamond a thumb on
the gap between two neighbours presses both, and the centre presses nothing. A
press shorter than one update still reaches the game, because presses latch
until the next read.

## Movement

All numbers live in `TUNING` in `player.ts`, in pixels per 60 Hz update. A
full jump rises 42px, about 2.6 tiles, so the 3-tile wall in the sandbox needs
a ledge grab or a wall jump. The kit: acceleration and friction, variable jump
height, coyote time (6 updates), jump buffering (7), faster falling, one-way
beams, wall slide and wall jump, ledge grab and climb, a ground roll with a
12px-tall hitbox that fits the 16px tunnel, one air dash per airtime, and a
sword swing with active frames, hit-pause and screen shake on the breakable
urns.

## Screen

The canvas is 320×180, which scales 6× to 1080p and 8× to 1440p. It scales by
whole numbers when 2× or more fits, and fits fractionally below that.

## Art

Everything is pixel data in code: palette-keyed string grids for tiles, props
and the hero's helm, torso and tuck, with limbs, sword, smear and scarf drawn
procedurally from a per-pose rig. The backgrounds are generated from seeded
noise at load, so they are identical every visit.

## Offline

`scripts/build-sw.mjs` bundles `src/sw.js` with webpack and precaches the
`/demos/game` HTML, revisioned by the build id.

## Testing on a phone

Chromium device emulation covers layout and input but not iOS itself. Launch
images, the status bar and home-screen install need Safari on a real iPhone:
open the preview deployment's `/demos/game`, Share, Add to Home Screen, then
launch it with the phone in airplane mode.

# Game Rig

The shell behind `/demos/game`: a Game Boy style handheld that runs in any
browser and is built to be added to an iPhone home screen. The current game is
a placeholder that exercises every input. A real game replaces
`src/components/game/demo-game.ts` and keeps the rest.

## Files

| File                                      | Job                                                                                     |
| ----------------------------------------- | --------------------------------------------------------------------------------------- |
| `src/app/demos/game/page.tsx`             | Metadata: manifest, `black-translucent` status bar, launch images, `viewport-fit=cover` |
| `src/app/demos/game/game-client.tsx`      | Client-only import, with a shell-coloured placeholder so launch never flashes white     |
| `src/components/game/Handheld.tsx`        | Full-screen layer, canvas scaling, on-screen controls, wake lock, pause on hide         |
| `src/components/game/input.ts`            | Keyboard map, gamepad map, D-pad and face-button geometry, `Controls` aggregation       |
| `src/components/game/loop.ts`             | Fixed 60 Hz update with a capped backlog, render on every animation frame               |
| `src/components/game/demo-game.ts`        | The `Game` contract (`step`, `draw`, `pause`) and the placeholder that implements it    |
| `src/components/game/splash-screens.json` | iPhone sizes that get a launch image, read by the page and by the generator             |
| `scripts/game-assets.mjs`                 | Regenerates `public/icons/game/*`. Run `node scripts/game-assets.mjs` after art changes |
| `public/icons/game.webmanifest`           | Installs as its own app, scoped to `/demos/game`                                        |

## Input

Every source feeds one `Controls` object, read once per fixed update:

- **Touch.** The D-pad reads the thumb's angle in eight sectors, so a diagonal
  presses two arms and sliding changes direction without lifting. A thumb
  between A and B presses both. Pointer capture keeps a sliding thumb on its
  control after it leaves the element.
- **Controllers.** The Gamepad API standard mapping: A is the right face
  button, B the bottom one, and the left stick doubles as the D-pad past a 0.5
  deadzone.
- **Keyboard.** Arrows or WASD, X or Space for A, Z for B, Enter for Start,
  Shift or Backspace for Select.

A press shorter than one update still reaches the game: presses latch until
the next read. The on-screen controls hide while a controller or keyboard is
in use and return on the next touch. Only real button or stick input counts,
because browsers report `gamepadconnected` for pads nobody is holding.

## Screen

The canvas is 160×144, the Game Boy's resolution, with `image-rendering:
pixelated`. It scales by whole numbers when 2× or more fits, and fits
fractionally below that.

## Offline

`scripts/build-sw.mjs` bundles `src/sw.js` with webpack and precaches the
`/demos/game` HTML, revisioned by the build id. Before this rig the worker
shipped its `import` statement unbundled, threw on line 1 and never installed
on any page.

## Testing on a phone

Chromium device emulation covers layout and input but not iOS itself. Launch
images, the status bar and home-screen install need Safari on a real iPhone:
open the preview deployment's `/demos/game`, Share, Add to Home Screen, then
launch it with the phone in airplane mode.

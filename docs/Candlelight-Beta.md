# Candlelight beta test

A playbook for a beta pass on `/demos/candlelight`, written so Claude or a person can
run it cold. It covers three layers. The automated scenarios catch
regressions. The browser pass checks feel, layout and frame timing on desktop
and phone viewports. The judgement pass is looking at the screenshots and
answering the questions below. Run all three before a game PR leaves draft.

## 1. Scenarios, on every commit

`pnpm test` runs `src/__tests__/components/game-qa.test.ts`, which plays every
scenario in `src/components/game/sandbox/qa.ts` through real button input on
fresh worlds. The scenarios cover:

- any button but select leaves the title, and select opens About there and
  mid-run, freezing the world until any button closes it
- every pixel of every drawn cap presses that button alone, and a lift and
  retap between two updates is a new press
- serpents painted in crimson and gold, strobing while coiled
- spawn safety, walk direction and stride speed
- beam reachability, overhead attack, torch arc, cooldown and burn damage
- serpent strike, lunge and wall climb
- serpents staying inside the map when left alone, a wall launch, pause
- five kills opening the gate, and only felling the boss winning; every
  serpent and then the boss on the shipped map staying hittable by the sword
  through to a win (the player is placed beside each, so this does not prove
  each is reachable on foot), death and restart, and hit-pause input carry
- the boss: spawning with its bar at the last kill, the gate shutting behind
  and the candles relighting, its entrance line, the camera holding on the
  hall, all four attacks under their banners with no repeats, each able to
  hurt and naming itself as the cause, an idle player dying within a minute,
  sword and torch damage, cutting a thrown letter, the half-health rage,
  PEER PRESSURE reaching the walls, and dying at the boss rising on the sill
- a 20,000-update random-input soak that fails on NaN or anything inside a wall
- the same soak in the boss's hall, which fails on NaN, the player leaving
  the hall, or a letter outside it

A new mechanic gets a scenario here. Deleting the line that implements it must
turn the scenario red. Check that before trusting it.

## 2. Browser pass

```sh
pnpm build
pnpm start -p 3100                      # leave running
pnpm exec playwright install chromium   # once per machine
node scripts/candlelight-beta.mjs --url http://localhost:3100
```

The script opens `/demos/candlelight?qa=1` at 1440×900, 1280×720, iPhone 15
portrait and landscape, Pixel 7 portrait, and iPhone 15 as launched from the
home screen (full screen height, `navigator.standalone` true). On each it
collects the in-page report:

- the same scenarios
- light falloff on the foreground darkness layer: 20px ahead of the visor at
  least 0.9 of full brightness, 52px ahead at least 0.45, 20px behind and
  104px ahead 0.25 ± 0.05 (the ambient)
- layout: the screen fits, pixels are square and whole (in device pixels for
  the portrait square), no horizontal scroll, no link or button over the HUD,
  touch diamonds at least 88px and clear of the screen
- every cap: on screen, clear of the picture, at least 44px, nothing on top
  of any of its pixels, and every pixel read by the shell as that button
  alone. In portrait, the diamonds within 16px of the edges, the screen a
  square at least 85% of the width, and the control group centred within
  24px of the middle of the space under the screen
- 3.5 seconds of live frame gaps, where more than 2% of frames over 34ms
  fails
- microseconds per update and per draw

It then plays through with real keys, or real touches on phones:

1. open About with select, close it with B
2. start from the title with X
3. walk
4. throw a torch
5. pause and resume with start
6. meet a serpent, then tick Debug view in the select menu by real tap or
   click, close the menu with B, resume with start, and screenshot the labels
7. die at 1 HP and rise again
8. kill every serpent: the gate opens and the boss bar appears
9. step onto the sill: the gate shuts and SOCIETY makes its entrance, then
   attacks (screenshots `boss-intro` and `boss-fight`)
10. fell it and win
11. on phones, a real touch on every cap at its centre and eight points near
    its rim: the game must hear that button alone, the cap must be bouncing,
    and the press must reach the game within 34ms (two frames)
12. on desktop, switch the key legend

Last, it opens `/demos` and navigates client-side to each installable app
(Candlelight, Prompt Composer, Mandelbrot Explorer, Opioid Converter). Each
must reload as its own document with a manifest whose `start_url` is its own
path, so an icon added from it opens the app, never the site root.

It screenshots each step and writes `report.md`, `report.json` and PNGs to
the `--out` directory (a temp directory by default). It exits 1 on any
failure. Errors from Vercel analytics and the report-only CSP are listed as
local-only and do not fail the run, since they come from the site, not the
game.

The `?qa` hook exposes `window.__candlelight` with `snapshot()`, `killAll()`,
`toBoss()` (onto the sill, once the serpents are dead), `beatBoss()`,
`setHp(n)`, `presses` (every press the game received, with its delay after
the last touch) and `game` (set `game.debug = true` for hitboxes), for
driving the game from a console or another tool.
Without `?qa`, none of it exists.

## 3. Judgement pass

Open every screenshot. For each, answer in the PR:

- **Title.** Is CANDLELIGHT readable at a glance, on a phone too? Are the
  iPhone install lines legible?
- **About.** Is the panel readable over the screen, with the pad still free?
- **Play.** Is the room ahead of the visor clearly lit and the room behind
  dark? Is the foreground dark but still parseable, with the skyline as lit
  as before?
- **Moon.** Is it the brightest cold thing on screen, lighting only the sky?
- **Serpent.** Does it read as a snake (head, body, eye) in its crimson and
  gold, and does the coil strobe?
- **Torch.** Is the thrown brand visible in flight and on the floor?
- **Boss.** Is it funny on sight: the word SOCIETY, and its hat, monocle,
  brow and moustache legible on a phone? Is every attack banner readable,
  and does each thrown or falling letter stand out from the wall?
- **HUD.** Are the five candles, the kill count and the boss bar legible and
  uncovered?
- **Death and win.** Is the message readable, and does "press jump" blink?
  Does a death to the boss name the attack that did it?
- **Phone layouts.** Do the diamonds sit under the thumbs, toward the edges,
  without covering the screen, in both orientations? Is the portrait screen a
  square across the width?

Then bug-bash by hand for five minutes on a real device if one is available:

- roll through a serpent's lunge
- throw a torch from a ledge onto a serpent below
- fight one on a wall with up + attack
- pause mid-lunge
- beat SOCIETY on foot, and die to each of its attacks at least once
- switch between keyboard, controller and touch mid-run
- lock the phone mid-run and come back

## What it cannot tell you

Chromium stands in for Safari, so iOS rendering, home-screen install and
haptics still need a real iPhone (see Game-Rig.md). Frame timing on a
desktop GPU says little about a five-year-old phone. Measure there before
changing anything for performance.

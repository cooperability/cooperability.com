# Candlelight beta test

A playbook for a beta pass on `/demos/game`, written so Claude or a person can
run it cold. It covers three layers. The automated scenarios catch
regressions. The browser pass checks feel, layout and frame timing on desktop
and phone viewports. The judgement pass is looking at the screenshots and
answering the questions below. Run all three before a game PR leaves draft.

## 1. Scenarios, on every commit

`pnpm test` runs `src/__tests__/components/game-qa.test.ts`, which plays every
scenario in `src/components/game/sandbox/qa.ts` through real button input on
fresh worlds. The scenarios cover:

- title to play, spawn safety, walk direction and stride speed
- beam reachability, overhead attack, torch arc, cooldown and burn damage
- serpent strike, lunge and wall climb
- win, death and restart, and hit-pause input carry
- a 20,000-update random-input soak that fails on NaN or anything inside a wall

A new mechanic gets a scenario here. Deleting the line that implements it must
turn the scenario red. Check that before trusting it.

## 2. Browser pass

```sh
pnpm build
pnpm start -p 3100                      # leave running
pnpm exec playwright install chromium   # once per machine
node scripts/candlelight-beta.mjs --url http://localhost:3100
```

The script opens `/demos/game?qa=1` at 1440×900, 1280×720, iPhone 15 portrait
and landscape, and Pixel 7 portrait. On each it collects the in-page report:

- the same scenarios
- light falloff on the darkness layer: 1 body length at least 0.9 of full
  brightness, 2 lengths at least 0.7, 4 lengths 0.5 ± 0.05 (the ambient)
- layout: the screen fits, pixels are square and whole, no horizontal scroll,
  no link or button over the HUD, touch diamonds at least 88px and clear of
  the screen
- 3.5 seconds of live frame gaps, where more than 2% of frames over 34ms
  fails
- microseconds per update and per draw

It then plays through with real keys, or real touches on phones:

1. start from the title
2. walk
3. throw a torch
4. meet a serpent
5. die at 1 HP and rise again
6. win
7. on desktop, switch the key legend

It screenshots each step and writes `report.md`, `report.json` and PNGs to
the `--out` directory (a temp directory by default). It exits 1 on any
failure. Errors from Vercel analytics and the report-only CSP are listed as
local-only and do not fail the run, since they come from the site, not the
game.

The `?qa` hook exposes `window.__candlelight` with `snapshot()`, `killAll()`
and `setHp(n)`, for driving the game from a console or another tool.
Without `?qa`, none of it exists.

## 3. Judgement pass

Open every screenshot. For each, answer in the PR:

- **Title.** Is CANDLELIGHT readable at a glance, on a phone too?
- **Play.** Can you make out the hero, the next ledge and a serpent at two
  body lengths? Does the far side of the screen feel dim, not black?
- **Moon.** Is it the brightest cold thing on screen, lighting only the sky?
- **Serpent.** Does it read as a snake (head, body, eye) at 1× phone scale?
- **Torch.** Is the thrown brand visible in flight and on the floor?
- **HUD.** Are the five candles and the kill count legible and uncovered?
- **Death and win.** Is the message readable, and does "press jump" blink?
- **Phone layouts.** Do the diamonds sit under the thumbs without covering the
  screen, in both orientations?

Then bug-bash by hand for five minutes on a real device if one is available:

- roll through a serpent's lunge
- throw a torch from a ledge onto a serpent below
- fight one on a wall with up + attack
- pause mid-lunge
- switch between keyboard, controller and touch mid-run
- lock the phone mid-run and come back

## What it cannot tell you

Chromium stands in for Safari, so iOS rendering, home-screen install and
haptics still need a real iPhone (see Game-Rig.md). Frame timing on a
desktop GPU says little about a five-year-old phone. Measure there before
changing anything for performance.

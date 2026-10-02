'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { buzz, tick, type Source } from './haptics'
import {
  Controls,
  dpadFromPoint,
  faceFromPoint,
  keyFor,
  type Button,
  type Scheme,
} from './input'
import { startLoop } from './loop'
import {
  createCandlelight,
  HEIGHT,
  SQUARE,
  WIDTH,
  type Candlelight,
} from './sandbox/game'
import styles from './Handheld.module.css'

type Mode = 'touch' | 'external'
type Mapper = (x: number, y: number) => Button[]
type ZoneName = 'dpad' | 'face' | 'select' | 'start'

// What a point in each control's own 0..1 box presses.
const ZONES: Record<ZoneName, Mapper> = {
  dpad: (x, y) => dpadFromPoint(x * 2 - 1, y * 2 - 1),
  face: faceFromPoint,
  select: () => ['select'],
  start: () => ['start'],
}

function readZone(zone: HTMLElement, clientX: number, clientY: number) {
  const box = zone.getBoundingClientRect()
  const map = ZONES[zone.dataset.zone as ZoneName]
  if (!map || !box.width || !box.height) return []
  return map((clientX - box.left) / box.width, (clientY - box.top) / box.height)
}

const HINT_KEY = 'game:install-hint-dismissed'
const TAPS_KEY = 'game:tap-haptics'

// A press squashes the cap and springs it back, so a thumb sees the press
// land on the frame it happens.
const BOUNCE: Keyframe[] = [
  { scale: '1' },
  { scale: '0.82' },
  { scale: '1.08' },
  { scale: '1' },
]
// A new key: the old one held whichever layout was last typed on, never a
// choice.
const SCHEME_KEY = 'game:layout'

// The legend for each keyboard layout, by the pad button each key plays.
const LEGEND: Record<Scheme, { name: string } & Record<Button, string>> = {
  arrows: {
    name: 'Arrows + WASD',
    up: '↑',
    left: '←',
    down: '↓',
    right: '→',
    y: 'W',
    x: 'D',
    a: 'S',
    b: 'A',
    start: 'Enter',
    select: 'Backspace',
  },
  wasd: {
    name: 'WASD + IJKL',
    up: 'W',
    left: 'A',
    down: 'S',
    right: 'D',
    y: 'I',
    x: 'J',
    a: 'K',
    b: 'L',
    start: 'Enter',
    select: 'Backspace',
  },
}

// Every fresh press bounces its cap on the frame it lands. The caps live
// in `within`, or are it.
function bounce(within: HTMLElement, buttons: Button[]) {
  for (const b of buttons) {
    const selector = `[data-button="${b}"]`
    const cap = within.matches(selector)
      ? within
      : within.querySelector(selector)
    cap?.animate?.(BOUNCE, { duration: 180, easing: 'ease-out' })
  }
}

// The experimental tick on every press of the on-screen pad, on unless
// turned off in the menu.
function savedTaps() {
  try {
    return localStorage.getItem(TAPS_KEY) !== 'off'
  } catch {
    return true
  }
}

// A real tap on the label of a switch is the one thing iOS Safari still
// answers with a haptic (script cannot trigger one since iOS 26.5), so
// with ticks on each cap carries an invisible one under the thumb.
function Tick() {
  return (
    <label className={styles.tick}>
      <input
        type="checkbox"
        {...{ switch: '' }}
        tabIndex={-1}
        onFocus={(e) => e.currentTarget.blur()}
      />
    </label>
  )
}

function saveScheme(scheme: Scheme) {
  try {
    localStorage.setItem(SCHEME_KEY, scheme)
  } catch {
    // Storage blocked: the choice lasts for this visit only.
  }
}

function savedScheme(): Scheme {
  try {
    return localStorage.getItem(SCHEME_KEY) === 'wasd' ? 'wasd' : 'arrows'
  } catch {
    return 'arrows'
  }
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

// navigator.standalone exists only in iOS Safari, so `false` means iOS in a
// browser tab, the one place the Add to Home Screen hint applies.
function shouldHint() {
  if ((navigator as Navigator & { standalone?: boolean }).standalone !== false)
    return false
  try {
    return localStorage.getItem(HINT_KEY) === null
  } catch {
    return true
  }
}

export default function Handheld() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  // Written by handlers and read by the loop, never used to render.
  const [controls] = useState(() => new Controls())
  const [mode, setMode] = useState<Mode>(() =>
    navigator.maxTouchPoints > 0 ? 'touch' : 'external'
  )
  const [standalone] = useState(isStandalone)
  const [hint, setHint] = useState(shouldHint)
  const [scheme, setScheme] = useState(savedScheme)
  const [about, setAbout] = useState(false)
  const [debug, setDebug] = useState(false)
  const [taps, setTaps] = useState(savedTaps)
  // Read by the loop and the touch handler, never used to render.
  const tapsRef = useRef(taps)
  const schemeRef = useRef(scheme)
  const source = useRef<Source>(mode === 'touch' ? 'touch' : 'key')
  const gameRef = useRef<Candlelight | null>(null)
  const chooseScheme = (next: Scheme) => {
    // A key held now would release as another button and leave this one
    // held, so every key lets go.
    controls.clearKeys()
    schemeRef.current = next
    setScheme(next)
    saveScheme(next)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const screen = screenRef.current
    const root = rootRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !screen || !root || !ctx) return

    const game = createCandlelight()
    gameRef.current = game
    let disposed = false
    // The beta script loads only when asked for, so players never download it.
    if (new URLSearchParams(window.location.search).has('qa'))
      import('./sandbox/qa')
        .then(({ exposeQA }) => {
          if (!disposed) exposeQA(game, canvas, root)
        })
        .catch((e) => console.error('[candlelight-qa] failed to load', e))

    const onKey = (e: KeyboardEvent) => {
      if (
        e.code === 'KeyF' &&
        e.type === 'keydown' &&
        !e.repeat &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        if (document.fullscreenElement)
          document.exitFullscreen().catch(() => {})
        else root.requestFullscreen?.().catch(() => {})
      }
      const button = keyFor(schemeRef.current, e.code)
      if (!button) return
      if (e.type === 'keyup') return controls.key(button, false)
      // Shortcuts pass through, and Enter or Space on the exit link, the
      // hint's button or the debug checkbox must still activate it.
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as Element
      if (target.closest?.('a, button')) return
      if (
        target.closest?.('input') &&
        (e.code === 'Space' || e.code === 'Enter')
      )
        return
      e.preventDefault()
      if (e.repeat) return
      controls.key(button, true)
      setMode('external')
      source.current = 'key'
    }
    // Fingers on the pad, rebuilt from the browser's own list of touches on
    // every touch event. A touch is read on the control it started on, as
    // pointer capture would, wherever it has slid to since.
    const onTouches = (e: TouchEvent) => {
      const next = new Map<number, Button[]>()
      for (const t of Array.from(e.touches)) {
        const zone = (t.target as Element | null)?.closest?.<HTMLElement>(
          '[data-zone]'
        )
        if (zone && root.contains(zone))
          next.set(t.identifier, readZone(zone, t.clientX, t.clientY))
      }
      if (next.size) {
        source.current = 'touch'
        if (e.type === 'touchstart') setMode('touch')
      }
      const fresh = controls.syncTouches(next)
      if (!fresh.length) return
      if (tapsRef.current) tick()
      bounce(root, fresh)
    }
    const touchEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel']
    // A lost focus or a hidden page owes releases that will never come:
    // macOS sends no keyup for keys released while Cmd is held, and iOS can
    // drop a touchend when a system gesture takes the screen.
    const onBlur = () => {
      controls.clearKeys()
      controls.releaseAll()
    }
    const onHide = () => controls.releaseAll()
    const onMeta = (e: KeyboardEvent) => {
      if (e.key === 'Meta') controls.clearKeys()
    }

    let wakeLock: WakeLockSentinel | null = null
    const lockScreen = () => {
      navigator.wakeLock
        ?.request('screen')
        .then((lock) => {
          // Unmounted while the request was pending: nothing else will
          // release it.
          if (disposed) lock.release().catch(() => {})
          else wakeLock = lock
        })
        .catch(() => {})
    }
    const onVisibility = () => {
      if (!document.hidden) return lockScreen()
      game.pause()
      controls.releaseAll()
    }
    const onPadGone = () => game.pause()
    const preventDefault = (e: Event) => e.preventDefault()

    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    window.addEventListener('blur', onBlur)
    window.addEventListener('keydown', onMeta)
    window.addEventListener('gamepaddisconnected', onPadGone)
    window.addEventListener('pagehide', onHide)
    for (const type of touchEvents)
      root.addEventListener(type, onTouches as EventListener, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    // iOS ignores user-scalable=no, so pinch has to be refused here.
    document.addEventListener('gesturestart', preventDefault)
    root.addEventListener('contextmenu', preventDefault)
    lockScreen()

    // The page behind this layer must not scroll or rubber-band.
    const html = document.documentElement
    const overflow = html.style.overflow
    html.style.overflow = 'hidden'

    // Take the hidden site chrome out of the tab order and the accessibility
    // tree, by marking everything beside this layer's ancestors inert.
    const inerted: Element[] = []
    for (let el: Element = root; el !== document.body; el = el.parentElement!) {
      for (const sibling of el.parentElement!.children) {
        if (
          sibling !== el &&
          !sibling.matches('script, next-route-announcer, [inert]')
        ) {
          sibling.setAttribute('inert', '')
          inerted.push(sibling)
        }
      }
    }

    // Whole-number scaling keeps every game pixel the same size. Below 2x
    // that would leave a postage stamp, so small screens fit fractionally.
    // The portrait handheld shows a square view that fills the phone's
    // width, scaled to whole device pixels.
    const resize = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const square =
        root.dataset.mode === 'touch' && window.innerHeight > window.innerWidth
      const view = square ? SQUARE : WIDTH
      if (canvas.width !== view) {
        canvas.width = view
        game.view = view
      }
      const fit = Math.min(width / view, height / HEIGHT)
      const dpr = window.devicePixelRatio || 1
      const scale = square
        ? Math.floor(fit * dpr) / dpr
        : fit >= 2
          ? Math.floor(fit)
          : fit
      canvas.style.width = `${view * scale}px`
      canvas.style.height = `${HEIGHT * scale}px`
    })
    resize.observe(screen)

    const pads = root.querySelectorAll<HTMLElement>('[data-control]')
    let held = ''
    let aboutShown = false

    const stop = startLoop(
      () => {
        const frame = controls.read(navigator.getGamepads?.() ?? [])
        // Only real stick or button input counts: browsers also report
        // connected pads that nobody is holding.
        if (frame.padActive) {
          setMode('external')
          source.current = 'pad'
        }
        held = [...frame.held].join(' ')
        game.step(frame)
        // Taken, not just read: a paused world keeps its last update's.
        const felt = game.world.haptics.splice(0)
        if (felt.length)
          buzz(felt.includes('hurt') ? 'hurt' : 'hit', source.current)
      },
      () => {
        game.draw(ctx)
        pads.forEach((el) => el.setAttribute('data-held', held))
        if (game.about !== aboutShown) setAbout((aboutShown = game.about))
      }
    )

    return () => {
      stop()
      resize.disconnect()
      html.style.overflow = overflow
      inerted.forEach((el) => el.removeAttribute('inert'))
      disposed = true
      wakeLock?.release().catch(() => {})
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('keydown', onMeta)
      window.removeEventListener('gamepaddisconnected', onPadGone)
      window.removeEventListener('pagehide', onHide)
      for (const type of touchEvents)
        root.removeEventListener(type, onTouches as EventListener)
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('gesturestart', preventDefault)
      root.removeEventListener('contextmenu', preventDefault)
    }
  }, [controls])

  // A mouse or pen on the pad. Fingers never come through here: they are
  // read from touch events above.
  const zone = (name: ZoneName) => {
    const track = (e: PointerEvent<HTMLElement>) => {
      const fresh = controls.touch(
        e.pointerId,
        readZone(e.currentTarget, e.clientX, e.clientY)
      )
      bounce(e.currentTarget, fresh)
    }
    const release = (e: PointerEvent<HTMLElement>) => controls.lift(e.pointerId)
    return {
      'data-control': '',
      'data-zone': name,
      onPointerDown: (e: PointerEvent<HTMLElement>) => {
        if (e.pointerType === 'touch') return
        // Capture keeps a sliding pointer on this control after it leaves
        // the element, so the D-pad rolls between directions.
        e.currentTarget.setPointerCapture(e.pointerId)
        setMode('touch')
        track(e)
      },
      onPointerMove: (e: PointerEvent<HTMLElement>) => {
        if (e.pointerType !== 'touch' && controls.tracking(e.pointerId))
          track(e)
      },
      onPointerUp: release,
      onPointerCancel: release,
      onLostPointerCapture: release,
    }
  }

  const dismissHint = () => {
    setHint(false)
    try {
      localStorage.setItem(HINT_KEY, '1')
    } catch {
      // Storage blocked: the hint comes back next visit, nothing breaks.
    }
  }

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-mode={mode}
      // The on-screen pad is hidden in external mode, so a touch anywhere
      // has to be able to bring it back.
      onPointerDown={(e) => e.pointerType === 'touch' && setMode('touch')}
    >
      {!standalone && (
        <div className={styles.topBar}>
          <Link href="/demos" className={styles.exit}>
            ‹ Demos
          </Link>
          {hint && (
            <p className={styles.hint}>
              Tap Share, then Add to Home Screen, to play full screen.
              <button
                type="button"
                onClick={dismissHint}
                aria-label="Dismiss hint"
              >
                ✕
              </button>
            </p>
          )}
        </div>
      )}

      <div ref={screenRef} className={styles.screen}>
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className={styles.canvas}
          aria-label="Game screen"
          role="img"
        />
        {about && (
          <div
            className={styles.about}
            role="dialog"
            aria-labelledby="candlelight-about"
          >
            <h2 id="candlelight-about">Candlelight</h2>
            <label className={styles.debug}>
              <input
                type="checkbox"
                checked={debug}
                onChange={(e) => {
                  const on = e.currentTarget.checked
                  if (gameRef.current) gameRef.current.debug = on
                  setDebug(on)
                }}
              />
              Debug view: hitboxes, states and frame counts
            </label>
            <label className={styles.debug}>
              <input
                type="checkbox"
                checked={taps}
                onChange={(e) => {
                  const on = e.currentTarget.checked
                  tapsRef.current = on
                  setTaps(on)
                  try {
                    localStorage.setItem(TAPS_KEY, on ? 'on' : 'off')
                  } catch {
                    // Storage blocked: the choice lasts for this visit only.
                  }
                }}
              />
              Haptic tick on every press (experimental)
            </label>
            <p>
              Built in September 2026 by Cooper Reed, working with Claude Code.
              It tests how far a browser game can go as a real phone app:
              installed from Safari, full screen, offline, with no app store in
              between.
            </p>
            <h3>Install it on an iPhone</h3>
            <ol>
              <li>Open this page in Safari.</li>
              <li>Tap Share, then Add to Home Screen.</li>
              <li>
                Launch Candlelight from its icon. It opens straight into the
                game, full screen, and works offline.
              </li>
            </ol>
            <button type="button" onClick={() => gameRef.current?.closeAbout()}>
              Close (any button)
            </button>
          </div>
        )}
      </div>

      <div
        className={`${styles.diamond} ${styles.dpad}`}
        {...zone('dpad')}
        aria-hidden="true"
      >
        <span className={styles.up} data-button="up">
          ▲{taps && <Tick />}
        </span>
        <span className={styles.left} data-button="left">
          ◀{taps && <Tick />}
        </span>
        <span className={styles.right} data-button="right">
          ▶{taps && <Tick />}
        </span>
        <span className={styles.down} data-button="down">
          ▼{taps && <Tick />}
        </span>
      </div>

      <div
        className={`${styles.diamond} ${styles.face}`}
        {...zone('face')}
        aria-hidden="true"
      >
        <span className={styles.y} data-button="y">
          Y{taps && <Tick />}
        </span>
        <span className={styles.x} data-button="x">
          X{taps && <Tick />}
        </span>
        <span className={styles.b} data-button="b">
          B{taps && <Tick />}
        </span>
        <span className={styles.a} data-button="a">
          A{taps && <Tick />}
        </span>
      </div>

      <div className={styles.meta} aria-hidden="true">
        <span
          className={styles.select}
          data-button="select"
          {...zone('select')}
        >
          SELECT{taps && <Tick />}
        </span>
        <span className={styles.start} data-button="start" {...zone('start')}>
          START{taps && <Tick />}
        </span>
      </div>

      {/* Desktop: which keys the game is hearing, from any input source. */}
      <div className={styles.keys} data-control="" aria-hidden="true">
        <div className={styles.cluster}>
          <kbd className={styles.up}>{LEGEND[scheme].up}</kbd>
          <kbd className={styles.left}>{LEGEND[scheme].left}</kbd>
          <kbd className={styles.down}>{LEGEND[scheme].down}</kbd>
          <kbd className={styles.right}>{LEGEND[scheme].right}</kbd>
        </div>
        <div className={styles.cluster}>
          <kbd className={styles.y}>
            {LEGEND[scheme].y}
            <small>torch</small>
          </kbd>
          <kbd className={styles.x}>
            {LEGEND[scheme].x}
            <small>attack</small>
          </kbd>
          <kbd className={styles.a}>
            {LEGEND[scheme].a}
            <small>jump</small>
          </kbd>
          <kbd className={styles.b}>
            {LEGEND[scheme].b}
            <small>dash</small>
          </kbd>
        </div>
        <p className={styles.legend}>
          <span className={styles.start}>Enter pause</span>
          <span className={styles.select}>Backspace menu</span>
          <span>F fullscreen</span>
          <span>Hold up + attack to strike overhead</span>
        </p>
      </div>
      <button
        type="button"
        className={styles.scheme}
        onClick={(e) => {
          chooseScheme(scheme === 'arrows' ? 'wasd' : 'arrows')
          // Keep Space for jumping rather than pressing this again.
          e.currentTarget.blur()
        }}
      >
        Keys: {LEGEND[scheme].name}
      </button>
    </div>
  )
}

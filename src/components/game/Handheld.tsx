'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { createDemoGame, HEIGHT, WIDTH } from './demo-game'
import {
  Controls,
  dpadFromPoint,
  faceFromPoint,
  KEY_MAP,
  type Button,
} from './input'
import { startLoop } from './loop'
import styles from './Handheld.module.css'

type Mode = 'touch' | 'external'
type Mapper = (x: number, y: number) => Button[]

const HINT_KEY = 'game:install-hint-dismissed'

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

  useEffect(() => {
    const canvas = canvasRef.current
    const screen = screenRef.current
    const root = rootRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !screen || !root || !ctx) return

    const game = createDemoGame()

    const onKey = (e: KeyboardEvent) => {
      const button = KEY_MAP[e.code]
      if (!button || e.metaKey || e.ctrlKey || e.altKey) return
      e.preventDefault()
      if (e.repeat) return
      controls.key(button, e.type === 'keydown')
      if (e.type === 'keydown') setMode('external')
    }
    const onBlur = () => controls.clearKeys()

    let wakeLock: WakeLockSentinel | null = null
    const lockScreen = () => {
      navigator.wakeLock
        ?.request('screen')
        .then((lock) => (wakeLock = lock))
        .catch(() => {})
    }
    const onVisibility = () => {
      if (document.hidden) game.pause()
      else lockScreen()
    }
    const onPadGone = () => game.pause()
    const preventDefault = (e: Event) => e.preventDefault()

    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    window.addEventListener('blur', onBlur)
    window.addEventListener('gamepaddisconnected', onPadGone)
    document.addEventListener('visibilitychange', onVisibility)
    // iOS ignores user-scalable=no, so pinch has to be refused here.
    document.addEventListener('gesturestart', preventDefault)
    root.addEventListener('contextmenu', preventDefault)
    lockScreen()

    // The page behind this layer must not scroll or rubber-band.
    const html = document.documentElement
    const overflow = html.style.overflow
    html.style.overflow = 'hidden'

    // Whole-number scaling keeps every game pixel the same size. Below 2x
    // that would leave a postage stamp, so small screens fit fractionally.
    const resize = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const fit = Math.min(width / WIDTH, height / HEIGHT)
      const scale = fit >= 2 ? Math.floor(fit) : fit
      canvas.style.width = `${WIDTH * scale}px`
      canvas.style.height = `${HEIGHT * scale}px`
    })
    resize.observe(screen)

    const pads = root.querySelectorAll<HTMLElement>('[data-control]')
    let held = ''

    const stop = startLoop(
      () => {
        const frame = controls.read(navigator.getGamepads?.() ?? [])
        // Only real stick or button input counts: browsers also report
        // connected pads that nobody is holding.
        if (frame.padActive) setMode('external')
        held = [...frame.held].join(' ')
        game.step(frame)
      },
      () => {
        game.draw(ctx)
        pads.forEach((el) => el.setAttribute('data-held', held))
      }
    )

    return () => {
      stop()
      resize.disconnect()
      html.style.overflow = overflow
      wakeLock?.release().catch(() => {})
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('gamepaddisconnected', onPadGone)
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('gesturestart', preventDefault)
      root.removeEventListener('contextmenu', preventDefault)
    }
  }, [controls])

  const zone = (map: Mapper) => {
    const track = (e: PointerEvent<HTMLElement>) => {
      const box = e.currentTarget.getBoundingClientRect()
      const x = (e.clientX - box.left) / box.width
      const y = (e.clientY - box.top) / box.height
      if (controls.touch(e.pointerId, map(x, y))) navigator.vibrate?.(8)
    }
    const release = (e: PointerEvent<HTMLElement>) => controls.lift(e.pointerId)
    return {
      'data-control': '',
      onPointerDown: (e: PointerEvent<HTMLElement>) => {
        // Capture keeps a sliding thumb on this control after it leaves the
        // element, so the D-pad rolls between directions without a lift.
        e.currentTarget.setPointerCapture(e.pointerId)
        setMode('touch')
        track(e)
      },
      onPointerMove: (e: PointerEvent<HTMLElement>) => {
        if (controls.tracking(e.pointerId)) track(e)
      },
      onPointerUp: release,
      onPointerCancel: release,
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
    <div ref={rootRef} className={styles.root} data-mode={mode}>
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
      </div>

      <div
        className={styles.dpad}
        {...zone((x, y) => dpadFromPoint(x * 2 - 1, y * 2 - 1))}
        aria-hidden="true"
      >
        <span className={styles.up} />
        <span className={styles.down} />
        <span className={styles.left} />
        <span className={styles.right} />
      </div>

      <div className={styles.face} {...zone(faceFromPoint)} aria-hidden="true">
        <span className={styles.b}>B</span>
        <span className={styles.a}>A</span>
      </div>

      <div className={styles.meta} aria-hidden="true">
        <span className={styles.select} {...zone(() => ['select'])}>
          SELECT
        </span>
        <span className={styles.start} {...zone(() => ['start'])}>
          START
        </span>
      </div>
    </div>
  )
}

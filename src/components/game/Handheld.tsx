'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import {
  Controls,
  dpadFromPoint,
  faceFromPoint,
  KEY_MAP,
  type Button,
} from './input'
import { startLoop } from './loop'
import { createSandbox, HEIGHT, WIDTH } from './sandbox/game'
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

    const game = createSandbox()

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
      const button = KEY_MAP[e.code]
      if (!button) return
      if (e.type === 'keyup') return controls.key(button, false)
      // Shortcuts pass through, and Enter or Space on the exit link or the
      // hint's button must still activate it.
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if ((e.target as Element).closest?.('a, button')) return
      e.preventDefault()
      if (e.repeat) return
      controls.key(button, true)
      setMode('external')
    }
    // macOS sends no keyup for keys released while Cmd is held.
    const onBlur = () => controls.clearKeys()
    const onMeta = (e: KeyboardEvent) => {
      if (e.key === 'Meta') controls.clearKeys()
    }

    let wakeLock: WakeLockSentinel | null = null
    let disposed = false
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
      if (document.hidden) game.pause()
      else lockScreen()
    }
    const onPadGone = () => game.pause()
    const preventDefault = (e: Event) => e.preventDefault()

    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    window.addEventListener('blur', onBlur)
    window.addEventListener('keydown', onMeta)
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
      inerted.forEach((el) => el.removeAttribute('inert'))
      disposed = true
      wakeLock?.release().catch(() => {})
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('keydown', onMeta)
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
      </div>

      <div
        className={`${styles.diamond} ${styles.dpad}`}
        {...zone((x, y) => dpadFromPoint(x * 2 - 1, y * 2 - 1))}
        aria-hidden="true"
      >
        <span className={styles.up}>▲</span>
        <span className={styles.left}>◀</span>
        <span className={styles.right}>▶</span>
        <span className={styles.down}>▼</span>
      </div>

      <div
        className={`${styles.diamond} ${styles.face}`}
        {...zone(faceFromPoint)}
        aria-hidden="true"
      >
        <span className={styles.y}>Y</span>
        <span className={styles.x}>X</span>
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

      {/* Desktop: which keys the game is hearing, from any input source. */}
      <div className={styles.keys} data-control="" aria-hidden="true">
        <div className={styles.cluster}>
          <kbd className={styles.up}>W</kbd>
          <kbd className={styles.left}>A</kbd>
          <kbd className={styles.down}>S</kbd>
          <kbd className={styles.right}>D</kbd>
        </div>
        <div className={styles.cluster}>
          <kbd className={styles.y}>I</kbd>
          <kbd className={styles.x}>
            J<small>attack</small>
          </kbd>
          <kbd className={styles.a}>
            K<small>jump</small>
          </kbd>
          <kbd className={styles.b}>
            L<small>dash</small>
          </kbd>
        </div>
        <p className={styles.legend}>
          <span className={styles.start}>Enter pause</span>
          <span className={styles.select}>Backspace debug</span>
          <span>F fullscreen</span>
        </p>
      </div>
    </div>
  )
}

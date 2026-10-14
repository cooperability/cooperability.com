import { render } from '@testing-library/react'
import { usePathname, useRouter } from 'next/navigation'
import SwipeNav from '../../components/SwipeNav'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}))

/**
 * jsdom's TouchEvent drops the touch lists it is given, so these build plain
 * events and attach the lists the component reads.
 */
function touch(
  type: 'touchstart' | 'touchend',
  x: number,
  y: number,
  { target = document.body, at = 0, fingers = 1 } = {}
) {
  const event = new Event(type, { bubbles: true })
  const point = { clientX: x, clientY: y }
  Object.defineProperties(event, {
    touches: { value: type === 'touchend' ? [] : Array(fingers).fill(point) },
    changedTouches: { value: [point] },
    timeStamp: { value: at },
  })
  target.dispatchEvent(event)
}

function swipe(
  from: [number, number],
  to: [number, number],
  options: { target?: Element; ms?: number; fingers?: number } = {}
) {
  const { ms = 200, ...rest } = options
  touch('touchstart', ...from, { ...rest, at: 1000 })
  touch('touchend', ...to, { ...rest, at: 1000 + ms })
}

const push = jest.fn()

function swipeOn(path: string) {
  jest.mocked(usePathname).mockReturnValue(path)
  return render(<SwipeNav />)
}

beforeEach(() => {
  push.mockReset()
  jest.mocked(useRouter).mockReturnValue({ push } as never)
})

describe('swiping between pages', () => {
  it.each([
    ['/', 'left', '/demos', [300, 400], [150, 405]],
    ['/demos', 'left', '/stash', [300, 400], [150, 405]],
    ['/demos', 'right', '/', [150, 400], [300, 395]],
    ['/stash', 'right', '/demos', [150, 400], [300, 395]],
  ] as const)('on %s, swiping %s goes to %s', (path, _, expected, from, to) => {
    swipeOn(path)

    swipe([...from], [...to])

    expect(push).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith(expected)
  })

  it.each([
    ['right on the first page', '/', [150, 400], [300, 400]],
    ['left on the last page', '/stash', [300, 400], [150, 400]],
    ['too short', '/', [300, 400], [250, 400]],
    ['mostly vertical', '/', [300, 400], [220, 520]],
  ] as const)('does nothing for a swipe: %s', (_, path, from, to) => {
    swipeOn(path)

    swipe([...from], [...to])

    expect(push).not.toHaveBeenCalled()
  })

  it('ignores a slow drag, which is a selection or a scroll', () => {
    swipeOn('/')

    swipe([300, 400], [150, 400], { ms: 900 })

    expect(push).not.toHaveBeenCalled()
  })

  it('ignores more than one finger, which is a pinch', () => {
    swipeOn('/')

    swipe([300, 400], [150, 400], { fingers: 2 })

    expect(push).not.toHaveBeenCalled()
  })

  it('leaves both screen edges to the browser’s own back gesture', () => {
    swipeOn('/demos')

    swipe([10, 400], [200, 400])
    swipe([window.innerWidth - 10, 400], [100, 400])

    expect(push).not.toHaveBeenCalled()
  })

  it.each([
    '/demos/candlelight',
    '/demos/mandelbrot-explorer',
    '/stash/linktree',
  ])('is off on the subpage %s, where drags belong to the page', (path) => {
    swipeOn(path)

    swipe([300, 400], [150, 400])

    expect(push).not.toHaveBeenCalled()
  })

  it.each(['textarea', 'input', 'canvas', 'div[data-no-swipe]'])(
    'does not start on %s',
    (selector) => {
      const [tag] = selector.split('[')
      const el = document.createElement(tag)
      if (selector.includes('data-no-swipe'))
        el.setAttribute('data-no-swipe', '')
      document.body.append(el)
      swipeOn('/')

      swipe([300, 400], [150, 400], { target: el })

      expect(push).not.toHaveBeenCalled()
      el.remove()
    }
  )

  it('does not start inside something that scrolls sideways', () => {
    const scroller = document.createElement('div')
    scroller.style.overflowX = 'auto'
    Object.defineProperties(scroller, {
      scrollWidth: { value: 900 },
      clientWidth: { value: 300 },
    })
    const inner = document.createElement('span')
    scroller.append(inner)
    document.body.append(scroller)
    swipeOn('/')

    swipe([300, 400], [150, 400], { target: inner })

    expect(push).not.toHaveBeenCalled()
    scroller.remove()
  })

  it('stops listening when it unmounts', () => {
    const { unmount } = swipeOn('/')
    unmount()

    swipe([300, 400], [150, 400])

    expect(push).not.toHaveBeenCalled()
  })
})

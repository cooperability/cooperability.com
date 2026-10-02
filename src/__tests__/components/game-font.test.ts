import {
  drawText,
  TEXT_CACHE_MAX,
  textCacheSize,
} from '../../components/game/sandbox/font'

// jsdom has no canvas, so every context is one that accepts anything.
const noop = () => {}
const ctx = new Proxy({}, { get: () => noop, set: () => true })

beforeEach(() => {
  jest
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockReturnValue(ctx as unknown as CanvasRenderingContext2D)
})

afterEach(() => jest.restoreAllMocks())

describe('drawText', () => {
  it('stays bounded when every frame draws new strings, as debug labels do', () => {
    const screen = ctx as unknown as CanvasRenderingContext2D
    for (let frame = 0; frame < 200; frame++)
      for (let label = 0; label < 7; label++)
        drawText(screen, `RUN ${label} VX ${frame}`, 0, 0, '#fff')
    expect(textCacheSize()).toBeGreaterThan(0)
    expect(textCacheSize()).toBeLessThanOrEqual(TEXT_CACHE_MAX)
  })
})

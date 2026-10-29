import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import SwatchGenerator from '../../components/swatch-generator/SwatchGenerator'
import { AESTHETICS } from '../../components/swatch-generator/palette'

beforeAll(() => {
  // jsdom's Blob lacks arrayBuffer(), which every target browser has.
  Blob.prototype.arrayBuffer ??= function (this: Blob) {
    return new Promise<ArrayBuffer>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.readAsArrayBuffer(this)
    })
  }
  // Radix Select calls these, and jsdom does not implement them.
  Element.prototype.hasPointerCapture ??= () => false
  Element.prototype.releasePointerCapture ??= () => {}
  Element.prototype.scrollIntoView ??= () => {}
})

// jsdom has no canvas backend. This stand-in records the text the exported
// card draws and ignores everything else.
let drawn: string[] = []
beforeEach(() => {
  drawn = []
  const ctx = new Proxy({} as Record<string | symbol, unknown>, {
    get: (target, key) =>
      key in target
        ? target[key]
        : key === 'measureText'
          ? () => ({ width: 0 })
          : key === 'fillText'
            ? // Each layout pass starts with this label, so keep the last one.
              (str: string) =>
                str === 'PERSONAL COLOR SWATCH'
                  ? (drawn = [str])
                  : drawn.push(str)
            : key === 'createLinearGradient'
              ? () => ({ addColorStop() {} })
              : () => {},
    set: (target, key, value) => ((target[key] = value), true),
  })
  jest
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockReturnValue(ctx as unknown as CanvasRenderingContext2D)
  jest.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(() => {})
})

afterEach(() => jest.restoreAllMocks())

function choose(label: string, name: string) {
  fireEvent.keyDown(screen.getByRole('combobox', { name: label }), {
    key: 'Enter',
  })
  fireEvent.click(screen.getByRole('option', { name }))
}

function pickFeatures(
  eyes: string,
  skin: string,
  undertone: string,
  hair: string
) {
  choose('Eyes', eyes)
  choose('Skin depth', skin)
  fireEvent.click(screen.getByRole('radio', { name: undertone }))
  choose('Hair', hair)
}

const season = () =>
  within(document.querySelector<HTMLElement>('[data-slot="card"]')!).getByRole(
    'heading',
    { level: 2 }
  )
const section = (title: string) =>
  screen.queryByRole('heading', { level: 3, name: title })?.closest('section')

describe('SwatchGenerator', () => {
  it('reclassifies the season when the features change', () => {
    render(<SwatchGenerator />)
    pickFeatures('Bright blue', 'Monk 1 (lightest)', 'Cool', 'Blue-black')
    expect(season()).toHaveTextContent('Bright Winter')
    expect(season()).toHaveTextContent('also called Clear Winter')
    pickFeatures('Dark brown', 'Monk 8', 'Warm', 'Dark brown, warm')
    expect(season()).toHaveTextContent('Deep Autumn')
  })

  it('selects an undertone with the arrow keys', async () => {
    render(<SwatchGenerator />)
    const neutral = screen.getByRole('radio', { name: 'Neutral' })
    act(() => neutral.focus())
    fireEvent.keyDown(neutral, { key: 'ArrowRight' })
    // Radix moves focus on the next tick, and focus is what checks the radio.
    await waitFor(() =>
      expect(screen.getByRole('radio', { name: 'Warm' })).toBeChecked()
    )
  })

  it('announces the result and labels warmth as a blend of features', () => {
    render(<SwatchGenerator />)
    const live = document.querySelector('[aria-live="polite"]')!
    expect(live).toHaveTextContent(/^Soft Autumn\. Warmth: \w+, Depth/)
    fireEvent.click(screen.getByRole('switch', { name: 'Seasonal analysis' }))
    expect(live).toHaveTextContent(/^Your colors\. Warmth:/)
  })

  it('credits the Monk scale under its license and states the caveat', () => {
    render(<SwatchGenerator />)
    expect(
      screen.getByRole('link', { name: 'Monk Skin Tone Scale' })
    ).toHaveAttribute('href', 'https://skintone.google/')
    expect(screen.getByRole('link', { name: 'CC BY 4.0' })).toHaveAttribute(
      'href',
      'https://creativecommons.org/licenses/by/4.0/'
    )
    expect(screen.getByText(/little published testing/)).toBeInTheDocument()
  })

  it('opens a wiki whose sources link to their DOIs', () => {
    render(<SwatchGenerator />)
    fireEvent.click(
      screen.getByRole('button', { name: 'Why it is built this way' })
    )
    const dois = screen
      .getAllByRole('link')
      .map((link) => link.getAttribute('href')!)
      .filter((href) => href.startsWith('https://doi.org/'))
    expect(dois).toEqual(
      expect.arrayContaining([
        'https://doi.org/10.1145/3632120',
        'https://doi.org/10.1177/20416695211053361',
        'https://doi.org/10.2466/pms.1990.71.1.151',
      ])
    )
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Where seasonal color analysis comes from',
      })
    )
    expect(screen.getByText('The Art of Color')).toBeInTheDocument()
  })

  it('keeps an undertone picked when its button is pressed again', () => {
    render(<SwatchGenerator />)
    const warm = screen.getByRole('radio', { name: 'Warm' })
    fireEvent.click(warm)
    fireEvent.click(warm)
    expect(warm).toBeChecked()
    expect(screen.getByText('Golden, peach or yellow')).toBeInTheDocument()
  })

  it('drops a section from the swatch when its toggle is switched off', () => {
    render(<SwatchGenerator />)
    expect(section('Colors to avoid')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Avoid' }))
    expect(section('Colors to avoid')).toBeUndefined()

    choose('Aesthetic', 'None')
    expect(screen.queryByText(/^Aesthetic:/)).not.toBeInTheDocument()
  })

  it('features the chosen aesthetic', () => {
    render(<SwatchGenerator />)
    choose('Aesthetic', 'Romantic')
    expect(section('Aesthetic: Romantic')).toBeInTheDocument()
  })

  it('works without seasonal analysis', () => {
    render(<SwatchGenerator />)
    fireEvent.click(screen.getByRole('radio', { name: 'Cool' }))
    fireEvent.click(screen.getByRole('switch', { name: 'Seasonal analysis' }))

    expect(season()).toHaveTextContent('Your colors')
    expect(section('Best colors')).toBeUndefined()
    expect(screen.queryByText(/^Aesthetic:/)).not.toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Aesthetic' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Avoid' })).toBeDisabled()
    expect(section('Harmonies from your features')).toBeInTheDocument()
    // Cool undertones take the white metals.
    const metals = within(section('Metals')!)
    expect(metals.getByText('Silver')).toBeInTheDocument()
    expect(metals.queryByText('Gold')).not.toBeInTheDocument()
  })

  it.each([
    ['with', false],
    ['without', true],
  ])(
    'exports the sections and swatches the preview shows, %s seasons',
    async (_, seasonsOff) => {
      render(<SwatchGenerator />)
      if (seasonsOff)
        fireEvent.click(
          screen.getByRole('switch', { name: 'Seasonal analysis' })
        )
      else choose('Aesthetic', 'Bold')
      await waitFor(() =>
        expect(drawn).toContain('cooperability.com/demos/swatch-generator')
      )

      const headings = screen
        .getAllByRole('heading', { level: 3 })
        .map((h) => h.textContent!.toUpperCase())
      const drawnHeadings = drawn.filter(
        (str) =>
          /^[A-Z][A-Z :,]+$/.test(str) &&
          !['PERSONAL COLOR SWATCH', 'EYES', 'SKIN', 'HAIR'].includes(str)
      )
      expect(drawnHeadings).toEqual(headings)

      const shown = screen
        .getAllByTestId('swatch-chip')
        .map((chip) => chip.nextElementSibling!.textContent!)
      const count = (list: string[], name: string) =>
        list.filter((n) => n === name).length
      for (const name of shown)
        expect(count(drawn, name)).toBeGreaterThanOrEqual(count(shown, name))

      // Hex codes appear only under chips, so these lists must match exactly.
      const isHex = (str: string) => /^#[0-9A-F]{6}$/.test(str)
      const shownHex = screen
        .getAllByTestId('swatch-chip')
        .flatMap((chip) =>
          [...chip.parentElement!.querySelectorAll('p')].map(
            (p) => p.textContent!
          )
        )
        .filter(isHex)
      expect(shownHex.length).toBeGreaterThanOrEqual(5)
      expect(drawn.filter(isHex)).toEqual(shownHex)

      // Metals, the 60/30/10 split and the aesthetic blurb.
      const drawnText = drawn.join(' | ')
      for (const item of screen.queryAllByRole('listitem'))
        if (!item.querySelector('[data-testid="swatch-chip"]'))
          expect(drawnText).toContain(item.textContent)
      const split = screen.queryByText(/^60% /)
      for (const part of split?.textContent!.split(', ') ?? [])
        expect(drawnText).toContain(part)
      if (!seasonsOff) {
        expect(split).toBeInTheDocument()
        expect(drawnText).toContain(
          AESTHETICS.find((a) => a.name === 'Bold')!.blurb
        )
      }
    }
  )

  it('encodes once after a burst of changes', () => {
    jest.useFakeTimers()
    try {
      const toBlob = jest.spyOn(HTMLCanvasElement.prototype, 'toBlob')
      render(<SwatchGenerator />)
      act(() => jest.advanceTimersByTime(200))
      toBlob.mockClear()
      for (const name of ['Cool', 'Warm', 'Olive'])
        fireEvent.click(screen.getByRole('radio', { name }))
      act(() => jest.advanceTimersByTime(100))
      expect(toBlob).not.toHaveBeenCalled()
      act(() => jest.advanceTimersByTime(100))
      expect(toBlob).toHaveBeenCalledTimes(1)
    } finally {
      jest.useRealTimers()
    }
  })

  it('shows Avoid as off, and says why, while seasons are off', () => {
    render(<SwatchGenerator />)
    const avoid = screen.getByRole('button', { name: 'Avoid' })
    expect(avoid).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('switch', { name: 'Seasonal analysis' }))
    expect(avoid).toHaveAttribute('aria-pressed', 'false')
    expect(avoid).toHaveAccessibleDescription(/need seasonal analysis/)

    // Toggling another section keeps Avoid's own setting for later.
    fireEvent.click(screen.getByRole('button', { name: 'Neutrals' }))
    fireEvent.click(screen.getByRole('switch', { name: 'Seasonal analysis' }))
    expect(avoid).toHaveAttribute('aria-pressed', 'true')
    expect(section('Colors to avoid')).toBeInTheDocument()
  })

  it('says how to add colors, and saves nothing, when every section is off', async () => {
    const jpeg = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])])
    jest
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation((cb) => cb(jpeg))
    render(<SwatchGenerator />)
    const save = screen.getByRole('button', { name: 'Save JPG' })
    await waitFor(() => expect(save).toBeEnabled())

    fireEvent.click(screen.getByRole('switch', { name: 'Seasonal analysis' }))
    fireEvent.click(screen.getByRole('button', { name: 'Neutrals' }))
    fireEvent.click(screen.getByRole('button', { name: 'Harmonies' }))
    expect(screen.getByText(/Switch on a section/)).toBeInTheDocument()
    // Past the encode delay, so the files for the empty card are ready.
    await act(() => new Promise((r) => setTimeout(r, 300)))
    expect(save).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Save PDF' })).toBeDisabled()
  })

  it.each([
    ['Save JPG', 'image/jpeg', 'personal-swatch-bright-winter.jpg', 'ff d8'],
    [
      'Save PDF',
      'application/pdf',
      'personal-swatch-bright-winter.pdf',
      '25 50',
    ],
  ])(
    '%s downloads a %s named after the season',
    async (button, type, name, magic) => {
      const jpeg = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], {
        type: 'image/jpeg',
      })
      jest
        .spyOn(HTMLCanvasElement.prototype, 'toBlob')
        .mockImplementation((cb) => cb(jpeg))
      const made: Blob[] = []
      URL.createObjectURL = jest.fn((b: Blob) => (made.push(b), 'blob:swatch'))
      URL.revokeObjectURL = jest.fn()
      const clicked: string[] = []
      jest
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(function (this: HTMLAnchorElement) {
          clicked.push(this.download)
        })

      render(<SwatchGenerator />)
      pickFeatures('Bright blue', 'Monk 1 (lightest)', 'Cool', 'Blue-black')
      const save = screen.getByRole('button', { name: button })
      await waitFor(() => expect(save).toBeEnabled())
      fireEvent.click(save)

      // Synchronous, inside the click: Safari drops a download started later.
      expect(clicked).toEqual([name])
      expect(made[0].type).toBe(type)
      const head = new Uint8Array(await made[0].arrayBuffer()).slice(0, 2)
      expect([...head].map((b) => b.toString(16)).join(' ')).toBe(magic)
    }
  )
})

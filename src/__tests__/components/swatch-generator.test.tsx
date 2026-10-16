import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import SwatchGenerator from '../../components/swatch-generator/SwatchGenerator'

// jsdom's Blob lacks arrayBuffer(), which every target browser has.
beforeAll(() => {
  Blob.prototype.arrayBuffer ??= function (this: Blob) {
    return new Promise<ArrayBuffer>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.readAsArrayBuffer(this)
    })
  }
})

beforeEach(() => {
  // jsdom has no canvas backend. A null context makes the renderer bail early.
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})

afterEach(() => jest.restoreAllMocks())

function pickFeatures(eyes: string, skin: string, hair: string) {
  fireEvent.change(screen.getByLabelText('Eyes'), { target: { value: eyes } })
  fireEvent.change(screen.getByLabelText('Skin'), { target: { value: skin } })
  fireEvent.change(screen.getByLabelText('Hair'), { target: { value: hair } })
}

describe('SwatchGenerator', () => {
  it('reclassifies the season when the features change', () => {
    render(<SwatchGenerator />)
    pickFeatures('Bright blue', 'Porcelain, cool', 'Blue-black')
    expect(
      screen.getByRole('img', { name: 'Personal color swatch: Bright Winter' })
    ).toBeInTheDocument()
    pickFeatures('Dark brown', 'Deep, warm', 'Dark brown, warm')
    expect(
      screen.getByRole('img', { name: 'Personal color swatch: Deep Autumn' })
    ).toBeInTheDocument()
  })

  it('drops a section from the swatch when its toggle is switched off', () => {
    render(<SwatchGenerator />)
    const text = () => screen.getByText('Palette as text').closest('details')!
    expect(within(text()).getByText('Colors to avoid')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('switch', { name: 'Colors to avoid' }))
    expect(
      within(text()).queryByText('Colors to avoid')
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('switch', { name: 'Aesthetic' }))
    expect(screen.queryByLabelText('Aesthetic style')).not.toBeInTheDocument()
    expect(within(text()).queryByText(/^Aesthetic:/)).not.toBeInTheDocument()
  })

  it('features the chosen aesthetic', () => {
    render(<SwatchGenerator />)
    fireEvent.change(screen.getByLabelText('Aesthetic style'), {
      target: { value: 'Romantic' },
    })
    expect(screen.getByText('Aesthetic: Romantic')).toBeInTheDocument()
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
      pickFeatures('Bright blue', 'Porcelain, cool', 'Blue-black')
      fireEvent.click(screen.getByRole('button', { name: button }))

      await waitFor(() => expect(clicked).toEqual([name]))
      expect(made[0].type).toBe(type)
      const head = new Uint8Array(await made[0].arrayBuffer()).slice(0, 2)
      expect([...head].map((b) => b.toString(16)).join(' ')).toBe(magic)
    }
  )
})

import { enteredClientSide } from '../../components/HardLoad'

const at = (href: string) => new URL(href) as unknown as Location

describe('enteredClientSide', () => {
  it('is false when the document was loaded at this path', () => {
    expect(
      enteredClientSide(
        'https://www.cooperability.com/demos/candlelight?qa=1',
        at('https://www.cooperability.com/demos/candlelight?qa=1')
      )
    ).toBe(false)
  })

  it('is true when the document was loaded elsewhere and navigated here', () => {
    expect(
      enteredClientSide(
        'https://www.cooperability.com/demos',
        at('https://www.cooperability.com/demos/prompt-composer')
      )
    ).toBe(true)
  })

  it('ignores the query and hash', () => {
    expect(
      enteredClientSide(
        'https://www.cooperability.com/demos/candlelight',
        at('https://www.cooperability.com/demos/candlelight?qa=1#x')
      )
    ).toBe(false)
  })
})

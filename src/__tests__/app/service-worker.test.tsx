import { render } from '@testing-library/react'
import ServiceWorkerRegistration from '../../app/service-worker'

/**
 * The guard was `window.location.protocol !== 'https:'`, which is not the rule
 * browsers actually apply: a service worker is allowed on https *and* on
 * http://localhost. That check disabled the worker in local development, which
 * is the one place you would want to test it.
 */

const register = jest.fn()

function setSecureContext(value: boolean) {
  Object.defineProperty(window, 'isSecureContext', {
    value,
    configurable: true,
    writable: true,
  })
}

function setServiceWorkerSupport(supported: boolean) {
  if (supported) {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register },
      configurable: true,
      writable: true,
    })
  } else {
    // @ts-expect-error removing an optional platform API for the test
    delete navigator.serviceWorker
  }
}

beforeEach(() => {
  register.mockReset().mockResolvedValue(undefined)
  setServiceWorkerSupport(true)
})

describe('ServiceWorkerRegistration', () => {
  it('registers on http://localhost, which is a secure context', () => {
    // jsdom serves this suite from http://localhost, so the old protocol check
    // returned early right here.
    expect(window.location.protocol).toBe('http:')
    setSecureContext(true)

    render(<ServiceWorkerRegistration />)
    expect(register).toHaveBeenCalledWith('/sw.js')
  })

  it('does not register outside a secure context', () => {
    setSecureContext(false)
    render(<ServiceWorkerRegistration />)
    expect(register).not.toHaveBeenCalled()
  })

  it('does nothing where the API is unavailable', () => {
    setSecureContext(true)
    setServiceWorkerSupport(false)
    expect(() => render(<ServiceWorkerRegistration />)).not.toThrow()
    expect(register).not.toHaveBeenCalled()
  })
})

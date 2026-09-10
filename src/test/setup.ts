import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// JSDOM has no viewport geometry. Scroll-triggered motion is checked in the browser.
Object.defineProperty(window, 'IntersectionObserver', {
  configurable: true,
  value: class {
    observe = (): undefined => undefined
    unobserve = (): undefined => undefined
    disconnect = (): undefined => undefined
  },
})

Object.defineProperty(window, 'scrollTo', {
  configurable: true,
  value: () => undefined,
})

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
})

afterEach(() => cleanup())

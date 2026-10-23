import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// unmount rendered components and forget the stored token between tests
afterEach(() => {
  cleanup()
  localStorage.clear()
})

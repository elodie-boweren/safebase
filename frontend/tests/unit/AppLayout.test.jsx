import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, test, vi } from 'vitest'
import AppLayout from '../../src/layouts/AppLayout'
import { logout, setToken } from '../../src/services/api'

// the layout is tested alone: no navbar, no alerts polling
vi.mock('../../src/components/Navbar', () => ({ default: () => <nav>Navbar</nav> }))
vi.mock('../../src/features/alerts/AlertsProvider', () => ({ default: ({ children }) => children }))

function renderAt(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<p>Page de connexion</p>} />
        <Route element={<AppLayout />}>
          <Route path="dashboard" element={<p>Page dashboard</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('protected pages', () => {
  test('without a session -> redirected to the login page (US00-08)', () => {
    renderAt('/dashboard')

    expect(screen.getByText('Page de connexion')).toBeInTheDocument()
    expect(screen.queryByText('Page dashboard')).not.toBeInTheDocument()
  })

  test('after logout -> the dashboard is no longer reachable (US00-07)', () => {
    setToken('jwt-token')
    logout()
    renderAt('/dashboard')

    expect(screen.getByText('Page de connexion')).toBeInTheDocument()
  })

  test('with a session -> the dashboard is displayed', () => {
    setToken('jwt-token')
    renderAt('/dashboard')

    expect(screen.getByText('Page dashboard')).toBeInTheDocument()
  })
})

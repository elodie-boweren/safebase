import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import AuthModal from '../../src/features/auth/AuthModal'
import { ApiError, login, register } from '../../src/services/api'

vi.mock('../../src/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  login: vi.fn(),
  register: vi.fn(),
}))

function renderAuth(mode) {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<AuthModal mode={mode} />} />
        <Route path="/dashboard" element={<p>Page dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillAndSubmit(user, { email, password, confirmPassword }, buttonName) {
  await user.type(screen.getByLabelText('email'), email)
  await user.type(screen.getByLabelText('mot de passe'), password)
  if (confirmPassword !== undefined) {
    await user.type(screen.getByLabelText('confirmer mot de passe'), confirmPassword)
  }
  await user.click(screen.getByRole('button', { name: buttonName }))
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('login', () => {
  test('valid credentials -> redirected to the dashboard (US00-04)', async () => {
    const user = userEvent.setup()
    login.mockResolvedValue({ user_id: 1 })
    renderAuth('login')

    await fillAndSubmit(user, { email: 'emma@safebase.dev', password: 'safebase123' }, 'Se connecter')

    expect(login).toHaveBeenCalledWith('emma@safebase.dev', 'safebase123')
    expect(await screen.findByText('Page dashboard')).toBeInTheDocument()
  })

  test.each([
    ['wrong password (US00-05)', 'emma@safebase.dev'],
    ['unknown email (US00-06)', 'nobody@safebase.dev'],
  ])('%s -> same generic message, stays on the login page', async (_label, email) => {
    const user = userEvent.setup()
    login.mockRejectedValue(new ApiError('Identifiants invalides', 401))
    renderAuth('login')

    await fillAndSubmit(user, { email, password: 'wrongpass' }, 'Se connecter')

    // the message does not reveal whether the email exists
    expect(await screen.findByText('Email ou mot de passe incorrect.')).toBeInTheDocument()
    expect(screen.queryByText('Page dashboard')).not.toBeInTheDocument()
  })
})

describe('signup', () => {
  test('creates the account then logs in (US00-01)', async () => {
    const user = userEvent.setup()
    register.mockResolvedValue({ user_id: 2 })
    login.mockResolvedValue({ user_id: 2 })
    renderAuth('signup')

    await fillAndSubmit(user, { email: 'new@safebase.dev', password: 'secret123', confirmPassword: 'secret123' }, "S'inscrire")

    expect(register).toHaveBeenCalledWith('new', 'new@safebase.dev', 'secret123')
    expect(login).toHaveBeenCalledWith('new@safebase.dev', 'secret123')
    expect(await screen.findByText('Page dashboard')).toBeInTheDocument()
  })

  test('email already registered -> error message (US00-02)', async () => {
    const user = userEvent.setup()
    register.mockRejectedValue(new ApiError('duplicate key value violates unique constraint', 400))
    renderAuth('signup')

    await fillAndSubmit(user, { email: 'emma@safebase.dev', password: 'secret123', confirmPassword: 'secret123' }, "S'inscrire")

    expect(await screen.findByText('Inscription impossible : cet email est peut-être déjà utilisé.')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  test('passwords do not match -> message, no account created (US00-03)', async () => {
    const user = userEvent.setup()
    renderAuth('signup')

    await fillAndSubmit(user, { email: 'new@safebase.dev', password: 'secret123', confirmPassword: 'other123' }, "S'inscrire")

    expect(screen.getByText('Les mots de passe ne correspondent pas.')).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })

  test('fields are required and the email must be valid (US00-03)', () => {
    renderAuth('signup')

    const email = screen.getByLabelText('email')
    expect(email).toBeRequired()
    expect(email).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('mot de passe')).toBeRequired()
    expect(screen.getByLabelText('mot de passe')).toHaveAttribute('minlength', '6')
  })
})

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import AddDatabaseModal from '../../src/features/databases/AddDatabaseModal'
import { ApiError, createDatabase } from '../../src/services/api'

vi.mock('../../src/services/api', async (importOriginal) => ({
  ...(await importOriginal()),
  createDatabase: vi.fn(),
}))

function renderModal() {
  const onCreated = vi.fn()
  const onCancel = vi.fn()
  render(<AddDatabaseModal onCreated={onCreated} onCancel={onCancel} />)
  return { onCreated, onCancel }
}

async function fillForm(user) {
  await user.type(screen.getByLabelText('Nom de la base'), 'bibliotheque_postgres')
  await user.type(screen.getByLabelText('Utilisateur'), 'safebase')
  await user.type(screen.getByLabelText('Mot de passe'), 'safebasepass')
}

beforeEach(() => {
  vi.clearAllMocks()
})

test('the type list offers PostgreSQL and MySQL (US01-04)', () => {
  renderModal()

  const options = within(screen.getByRole('combobox')).getAllByRole('option').map((option) => option.textContent)
  expect(options).toEqual(['PostgreSQL', 'MySQL'])
})

test.todo('the type list offers MongoDB (US01-04, bonus not implemented yet)')

test('choosing MySQL switches the default host and port', async () => {
  const user = userEvent.setup()
  renderModal()

  await user.selectOptions(screen.getByRole('combobox'), 'mysql')

  expect(screen.getByLabelText('Hôte')).toHaveValue('mysql')
  expect(screen.getByLabelText('Port')).toHaveValue(3306)
})

test('every field is required (US01-05)', () => {
  renderModal()

  for (const label of ['Nom de la base', 'Hôte', 'Port', 'Utilisateur', 'Mot de passe']) {
    expect(screen.getByLabelText(label)).toBeRequired()
  }
})

test('valid connection -> sent to the API and added (US01-01, US01-02)', async () => {
  const user = userEvent.setup()
  createDatabase.mockResolvedValue({ database_id: 1, name: 'bibliotheque_postgres' })
  const { onCreated } = renderModal()

  await fillForm(user)
  await user.click(screen.getByRole('button', { name: 'Ajouter' }))

  expect(createDatabase).toHaveBeenCalledWith({
    type: 'postgres',
    host: 'postgres',
    port: 5432,
    database_name: 'bibliotheque_postgres',
    name: 'bibliotheque_postgres',
    username: 'safebase',
    password: 'safebasepass',
  })
  expect(onCreated).toHaveBeenCalledWith({ database_id: 1, name: 'bibliotheque_postgres' })
})

test.each([
  ['invalid credentials (US01-06)', 'Échec du test de connexion : Identifiants invalides'],
  ['unreachable server (US01-07)', "Échec du test de connexion : Connexion refusée : vérifiez l'hôte et le port"],
])('%s -> error shown, database not added', async (_label, message) => {
  const user = userEvent.setup()
  createDatabase.mockRejectedValue(new ApiError(message, 400))
  const { onCreated } = renderModal()

  await fillForm(user)
  await user.click(screen.getByRole('button', { name: 'Ajouter' }))

  expect(await screen.findByText(message)).toBeInTheDocument()
  expect(onCreated).not.toHaveBeenCalled()
})

test('"Annuler" closes the form without adding anything', async () => {
  const user = userEvent.setup()
  const { onCancel } = renderModal()

  await user.click(screen.getByRole('button', { name: 'Annuler' }))

  expect(onCancel).toHaveBeenCalled()
  expect(createDatabase).not.toHaveBeenCalled()
})

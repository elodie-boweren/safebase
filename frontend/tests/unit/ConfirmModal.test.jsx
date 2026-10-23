import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import ConfirmModal from '../../src/components/ConfirmModal'

function renderModal(props = {}) {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  render(
    <ConfirmModal
      open
      title="Restaurer cette version ?"
      description="Les données actuelles seront remplacées."
      confirmLabel="Restaurer"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
  )
  return { onConfirm, onCancel }
}

test('closed -> nothing is displayed', () => {
  renderModal({ open: false })

  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
})

test('open -> the warning is shown and nothing happens before a choice (US04-02, US05-01)', () => {
  const { onConfirm, onCancel } = renderModal()

  expect(screen.getByRole('alertdialog', { name: 'Restaurer cette version ?' }))
    .toHaveAccessibleDescription('Les données actuelles seront remplacées.')
  expect(onConfirm).not.toHaveBeenCalled()
  expect(onCancel).not.toHaveBeenCalled()
})

test('"Retour" cancels without confirming (US04-03, US05-03)', async () => {
  const user = userEvent.setup()
  const { onConfirm, onCancel } = renderModal()

  await user.click(screen.getByRole('button', { name: 'Retour' }))

  expect(onCancel).toHaveBeenCalledTimes(1)
  expect(onConfirm).not.toHaveBeenCalled()
})

test('the confirm button confirms (US05-02)', async () => {
  const user = userEvent.setup()
  const { onConfirm, onCancel } = renderModal()

  await user.click(screen.getByRole('button', { name: 'Restaurer' }))

  expect(onConfirm).toHaveBeenCalledTimes(1)
  expect(onCancel).not.toHaveBeenCalled()
})

test('Escape and a click outside the dialog cancel too', async () => {
  const user = userEvent.setup()
  const { onConfirm, onCancel } = renderModal()

  await user.keyboard('{Escape}')
  await user.click(screen.getByRole('button', { name: 'Fermer' }))

  expect(onCancel).toHaveBeenCalledTimes(2)
  expect(onConfirm).not.toHaveBeenCalled()
})

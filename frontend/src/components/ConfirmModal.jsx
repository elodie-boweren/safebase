import { useEffect } from 'react'
import Button from './Button'

function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Retour',
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onCancel?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="confirm-modal" role="presentation">
      <button
        type="button"
        className="confirm-modal__backdrop"
        aria-label="Fermer"
        onClick={onCancel}
      />
      <div
        className="confirm-modal__dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby={description ? 'confirm-modal-desc' : undefined}
      >
        <h2 id="confirm-modal-title" className="confirm-modal__title">
          {title}
        </h2>
        {description ? (
          <div id="confirm-modal-desc" className="confirm-modal__desc">
            {description}
          </div>
        ) : null}
        <div className="confirm-modal__actions">
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal

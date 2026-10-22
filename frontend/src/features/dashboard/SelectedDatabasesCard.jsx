import { useState } from 'react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Tag from '../../components/Tag'
import EmptyState from '../../components/EmptyState'
import IconButton from '../../components/IconButton'
import ConfirmModal from '../../components/ConfirmModal'
import {
  DownloadIcon,
  RestoreIcon,
  TrashIcon,
  LogoutIcon,
} from '../../components/icons/Icons'
import {
  formatBackupDate,
  formatBackupStatus,
  formatHost,
} from '../../data/mocks'

const TRIGGER_LABELS = {
  manual: 'manuelle',
  scheduled: 'auto',
  pre_restore: 'avant restauration',
}

function SelectedDatabasesCard({
  database,
  versions,
  onDisconnect,
  onDeleteBackup,
  onDownloadBackup,
  onRestoreBackup,
  onBackup,
  backingUp = false,
}) {
  const [confirm, setConfirm] = useState(null)
  const failedCount = versions.filter((backup) => backup.status === 'failed').length
  const latestSuccessId = versions.find((backup) => backup.status === 'success')?.id

  function closeConfirm() {
    setConfirm(null)
  }

  function handleConfirm() {
    if (confirm?.type === 'disconnect') {
      onDisconnect?.(database.id)
    }

    if (confirm?.type === 'delete-backup') {
      onDeleteBackup?.(confirm.backup.id)
    }

    if (confirm?.type === 'download-backup') {
      onDownloadBackup?.(confirm.backup)
    }

    if (confirm?.type === 'restore-backup') {
      onRestoreBackup?.(confirm.backup)
    }

    closeConfirm()
  }

  const deleteTitle = confirm?.type === 'delete-backup' && database ? (
    <>
      <span className="confirm-modal__danger">Supprimer</span>
      {' '}la version du{' '}
      <strong>{formatBackupDate(confirm.backup.createdAt)}</strong>
      {' '}de la base{' '}
      <strong>{database.name}</strong> ?
    </>
  ) : null

  const downloadTitle = confirm?.type === 'download-backup' && database ? (
    <>
      Télécharger la version du{' '}
      <strong>{formatBackupDate(confirm.backup.createdAt)}</strong>
      {' '}de la base{' '}
      <strong>{database.name}</strong> ?
    </>
  ) : null

  const restoreTitle = confirm?.type === 'restore-backup' && database ? (
    <>
      Restaurer la version du{' '}
      <strong>{formatBackupDate(confirm.backup.createdAt)}</strong>
      {' '}de la base{' '}
      <strong>{database.name}</strong> ?
    </>
  ) : null

  const disconnectTitle = database ? (
    <>
      <span className="confirm-modal__danger">Déconnecter</span>
      {' '}la base <strong>{database.name}</strong> ?
    </>
  ) : null

  return (
    <>
      <Card
        className="card--fill"
        title="Bases sélectionnée"
        action={
          <Button
            variant="primary"
            icon={<DownloadIcon />}
            disabled={!database || backingUp}
            onClick={() => onBackup?.(database.id)}
          >
            {backingUp ? 'Sauvegarde en cours…' : 'Sauvegarder maintenant'}
          </Button>
        }
      >
        {!database ? (
          <EmptyState />
        ) : (
          <div className="selected-db">
            <div className="selected-db__meta">
              <div className="selected-db__identity">
                <strong>{database.name}</strong>
                <Tag type={database.type}>{database.typeLabel}</Tag>
                <span className="selected-db__host">{formatHost(database)}</span>
              </div>
              <IconButton
                label="Déconnecter la base"
                tone="danger"
                className="selected-db__disconnect"
                onClick={() => setConfirm({ type: 'disconnect' })}
              >
                <LogoutIcon />
              </IconButton>
            </div>

            <h3 className="selected-db__subtitle">
              Versions sauvegardées
              {versions.length > 0 ? (
                <span className="selected-db__count">
                  {versions.length} version(s)
                  {failedCount > 0 ? <span className="selected-db__failed"> · {failedCount} en échec</span> : null}
                </span>
              ) : null}
            </h3>

            {versions.length === 0 ? (
              <EmptyState>Aucune sauvegarde pour cette base</EmptyState>
            ) : (
              <div className="table-wrap">
                <table className="data-table data-table--versions">
                  <thead>
                    <tr>
                      <th>Version</th>
                      <th>Date</th>
                      <th>Taille</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versions.map((backup) => {
                      const canTransfer = backup.status === 'success'
                      const isLatest = backup.id === latestSuccessId

                      return (
                        <tr key={backup.id} className={`version-row version-row--${backup.status}`}>
                          <td>
                            <span className="version-row__number">v{backup.version}</span>
                            {isLatest ? <span className="version-row__latest">dernière</span> : null}
                          </td>
                          <td>
                            {formatBackupDate(backup.createdAt)}
                            <span className="version-row__trigger">
                              {TRIGGER_LABELS[backup.triggerType] ?? backup.triggerType}
                            </span>
                          </td>
                          <td>{backup.size}</td>
                          <td>
                            <span className={`backup-status backup-status--${backup.status}`}>
                              {formatBackupStatus(backup.status)}
                            </span>
                            {backup.error ? (
                              <span className="version-row__error" title={backup.error}>
                                {backup.error}
                              </span>
                            ) : null}
                          </td>
                          <td>
                            <div className="action-row">
                              {canTransfer ? (
                                <>
                                  <IconButton
                                    label="Télécharger"
                                    tone="teal"
                                    onClick={() =>
                                      setConfirm({
                                        type: 'download-backup',
                                        backup,
                                      })
                                    }
                                  >
                                    <DownloadIcon />
                                  </IconButton>
                                  <IconButton
                                    label="Restaurer"
                                    tone="teal"
                                    onClick={() =>
                                      setConfirm({
                                        type: 'restore-backup',
                                        backup,
                                      })
                                    }
                                  >
                                    <RestoreIcon />
                                  </IconButton>
                                </>
                              ) : null}
                              <IconButton
                                label="Supprimer"
                                tone="danger"
                                onClick={() =>
                                  setConfirm({ type: 'delete-backup', backup })
                                }
                              >
                                <TrashIcon />
                              </IconButton>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>

      <ConfirmModal
        open={confirm?.type === 'download-backup'}
        title={downloadTitle}
        confirmLabel="Télécharger"
        confirmVariant="primary"
        onCancel={closeConfirm}
        onConfirm={handleConfirm}
      />

      <ConfirmModal
        open={confirm?.type === 'restore-backup'}
        title={restoreTitle}
        description="Les données actuelles de la base seront remplacées par celles de cette version."
        confirmLabel="Restaurer"
        confirmVariant="primary"
        onCancel={closeConfirm}
        onConfirm={handleConfirm}
      />

      <ConfirmModal
        open={confirm?.type === 'delete-backup'}
        title={deleteTitle}
        description={
          <>
            Cette action est irréversible.
            <br />
            Assurez-vous d&apos;avoir téléchargé la version avant de la
            supprimer.
          </>
        }
        confirmLabel="Supprimer"
        onCancel={closeConfirm}
        onConfirm={handleConfirm}
      />

      <ConfirmModal
        open={confirm?.type === 'disconnect'}
        title={disconnectTitle}
        description="Attention, cette action est irréversible."
        confirmLabel="Déconnecter"
        onCancel={closeConfirm}
        onConfirm={handleConfirm}
      />
    </>
  )
}

export default SelectedDatabasesCard

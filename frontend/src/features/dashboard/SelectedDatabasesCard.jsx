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

function SelectedDatabasesCard({
  database,
  versions,
  onDisconnect,
  onDeleteBackup,
  onDownloadBackup,
  onRestoreBackup,
}) {
  const [confirm, setConfirm] = useState(null)

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
          <Button variant="primary" icon={<DownloadIcon />} disabled={!database}>
            Sauvegarder maintenant
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

            <h3 className="selected-db__subtitle">versions sauvegardées</h3>

            <div className="table-wrap">
              <table className="data-table data-table--versions">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Taille</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((backup) => {
                    const canTransfer = backup.status === 'success'

                    return (
                      <tr key={backup.id}>
                        <td>{formatBackupDate(backup.createdAt)}</td>
                        <td>{backup.size}</td>
                        <td>{formatBackupStatus(backup.status)}</td>
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

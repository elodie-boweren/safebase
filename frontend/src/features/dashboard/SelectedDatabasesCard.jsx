import Card from '../../components/Card'
import Button from '../../components/Button'
import Tag from '../../components/Tag'
import EmptyState from '../../components/EmptyState'
import IconButton from '../../components/IconButton'
import {
  DownloadIcon,
  RestoreIcon,
  TrashIcon,
  DisconnectIcon,
} from '../../components/icons/Icons'
import {
  formatBackupDate,
  formatBackupStatus,
  formatHost,
  getBackupsForDatabase,
  getDatabaseById,
} from '../../data/mocks'

function SelectedDatabasesCard({ selectedId, onClear }) {
  const database = selectedId ? getDatabaseById(selectedId) : null
  const versions = database ? getBackupsForDatabase(database.id) : []

  return (
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
            <IconButton label="Désélectionner la base" onClick={onClear}>
              <DisconnectIcon />
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
                {versions.map((backup) => (
                  <tr key={backup.id}>
                    <td>{formatBackupDate(backup.createdAt)}</td>
                    <td>{backup.size}</td>
                    <td>{formatBackupStatus(backup.status)}</td>
                    <td>
                      <div className="action-row">
                        <IconButton label="Télécharger" tone="teal">
                          <DownloadIcon />
                        </IconButton>
                        <IconButton label="Restaurer" tone="teal">
                          <RestoreIcon />
                        </IconButton>
                        <IconButton label="Supprimer" tone="danger">
                          <TrashIcon />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  )
}

export default SelectedDatabasesCard

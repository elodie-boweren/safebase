import Card from '../../components/Card'
import Button from '../../components/Button'
import Tag from '../../components/Tag'
import StatusIcon from '../../components/StatusIcon'
import { PlusIcon } from '../../components/icons/Icons'
import { formatBackupAge } from '../../data/mocks'

function getRow(database, now = new Date()) {
  const { lastBackupAt, lastBackupStatus } = database

  return {
    ...database,
    lastBackup: lastBackupAt ? formatBackupAge(lastBackupAt, now) : '—',
    status: lastBackupStatus === 'success' ? 'ok' : lastBackupStatus ? 'failed' : 'unknown',
  }
}

function ConnectedDatabasesCard({ databases, selectedId, onSelect, onAdd }) {
  const rows = databases.map((db) => getRow(db))

  return (
    <Card
      title="Bases connectées"
      action={
        <Button variant="primary" icon={<PlusIcon />} onClick={onAdd}>
          Ajouter une base
        </Button>
      }
    >
      <div className="table-wrap">
        <table className="data-table data-table--dashboard">
          <thead>
            <tr>
              <th>Nom de la base</th>
              <th>Type de base</th>
              <th>Dernière sauvegarde</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4}>Aucune base connectée pour le moment.</td>
              </tr>
            ) : null}
            {rows.map((db) => {
              const isSelected = selectedId === db.id

              return (
                <tr
                  key={db.id}
                  className={isSelected ? 'is-selected' : undefined}
                  onClick={() => onSelect?.(db.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onSelect?.(db.id)
                    }
                  }}
                  tabIndex={0}
                  aria-selected={isSelected}
                >
                  <td>{db.name}</td>
                  <td>
                    <Tag type={db.type}>{db.typeLabel}</Tag>
                  </td>
                  <td>{db.lastBackup}</td>
                  <td>
                    {db.status === 'unknown' ? '—' : <StatusIcon status={db.status} />}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export default ConnectedDatabasesCard

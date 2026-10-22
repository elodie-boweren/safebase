import { useState } from 'react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Tag from '../../components/Tag'
import StatusIcon from '../../components/StatusIcon'
import { ChevronIcon, PlusIcon } from '../../components/icons/Icons'
import { formatBackupAge } from '../../data/mocks'

function getRow(database, now = new Date()) {
  const { lastBackupAt, lastBackupStatus } = database

  return {
    ...database,
    lastBackup: lastBackupAt ? formatBackupAge(lastBackupAt, now) : '—',
    status: lastBackupStatus === 'success' ? 'ok' : lastBackupStatus ? 'failed' : 'unknown',
  }
}

const OPEN_KEY = 'safebase_databases_open'

function loadOpen() {
  try {
    return localStorage.getItem(OPEN_KEY) !== 'false'
  } catch {
    return true
  }
}

function ConnectedDatabasesCard({ databases, selectedId, onSelect, onAdd }) {
  const rows = databases.map((db) => getRow(db))
  const [open, setOpen] = useState(loadOpen)
  const selectedName = databases.find((db) => db.id === selectedId)?.name

  function toggle() {
    setOpen((prev) => {
      try {
        localStorage.setItem(OPEN_KEY, String(!prev))
      } catch {
        // storage unavailable: the choice only lasts until reload
      }
      return !prev
    })
  }

  return (
    <Card
      className={open ? 'card--collapsible' : 'card--collapsible card--collapsed'}
      title={
        <button
          type="button"
          className="card__toggle"
          aria-expanded={open}
          aria-controls="connected-databases"
          onClick={toggle}
        >
          <span className="card__toggle-icon">
            <ChevronIcon />
          </span>
          Bases connectées
          <span className="card__toggle-count">({databases.length})</span>
        </button>
      }
      badge={
        !open && selectedName ? (
          <span className="card__toggle-selected">
            Sélection : <strong>{selectedName}</strong>
          </span>
        ) : null
      }
      action={
        <Button variant="primary" icon={<PlusIcon />} onClick={onAdd}>
          Ajouter une base
        </Button>
      }
    >
      {open ? (
        <div className="table-wrap" id="connected-databases">
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
      ) : null}
    </Card>
  )
}

export default ConnectedDatabasesCard

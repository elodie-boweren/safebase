import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ConnectedDatabasesCard from '../features/dashboard/ConnectedDatabasesCard'
import SelectedDatabasesCard from '../features/dashboard/SelectedDatabasesCard'
import BackupSummaryCard from '../features/dashboard/BackupSummaryCard'
import AddDatabaseModal from '../features/databases/AddDatabaseModal'
import ConfirmModal from '../components/ConfirmModal'
import {
  createBackup,
  deleteBackup,
  deleteDatabase,
  downloadBackup,
  getBackups,
  getDatabases,
  logout,
  restoreBackup,
  updateSchedule,
} from '../services/api'
import { defaultSchedule } from '../data/mocks'
import { useAlerts } from '../features/alerts/alertsContext'

const TYPE_LABELS = {
  mysql: 'MySQL',
  postgres: 'Postgres',
  mongodb: 'MongoDB',
}

// API row -> shape used by the dashboard components
function toDatabase(row) {
  return {
    id: row.database_id,
    name: row.name,
    type: row.type,
    typeLabel: TYPE_LABELS[row.type] ?? row.type,
    host: row.host,
    port: row.port,
    databaseName: row.database_name,
    lastBackupAt: row.last_backup_at ?? null,
    lastBackupStatus: row.last_backup_status ?? null,
    // form values of the saved schedule (API cron -> fields)
    schedule: { ...defaultSchedule, ...row.schedule, enabled: Boolean(row.is_schedule_enabled) },
  }
}

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`
}

function toBackup(row) {
  return {
    id: row.backup_id,
    version: row.version,
    databaseId: row.database_id,
    createdAt: row.created_at,
    size: formatSize(Number(row.size)),
    status: row.status,
    filename: row.filename,
    triggerType: row.trigger_type,
    error: row.error_message ?? null,
  }
}

function DashboardPage() {
  const navigate = useNavigate()
  const { refresh: refreshAlerts } = useAlerts()
  const [databases, setDatabases] = useState([])
  const [backups, setBackups] = useState([])
  const [backingUp, setBackingUp] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [forceDelete, setForceDelete] = useState(null)

  const handleApiError = useCallback(
    (err) => {
      if (err.status === 401 || err.status === 403) {
        logout()
        navigate('/')
        return
      }
      setError(err.message)
    },
    [navigate],
  )

  useEffect(() => {
    getDatabases()
      .then((rows) => {
        const loaded = rows.map(toDatabase)
        setDatabases(loaded)
        setSelectedId(loaded[0]?.id ?? null)
      })
      .catch(handleApiError)
  }, [handleApiError])

  // backups of the selected database
  useEffect(() => {
    if (selectedId === null) return
    getBackups(selectedId)
      .then((rows) => setBackups(rows.map(toBackup)))
      .catch(handleApiError)
  }, [selectedId, handleApiError])

  async function handleSaveSchedule(databaseId, schedule) {
    setError('')
    setNotice('')
    try {
      const saved = await updateSchedule(databaseId, schedule)
      refreshAlerts()
      const savedSchedule = { ...defaultSchedule, ...saved.schedule, enabled: saved.is_schedule_enabled }
      setDatabases((prev) =>
        prev.map((db) => (db.id === databaseId ? { ...db, schedule: savedSchedule } : db)),
      )
    } catch (err) {
      handleApiError(err)
    }
  }

  async function handleBackup(databaseId) {
    setError('')
    setNotice('')
    setBackingUp(true)
    try {
      await createBackup(databaseId)
    } catch (err) {
      handleApiError(err)
    } finally {
      setBackingUp(false)
    }

    // refresh the versions, the "last backup" column and the alerts, whatever the result
    refreshAlerts()
    try {
      const [backupRows, databaseRows] = await Promise.all([getBackups(databaseId), getDatabases()])
      setDatabases(databaseRows.map(toDatabase))
      if (databaseId === selectedId) setBackups(backupRows.map(toBackup))
    } catch (err) {
      handleApiError(err)
    }
  }

  const selectedDatabase = useMemo(
    () => databases.find((db) => db.id === selectedId) ?? null,
    [databases, selectedId],
  )

  const selectedVersions = useMemo(
    () =>
      backups
        .filter((backup) => backup.databaseId === selectedId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [backups, selectedId],
  )

  function handleCreated(row) {
    refreshAlerts()
    const database = toDatabase(row)
    setDatabases((prev) => [...prev, database])
    setSelectedId(database.id)
    setAddOpen(false)
  }

  function removeDatabase(databaseId) {
    setDatabases((prev) => prev.filter((db) => db.id !== databaseId))
    setBackups((prev) => prev.filter((backup) => backup.databaseId !== databaseId))
    setSelectedId((current) => (current === databaseId ? null : current))
  }

  async function handleDisconnect(databaseId, { force = false } = {}) {
    setError('')
    try {
      await deleteDatabase(databaseId, { force })
      removeDatabase(databaseId)
      refreshAlerts()
    } catch (err) {
      // the database has backups: ask for a second confirmation
      if (err.status === 409) {
        setForceDelete({ databaseId, backupsCount: err.data?.backups_count ?? 0 })
        return
      }
      handleApiError(err)
    }
  }

  async function handleForceDelete() {
    const { databaseId } = forceDelete
    setForceDelete(null)
    await handleDisconnect(databaseId, { force: true })
  }

  async function handleDeleteBackup(backupId) {
    setError('')
    setNotice('')
    try {
      await deleteBackup(backupId)
      setBackups((prev) => prev.filter((backup) => backup.id !== backupId))
      refreshAlerts()
      // the "last backup" column may change
      const rows = await getDatabases()
      setDatabases(rows.map(toDatabase))
    } catch (err) {
      handleApiError(err)
    }
  }

  async function handleDownloadBackup(backup) {
    setError('')
    try {
      await downloadBackup(backup)
      refreshAlerts()
    } catch (err) {
      handleApiError(err)
    }
  }

  async function handleRestoreBackup(backup) {
    setError('')
    setNotice(`Sauvegarde de sécurité puis restauration de la version v${backup.version} en cours…`)
    try {
      await restoreBackup(backup.id)
      setNotice(
        `La version v${backup.version} a été restaurée. Les données d'avant sont gardées dans une nouvelle version « avant restauration ».`,
      )
    } catch (err) {
      setNotice('')
      handleApiError(err)
    }

    // the safety backup appears as a new version, a failure as an alert
    refreshAlerts()
    try {
      const [backupRows, databaseRows] = await Promise.all([getBackups(backup.databaseId), getDatabases()])
      setDatabases(databaseRows.map(toDatabase))
      if (backup.databaseId === selectedId) setBackups(backupRows.map(toBackup))
    } catch (err) {
      handleApiError(err)
    }
  }

  const forceDeleteName = databases.find((db) => db.id === forceDelete?.databaseId)?.name

  return (
    <div className="dashboard">
      {error ? <p className="dashboard__error" role="alert">{error}</p> : null}
      {notice ? <p className="dashboard__notice" role="status">{notice}</p> : null}
      <ConnectedDatabasesCard
        databases={databases}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAdd={() => setAddOpen(true)}
      />
      <div className="dashboard__bottom">
        <SelectedDatabasesCard
          database={selectedDatabase}
          versions={selectedVersions}
          onDisconnect={handleDisconnect}
          onDeleteBackup={handleDeleteBackup}
          onDownloadBackup={handleDownloadBackup}
          onRestoreBackup={handleRestoreBackup}
          onBackup={handleBackup}
          backingUp={backingUp}
        />
        <aside className="dashboard__side">
          <BackupSummaryCard
            key={selectedId ?? 'none'}
            database={selectedDatabase}
            savedSchedule={selectedDatabase?.schedule}
            onSave={(schedule) => handleSaveSchedule(selectedId, schedule)}
          />
        </aside>
      </div>

      {addOpen ? (
        <AddDatabaseModal onCancel={() => setAddOpen(false)} onCreated={handleCreated} />
      ) : null}

      <ConfirmModal
        open={forceDelete !== null}
        title={
          <>
            La base <strong>{forceDeleteName}</strong> a{' '}
            {forceDelete?.backupsCount} sauvegarde(s)
          </>
        }
        description="Les sauvegardes seront supprimées avec la base. Cette action est irréversible."
        confirmLabel="Tout supprimer"
        onCancel={() => setForceDelete(null)}
        onConfirm={handleForceDelete}
      />
    </div>
  )
}

export default DashboardPage

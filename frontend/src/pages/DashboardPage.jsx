import { useMemo, useState } from 'react'
import ConnectedDatabasesCard from '../features/dashboard/ConnectedDatabasesCard'
import SelectedDatabasesCard from '../features/dashboard/SelectedDatabasesCard'
import BackupSummaryCard from '../features/dashboard/BackupSummaryCard'
import AlertsCard from '../features/dashboard/AlertsCard'
import {
  backups as initialBackups,
  connectedDatabases as initialDatabases,
} from '../data/mocks'

function DashboardPage() {
  const [databases, setDatabases] = useState(initialDatabases)
  const [backups, setBackups] = useState(initialBackups)
  const [selectedId, setSelectedId] = useState(initialDatabases[0]?.id ?? null)

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

  function handleDisconnect(databaseId) {
    setDatabases((prev) => prev.filter((db) => db.id !== databaseId))
    setBackups((prev) => prev.filter((backup) => backup.databaseId !== databaseId))
    setSelectedId((current) => (current === databaseId ? null : current))
  }

  function handleDeleteBackup(backupId) {
    setBackups((prev) => prev.filter((backup) => backup.id !== backupId))
  }

  function handleDownloadBackup(backup) {
    // Static UI: no real file download yet
    window.alert(`Téléchargement simulé de la version #${backup.id}`)
  }

  return (
    <div className="dashboard">
      <ConnectedDatabasesCard
        databases={databases}
        backups={backups}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <div className="dashboard__bottom">
        <SelectedDatabasesCard
          database={selectedDatabase}
          versions={selectedVersions}
          onDisconnect={handleDisconnect}
          onDeleteBackup={handleDeleteBackup}
          onDownloadBackup={handleDownloadBackup}
        />
        <aside className="dashboard__side">
          <BackupSummaryCard />
          <AlertsCard />
        </aside>
      </div>
    </div>
  )
}

export default DashboardPage

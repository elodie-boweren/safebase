import { useState } from 'react'
import ConnectedDatabasesCard from '../features/dashboard/ConnectedDatabasesCard'
import SelectedDatabasesCard from '../features/dashboard/SelectedDatabasesCard'
import BackupSummaryCard from '../features/dashboard/BackupSummaryCard'
import AlertsCard from '../features/dashboard/AlertsCard'

function DashboardPage() {
  const [selectedId, setSelectedId] = useState(1)

  return (
    <div className="dashboard">
      <ConnectedDatabasesCard
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <div className="dashboard__bottom">
        <SelectedDatabasesCard
          selectedId={selectedId}
          onClear={() => setSelectedId(null)}
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

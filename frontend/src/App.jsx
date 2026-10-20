import { Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import HomePage from './pages/HomePage'
import DatabasesPage from './pages/DatabasesPage'
import BackupsPage from './pages/BackupsPage'
import SchedulesPage from './pages/SchedulesPage'
import RestoresPage from './pages/RestoresPage'
import AlertsPage from './pages/AlertsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="databases" element={<DatabasesPage />} />
        <Route path="backups" element={<BackupsPage />} />
        <Route path="schedules" element={<SchedulesPage />} />
        <Route path="restores" element={<RestoresPage />} />
        <Route path="alerts" element={<AlertsPage />} />
      </Route>
    </Routes>
  )
}

export default App

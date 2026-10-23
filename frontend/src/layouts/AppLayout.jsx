import { Navigate, Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import AlertsProvider from '../features/alerts/AlertsProvider'
import { getToken } from '../services/api'

function AppLayout() {
  if (!getToken()) {
    return <Navigate to="/" replace />
  }

  return (
    <AlertsProvider>
      <div className="app-shell">
        <Navbar />
        <main className="app-shell__main">
          <Outlet />
        </main>
      </div>
    </AlertsProvider>
  )
}

export default AppLayout

import { Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage mode="login" />} />
      <Route path="/inscription" element={<AuthPage mode="signup" />} />
      <Route element={<AppLayout />}>
        <Route path="dashboard" element={<DashboardPage />} />
      </Route>
    </Routes>
  )
}

export default App

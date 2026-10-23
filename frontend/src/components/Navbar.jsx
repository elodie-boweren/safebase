import { Link, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import Button from './Button'
import { LogoutIcon } from './icons/Icons'
import { logout } from '../services/api'
import AlertsDropdown from '../features/alerts/AlertsDropdown'

function Navbar() {
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="navbar">
      <Link to="/dashboard" className="navbar__brand" aria-label="SafeBase dashboard">
        <Logo />
      </Link>
      <div className="navbar__actions">
        <AlertsDropdown />
        <Button variant="primary" icon={<LogoutIcon />} iconPosition="end" onClick={handleLogout}>
          Déconnexion
        </Button>
      </div>
    </header>
  )
}

export default Navbar

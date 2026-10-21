import { Link, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import Button from './Button'
import { LogoutIcon } from './icons/Icons'

function Navbar() {
  const navigate = useNavigate()

  function handleLogout() {
    navigate('/')
  }

  return (
    <header className="navbar">
      <Link to="/dashboard" className="navbar__brand" aria-label="SafeBase dashboard">
        <Logo />
      </Link>
      <Button variant="primary" icon={<LogoutIcon />} iconPosition="end" onClick={handleLogout}>
        Déconnexion
      </Button>
    </header>
  )
}

export default Navbar

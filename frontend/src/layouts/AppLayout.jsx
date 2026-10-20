import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/databases', label: 'Databases' },
  { to: '/backups', label: 'Backups' },
  { to: '/schedules', label: 'Schedules' },
  { to: '/restores', label: 'Restores' },
  { to: '/alerts', label: 'Alerts' },
]

function AppLayout() {
  return (
    <div className="app-layout">
      <header className="app-header">
        <h1 className="app-brand">SafeBase</h1>
        <nav className="app-nav" aria-label="Main">
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive ? 'nav-link nav-link--active' : 'nav-link'
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout

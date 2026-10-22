import { useEffect, useRef, useState } from 'react'
import { BellIcon, CrossIcon } from '../../components/icons/Icons'
import { useAlerts } from './alertsContext'

const TYPE_LABELS = {
  backup_failed: 'Sauvegarde',
  restore_failed: 'Restauration',
}

function AlertsDropdown() {
  const { alerts, unreadCount, markAsRead, markAllAsRead } = useAlerts()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    function handleClickOutside(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="alerts-dropdown" ref={rootRef}>
      <button
        type="button"
        className="alerts-dropdown__toggle"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={unreadCount > 0 ? `Alertes, ${unreadCount} non lue(s)` : 'Alertes'}
        onClick={() => setOpen((prev) => !prev)}
      >
        <BellIcon />
        {unreadCount > 0 ? <span className="alerts-dropdown__bubble">{unreadCount}</span> : null}
      </button>

      {open ? (
        <div className="alerts-dropdown__panel" role="dialog" aria-label="Alertes">
          <header className="alerts-dropdown__header">
            <strong>Alertes</strong>
            <button
              type="button"
              className="alerts-dropdown__link"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Tout marquer comme lu
            </button>
          </header>

          {alerts.length === 0 ? (
            <p className="empty-state">Aucune alerte</p>
          ) : (
            <ul className="alert-feed">
              {alerts.map((alert) => (
                <li
                  key={alert.id}
                  className={`alert-feed__item${alert.isRead ? ' alert-feed__item--read' : ''}`}
                >
                  <span className="alert-feed__icon" aria-hidden="true">
                    <CrossIcon />
                  </span>
                  <div className="alert-feed__content">
                    <p className="alert-feed__message">{alert.message}</p>
                    {alert.details ? <p className="alert-feed__details">{alert.details}</p> : null}
                    <time className="alert-feed__time">
                      {TYPE_LABELS[alert.type] ?? alert.type} · {alert.createdAt}
                    </time>
                    {!alert.isRead ? (
                      <button
                        type="button"
                        className="alerts-dropdown__link"
                        onClick={() => markAsRead(alert.id)}
                      >
                        Marquer comme lue
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default AlertsDropdown

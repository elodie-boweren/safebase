import { useEffect, useRef, useState } from 'react'
import { BellIcon } from '../../components/icons/Icons'
import { useAlerts } from './alertsContext'
import AlertItem from './AlertItem'
import NotificationsModal from './NotificationsModal'

// the dropdown shows the latest ones, the modal shows everything
const DROPDOWN_LIMIT = 8

function AlertsDropdown() {
  const { alerts, unreadCount, unreadAlertCount, unreadInfoCount, markAsRead, markAllAsRead } = useAlerts()
  const [open, setOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
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

  function openAll() {
    setOpen(false)
    setShowAll(true)
  }

  return (
    <>
      <div className="alerts-dropdown" ref={rootRef}>
        <button
          type="button"
          className="alerts-dropdown__toggle"
          aria-expanded={open}
          aria-haspopup="true"
          aria-label={
            unreadCount > 0
              ? `Notifications : ${unreadAlertCount} alerte(s) et ${unreadInfoCount} autre(s) non lue(s)`
              : 'Notifications'
          }
          onClick={() => setOpen((prev) => !prev)}
        >
          <BellIcon />
          {unreadAlertCount > 0 ? <span className="alerts-dropdown__bubble">{unreadAlertCount}</span> : null}
          {unreadInfoCount > 0 ? (
            <span className="alerts-dropdown__bubble alerts-dropdown__bubble--info">{unreadInfoCount}</span>
          ) : null}
        </button>

        {open ? (
          <div className="alerts-dropdown__panel" role="dialog" aria-label="Notifications">
            <header className="alerts-dropdown__header">
              <strong>Notifications</strong>
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
              <p className="empty-state">Aucune notification</p>
            ) : (
              <ul className="alert-feed">
                {alerts.slice(0, DROPDOWN_LIMIT).map((alert) => (
                  <AlertItem key={alert.id} alert={alert} onMarkAsRead={markAsRead} />
                ))}
              </ul>
            )}

            <button type="button" className="alerts-dropdown__all" onClick={openAll}>
              Voir toutes les notifications
              {unreadCount > 0 ? ` (${unreadCount} non lue${unreadCount > 1 ? 's' : ''})` : ''}
            </button>
          </div>
        ) : null}
      </div>

      {showAll ? <NotificationsModal onClose={() => setShowAll(false)} /> : null}
    </>
  )
}

export default AlertsDropdown

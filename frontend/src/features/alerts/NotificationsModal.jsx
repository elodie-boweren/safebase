import { useEffect, useState } from 'react'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import AlertItem from './AlertItem'
import { useAlerts } from './alertsContext'
import { NOTIFICATION_FILTERS, matchesFilter } from './notificationTypes'

// Full history, filtered by type, with the red alerts on their own filter
function NotificationsModal({ onClose }) {
  const { alerts, unreadCount, markAsRead, markAllAsRead } = useAlerts()
  const [filter, setFilter] = useState('all')
  const [unreadOnly, setUnreadOnly] = useState(false)

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const visible = alerts.filter(
    (alert) => matchesFilter(alert, filter) && (!unreadOnly || !alert.isRead),
  )

  return (
    <div className="confirm-modal" role="presentation">
      <button type="button" className="confirm-modal__backdrop" aria-label="Fermer" onClick={onClose} />
      <div
        className="confirm-modal__dialog notifications-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-title"
      >
        <header className="notifications-modal__header">
          <h2 id="notifications-title" className="notifications-modal__title">
            Notifications
            {unreadCount > 0 ? <span className="notifications-modal__unread">{unreadCount} non lue(s)</span> : null}
          </h2>
          <button type="button" className="notifications-modal__close" aria-label="Fermer" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="notifications-modal__filters" role="group" aria-label="Filtrer par type">
          {NOTIFICATION_FILTERS.map((option) => {
            // only the unread ones are counted
            const count = alerts.filter((alert) => !alert.isRead && matchesFilter(alert, option.value)).length
            const classes = [
              'notifications-modal__filter',
              option.value === 'alerts' ? 'notifications-modal__filter--alerts' : '',
              filter === option.value ? 'is-active' : '',
            ].join(' ')

            return (
              <button
                key={option.value}
                type="button"
                className={classes}
                aria-pressed={filter === option.value}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
                {count > 0 ? <span className="notifications-modal__count"> {count}</span> : null}
              </button>
            )
          })}
        </div>

        <div className="notifications-modal__toolbar">
          <label className="schedule-form__toggle">
            <input type="checkbox" checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} />
            <span>Non lues seulement</span>
          </label>
          <button
            type="button"
            className="alerts-dropdown__link"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Tout marquer comme lu
          </button>
        </div>

        <div className="notifications-modal__list">
          {visible.length === 0 ? (
            <EmptyState>Aucune notification</EmptyState>
          ) : (
            <ul className="alert-feed">
              {visible.map((alert) => (
                <AlertItem key={alert.id} alert={alert} onMarkAsRead={markAsRead} />
              ))}
            </ul>
          )}
        </div>

        <div className="confirm-modal__actions notifications-modal__actions">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NotificationsModal

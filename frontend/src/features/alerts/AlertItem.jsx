import { CheckIcon, CrossIcon, InfoIcon } from '../../components/icons/Icons'
import { formatBackupDate } from '../../data/mocks'
import { NOTIFICATION_TYPES } from './notificationTypes'

const LEVEL_ICONS = {
  error: <CrossIcon />,
  success: <CheckIcon />,
  info: <InfoIcon />,
}

// One notification: red for failures, green for successes, neutral for other actions
function AlertItem({ alert, onMarkAsRead }) {
  const classes = [
    'alert-feed__item',
    `alert-feed__item--${alert.level}`,
    alert.isRead ? 'alert-feed__item--read' : 'alert-feed__item--unread',
  ].join(' ')

  return (
    <li className={classes}>
      <span className="alert-feed__icon" aria-hidden="true">
        {LEVEL_ICONS[alert.level] ?? <InfoIcon />}
      </span>
      <div className="alert-feed__content">
        <p className="alert-feed__message">{alert.message}</p>
        {alert.details ? <p className="alert-feed__details">{alert.details}</p> : null}
        <time className="alert-feed__time" dateTime={alert.createdAt}>
          {NOTIFICATION_TYPES[alert.type]?.label ?? alert.type}
          {alert.databaseName ? ` · ${alert.databaseName}` : ''} · {formatBackupDate(alert.createdAt)}
        </time>
        {!alert.isRead ? (
          <button type="button" className="alerts-dropdown__link" onClick={() => onMarkAsRead(alert.id)}>
            Marquer comme lue
          </button>
        ) : null}
      </div>
    </li>
  )
}

export default AlertItem

import Card from '../../components/Card'
import Badge from '../../components/Badge'
import { CrossIcon } from '../../components/icons/Icons'
import { alerts } from '../../data/mocks'

function AlertsCard() {
  return (
    <Card
      title="Alertes"
      badge={<Badge>{alerts.length}</Badge>}
      className="card--compact"
    >
      <ul className="alert-feed">
        {alerts.map((alert) => (
          <li key={alert.id} className="alert-feed__item">
            <span className="alert-feed__icon" aria-hidden="true">
              <CrossIcon />
            </span>
            <div className="alert-feed__content">
              <p className="alert-feed__message">{alert.message}</p>
              <time className="alert-feed__time">{alert.createdAt}</time>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default AlertsCard

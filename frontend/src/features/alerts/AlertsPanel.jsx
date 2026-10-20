import { alerts } from '../../data/mocks'

function AlertsPanel() {
  return (
    <section>
      <p>View alerts and errors from backup or restore operations.</p>
      <ul className="alert-list">
        {alerts.map((alert) => (
          <li key={alert.id} className={`alert-item alert-item--${alert.severity}`}>
            <div className="alert-item__meta">
              <span className={`badge badge--${alert.severity}`}>{alert.severity}</span>
              <span className="alert-item__type">{alert.type}</span>
              <time dateTime={alert.createdAt}>
                {new Date(alert.createdAt).toLocaleString()}
              </time>
            </div>
            <p className="alert-item__message">{alert.message}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default AlertsPanel

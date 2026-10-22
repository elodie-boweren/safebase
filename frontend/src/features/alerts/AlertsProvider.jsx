import { useMemo, useState } from 'react'
import { alerts as mockAlerts } from '../../data/mocks'
import { AlertsContext } from './alertsContext'

// No alerts API yet: alerts come from the mocks and the read state
// is kept in the browser so the badge stays cleared after a reload
const READ_KEY = 'safebase_read_alerts'

function loadReadIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY)) ?? [])
  } catch {
    return new Set()
  }
}

function saveReadIds(ids) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...ids]))
  } catch {
    // storage unavailable: read state only lasts until reload
  }
}

function AlertsProvider({ children }) {
  const [readIds, setReadIds] = useState(loadReadIds)

  const value = useMemo(() => {
    const alerts = mockAlerts.map((alert) => ({
      ...alert,
      isRead: alert.isRead || readIds.has(alert.id),
    }))

    function markRead(ids) {
      setReadIds((prev) => {
        const next = new Set(prev)
        ids.forEach((id) => next.add(id))
        saveReadIds(next)
        return next
      })
    }

    return {
      alerts,
      unreadCount: alerts.filter((alert) => !alert.isRead).length,
      markAsRead: (id) => markRead([id]),
      markAllAsRead: () => markRead(alerts.map((alert) => alert.id)),
    }
  }, [readIds])

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
}

export default AlertsProvider

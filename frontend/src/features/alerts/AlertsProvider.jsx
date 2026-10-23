import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertsContext } from './alertsContext'
import { getAlerts, markAlertRead, markAllAlertsRead } from '../../services/api'

// alerts can come from scheduled backups too: refresh regularly
const REFRESH_MS = 30000

// API row -> shape used by the alerts dropdown
function toAlert(row) {
  return {
    id: row.alert_id,
    type: row.type,
    level: row.level,
    message: row.message,
    details: row.details,
    isRead: row.is_read,
    createdAt: row.created_at,
    databaseName: row.database_name,
    backupFilename: row.backup_filename,
  }
}

function AlertsProvider({ children }) {
  const [alerts, setAlerts] = useState([])

  const refresh = useCallback(async () => {
    try {
      const rows = await getAlerts()
      setAlerts(rows.map(toAlert))
    } catch {
      // the dashboard shows API errors; the badge just keeps its last value
    }
  }, [])

  useEffect(() => {
    getAlerts()
      .then((rows) => setAlerts(rows.map(toAlert)))
      .catch(() => {})
    const timer = setInterval(refresh, REFRESH_MS)
    return () => clearInterval(timer)
  }, [refresh])

  const value = useMemo(() => {
    async function markAsRead(id) {
      setAlerts((prev) => prev.map((alert) => (alert.id === id ? { ...alert, isRead: true } : alert)))
      await markAlertRead(id).catch(refresh)
    }

    async function markAllAsRead() {
      setAlerts((prev) => prev.map((alert) => ({ ...alert, isRead: true })))
      await markAllAlertsRead().catch(refresh)
    }

    const unread = alerts.filter((alert) => !alert.isRead)

    return {
      alerts,
      unreadCount: unread.length,
      // red bubble: unread failures, blue bubble: the other unread notifications
      unreadAlertCount: unread.filter((alert) => alert.level === 'error').length,
      unreadInfoCount: unread.filter((alert) => alert.level !== 'error').length,
      markAsRead,
      markAllAsRead,
      refresh,
    }
  }, [alerts, refresh])

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>
}

export default AlertsProvider

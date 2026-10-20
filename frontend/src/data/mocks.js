/** Static demo data for UI work (no backend required). */

export const databases = [
  {
    id: 1,
    name: 'Demo MySQL',
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    status: 'connected',
  },
  {
    id: 2,
    name: 'Demo PostgreSQL',
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    status: 'connected',
  },
  {
    id: 3,
    name: 'Demo MongoDB',
    type: 'mongodb',
    host: 'localhost',
    port: 27017,
    status: 'disconnected',
  },
]

export const backups = [
  {
    id: 1,
    databaseId: 1,
    databaseName: 'Demo MySQL',
    createdAt: '2026-10-18T09:00:00Z',
    size: '42 MB',
    status: 'success',
  },
  {
    id: 2,
    databaseId: 2,
    databaseName: 'Demo PostgreSQL',
    createdAt: '2026-10-19T14:30:00Z',
    size: '128 MB',
    status: 'success',
  },
  {
    id: 3,
    databaseId: 1,
    databaseName: 'Demo MySQL',
    createdAt: '2026-10-20T08:15:00Z',
    size: '—',
    status: 'failed',
  },
]

export const schedules = [
  {
    id: 1,
    databaseId: 1,
    databaseName: 'Demo MySQL',
    cron: '0 2 * * *',
    label: 'Daily at 02:00',
    enabled: true,
  },
  {
    id: 2,
    databaseId: 2,
    databaseName: 'Demo PostgreSQL',
    cron: '0 3 * * 0',
    label: 'Weekly on Sunday at 03:00',
    enabled: true,
  },
  {
    id: 3,
    databaseId: 3,
    databaseName: 'Demo MongoDB',
    cron: '0 */6 * * *',
    label: 'Every 6 hours',
    enabled: false,
  },
]

export const restores = [
  {
    id: 1,
    backupId: 1,
    databaseName: 'Demo MySQL',
    startedAt: '2026-10-18T10:00:00Z',
    status: 'success',
  },
  {
    id: 2,
    backupId: 2,
    databaseName: 'Demo PostgreSQL',
    startedAt: '2026-10-19T16:00:00Z',
    status: 'failed',
  },
]

export const alerts = [
  {
    id: 1,
    type: 'backup',
    message: 'Backup failed for Demo MySQL',
    createdAt: '2026-10-20T08:16:00Z',
    severity: 'error',
  },
  {
    id: 2,
    type: 'restore',
    message: 'Restore failed for Demo PostgreSQL',
    createdAt: '2026-10-19T16:05:00Z',
    severity: 'error',
  },
  {
    id: 3,
    type: 'connection',
    message: 'Demo MongoDB is disconnected',
    createdAt: '2026-10-20T07:00:00Z',
    severity: 'warning',
  },
]

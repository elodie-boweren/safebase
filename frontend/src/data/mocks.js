/**
 * Static mock data for SafeBase frontend (no backend yet).
 *
 * - mockUser            → login / inscription demo
 * - connectedDatabases  → bases affichées sur le dashboard
 * - backups             → historiques liés à chaque base (date, taille, statut)
 * - scheduleOptions     → planification de sauvegarde
 */

export const mockUser = {
  id: 1,
  name: 'Emmanuelle',
  email: 'emma@safebase.dev',
  password: 'safebase123',
}

export const connectedDatabases = [
  {
    id: 1,
    name: 'prod_clients',
    type: 'mysql',
    typeLabel: 'MySQL',
    host: 'localhost',
    port: 3306,
  },
  {
    id: 2,
    name: 'dataPro',
    type: 'postgres',
    typeLabel: 'Postgres',
    host: 'localhost',
    port: 5432,
  },
  {
    id: 3,
    name: 'prod-test',
    type: 'mongodb',
    typeLabel: 'MongoDB',
    host: 'localhost',
    port: 27017,
  },
]

/**
 * Backups des bases connectées.
 * status: "success" | "failed" | "running"
 */
export const backups = [
  // prod_clients (MySQL)
  {
    id: 1,
    databaseId: 1,
    createdAt: '2026-09-16T14:08:00Z',
    size: '2,4 Mo',
    status: 'success',
  },
  {
    id: 2,
    databaseId: 1,
    createdAt: '2026-09-15T14:08:00Z',
    size: '2,4 Mo',
    status: 'success',
  },
  {
    id: 3,
    databaseId: 1,
    createdAt: '2026-09-14T14:08:00Z',
    size: '2,3 Mo',
    status: 'success',
  },
  {
    id: 4,
    databaseId: 1,
    createdAt: '2026-09-13T14:08:00Z',
    size: '2,2 Mo',
    status: 'success',
  },
  {
    id: 5,
    databaseId: 1,
    createdAt: '2026-10-20T10:00:00Z',
    size: '2,5 Mo',
    status: 'success',
  },

  // dataPro (Postgres)
  {
    id: 6,
    databaseId: 2,
    createdAt: '2026-10-19T15:00:00Z',
    size: '128 Mo',
    status: 'success',
  },
  {
    id: 7,
    databaseId: 2,
    createdAt: '2026-10-18T15:00:00Z',
    size: '126 Mo',
    status: 'success',
  },

  // prod-test (MongoDB)
  {
    id: 8,
    databaseId: 3,
    createdAt: '2026-10-18T08:30:00Z',
    size: '—',
    status: 'failed',
  },
  {
    id: 9,
    databaseId: 3,
    createdAt: '2026-10-16T08:30:00Z',
    size: '85 Mo',
    status: 'success',
  },
]

export const scheduleFrequencies = [
  { value: 'none', label: 'Aucune' },
  { value: 'daily', label: 'Tous les jours' },
  { value: 'weekly', label: 'Toutes les semaines' },
  { value: 'monthly', label: 'Tous les mois' },
]

export const scheduleWeekdays = [
  { value: '1', label: 'Lundi' },
  { value: '2', label: 'Mardi' },
  { value: '3', label: 'Mercredi' },
  { value: '4', label: 'Jeudi' },
  { value: '5', label: 'Vendredi' },
  { value: '6', label: 'Samedi' },
  { value: '0', label: 'Dimanche' },
]

export const scheduleMonthDays = Array.from({ length: 28 }, (_, index) => {
  const day = index + 1
  return {
    value: String(day),
    label: `${day}`,
  }
})

export const scheduleHours = Array.from({ length: 24 }, (_, hour) => ({
  value: String(hour),
  label: `${String(hour).padStart(2, '0')}h`,
}))

export const scheduleMinutes = ['00', '15', '30', '45'].map((minute) => ({
  value: minute,
  label: minute,
}))

export const defaultSchedule = {
  frequency: 'daily',
  weekday: '1',
  monthDay: '1',
  hour: '14',
  minute: '00',
}

export function formatScheduleSummary(schedule) {
  const hourLabel = `${String(schedule.hour).padStart(2, '0')}h${schedule.minute}`

  if (schedule.frequency === 'none') {
    return 'Aucune sauvegarde planifiée'
  }

  if (schedule.frequency === 'daily') {
    return `Tous les jours à ${hourLabel}`
  }

  if (schedule.frequency === 'weekly') {
    const weekday =
      scheduleWeekdays.find((day) => day.value === schedule.weekday)?.label ??
      'Lundi'
    return `Chaque ${weekday.toLowerCase()} à ${hourLabel}`
  }

  if (schedule.frequency === 'monthly') {
    return `Le ${schedule.monthDay} de chaque mois à ${hourLabel}`
  }

  return ''
}

export const alerts = [
  {
    id: 1,
    databaseId: 3,
    backupId: 8,
    message: 'Echec sauvegarde - admin-pro',
    createdAt: '15/09 14:02',
    severity: 'error',
  },
]

/** Alias utilisé par le dashboard. */
export const databases = connectedDatabases

export function authenticateUser(email, password) {
  const emailOk = email.trim().toLowerCase() === mockUser.email.toLowerCase()
  const passwordOk = password === mockUser.password

  if (!emailOk || !passwordOk) {
    return null
  }

  return {
    id: mockUser.id,
    name: mockUser.name,
    email: mockUser.email,
  }
}

export function getDatabaseById(databaseId) {
  return connectedDatabases.find((db) => db.id === databaseId) ?? null
}

export function getBackupsForDatabase(databaseId) {
  return backups
    .filter((backup) => backup.databaseId === databaseId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function getLatestBackup(databaseId) {
  return getBackupsForDatabase(databaseId)[0] ?? null
}

export function formatBackupAge(isoDate, now = new Date()) {
  const then = new Date(isoDate)
  const diffMs = Math.max(0, now - then)
  const hours = Math.floor(diffMs / (1000 * 60 * 60))

  if (hours < 1) return "À l'instant"
  if (hours < 24) return `Il y a ${hours}h`

  const days = Math.floor(hours / 24)
  return `Il y a ${days}j`
}

export function formatBackupDate(isoDate) {
  const date = new Date(isoDate)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}/${month} ${hours}:${minutes}`
}

export function formatHost(database) {
  return `${database.host}:${database.port}`
}

export function formatBackupStatus(status) {
  if (status === 'success') return 'succès'
  if (status === 'failed') return 'échec'
  if (status === 'running') return 'en cours'
  return status
}

export function getDatabaseRow(database, now = new Date()) {
  const latest = getLatestBackup(database.id)

  return {
    ...database,
    lastBackup: latest ? formatBackupAge(latest.createdAt, now) : '—',
    status: latest?.status === 'success' ? 'ok' : latest ? 'failed' : 'unknown',
    latestBackup: latest,
  }
}

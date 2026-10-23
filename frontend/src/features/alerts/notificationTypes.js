// Notification types sent by the API (api/events.js) -> label and filter category
export const NOTIFICATION_TYPES = {
  database_added: { label: 'Base ajoutée', category: 'databases' },
  database_deleted: { label: 'Base supprimée', category: 'databases' },
  backup_success: { label: 'Sauvegarde', category: 'backups' },
  backup_failed: { label: 'Sauvegarde', category: 'backups' },
  backup_deleted: { label: 'Version supprimée', category: 'backups' },
  backup_downloaded: { label: 'Téléchargement', category: 'downloads' },
  restore_success: { label: 'Restauration', category: 'restores' },
  restore_failed: { label: 'Restauration', category: 'restores' },
  schedule_updated: { label: 'Planification', category: 'schedules' },
}

// "alerts" = the red ones (failures), whatever their type
export const NOTIFICATION_FILTERS = [
  { value: 'all', label: 'Toutes' },
  { value: 'alerts', label: 'Alertes' },
  { value: 'backups', label: 'Sauvegardes' },
  { value: 'restores', label: 'Restaurations' },
  { value: 'databases', label: 'Bases' },
  { value: 'schedules', label: 'Planification' },
  { value: 'downloads', label: 'Téléchargements' },
]

export function matchesFilter(alert, filter) {
  if (filter === 'all') return true
  if (filter === 'alerts') return alert.level === 'error'
  return NOTIFICATION_TYPES[alert.type]?.category === filter
}

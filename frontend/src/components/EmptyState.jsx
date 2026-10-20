function EmptyState({ children = 'Aucune base sélectionnée' }) {
  return <p className="empty-state">{children}</p>
}

export default EmptyState

function Badge({ children, tone = 'danger' }) {
  return <span className={`badge-count badge-count--${tone}`}>{children}</span>
}

export default Badge

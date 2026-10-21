function Logo({ className = '' }) {
  return (
    <span className={`logo ${className}`.trim()}>
      <span className="logo__safe">SAFE</span>
      <span className="logo__base">BASE</span>
    </span>
  )
}

export default Logo

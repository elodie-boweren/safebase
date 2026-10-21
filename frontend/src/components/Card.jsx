function Card({ title, action, badge, children, className = '' }) {
  const showHeader = title || action || badge

  return (
    <section className={`card ${className}`.trim()}>
      {showHeader ? (
        <header className="card__header">
          <div className="card__title-row">
            {title ? <h2 className="card__title">{title}</h2> : null}
            {badge}
          </div>
          {action ? <div className="card__action">{action}</div> : null}
        </header>
      ) : null}
      <div className="card__body">{children}</div>
    </section>
  )
}

export default Card

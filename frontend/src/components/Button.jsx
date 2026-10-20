function Button({
  children,
  variant = 'primary',
  type = 'button',
  icon,
  iconPosition = 'start',
  className = '',
  ...props
}) {
  const classes = ['btn', `btn--${variant}`, className].filter(Boolean).join(' ')

  return (
    <button type={type} className={classes} {...props}>
      {icon && iconPosition === 'start' ? <span className="btn__icon">{icon}</span> : null}
      <span className="btn__label">{children}</span>
      {icon && iconPosition === 'end' ? <span className="btn__icon">{icon}</span> : null}
    </button>
  )
}

export default Button

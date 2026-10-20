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
      {icon && iconPosition === 'start' ? icon : null}
      <span>{children}</span>
      {icon && iconPosition === 'end' ? icon : null}
    </button>
  )
}

export default Button

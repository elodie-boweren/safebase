function IconButton({
  children,
  label,
  tone = 'default',
  type = 'button',
  className = '',
  ...props
}) {
  const classes = ['icon-btn', `icon-btn--${tone}`, className].filter(Boolean).join(' ')

  return (
    <button type={type} className={classes} aria-label={label} title={label} {...props}>
      {children}
    </button>
  )
}

export default IconButton

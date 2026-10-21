function Select({
  id,
  label,
  value,
  onChange,
  options,
  className = '',
  ...props
}) {
  return (
    <label className={`select-field ${className}`.trim()}>
      {label ? <span className="visually-hidden">{label}</span> : null}
      <select id={id} value={value} onChange={onChange} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default Select

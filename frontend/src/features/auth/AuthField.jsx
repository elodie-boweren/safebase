function AuthField({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  required = true,
  minLength,
}) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      <input
        type={type}
        name={name}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
      />
    </label>
  )
}

export default AuthField

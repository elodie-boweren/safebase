import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthField from './AuthField'

function AuthModal({ mode = 'login' }) {
  const navigate = useNavigate()
  const isLogin = mode === 'login'
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!isLogin && form.password !== form.confirmPassword) {
      window.alert('Les mots de passe ne correspondent pas.')
      return
    }

    // Static UI only — no backend yet
    navigate('/databases')
  }

  return (
    <div className="auth-modal" role="dialog" aria-labelledby="auth-title">
      <h1 id="auth-title" className="auth-logo">
        <span className="auth-logo__safe">SAFE</span>
        <span className="auth-logo__base">BASE</span>
      </h1>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-fields">
          <AuthField
            label="email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="exemple@email.com"
            value={form.email}
            onChange={handleChange}
          />

          <AuthField
            label="mot de passe"
            type="password"
            name="password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            placeholder="************"
            value={form.password}
            onChange={handleChange}
            minLength={6}
          />

          {!isLogin && (
            <AuthField
              label="confirmer mot de passe"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="************"
              value={form.confirmPassword}
              onChange={handleChange}
              minLength={6}
            />
          )}
        </div>

        <button type="submit" className="auth-submit">
          {isLogin ? 'Se connecter' : "S'inscrire"}
        </button>
      </form>

      {isLogin ? (
        <p className="auth-switch">
          <Link to="/inscription">Pas de compte ? S&apos;inscrire</Link>
        </p>
      ) : (
        <p className="auth-switch">
          <Link to="/">Déjà un compte ? Se connecter</Link>
        </p>
      )}
    </div>
  )
}

export default AuthModal

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../../components/Logo'
import AuthField from './AuthField'
import { authenticateUser, mockUser } from '../../data/mocks'

function AuthModal({ mode = 'login' }) {
  const navigate = useNavigate()
  const isLogin = mode === 'login'
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })

  function handleChange(event) {
    const { name, value } = event.target
    setError('')
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!isLogin && form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    if (isLogin) {
      const user = authenticateUser(form.email, form.password)
      if (!user) {
        setError('Email ou mot de passe incorrect.')
        return
      }
    }

    // Static UI only — no backend yet
    navigate('/dashboard')
  }

  return (
    <div className="auth-modal" role="dialog" aria-labelledby="auth-title">
      <h1 id="auth-title" className="auth-logo">
        <Logo />
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

        {error ? <p className="auth-error">{error}</p> : null}

        <button type="submit" className="auth-submit">
          {isLogin ? 'Se connecter' : "S'inscrire"}
        </button>
      </form>

      {isLogin ? (
        <>
          <p className="auth-hint">
            Demo : {mockUser.email} / {mockUser.password}
          </p>
          <p className="auth-switch">
            <Link to="/inscription">Pas de compte ? S&apos;inscrire</Link>
          </p>
        </>
      ) : (
        <p className="auth-switch">
          <Link to="/">Déjà un compte ? Se connecter</Link>
        </p>
      )}
    </div>
  )
}

export default AuthModal

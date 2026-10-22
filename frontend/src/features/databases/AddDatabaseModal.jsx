import { useEffect, useState } from 'react'
import Button from '../../components/Button'
import Select from '../../components/Select'
import AuthField from '../auth/AuthField'
import { createDatabase } from '../../services/api'

const TYPE_OPTIONS = [
  { value: 'postgres', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
]

// Default host = Docker service name of the test databases (see docker-compose.yml)
const DEFAULTS = {
  postgres: { host: 'postgres', port: 5432, databaseName: 'bibliotheque_postgres' },
  mysql: { host: 'mysql', port: 3306, databaseName: 'boutique_mysql' },
}

const EMPTY_FORM = {
  type: 'postgres',
  host: DEFAULTS.postgres.host,
  port: DEFAULTS.postgres.port,
  database_name: '',
  username: '',
  password: '',
}

// Rendered only while open, so the form starts empty each time
function AddDatabaseModal({ onCancel, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onCancel?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onCancel])

  function handleChange(event) {
    const { name, value } = event.target
    setError('')
    setForm((prev) => {
      if (name !== 'type') {
        return { ...prev, [name]: value }
      }

      // keep the default host and port in sync with the type, unless the user changed them
      const previous = DEFAULTS[prev.type]
      const next = DEFAULTS[value]
      return {
        ...prev,
        type: value,
        host: prev.host === '' || prev.host === previous.host ? next.host : prev.host,
        port: Number(prev.port) === previous.port ? next.port : prev.port,
      }
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      // the name displayed in SafeBase is the database name on the server
      const database = await createDatabase({ ...form, name: form.database_name, port: Number(form.port) })
      onCreated?.(database)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="confirm-modal" role="presentation">
      <button
        type="button"
        className="confirm-modal__backdrop"
        aria-label="Fermer"
        onClick={onCancel}
      />
      <div
        className="confirm-modal__dialog database-form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-database-title"
      >
        <h2 id="add-database-title" className="confirm-modal__title">
          Ajouter une base
        </h2>

        <form className="database-form__body" onSubmit={handleSubmit}>
          <div className="database-form__fields">
            <AuthField
              label="Nom de la base"
              name="database_name"
              placeholder={DEFAULTS[form.type].databaseName}
              value={form.database_name}
              onChange={handleChange}
            />
            <label className="auth-field">
              <span>Type</span>
              <Select name="type" value={form.type} onChange={handleChange} options={TYPE_OPTIONS} />
            </label>

            <div className="database-form__row">
              <AuthField label="Hôte" name="host" placeholder={DEFAULTS[form.type].host} value={form.host} onChange={handleChange} />
              <AuthField label="Port" type="number" name="port" value={form.port} onChange={handleChange} />
            </div>

            <AuthField
              label="Utilisateur"
              name="username"
              autoComplete="off"
              value={form.username}
              onChange={handleChange}
            />
            <AuthField
              label="Mot de passe"
              type="password"
              name="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          {error ? <p className="auth-error database-form__error">{error}</p> : null}

          <div className="confirm-modal__actions">
            <Button variant="outline" onClick={onCancel} disabled={submitting}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Test de connexion…' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddDatabaseModal

import AuthModal from '../features/auth/AuthModal'

function AuthPage({ mode = 'login' }) {
  return (
    <div className="auth-page">
      <div className="auth-page__backdrop" aria-hidden="true" />
      <AuthModal mode={mode} />
    </div>
  )
}

export default AuthPage

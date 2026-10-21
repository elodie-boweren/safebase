import { CheckIcon, CrossIcon } from './icons/Icons'

function StatusIcon({ status }) {
  const isOk = status === 'ok' || status === 'success'

  return (
    <span
      className={`status-icon ${isOk ? 'status-icon--ok' : 'status-icon--error'}`}
      title={isOk ? 'Ok' : 'Échec'}
    >
      {isOk ? <CheckIcon /> : <CrossIcon />}
      <span className="status-icon__label">{isOk ? 'Ok' : 'Échec'}</span>
    </span>
  )
}

export default StatusIcon

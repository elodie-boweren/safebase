import { useState } from 'react'
import Card from '../../components/Card'
import Select from '../../components/Select'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import { CheckIcon } from '../../components/icons/Icons'
import {
  defaultSchedule,
  formatScheduleSummary,
  scheduleFrequencies,
  scheduleHours,
  scheduleIntervals,
  scheduleMinutes,
  scheduleMonthDays,
  scheduleWeekdays,
} from '../../data/mocks'

// Remounted (key) when the selected database changes, so the draft starts from its saved schedule
function BackupSummaryCard({ database, savedSchedule = defaultSchedule, onSave }) {
  // schedule = what is being edited, savedSchedule = what is saved in the API
  const [schedule, setSchedule] = useState(savedSchedule)
  const [saving, setSaving] = useState(false)
  const hasChanges =
    schedule.enabled !== savedSchedule.enabled ||
    formatScheduleSummary(schedule) !== formatScheduleSummary(savedSchedule)

  function updateField(field) {
    return (event) => {
      setSchedule((prev) => ({ ...prev, [field]: event.target.value }))
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await onSave?.(schedule)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card
      title="Sauvegarde automatique"
      className="card--compact"
      action={
        <Button
          variant="primary"
          icon={<CheckIcon />}
          onClick={handleSave}
          disabled={!database || !hasChanges || saving}
        >
          Valider
        </Button>
      }
    >
      {!database ? (
        <EmptyState>Sélectionnez une base pour planifier ses sauvegardes</EmptyState>
      ) : (
        <div className="schedule-form">
          <label className="schedule-form__toggle">
            <input
              type="checkbox"
              checked={schedule.enabled}
              onChange={(event) => setSchedule((prev) => ({ ...prev, enabled: event.target.checked }))}
            />
            <span>Activée</span>
          </label>

          <Select
            label="Fréquence"
            value={schedule.frequency}
            onChange={updateField('frequency')}
            options={scheduleFrequencies}
          />

          {schedule.frequency === 'interval' ? (
            <Select
              label="Intervalle"
              value={schedule.intervalHours}
              onChange={updateField('intervalHours')}
              options={scheduleIntervals}
            />
          ) : null}

          {schedule.frequency === 'weekly' ? (
            <Select
              label="Jour de la semaine"
              value={schedule.weekday}
              onChange={updateField('weekday')}
              options={scheduleWeekdays}
            />
          ) : null}

          {schedule.frequency === 'monthly' ? (
            <Select
              label="Jour du mois"
              value={schedule.monthDay}
              onChange={updateField('monthDay')}
              options={scheduleMonthDays}
            />
          ) : null}

          <div className="schedule-form__time">
            <span className="schedule-form__prefix">
              {schedule.frequency === 'interval' ? 'à la minute' : 'à'}
            </span>
            {schedule.frequency !== 'interval' ? (
              <Select
                label="Heure"
                value={schedule.hour}
                onChange={updateField('hour')}
                options={scheduleHours}
              />
            ) : null}
            <Select
              label="Minutes"
              value={schedule.minute}
              onChange={updateField('minute')}
              options={scheduleMinutes}
            />
          </div>

          <p className="schedule-form__summary">
            {savedSchedule.enabled
              ? `Active : ${formatScheduleSummary(savedSchedule)}`
              : 'Aucune sauvegarde automatique'}
            {hasChanges ? (
              <span className="schedule-form__pending">
                {schedule.enabled
                  ? `Nouveau : ${formatScheduleSummary(schedule)}`
                  : 'Nouveau : désactivée (réglage conservé)'}
                {' (non validé)'}
              </span>
            ) : null}
          </p>
        </div>
      )}
    </Card>
  )
}

export default BackupSummaryCard

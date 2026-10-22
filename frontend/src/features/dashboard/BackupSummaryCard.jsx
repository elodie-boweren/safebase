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
  scheduleMinutes,
  scheduleMonthDays,
  scheduleWeekdays,
} from '../../data/mocks'

// Remounted (key) when the selected database changes, so the draft starts from its saved schedule
function BackupSummaryCard({ database, savedSchedule = defaultSchedule, onSave }) {
  // schedule = what is being edited, savedSchedule = what was confirmed with "Valider"
  const [schedule, setSchedule] = useState(savedSchedule)
  const isEnabled = schedule.frequency !== 'none'
  const hasChanges = formatScheduleSummary(schedule) !== formatScheduleSummary(savedSchedule)

  function updateField(field) {
    return (event) => {
      setSchedule((prev) => ({ ...prev, [field]: event.target.value }))
    }
  }

  return (
    <Card
      title="Sauvegarde"
      className="card--compact"
      action={
        <Button
          variant="primary"
          icon={<CheckIcon />}
          onClick={() => onSave?.(schedule)}
          disabled={!database || !hasChanges}
        >
          Valider
        </Button>
      }
    >
      {!database ? (
        <EmptyState>Sélectionnez une base pour planifier ses sauvegardes</EmptyState>
      ) : (
        <div className="schedule-form">
          <Select
            label="Fréquence"
            value={schedule.frequency}
            onChange={updateField('frequency')}
            options={scheduleFrequencies}
          />

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

          {isEnabled ? (
            <div className="schedule-form__time">
              <span className="schedule-form__prefix">à</span>
              <Select
                label="Heure"
                value={schedule.hour}
                onChange={updateField('hour')}
                options={scheduleHours}
              />
              <Select
                label="Minutes"
                value={schedule.minute}
                onChange={updateField('minute')}
                options={scheduleMinutes}
              />
            </div>
          ) : null}

          <p className="schedule-form__summary">
            {formatScheduleSummary(savedSchedule)}
            {hasChanges ? (
              <span className="schedule-form__pending">
                Nouveau : {formatScheduleSummary(schedule)} (non validé)
              </span>
            ) : null}
          </p>
        </div>
      )}
    </Card>
  )
}

export default BackupSummaryCard

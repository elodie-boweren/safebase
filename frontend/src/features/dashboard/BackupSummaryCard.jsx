import { useState } from 'react'
import Card from '../../components/Card'
import Select from '../../components/Select'
import {
  defaultSchedule,
  formatScheduleSummary,
  scheduleFrequencies,
  scheduleHours,
  scheduleMinutes,
  scheduleMonthDays,
  scheduleWeekdays,
} from '../../data/mocks'

function BackupSummaryCard() {
  const [schedule, setSchedule] = useState(defaultSchedule)
  const isEnabled = schedule.frequency !== 'none'

  function updateField(field) {
    return (event) => {
      setSchedule((prev) => ({ ...prev, [field]: event.target.value }))
    }
  }

  return (
    <Card title="Sauvegarde" className="card--compact">
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

        <p className="schedule-form__summary">{formatScheduleSummary(schedule)}</p>
      </div>
    </Card>
  )
}

export default BackupSummaryCard

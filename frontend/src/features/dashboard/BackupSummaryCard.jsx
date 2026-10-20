import { useState } from 'react'
import Card from '../../components/Card'
import Select from '../../components/Select'
import {
  defaultSchedule,
  scheduleFrequencies,
  scheduleHours,
  scheduleMinutes,
} from '../../data/mocks'

function BackupSummaryCard() {
  const [schedule, setSchedule] = useState(defaultSchedule)

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
      </div>
    </Card>
  )
}

export default BackupSummaryCard

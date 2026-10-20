import { schedules } from '../../data/mocks'

function SchedulesPanel() {
  return (
    <section>
      <p>Configure automated backup schedules (cron).</p>
      <table className="data-table">
        <thead>
          <tr>
            <th>Database</th>
            <th>Schedule</th>
            <th>Cron</th>
            <th>Enabled</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule) => (
            <tr key={schedule.id}>
              <td>{schedule.databaseName}</td>
              <td>{schedule.label}</td>
              <td>
                <code>{schedule.cron}</code>
              </td>
              <td>{schedule.enabled ? 'yes' : 'no'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default SchedulesPanel

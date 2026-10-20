import { restores } from '../../data/mocks'

function RestoresPanel() {
  return (
    <section>
      <p>Restore a database from a selected backup version.</p>
      <table className="data-table">
        <thead>
          <tr>
            <th>Database</th>
            <th>Backup ID</th>
            <th>Started at</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {restores.map((restore) => (
            <tr key={restore.id}>
              <td>{restore.databaseName}</td>
              <td>{restore.backupId}</td>
              <td>{new Date(restore.startedAt).toLocaleString()}</td>
              <td>
                <span className={`badge badge--${restore.status}`}>
                  {restore.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default RestoresPanel

import { databases } from '../../data/mocks'

function DatabasesPanel() {
  return (
    <section>
      <p>Manage database connections (MySQL, PostgreSQL, MongoDB).</p>
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Host</th>
            <th>Port</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {databases.map((db) => (
            <tr key={db.id}>
              <td>{db.name}</td>
              <td>{db.type}</td>
              <td>{db.host}</td>
              <td>{db.port}</td>
              <td>
                <span className={`badge badge--${db.status}`}>{db.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default DatabasesPanel

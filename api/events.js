const pool = require('./db');

// Every action is recorded in the "alerts" table, which is the notification history.
// level: error (red alerts), success, info.
// Names are copied at creation time so the history survives deletions.
//
// Every event starts unread: the bell shows a red bubble for unread failures
// and a blue one for the other unread notifications.
async function logEvent({ type, level, message, details = null, userId, database = null, backup = null, isRead = false }) {
  const fullMessage = details ? `${message} — ${details}` : message;

  try {
    await pool.query(
      `INSERT INTO alerts (type, level, message, is_read, user_id, database_id, database_name, backup_id, backup_filename)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        type,
        level,
        fullMessage,
        isRead,
        userId ?? database?.user_id,
        database?.database_id ?? null,
        database?.name ?? null,
        backup?.backup_id ?? null,
        backup?.filename ?? null,
      ]
    );
  } catch (error) {
    // the history must never break the action itself
    console.error('[events] could not record event:', error.message);
  }
}

module.exports = { logEvent };

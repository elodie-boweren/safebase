const pool = require('./db');

// db/schema.sql only runs when the PostgreSQL volume is created.
// These idempotent changes bring existing databases up to date at API start.
const MIGRATIONS = `
  -- alerts become the full notification history (actions + failures)
  ALTER TABLE alerts ADD COLUMN IF NOT EXISTS level VARCHAR(20) NOT NULL DEFAULT 'error';
  ALTER TABLE alerts ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(user_id) ON DELETE CASCADE;
  ALTER TABLE alerts ADD COLUMN IF NOT EXISTS database_id INT REFERENCES databases(database_id) ON DELETE SET NULL;
  ALTER TABLE alerts ADD COLUMN IF NOT EXISTS database_name VARCHAR(255);
  ALTER TABLE alerts ADD COLUMN IF NOT EXISTS backup_filename VARCHAR(255);

  -- keep the history when a backup is deleted
  ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_backup_id_fkey;
  ALTER TABLE alerts ADD CONSTRAINT alerts_backup_id_fkey
    FOREIGN KEY (backup_id) REFERENCES backups(backup_id) ON DELETE SET NULL;

  -- fill the new columns of the alerts created before this migration
  UPDATE alerts a
  SET user_id = d.user_id, database_id = d.database_id, database_name = d.name, backup_filename = b.filename
  FROM backups b JOIN databases d ON d.database_id = b.database_id
  WHERE a.backup_id = b.backup_id AND a.user_id IS NULL;
`;

// The database may not be ready yet when the API starts with Docker: retry a few times
async function runMigrations({ retries = 10, delayMs = 3000 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      // several statements in one query run as a single transaction
      await pool.query(MIGRATIONS);
      console.log('[migrations] schema up to date');
      return;
    } catch (error) {
      console.error(`[migrations] attempt ${attempt} failed: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

module.exports = { runMigrations };

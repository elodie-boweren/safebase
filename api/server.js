const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
const PORT = process.env.PORT || 3000;
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'safebase_secret_key';
const { encrypt } = require('./encryption');
const { testConnection, SUPPORTED_TYPES } = require('./connectionTester');
const { createBackup, restoreBackup, removeBackupFiles } = require('./backupService');
const { scheduleToCron, cronToSchedule, describeCron, scheduleDatabase, unscheduleDatabase, initScheduler } = require('./scheduler');
const { logEvent } = require('./events');
const { runMigrations } = require('./migrations');

const TYPE_LABELS = { mysql: 'MySQL', postgres: 'PostgreSQL' };

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Token invalide ou expiré' });
  }
}

const pool = require('./db');
const bcrypt = require('bcryptjs');

app.get('/', (req, res) => {
  res.send('SafeBase API is running');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'safebase-backend' });
});

app.get('/test-db', async (req, res) => {
  const result = await pool.query('SELECT NOW()');
  res.send(`Base connectée. Heure : ${result.rows[0].now}`);
});

app.post('/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING user_id, username, email, role',
      [username, email, hashedPassword]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message, details: error.detail });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { user_id: user.user_id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/me', authMiddleware, (req, res) => {
  res.json({ message: 'Tu es connecté.e', user: req.user });
});

// add a db
app.post('/databases', authMiddleware, async (req, res) => {
  const { name, description, type, host, port, database_name, username, password } = req.body;

  const missing = ['name', 'type', 'host', 'port', 'database_name', 'username', 'password']
    .filter((field) => req.body[field] === undefined || req.body[field] === null || req.body[field] === '');
  if (missing.length > 0) {
    return res.status(400).json({ error: `Champs obligatoires manquants : ${missing.join(', ')}` });
  }

  if (!SUPPORTED_TYPES.includes(type)) {
    return res.status(400).json({ error: `Type de base non supporté. Types acceptés : ${SUPPORTED_TYPES.join(', ')}` });
  }

  const portNumber = Number(port);
  if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) {
    return res.status(400).json({ error: 'Le port doit être un entier entre 1 et 65535' });
  }

  // the connection is saved only if it works
  const connectionTest = await testConnection({ type, host, port: portNumber, database_name, username, password });
  if (!connectionTest.ok) {
    return res.status(400).json({ error: `Échec du test de connexion : ${connectionTest.error}`, details: connectionTest.details });
  }

  try {
    const encryptedPassword = encrypt(password);

    const result = await pool.query(
      `INSERT INTO databases (name, description, type, host, port, database_name, username, password, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING database_id, name, description, type, host, port, database_name, username`,
      [name, description, type, host, portNumber, database_name, username, encryptedPassword, req.user.user_id]
    );

    await logEvent({
      type: 'database_added',
      level: 'info',
      message: `Base ${name} (${TYPE_LABELS[type]}) ajoutée`,
      userId: req.user.user_id,
      database: result.rows[0],
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message, details: error.detail });
  }
});

// list a bases
app.get('/databases', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.database_id, d.name, d.description, d.type, d.host, d.port, d.database_name, d.username,
              d.cron_expression, d.is_schedule_enabled,
              last.created_at AS last_backup_at, last.status AS last_backup_status
       FROM databases d
       LEFT JOIN LATERAL (
         SELECT created_at, status FROM backups
         WHERE backups.database_id = d.database_id
         ORDER BY created_at DESC LIMIT 1
       ) last ON TRUE
       WHERE d.user_id = $1 ORDER BY d.database_id`,
      [req.user.user_id]
    );
    res.json(result.rows.map((row) => ({ ...row, schedule: cronToSchedule(row.cron_expression) })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// delete a db
// if the db has backups, deletion is refused unless ?force=true (backups are then deleted too)
app.delete('/databases/:id', authMiddleware, async (req, res) => {
  const databaseId = Number(req.params.id);
  if (!Number.isInteger(databaseId)) {
    return res.status(400).json({ error: 'Identifiant de base invalide' });
  }

  try {
    const backupsResult = await pool.query(
      `SELECT d.name, COUNT(b.backup_id)::int AS backups_count
       FROM databases d LEFT JOIN backups b ON b.database_id = d.database_id
       WHERE d.database_id = $1 AND d.user_id = $2
       GROUP BY d.database_id`,
      [databaseId, req.user.user_id]
    );

    if (backupsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Base introuvable' });
    }

    const { name, backups_count } = backupsResult.rows[0];
    if (backups_count > 0 && req.query.force !== 'true') {
      return res.status(409).json({
        error: `Cette base a ${backups_count} sauvegarde(s). Confirmez la suppression avec ?force=true : les sauvegardes seront aussi supprimées.`,
        backups_count,
      });
    }

    const result = await pool.query(
      'DELETE FROM databases WHERE database_id = $1 AND user_id = $2 RETURNING database_id',
      [databaseId, req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Base introuvable' });
    }

    unscheduleDatabase(databaseId);
    await removeBackupFiles({ databaseId }).catch((error) => console.error(error));

    // the row is gone: only its name is kept in the history
    await logEvent({
      type: 'database_deleted',
      level: 'info',
      message: `Base ${name} supprimée${backups_count > 0 ? ` avec ses ${backups_count} sauvegarde(s)` : ''}`,
      userId: req.user.user_id,
      database: { name },
    });

    res.json({ message: 'Base supprimée', database_id: result.rows[0].database_id, deleted_backups: backups_count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// run a manual backup of a db
app.post('/databases/:id/backup', authMiddleware, async (req, res) => {
  const databaseId = Number(req.params.id);
  if (!Number.isInteger(databaseId)) {
    return res.status(400).json({ error: 'Identifiant de base invalide' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM databases WHERE database_id = $1 AND user_id = $2',
      [databaseId, req.user.user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Base introuvable' });
    }

    const { backup, error, alreadyRunning } = await createBackup(result.rows[0]);
    if (alreadyRunning) {
      return res.status(409).json({ error });
    }
    if (error) {
      return res.status(500).json({ error: `Échec de la sauvegarde : ${error}`, backup });
    }

    res.status(201).json(backup);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// list the backups of a db, most recent first
app.get('/databases/:id/backups', authMiddleware, async (req, res) => {
  const databaseId = Number(req.params.id);
  if (!Number.isInteger(databaseId)) {
    return res.status(400).json({ error: 'Identifiant de base invalide' });
  }

  try {
    const owner = await pool.query(
      'SELECT 1 FROM databases WHERE database_id = $1 AND user_id = $2',
      [databaseId, req.user.user_id]
    );
    if (owner.rows.length === 0) {
      return res.status(404).json({ error: 'Base introuvable' });
    }

    const result = await pool.query(
      `SELECT backup_id,
              ROW_NUMBER() OVER (ORDER BY created_at, backup_id)::int AS version,
              name, filename, filepath, size::float8 AS size, status, trigger_type, created_at, database_id,
              CASE WHEN status = 'failed' THEN description END AS error_message
       FROM backups WHERE database_id = $1
       ORDER BY created_at DESC, backup_id DESC`,
      [databaseId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// set the automatic backup schedule of a db
// body: { frequency: daily|weekly|monthly|interval, hour, minute, weekday, monthDay, intervalHours, enabled }
// without frequency, only "enabled" is changed and the current schedule is kept
app.put('/databases/:id/schedule', authMiddleware, async (req, res) => {
  const databaseId = Number(req.params.id);
  if (!Number.isInteger(databaseId)) {
    return res.status(400).json({ error: 'Identifiant de base invalide' });
  }

  try {
    const current = await pool.query(
      'SELECT cron_expression FROM databases WHERE database_id = $1 AND user_id = $2',
      [databaseId, req.user.user_id]
    );
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Base introuvable' });
    }

    let cronExpression = current.rows[0].cron_expression;
    if (req.body.frequency !== undefined) {
      const converted = scheduleToCron(req.body);
      if (converted.error) {
        return res.status(400).json({ error: converted.error });
      }
      cronExpression = converted.cron;
    }

    const enabled = req.body.enabled === undefined ? true : Boolean(req.body.enabled);
    if (enabled && !cronExpression) {
      return res.status(400).json({ error: "Choisissez une fréquence avant d'activer la planification" });
    }

    const result = await pool.query(
      `UPDATE databases
       SET cron_expression = $1, is_schedule_enabled = $2,
           schedule_created_at = COALESCE(schedule_created_at, NOW()), schedule_updated_at = NOW()
       WHERE database_id = $3
       RETURNING *`,
      [cronExpression, enabled, databaseId]
    );
    const database = result.rows[0];

    // takes effect right away: the old task is stopped and the new one registered
    scheduleDatabase(database);

    await logEvent({
      type: 'schedule_updated',
      level: 'info',
      message: database.is_schedule_enabled
        ? `Sauvegarde automatique de ${database.name} : ${describeCron(database.cron_expression)}`
        : `Sauvegarde automatique de ${database.name} désactivée`,
      database,
    });

    res.json({
      database_id: databaseId,
      cron_expression: database.cron_expression,
      is_schedule_enabled: database.is_schedule_enabled,
      schedule: cronToSchedule(database.cron_expression),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// alert row -> API shape: the message is "clear reason — raw tool output",
// the raw part is returned as details for the diagnosis
function toAlert(row) {
  const [message, ...details] = row.message.split(' — ');
  return {
    alert_id: row.alert_id,
    type: row.type,
    level: row.level,
    message,
    details: details.join(' — ') || null,
    is_read: row.is_read,
    created_at: row.created_at,
    backup_id: row.backup_id,
    backup_filename: row.backup_filename,
    database_id: row.database_id,
    database_name: row.database_name,
  };
}

// notification history of the user, most recent first
// ?unread=true for unread only, ?level=error for the red alerts only
app.get('/alerts', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT alert_id, type, level, message, is_read, created_at,
              backup_id, backup_filename, database_id, database_name
       FROM alerts
       WHERE user_id = $1
         AND ($2::boolean IS NOT TRUE OR is_read = FALSE)
         AND ($3::text IS NULL OR level = $3)
       ORDER BY created_at DESC, alert_id DESC
       LIMIT 500`,
      [req.user.user_id, req.query.unread === 'true', req.query.level ?? null]
    );
    res.json(result.rows.map(toAlert));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// mark every alert of the user as read
app.patch('/alerts/read', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE alerts SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
      [req.user.user_id]
    );
    res.json({ message: 'Alertes marquées comme lues', updated: result.rowCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// mark one alert as read
app.patch('/alerts/:id/read', authMiddleware, async (req, res) => {
  const alertId = Number(req.params.id);
  if (!Number.isInteger(alertId)) {
    return res.status(400).json({ error: "Identifiant d'alerte invalide" });
  }

  try {
    const result = await pool.query(
      'UPDATE alerts SET is_read = TRUE WHERE alert_id = $1 AND user_id = $2 RETURNING alert_id',
      [alertId, req.user.user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alerte introuvable' });
    }
    res.json({ message: 'Alerte marquée comme lue', alert_id: alertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// a backup of one of the user's databases, or null
async function findOwnedBackup(backupId, userId) {
  const result = await pool.query(
    `SELECT b.backup_id, b.filename, b.filepath, b.status, b.database_id,
            d.name AS database_name, d.user_id
     FROM backups b JOIN databases d ON d.database_id = b.database_id
     WHERE b.backup_id = $1 AND d.user_id = $2`,
    [backupId, userId]
  );
  return result.rows[0] ?? null;
}

// download the .sql file of a backup
app.get('/backups/:id/download', authMiddleware, async (req, res) => {
  const backupId = Number(req.params.id);
  if (!Number.isInteger(backupId)) {
    return res.status(400).json({ error: 'Identifiant de sauvegarde invalide' });
  }

  try {
    const backup = await findOwnedBackup(backupId, req.user.user_id);
    if (!backup) {
      return res.status(404).json({ error: 'Sauvegarde introuvable' });
    }
    if (backup.status !== 'success') {
      return res.status(409).json({ error: 'Cette sauvegarde a échoué : aucun fichier à télécharger' });
    }

    res.download(backup.filepath, backup.filename, (error) => {
      if (error) {
        if (!res.headersSent) res.status(404).json({ error: 'Fichier de sauvegarde introuvable' });
        return;
      }
      logEvent({
        type: 'backup_downloaded',
        level: 'info',
        message: `Sauvegarde de ${backup.database_name} téléchargée (${backup.filename})`,
        database: { database_id: backup.database_id, name: backup.database_name, user_id: backup.user_id },
        backup,
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// restore a backup into its database (current data is replaced)
app.post('/backups/:id/restore', authMiddleware, async (req, res) => {
  const backupId = Number(req.params.id);
  if (!Number.isInteger(backupId)) {
    return res.status(400).json({ error: 'Identifiant de sauvegarde invalide' });
  }

  try {
    const backup = await findOwnedBackup(backupId, req.user.user_id);
    if (!backup) {
      return res.status(404).json({ error: 'Sauvegarde introuvable' });
    }
    if (backup.status !== 'success') {
      return res.status(409).json({ error: 'Seule une sauvegarde réussie peut être restaurée' });
    }

    const databaseResult = await pool.query('SELECT * FROM databases WHERE database_id = $1', [backup.database_id]);
    const database = databaseResult.rows[0];

    // safety dump of the current data first: without it, nothing is overwritten
    const safety = await createBackup(database, { triggerType: 'pre_restore' });
    if (safety.error) {
      await logEvent({
        type: 'restore_failed',
        level: 'error',
        message: `Restauration de ${database.name} (${backup.filename}) annulée : la sauvegarde de sécurité a échoué (${safety.error})`,
        details: safety.backup?.description?.split(' — ').slice(1).join(' — ') || null,
        database,
        backup,
      });
      return res.status(500).json({
        error: `Restauration annulée : la sauvegarde de sécurité a échoué (${safety.error})`,
        safety_backup: safety.backup,
      });
    }

    const result = await restoreBackup(database, backup);
    if (!result.ok) {
      return res.status(500).json({
        error: `Échec de la restauration : ${result.error}`,
        safety_backup: safety.backup,
      });
    }

    res.json({ message: 'Restauration terminée', backup_id: backupId, safety_backup: safety.backup });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// delete a backup and its file
app.delete('/backups/:id', authMiddleware, async (req, res) => {
  const backupId = Number(req.params.id);
  if (!Number.isInteger(backupId)) {
    return res.status(400).json({ error: 'Identifiant de sauvegarde invalide' });
  }

  try {
    const backup = await findOwnedBackup(backupId, req.user.user_id);
    if (!backup) {
      return res.status(404).json({ error: 'Sauvegarde introuvable' });
    }

    await pool.query('DELETE FROM backups WHERE backup_id = $1', [backupId]);
    await removeBackupFiles({ filepath: backup.filepath }).catch((error) => console.error(error));

    // the backup row is gone: only its file name is kept in the history
    await logEvent({
      type: 'backup_deleted',
      level: 'info',
      message: `Sauvegarde de ${backup.database_name} supprimée (${backup.filename})`,
      database: { database_id: backup.database_id, name: backup.database_name, user_id: backup.user_id },
      backup: { filename: backup.filename },
    });

    res.json({ message: 'Sauvegarde supprimée', backup_id: backupId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API démarrée sur http://localhost:${PORT}`);
  runMigrations().then(() => initScheduler());
});
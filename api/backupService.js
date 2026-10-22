const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const pool = require('./db');
const { decrypt } = require('./encryption');
const { logEvent } = require('./events');

const TRIGGER_LABELS = {
  manual: 'manuelle',
  scheduled: 'automatique',
  pre_restore: 'de sécurité',
};

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
}

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, 'backups');
const DUMP_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_STDERR_LENGTH = 4000;

// databases with a backup in progress: a second backup of the same database is refused
const runningBackups = new Set();

function isBackupRunning(databaseId) {
  return runningBackups.has(databaseId);
}

// Builds the dump command for each database type.
// The password is passed through an environment variable, never in the arguments.
function buildDumpCommand(database, password, filepath) {
  if (database.type === 'postgres') {
    return {
      command: 'pg_dump',
      args: [
        `--host=${database.host}`,
        `--port=${database.port}`,
        `--username=${database.username}`,
        `--dbname=${database.database_name}`,
        '--clean',
        '--if-exists',
        '--no-owner',
        '--no-privileges',
        `--file=${filepath}`,
      ],
      env: { PGPASSWORD: password },
    };
  }

  if (database.type === 'mysql') {
    return {
      command: 'mariadb-dump',
      args: [
        `--host=${database.host}`,
        `--port=${database.port}`,
        `--user=${database.username}`,
        '--single-transaction',
        '--no-tablespaces',
        '--routines',
        '--triggers',
        `--result-file=${filepath}`,
        database.database_name,
      ],
      env: { MYSQL_PWD: password },
    };
  }

  throw new Error(`Type de base non supporté : ${database.type}`);
}

// Builds the restore command for each database type (password through env vars too)
function buildRestoreCommand(database, password, filepath) {
  if (database.type === 'postgres') {
    return {
      command: 'psql',
      args: [
        `--host=${database.host}`,
        `--port=${database.port}`,
        `--username=${database.username}`,
        `--dbname=${database.database_name}`,
        '--quiet',
        '--no-psqlrc',
        // stop at the first error and roll everything back: the database is left untouched
        '--set=ON_ERROR_STOP=1',
        '--single-transaction',
        `--file=${filepath}`,
      ],
      env: { PGPASSWORD: password },
    };
  }

  if (database.type === 'mysql') {
    return {
      command: 'mariadb',
      args: [
        `--host=${database.host}`,
        `--port=${database.port}`,
        `--user=${database.username}`,
        database.database_name,
      ],
      env: { MYSQL_PWD: password },
      inputFile: filepath,
    };
  }

  throw new Error(`Type de base non supporté : ${database.type}`);
}

function runCommand({ command, args, env, inputFile }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: { ...process.env, ...env },
      stdio: [inputFile ? 'pipe' : 'ignore', 'ignore', 'pipe'],
    });

    if (inputFile) {
      const input = fs.createReadStream(inputFile);
      input.on('error', (error) => {
        child.kill('SIGKILL');
        reject(new Error(`Lecture du fichier impossible : ${error.message}`));
      });
      // the client may exit early on error: its exit code is reported below
      child.stdin.on('error', () => {});
      input.pipe(child.stdin);
    }

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr = (stderr + chunk.toString()).slice(-MAX_STDERR_LENGTH);
    });

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error("Délai d'exécution dépassé"));
    }, DUMP_TIMEOUT_MS);

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(new Error(`Impossible de lancer ${command} : ${error.message}`));
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
      } else {
        // drop the client warnings (e.g. SSL notice) to keep only the real error
        const errorOutput = stderr
          .split('\n')
          .filter((line) => line.trim() && !line.startsWith('WARNING:'))
          .join('\n');
        reject(new Error(errorOutput || `${command} s'est terminé avec le code ${code}`));
      }
    });
  });
}

// mariadb-dump starts the file with a "sandbox mode" line that the official
// MySQL client cannot read: remove it so the .sql file can be restored anywhere
async function removeMariadbSandboxLine(filepath) {
  const handle = await fs.promises.open(filepath, 'r');
  const { buffer, bytesRead } = await handle.read(Buffer.alloc(256), 0, 256, 0);
  await handle.close();

  const firstLine = buffer.subarray(0, bytesRead).toString();
  if (!firstLine.startsWith('/*M!999999')) {
    return;
  }

  const start = firstLine.indexOf('\n') + 1;
  const tmpPath = `${filepath}.tmp`;
  await new Promise((resolve, reject) => {
    fs.createReadStream(filepath, { start })
      .on('error', reject)
      .pipe(fs.createWriteStream(tmpPath))
      .on('error', reject)
      .on('finish', resolve);
  });
  await fs.promises.rename(tmpPath, filepath);
}

// Translate the dump tool output into a clear message for the user
function toBackupMessage(error) {
  const message = error.message;
  if (/access denied|password authentication failed/i.test(message)) return 'Identifiants invalides';
  if (/unknown database|does not exist/i.test(message)) return 'La base de données n\'existe pas';
  if (/can't connect|could not translate host|connection refused|unknown server host|timeout expired/i.test(message)) {
    return 'Serveur de base de données injoignable';
  }
  if (/délai d'exécution dépassé|lecture du fichier impossible/i.test(message)) return message;
  return null;
}

function hasUnsafeValue(database) {
  // values starting with "-" would be read as options by the client tools
  return [database.host, database.username, database.database_name].some((value) => String(value).startsWith('-'));
}

function buildFilename(database) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const safeName = database.database_name.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${safeName}_${timestamp}.sql`;
}

// Runs a backup of the database and records it in the backups table.
// On failure, the backup is marked as failed and an alert is created.
// Returns { backup } or { backup, error }
async function createBackup(database, options = {}) {
  if (runningBackups.has(database.database_id)) {
    return { backup: null, error: 'Une sauvegarde de cette base est déjà en cours', alreadyRunning: true };
  }

  runningBackups.add(database.database_id);
  try {
    return await runBackup(database, options);
  } finally {
    runningBackups.delete(database.database_id);
  }
}

async function runBackup(database, { triggerType = 'manual' } = {}) {
  const directory = path.join(BACKUP_DIR, String(database.database_id));
  const filename = buildFilename(database);
  const filepath = path.join(directory, filename);

  const inserted = await pool.query(
    `INSERT INTO backups (name, filename, filepath, size, status, trigger_type, database_id)
     VALUES ($1, $2, $3, 0, 'running', $4, $5)
     RETURNING *`,
    [filename, filename, filepath, triggerType, database.database_id]
  );
  const backupId = inserted.rows[0].backup_id;

  try {
    if (hasUnsafeValue(database)) {
      throw new Error('Paramètres de connexion invalides');
    }

    await fs.promises.mkdir(directory, { recursive: true });
    await runCommand(buildDumpCommand(database, decrypt(database.password), filepath));

    if (database.type === 'mysql') {
      await removeMariadbSandboxLine(filepath);
    }

    const { size } = await fs.promises.stat(filepath);
    const updated = await pool.query(
      `UPDATE backups SET status = 'success', size = $1 WHERE backup_id = $2 RETURNING *`,
      [size, backupId]
    );
    await logEvent({
      type: 'backup_success',
      level: 'success',
      message: `Sauvegarde ${TRIGGER_LABELS[triggerType] ?? triggerType} de ${database.name} réussie (${formatSize(size)})`,
      database,
      backup: updated.rows[0],
    });
    return { backup: updated.rows[0] };
  } catch (error) {
    console.error(`Backup ${backupId} failed:`, error.message);
    await fs.promises.rm(filepath, { force: true }).catch(() => {});

    // clear reason first (shown in the versions list), then the raw tool output
    const reason = toBackupMessage(error) ?? 'Erreur pendant la sauvegarde';
    const updated = await pool.query(
      `UPDATE backups SET status = 'failed', size = 0, description = $1 WHERE backup_id = $2 RETURNING *`,
      [`${reason} — ${error.message}`, backupId]
    );
    await logEvent({
      type: 'backup_failed',
      level: 'error',
      message: `Échec de la sauvegarde ${TRIGGER_LABELS[triggerType] ?? triggerType} de ${database.name} : ${reason}`,
      details: error.message,
      database,
      backup: updated.rows[0],
    });

    return { backup: updated.rows[0], error: reason };
  }
}

// Restores a successful backup into its database.
// On failure, a restore_failed alert is created. Returns { ok: true } or { ok: false, error }
async function restoreBackup(database, backup) {
  try {
    if (hasUnsafeValue(database)) {
      throw new Error('Paramètres de connexion invalides');
    }

    await fs.promises.access(backup.filepath, fs.constants.R_OK).catch(() => {
      throw new Error('Fichier de sauvegarde introuvable');
    });

    await runCommand(buildRestoreCommand(database, decrypt(database.password), backup.filepath));
    await logEvent({
      type: 'restore_success',
      level: 'success',
      message: `Restauration de ${database.name} réussie (${backup.filename})`,
      database,
      backup,
    });
    return { ok: true };
  } catch (error) {
    console.error(`Restore of backup ${backup.backup_id} failed:`, error.message);

    const reason = toBackupMessage(error) ?? (/introuvable/.test(error.message) ? error.message : 'Erreur pendant la restauration');
    await logEvent({
      type: 'restore_failed',
      level: 'error',
      message: `Échec de la restauration de ${database.name} (${backup.filename}) : ${reason}`,
      details: error.message,
      database,
      backup,
    });

    return { ok: false, error: reason };
  }
}

// Removes a backup file, or every backup file of a database
async function removeBackupFiles({ filepath, databaseId }) {
  if (filepath) {
    await fs.promises.rm(filepath, { force: true });
  }
  if (databaseId !== undefined) {
    await fs.promises.rm(path.join(BACKUP_DIR, String(databaseId)), { recursive: true, force: true });
  }
}

module.exports = { createBackup, isBackupRunning, restoreBackup, removeBackupFiles };

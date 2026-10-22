const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const pool = require('./db');
const { decrypt } = require('./encryption');

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, 'backups');
const DUMP_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_STDERR_LENGTH = 4000;

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

function runCommand({ command, args, env }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: { ...process.env, ...env },
      stdio: ['ignore', 'ignore', 'pipe'],
    });

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr = (stderr + chunk.toString()).slice(-MAX_STDERR_LENGTH);
    });

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('Délai de sauvegarde dépassé'));
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
  if (/délai de sauvegarde dépassé/i.test(message)) return message;
  return 'Erreur pendant la sauvegarde';
}

function buildFilename(database) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const safeName = database.database_name.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${safeName}_${timestamp}.sql`;
}

// Runs a backup of the database and records it in the backups table.
// On failure, the backup is marked as failed and an alert is created.
// Returns { backup } or { backup, error }
async function createBackup(database, { triggerType = 'manual' } = {}) {
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
    // values starting with "-" would be read as options by the dump tools
    if ([database.host, database.username, database.database_name].some((value) => String(value).startsWith('-'))) {
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
    return { backup: updated.rows[0] };
  } catch (error) {
    console.error(`Backup ${backupId} failed:`, error.message);
    await fs.promises.rm(filepath, { force: true }).catch(() => {});

    const reason = toBackupMessage(error);
    const updated = await pool.query(
      `UPDATE backups SET status = 'failed', size = 0, description = $1 WHERE backup_id = $2 RETURNING *`,
      [error.message, backupId]
    );
    await pool.query(
      `INSERT INTO alerts (type, message, backup_id) VALUES ('backup_failed', $1, $2)`,
      [`Échec de la sauvegarde de ${database.name} : ${reason}`, backupId]
    );

    return { backup: updated.rows[0], error: reason };
  }
}

module.exports = { createBackup };

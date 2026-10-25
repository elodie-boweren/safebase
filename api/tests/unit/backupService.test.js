const fs = require('fs');
const os = require('os');
const path = require('path');
const { EventEmitter } = require('events');
const { Writable } = require('stream');

jest.mock('child_process', () => ({ spawn: jest.fn() }));
jest.mock('../../db', () => ({ query: jest.fn() }));
jest.mock('../../events', () => ({ logEvent: jest.fn() }));
jest.mock('../../encryption', () => ({ decrypt: jest.fn(() => 'secret-password') }));

// backups are written in a temporary folder (BACKUP_DIR is read when backupService loads)
const BACKUP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'safebase-tests-'));
process.env.BACKUP_DIR = BACKUP_DIR;

const { spawn } = require('child_process');
const pool = require('../../db');
const { logEvent } = require('../../events');
const { createBackup, restoreBackup, removeBackupFiles } = require('../../backupService');

const POSTGRES_DB = {
  database_id: 1, name: 'Bibliothèque', type: 'postgres', host: 'postgres', port: 5432,
  database_name: 'bibliotheque_postgres', username: 'safebase', password: 'encrypted', user_id: 7,
};
const MYSQL_DB = {
  database_id: 2, name: 'Boutique', type: 'mysql', host: 'mysql', port: 3306,
  database_name: 'boutique_mysql', username: 'safebase', password: 'encrypted', user_id: 7,
};

// Fake pg_dump / mariadb-dump / psql / mariadb process.
// A dump tool writes `output` in the file given by --file= or --result-file=.
function mockTool({ exitCode = 0, stderr = '', output = '-- SQL dump\nCREATE TABLE livres (id INT);\n' } = {}) {
  spawn.mockImplementation((command, args) => {
    const child = new EventEmitter();
    child.stderr = new EventEmitter();
    // restore input (mariadb < file) is read and dropped
    child.stdin = new Writable({ write: (_chunk, _encoding, done) => done() });
    child.kill = jest.fn();

    setImmediate(() => {
      const fileArg = args.find((arg) => arg.startsWith('--file=') || arg.startsWith('--result-file='));
      if (command.endsWith('dump') && exitCode === 0 && fileArg) {
        fs.writeFileSync(fileArg.slice(fileArg.indexOf('=') + 1), output);
      }
      if (stderr) child.stderr.emit('data', Buffer.from(stderr));
      child.emit('close', exitCode);
    });

    return child;
  });
}

// Fake app database: the backup row goes running -> success | failed
function mockBackupsTable() {
  pool.query.mockImplementation(async (sql, params) => {
    if (sql.includes('INSERT INTO backups')) {
      return { rows: [{ backup_id: 42, filename: params[1], filepath: params[2], status: 'running', trigger_type: params[3] }] };
    }
    if (sql.includes("status = 'success'")) {
      return { rows: [{ backup_id: 42, status: 'success', size: params[0] }] };
    }
    if (sql.includes("status = 'failed'")) {
      return { rows: [{ backup_id: 42, status: 'failed', size: 0, description: params[0] }] };
    }
    return { rows: [] };
  });
}

// INSERT values: [name, filename, filepath, trigger_type, database_id]
function insertParams() {
  return pool.query.mock.calls.find(([sql]) => sql.includes('INSERT INTO backups'))[1];
}

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

beforeEach(() => {
  jest.clearAllMocks();
  mockBackupsTable();
  mockTool();
});

afterAll(() => {
  fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
});

describe('createBackup', () => {
  test('PostgreSQL: runs pg_dump and records a successful backup (US02-04, US02-05)', async () => {
    const { backup, error } = await createBackup(POSTGRES_DB);

    expect(error).toBeUndefined();
    expect(backup).toMatchObject({ backup_id: 42, status: 'success' });
    expect(backup.size).toBeGreaterThan(0);

    const [command, args] = spawn.mock.calls[0];
    expect(command).toBe('pg_dump');
    expect(args).toEqual(expect.arrayContaining([
      '--host=postgres', '--port=5432', '--username=safebase', '--dbname=bibliotheque_postgres',
    ]));

    // the file is in BACKUP_DIR/<database_id>/ and its location is recorded
    const [, filename, filepath, triggerType, databaseId] = insertParams();
    expect(filepath).toBe(path.join(BACKUP_DIR, '1', filename));
    expect(filename).toMatch(/^bibliotheque_postgres_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.sql$/);
    expect(triggerType).toBe('manual');
    expect(databaseId).toBe(1);
    expect(fs.existsSync(filepath)).toBe(true);
  });

  test('the password goes through an environment variable, never in the arguments', async () => {
    await createBackup(POSTGRES_DB);

    const [, args, options] = spawn.mock.calls[0];
    expect(options.env.PGPASSWORD).toBe('secret-password');
    expect(args.join(' ')).not.toContain('secret-password');
  });

  test('MySQL: runs mariadb-dump and removes the MariaDB "sandbox" first line (US02-05)', async () => {
    mockTool({ output: '/*M!999999\\- enable the sandbox mode */\n-- MariaDB dump\nCREATE TABLE produits (id INT);\n' });

    const { backup } = await createBackup(MYSQL_DB);

    const [command, args, options] = spawn.mock.calls[0];
    expect(command).toBe('mariadb-dump');
    expect(args[args.length - 1]).toBe('boutique_mysql');
    expect(options.env.MYSQL_PWD).toBe('secret-password');
    expect(backup.status).toBe('success');
    expect(fs.readFileSync(insertParams()[2], 'utf8')).toMatch(/^-- MariaDB dump/);
  });

  test('a scheduled backup is recorded with trigger_type "scheduled" (US02-03)', async () => {
    await createBackup(POSTGRES_DB, { triggerType: 'scheduled' });

    expect(insertParams()[3]).toBe('scheduled');
  });

  test('a success creates a "success" event, not an error alert (US06-02)', async () => {
    await createBackup(POSTGRES_DB);

    expect(logEvent).toHaveBeenCalledTimes(1);
    expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'backup_success', level: 'success' }));
  });

  test('server unreachable: backup marked as failed and an error alert is created (US02-08, US06-01)', async () => {
    mockTool({
      exitCode: 1,
      stderr: 'pg_dump: error: connection to server at "postgres" (172.18.0.2), port 5432 failed: Connection refused\n',
    });

    const { backup, error } = await createBackup(POSTGRES_DB);

    expect(error).toBe('Serveur de base de données injoignable');
    expect(backup.status).toBe('failed');
    // clear reason first, then the raw tool output
    expect(backup.description).toMatch(/^Serveur de base de données injoignable — pg_dump: error: .*Connection refused/);
    expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({
      type: 'backup_failed',
      level: 'error',
      details: expect.stringContaining('Connection refused'),
      database: POSTGRES_DB,
      backup: expect.objectContaining({ backup_id: 42 }),
    }));
    // no half-written file is left
    expect(fs.existsSync(insertParams()[2])).toBe(false);
  });

  test('wrong credentials -> "Identifiants invalides"', async () => {
    mockTool({
      exitCode: 2,
      stderr: "mariadb-dump: Got error: 1045: \"Access denied for user 'safebase'@'172.18.0.5' (using password: YES)\" when trying to connect\n",
    });

    const { error } = await createBackup(MYSQL_DB);

    expect(error).toBe('Identifiants invalides');
  });

  test('refuses a second backup of the same database while one is running', async () => {
    const first = createBackup(POSTGRES_DB);
    const second = await createBackup(POSTGRES_DB);

    expect(second).toMatchObject({ backup: null, alreadyRunning: true });
    await first;
    expect(spawn).toHaveBeenCalledTimes(1);
  });

  test('a connection value starting with "-" is rejected before running the tool', async () => {
    const { backup, error } = await createBackup({ ...POSTGRES_DB, host: '--help' });

    expect(spawn).not.toHaveBeenCalled();
    expect(error).toBe('Erreur pendant la sauvegarde');
    expect(backup.status).toBe('failed');
  });
});

// a backup file already on disk
  function existingBackup(database) {
    const directory = path.join(BACKUP_DIR, String(database.database_id));
    fs.mkdirSync(directory, { recursive: true });
    const filepath = path.join(directory, `${database.database_name}_restore-test.sql`);
    fs.writeFileSync(filepath, '-- SQL dump\n');
    return { backup_id: 99, filename: path.basename(filepath), filepath, database_id: database.database_id };
  }

describe('restoreBackup', () => {
  test('PostgreSQL: runs psql in one transaction that stops at the first error (US04-05)', async () => {
    const backup = existingBackup(POSTGRES_DB);

    await expect(restoreBackup(POSTGRES_DB, backup)).resolves.toEqual({ ok: true });

    const [command, args, options] = spawn.mock.calls[0];
    expect(command).toBe('psql');
    expect(args).toEqual(expect.arrayContaining([
      '--dbname=bibliotheque_postgres', '--single-transaction', '--set=ON_ERROR_STOP=1', `--file=${backup.filepath}`,
    ]));
    expect(options.env.PGPASSWORD).toBe('secret-password');
    expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'restore_success', level: 'success' }));
  });

  test('MySQL: sends the file to the mariadb client (US04-04)', async () => {
    const backup = existingBackup(MYSQL_DB);

    await expect(restoreBackup(MYSQL_DB, backup)).resolves.toEqual({ ok: true });

    const [command, args, options] = spawn.mock.calls[0];
    expect(command).toBe('mariadb');
    expect(args[args.length - 1]).toBe('boutique_mysql');
    // the file is piped on stdin
    expect(options.stdio[0]).toBe('pipe');
  });

  test('deleted file: restore fails and a restore_failed alert is linked to the backup (US04-08, US07-01)', async () => {
    const backup = { backup_id: 98, filename: 'gone.sql', filepath: path.join(BACKUP_DIR, '1', 'gone.sql'), database_id: 1 };

    await expect(restoreBackup(POSTGRES_DB, backup)).resolves.toEqual({ ok: false, error: 'Fichier de sauvegarde introuvable' });

    expect(spawn).not.toHaveBeenCalled();
    expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({
      type: 'restore_failed',
      level: 'error',
      database: POSTGRES_DB,
      backup,
    }));
  });

  test('target database stopped: restore fails with a clear reason (US04-08)', async () => {
    const backup = existingBackup(POSTGRES_DB);
    mockTool({
      exitCode: 2,
      stderr: 'psql: error: connection to server at "postgres" (172.18.0.2), port 5432 failed: Connection refused\n',
    });

    await expect(restoreBackup(POSTGRES_DB, backup)).resolves.toEqual({
      ok: false,
      error: 'Serveur de base de données injoignable',
    });
    expect(logEvent).toHaveBeenCalledWith(expect.objectContaining({
      type: 'restore_failed',
      details: expect.stringContaining('Connection refused'),
    }));
  });
});

describe('removeBackupFiles', () => {
  test('removes every backup file of a deleted database (US05-08)', async () => {
    const directory = path.join(BACKUP_DIR, '3');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'a.sql'), '');
    fs.writeFileSync(path.join(directory, 'b.sql'), '');

    await removeBackupFiles({ databaseId: 3 });

    expect(fs.existsSync(directory)).toBe(false);
  });
});

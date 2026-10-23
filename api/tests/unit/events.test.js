jest.mock('../../db', () => ({ query: jest.fn() }));

const pool = require('../../db');
const { logEvent } = require('../../events');

// values passed to the INSERT, by column name
function insertedValues() {
  const [, values] = pool.query.mock.calls[0];
  const [type, level, message, is_read, user_id, database_id, database_name, backup_id, backup_filename] = values;
  return { type, level, message, is_read, user_id, database_id, database_name, backup_id, backup_filename };
}

beforeEach(() => {
  jest.clearAllMocks();
  pool.query.mockResolvedValue({ rows: [] });
});

test('a failed backup is recorded as an unread error linked to its database and backup (US06-01, US06-06)', async () => {
  await logEvent({
    type: 'backup_failed',
    level: 'error',
    message: 'Échec de la sauvegarde manuelle de db_a : Identifiants invalides',
    details: 'Access denied for user',
    database: { database_id: 1, name: 'db_a', user_id: 7 },
    backup: { backup_id: 42, filename: 'db_a_2026.sql' },
  });

  expect(insertedValues()).toEqual({
    type: 'backup_failed',
    level: 'error',
    message: 'Échec de la sauvegarde manuelle de db_a : Identifiants invalides — Access denied for user',
    is_read: false,
    user_id: 7,
    database_id: 1,
    database_name: 'db_a',
    backup_id: 42,
    backup_filename: 'db_a_2026.sql',
  });
});

test('without details the message is kept as is', async () => {
  await logEvent({ type: 'database_added', level: 'info', message: 'Base db_a (MySQL) ajoutée', userId: 7 });

  expect(insertedValues().message).toBe('Base db_a (MySQL) ajoutée');
});

test('an explicit userId wins over the database owner', async () => {
  await logEvent({ type: 'x', level: 'info', message: 'm', userId: 3, database: { database_id: 1, name: 'db_a', user_id: 7 } });

  expect(insertedValues().user_id).toBe(3);
});

test('names are copied so the history survives a deletion', async () => {
  await logEvent({ type: 'database_deleted', level: 'info', message: 'Base db_a supprimée', userId: 7, database: { name: 'db_a' } });

  expect(insertedValues()).toMatchObject({
    database_id: null,
    database_name: 'db_a',
    backup_id: null,
    backup_filename: null,
  });
});

test('a database error never breaks the action', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  pool.query.mockRejectedValueOnce(new Error('connection lost'));

  await expect(logEvent({ type: 'x', level: 'info', message: 'm', userId: 7 })).resolves.toBeUndefined();
});

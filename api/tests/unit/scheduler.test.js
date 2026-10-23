jest.mock('node-cron', () => ({
  schedule: jest.fn(() => ({ destroy: jest.fn() })),
  validate: jest.fn(() => true),
}));
jest.mock('../../db', () => ({ query: jest.fn() }));
jest.mock('../../backupService', () => ({
  createBackup: jest.fn(),
  isBackupRunning: jest.fn(() => false),
}));

const cron = require('node-cron');
const pool = require('../../db');
const { createBackup, isBackupRunning } = require('../../backupService');
const {
  scheduleToCron,
  cronToSchedule,
  describeCron,
  scheduleDatabase,
  unscheduleDatabase,
} = require('../../scheduler');

// the scheduler keeps its tasks in memory: each test uses its own database ids
function database(id, overrides = {}) {
  return { database_id: id, name: `db_${id}`, cron_expression: '0 14 * * *', is_schedule_enabled: true, ...overrides };
}

// task returned by the nth call to cron.schedule
function scheduledTask(index = 0) {
  return cron.schedule.mock.results[index].value;
}

// runs the function given to cron.schedule, as node-cron would at the scheduled time
function runTask(index = 0) {
  return cron.schedule.mock.calls[index][1]();
}

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

beforeEach(() => jest.clearAllMocks());

describe('scheduleToCron (US02-01, US02-07)', () => {
  test.each([
    [{ frequency: 'daily', hour: 14, minute: 0 }, '0 14 * * *'],
    [{ frequency: 'weekly', hour: 9, minute: 30, weekday: 1 }, '30 9 * * 1'],
    [{ frequency: 'monthly', hour: 3, minute: 15, monthDay: 28 }, '15 3 28 * *'],
    [{ frequency: 'interval', minute: 5, intervalHours: 6 }, '5 */6 * * *'],
  ])('%o -> "%s"', (schedule, expected) => {
    expect(scheduleToCron(schedule)).toEqual({ cron: expected });
  });

  test('accepts the string values sent by the form', () => {
    expect(scheduleToCron({ frequency: 'daily', hour: '14', minute: '30' })).toEqual({ cron: '30 14 * * *' });
  });

  test.each([
    ['an unknown frequency', { frequency: 'yearly', hour: 1, minute: 0 }],
    ['a missing frequency', { hour: 1, minute: 0 }],
    ['a minute out of range', { frequency: 'daily', hour: 1, minute: 60 }],
    ['an hour out of range', { frequency: 'daily', hour: 24, minute: 0 }],
    ['a non numeric hour', { frequency: 'daily', hour: 'abc', minute: 0 }],
    ['a weekday out of range', { frequency: 'weekly', hour: 1, minute: 0, weekday: 7 }],
    ['the 29th (not in every month)', { frequency: 'monthly', hour: 1, minute: 0, monthDay: 29 }],
    ['an interval not in the allowed list', { frequency: 'interval', minute: 0, intervalHours: 5 }],
  ])('rejects %s', (_label, schedule) => {
    const result = scheduleToCron(schedule);

    expect(result.cron).toBeUndefined();
    expect(result.error).toEqual(expect.any(String));
  });
});

describe('cronToSchedule', () => {
  test.each([
    ['0 14 * * *', { frequency: 'daily', hour: '14', minute: '00' }],
    ['30 9 * * 1', { frequency: 'weekly', weekday: '1', hour: '9', minute: '30' }],
    ['15 3 28 * *', { frequency: 'monthly', monthDay: '28', hour: '3', minute: '15' }],
    ['5 */6 * * *', { frequency: 'interval', intervalHours: '6', minute: '05' }],
  ])('"%s" -> form values', (expression, expected) => {
    expect(cronToSchedule(expression)).toEqual(expected);
  });

  test('no expression -> null', () => {
    expect(cronToSchedule(null)).toBeNull();
  });
});

describe('describeCron', () => {
  test.each([
    ['0 14 * * *', 'tous les jours à 14h00'],
    ['30 9 * * 1', 'chaque lundi à 09h30'],
    ['15 3 28 * *', 'le 28 de chaque mois à 03h15'],
    ['5 */1 * * *', 'toutes les heures, à la minute 05'],
    ['0 */6 * * *', 'toutes les 6 heures, à la minute 00'],
    [null, 'aucune'],
  ])('"%s" -> "%s"', (expression, expected) => {
    expect(describeCron(expression)).toBe(expected);
  });
});

describe('scheduleDatabase / unscheduleDatabase', () => {
  test('registers a cron task with the database expression (US02-01)', () => {
    scheduleDatabase(database(1));

    expect(cron.schedule).toHaveBeenCalledWith('0 14 * * *', expect.any(Function), {
      timezone: 'Europe/Paris',
      name: 'backup-1',
    });
    unscheduleDatabase(1);
  });

  test('two databases keep their own frequency (US02-02)', () => {
    scheduleDatabase(database(2, { cron_expression: '0 14 * * *' }));
    scheduleDatabase(database(3, { cron_expression: '30 9 * * 1' }));

    expect(cron.schedule).toHaveBeenCalledTimes(2);
    expect(cron.schedule.mock.calls[0][0]).toBe('0 14 * * *');
    expect(cron.schedule.mock.calls[1][0]).toBe('30 9 * * 1');
    expect(scheduledTask(0).destroy).not.toHaveBeenCalled();
    unscheduleDatabase(2);
    unscheduleDatabase(3);
  });

  test('a new schedule replaces the old task of the same database', () => {
    scheduleDatabase(database(4, { cron_expression: '0 14 * * *' }));
    scheduleDatabase(database(4, { cron_expression: '0 18 * * *' }));

    expect(scheduledTask(0).destroy).toHaveBeenCalled();
    expect(scheduledTask(1).destroy).not.toHaveBeenCalled();
    unscheduleDatabase(4);
  });

  test('disabling the schedule stops the task (US02-06)', () => {
    scheduleDatabase(database(5));
    scheduleDatabase(database(5, { is_schedule_enabled: false }));

    expect(cron.schedule).toHaveBeenCalledTimes(1);
    expect(scheduledTask(0).destroy).toHaveBeenCalled();
  });

  test('deleting the database removes its task (US05-07)', () => {
    scheduleDatabase(database(6));
    unscheduleDatabase(6);

    expect(scheduledTask(0).destroy).toHaveBeenCalled();
  });

  test('an invalid cron expression is not registered (US02-07)', () => {
    cron.validate.mockReturnValueOnce(false);
    scheduleDatabase(database(7, { cron_expression: 'not a cron' }));

    expect(cron.schedule).not.toHaveBeenCalled();
  });
});

describe('scheduled run', () => {
  test('launches a "scheduled" backup (US02-03)', async () => {
    const row = database(8);
    pool.query.mockResolvedValueOnce({ rows: [row] });
    createBackup.mockResolvedValueOnce({ backup: { backup_id: 1 } });

    scheduleDatabase(row);
    await runTask();

    expect(createBackup).toHaveBeenCalledWith(row, { triggerType: 'scheduled' });
    unscheduleDatabase(8);
  });

  test('skips the run while a backup of the same database is running', async () => {
    isBackupRunning.mockReturnValueOnce(true);

    scheduleDatabase(database(9));
    await runTask();

    expect(pool.query).not.toHaveBeenCalled();
    expect(createBackup).not.toHaveBeenCalled();
    unscheduleDatabase(9);
  });

  test('schedule disabled in the meantime: no backup and the task is removed (US02-06)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [database(10, { is_schedule_enabled: false })] });

    scheduleDatabase(database(10));
    await runTask();

    expect(createBackup).not.toHaveBeenCalled();
    expect(scheduledTask(0).destroy).toHaveBeenCalled();
  });

  test('database deleted in the meantime: no backup and the task is removed (US05-07)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    scheduleDatabase(database(11));
    await runTask();

    expect(createBackup).not.toHaveBeenCalled();
    expect(scheduledTask(0).destroy).toHaveBeenCalled();
  });
});

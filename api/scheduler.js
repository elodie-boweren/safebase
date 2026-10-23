const cron = require('node-cron');
const pool = require('./db');
const { createBackup, isBackupRunning } = require('./backupService');

const TIMEZONE = process.env.SCHEDULER_TIMEZONE || 'Europe/Paris';
const INTERVAL_HOURS = [1, 2, 3, 4, 6, 8, 12];

// one cron task per scheduled database
const tasks = new Map();

function toInt(value) {
  const number = Number(value);
  return Number.isInteger(number) ? number : NaN;
}

function inRange(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

// User choice -> cron expression ("minute hour day-of-month month day-of-week").
// Returns { cron } or { error }
function scheduleToCron(schedule = {}) {
  if (!['daily', 'weekly', 'monthly', 'interval'].includes(schedule.frequency)) {
    return { error: 'Fréquence invalide (daily, weekly, monthly ou interval)' };
  }

  const minute = toInt(schedule.minute);
  if (!inRange(minute, 0, 59)) return { error: 'Minute invalide (0 à 59)' };

  if (schedule.frequency === 'interval') {
    const hours = toInt(schedule.intervalHours);
    if (!INTERVAL_HOURS.includes(hours)) {
      return { error: `Intervalle invalide (valeurs possibles : ${INTERVAL_HOURS.join(', ')} heures)` };
    }
    return { cron: `${minute} */${hours} * * *` };
  }

  const hour = toInt(schedule.hour);
  if (!inRange(hour, 0, 23)) return { error: 'Heure invalide (0 à 23)' };

  if (schedule.frequency === 'daily') {
    return { cron: `${minute} ${hour} * * *` };
  }

  if (schedule.frequency === 'weekly') {
    const weekday = toInt(schedule.weekday);
    if (!inRange(weekday, 0, 6)) return { error: 'Jour de la semaine invalide (0 = dimanche à 6 = samedi)' };
    return { cron: `${minute} ${hour} * * ${weekday}` };
  }

  if (schedule.frequency === 'monthly') {
    // up to the 28th so that every month has the day
    const monthDay = toInt(schedule.monthDay);
    if (!inRange(monthDay, 1, 28)) return { error: 'Jour du mois invalide (1 à 28)' };
    return { cron: `${minute} ${hour} ${monthDay} * *` };
  }

  return { error: 'Fréquence invalide (daily, weekly, monthly ou interval)' };
}

// Cron expression written by scheduleToCron -> user choice (for the form), or null
function cronToSchedule(expression) {
  if (!expression) return null;
  const [rawMinute, hour, monthDay, , weekday] = expression.split(' ');
  const minute = rawMinute.padStart(2, '0');

  if (hour.startsWith('*/')) {
    return { frequency: 'interval', intervalHours: hour.slice(2), minute };
  }
  if (monthDay !== '*') {
    return { frequency: 'monthly', monthDay, hour, minute };
  }
  if (weekday !== '*') {
    return { frequency: 'weekly', weekday, hour, minute };
  }
  return { frequency: 'daily', hour, minute };
}

const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

// Cron expression -> sentence for the history ("tous les jours à 14h00")
function describeCron(expression) {
  const schedule = cronToSchedule(expression);
  if (!schedule) return 'aucune';
  const time = `${String(schedule.hour).padStart(2, '0')}h${schedule.minute}`;
  if (schedule.frequency === 'interval') {
    const hours = Number(schedule.intervalHours);
    return `${hours === 1 ? 'toutes les heures' : `toutes les ${hours} heures`}, à la minute ${schedule.minute}`;
  }
  if (schedule.frequency === 'weekly') return `chaque ${WEEKDAYS[Number(schedule.weekday)]} à ${time}`;
  if (schedule.frequency === 'monthly') return `le ${schedule.monthDay} de chaque mois à ${time}`;
  return `tous les jours à ${time}`;
}

async function runScheduledBackup(databaseId) {
  // the "lock": a database still being dumped skips this run
  if (isBackupRunning(databaseId)) {
    console.log(`[scheduler] database ${databaseId}: backup already running, run skipped`);
    return;
  }

  // reload the row: connection settings may have changed since scheduling
  const result = await pool.query('SELECT * FROM databases WHERE database_id = $1', [databaseId]);
  const database = result.rows[0];
  if (!database || !database.is_schedule_enabled) {
    unscheduleDatabase(databaseId);
    return;
  }

  const { backup, error } = await createBackup(database, { triggerType: 'scheduled' });
  if (error) {
    console.error(`[scheduler] database ${databaseId}: ${error}`);
  } else {
    console.log(`[scheduler] database ${databaseId}: backup ${backup.backup_id} done`);
  }
}

function unscheduleDatabase(databaseId) {
  const task = tasks.get(databaseId);
  if (task) {
    task.destroy();
    tasks.delete(databaseId);
  }
}

// (Re)registers the task of a database from its row: stops the old one first
function scheduleDatabase(database) {
  unscheduleDatabase(database.database_id);

  if (!database.is_schedule_enabled || !database.cron_expression) return;
  if (!cron.validate(database.cron_expression)) {
    console.error(`[scheduler] database ${database.database_id}: invalid cron "${database.cron_expression}"`);
    return;
  }

  const task = cron.schedule(
    database.cron_expression,
    () => runScheduledBackup(database.database_id).catch((error) => console.error('[scheduler]', error)),
    { timezone: TIMEZONE, name: `backup-${database.database_id}` }
  );
  tasks.set(database.database_id, task);
}

// Registers every enabled schedule. The database may not be ready yet when
// the API starts with Docker, so it retries a few times.
async function initScheduler({ retries = 10, delayMs = 3000 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const result = await pool.query(
        'SELECT * FROM databases WHERE is_schedule_enabled = TRUE AND cron_expression IS NOT NULL'
      );
      result.rows.forEach(scheduleDatabase);
      console.log(`[scheduler] ${tasks.size} scheduled backup(s) registered (timezone ${TIMEZONE})`);
      return;
    } catch (error) {
      console.error(`[scheduler] init attempt ${attempt} failed: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

module.exports = { scheduleToCron, cronToSchedule, describeCron, scheduleDatabase, unscheduleDatabase, initScheduler };

DROP TABLE IF EXISTS alerts, backups, databases, users, alert, backup, database_connection, app_user CASCADE;

CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin'
);

CREATE TABLE IF NOT EXISTS databases (
  database_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  host VARCHAR(255) NOT NULL,
  port INT NOT NULL,
  database_name VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  cron_expression VARCHAR(255),
  is_schedule_enabled BOOLEAN DEFAULT FALSE,
  schedule_created_at TIMESTAMP,
  schedule_updated_at TIMESTAMP,
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS backups (
  backup_id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  filename VARCHAR(255),
  filepath VARCHAR(255),
  size BIGINT,
  status VARCHAR(50) NOT NULL,
  backup_type VARCHAR(50) DEFAULT 'full',
  storage_location VARCHAR(50) DEFAULT 'local',
  trigger_type VARCHAR(50) DEFAULT 'manual',
  schedule_id INT,
  created_at TIMESTAMP DEFAULT NOW(),
  database_id INT REFERENCES databases(database_id) ON DELETE CASCADE
);

-- notification history: every action (level info/success) and every failure (level error)
-- names are copied so the history survives the deletion of a database or a backup
CREATE TABLE IF NOT EXISTS alerts (
  alert_id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  level VARCHAR(20) NOT NULL DEFAULT 'error',
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  database_id INT REFERENCES databases(database_id) ON DELETE SET NULL,
  database_name VARCHAR(255),
  backup_id INT REFERENCES backups(backup_id) ON DELETE SET NULL,
  backup_filename VARCHAR(255)
);
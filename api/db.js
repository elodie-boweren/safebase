const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'safebase',
  password: 'safebasepass',
  database: 'demo_postgres',
});

module.exports = pool;
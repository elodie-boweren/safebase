const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  user: process.env.POSTGRES_USER || 'safebase',
  password: process.env.POSTGRES_PASSWORD || 'safebasepass',
  database: process.env.POSTGRES_DATABASE || 'demo_postgres',
});

module.exports = pool;

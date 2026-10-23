const { Client } = require('pg');
const mysql = require('mysql2/promise');

const SUPPORTED_TYPES = ['mysql', 'postgres'];
const CONNECTION_TIMEOUT_MS = 5000;

// Translate driver errors into a clear message for the user
function toConnectionMessage(error) {
  switch (error.code) {
    case 'ECONNREFUSED':
      return 'Connexion refusée : vérifiez l\'hôte et le port';
    case 'ENOTFOUND':
    case 'EAI_AGAIN':
      return 'Hôte introuvable';
    case 'ETIMEDOUT':
      return 'Délai de connexion dépassé : le serveur ne répond pas';
    case '28P01':
    case '28000':
    case 'ER_ACCESS_DENIED_ERROR':
      return 'Identifiants invalides';
    case '3D000':
    case 'ER_BAD_DB_ERROR':
      return 'La base de données n\'existe pas';
    default:
      if (/timeout/i.test(error.message)) {
        return 'Délai de connexion dépassé : le serveur ne répond pas';
      }
      return 'Connexion impossible';
  }
}

async function testPostgres({ host, port, database_name, username, password }) {
  const client = new Client({
    host,
    port,
    database: database_name,
    user: username,
    password,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
  });

  try {
    await client.connect();
    await client.query('SELECT 1');
  } finally {
    await client.end().catch(() => {});
  }
}

async function testMysql({ host, port, database_name, username, password }) {
  const connection = await mysql.createConnection({
    host,
    port,
    database: database_name,
    user: username,
    password,
    connectTimeout: CONNECTION_TIMEOUT_MS,
  });

  try {
    await connection.ping();
  } finally {
    await connection.end().catch(() => {});
  }
}

// Returns { ok: true } or { ok: false, error, details }
async function testConnection(config) {
  try {
    if (config.type === 'postgres') {
      await testPostgres(config);
    } else if (config.type === 'mysql') {
      await testMysql(config);
    } else {
      return { ok: false, error: `Type de base non supporté : ${config.type}` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toConnectionMessage(error), details: error.message };
  }
}

module.exports = { testConnection, SUPPORTED_TYPES };

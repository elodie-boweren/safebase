jest.mock('pg', () => ({ Client: jest.fn() }));
jest.mock('mysql2/promise', () => ({ createConnection: jest.fn() }));

const { Client } = require('pg');
const mysql = require('mysql2/promise');
const { testConnection, SUPPORTED_TYPES } = require('../../connectionTester');

const POSTGRES = {
  type: 'postgres', host: 'postgres', port: 5432,
  database_name: 'bibliotheque_postgres', username: 'safebase', password: 'safebasepass',
};
const MYSQL = {
  type: 'mysql', host: 'mysql', port: 3306,
  database_name: 'boutique_mysql', username: 'safebase', password: 'safebasepass',
};

function driverError(code, message = `driver error ${code}`) {
  return Object.assign(new Error(message), { code });
}

// fake pg client: connect() succeeds, or fails with the given error
function mockPostgres(error) {
  const client = {
    connect: error ? jest.fn().mockRejectedValue(error) : jest.fn().mockResolvedValue(),
    query: jest.fn().mockResolvedValue({ rows: [] }),
    end: jest.fn().mockResolvedValue(),
  };
  Client.mockImplementation(() => client);
  return client;
}

// fake mysql2 connection: createConnection() succeeds, or fails with the given error
function mockMysql(error) {
  const connection = { ping: jest.fn().mockResolvedValue(), end: jest.fn().mockResolvedValue() };
  mysql.createConnection.mockImplementation(() => (error ? Promise.reject(error) : Promise.resolve(connection)));
  return connection;
}

beforeEach(() => jest.clearAllMocks());

test('only MySQL and PostgreSQL are supported for now (MongoDB is a bonus)', () => {
  expect(SUPPORTED_TYPES).toEqual(['mysql', 'postgres']);
});

test('MongoDB is refused until it is implemented (US01-03)', async () => {
  await expect(testConnection({ ...POSTGRES, type: 'mongodb' })).resolves.toEqual({
    ok: false,
    error: 'Type de base non supporté : mongodb',
  });
  expect(Client).not.toHaveBeenCalled();
});

describe('valid connection', () => {
  test('PostgreSQL (US01-02)', async () => {
    const client = mockPostgres();

    await expect(testConnection(POSTGRES)).resolves.toEqual({ ok: true });
    expect(Client).toHaveBeenCalledWith(expect.objectContaining({
      host: 'postgres',
      port: 5432,
      database: 'bibliotheque_postgres',
      user: 'safebase',
      connectionTimeoutMillis: 5000,
    }));
    expect(client.query).toHaveBeenCalledWith('SELECT 1');
    expect(client.end).toHaveBeenCalled();
  });

  test('MySQL (US01-01)', async () => {
    const connection = mockMysql();

    await expect(testConnection(MYSQL)).resolves.toEqual({ ok: true });
    expect(mysql.createConnection).toHaveBeenCalledWith(expect.objectContaining({
      host: 'mysql',
      port: 3306,
      database: 'boutique_mysql',
      user: 'safebase',
      connectTimeout: 5000,
    }));
    expect(connection.ping).toHaveBeenCalled();
    expect(connection.end).toHaveBeenCalled();
  });
});

describe('failed connection (US01-06, US01-07)', () => {
  test.each([
    ['28P01', 'Identifiants invalides'],
    ['3D000', "La base de données n'existe pas"],
    ['ECONNREFUSED', "Connexion refusée : vérifiez l'hôte et le port"],
    ['ENOTFOUND', 'Hôte introuvable'],
    ['ETIMEDOUT', 'Délai de connexion dépassé : le serveur ne répond pas'],
  ])('PostgreSQL error %s -> "%s"', async (code, message) => {
    const client = mockPostgres(driverError(code));

    await expect(testConnection(POSTGRES)).resolves.toEqual({
      ok: false,
      error: message,
      details: `driver error ${code}`,
    });
    // the connection is closed even on failure
    expect(client.end).toHaveBeenCalled();
  });

  test.each([
    ['ER_ACCESS_DENIED_ERROR', 'Identifiants invalides'],
    ['ER_BAD_DB_ERROR', "La base de données n'existe pas"],
    ['ECONNREFUSED', "Connexion refusée : vérifiez l'hôte et le port"],
  ])('MySQL error %s -> "%s"', async (code, message) => {
    mockMysql(driverError(code));

    await expect(testConnection(MYSQL)).resolves.toMatchObject({ ok: false, error: message });
  });

  test('a timeout without error code is still reported as a timeout', async () => {
    mockPostgres(new Error('Connection terminated due to connection timeout'));

    await expect(testConnection(POSTGRES)).resolves.toMatchObject({
      ok: false,
      error: 'Délai de connexion dépassé : le serveur ne répond pas',
    });
  });

  test('an unknown error gives a generic message', async () => {
    mockPostgres(driverError('SOMETHING_ELSE'));

    await expect(testConnection(POSTGRES)).resolves.toMatchObject({ ok: false, error: 'Connexion impossible' });
  });
});

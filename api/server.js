const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
const PORT = process.env.PORT || 3000;
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'safebase_secret_key';
const { encrypt } = require('./encryption');
const { testConnection, SUPPORTED_TYPES } = require('./connectionTester');
const { createBackup } = require('./backupService');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token invalide ou expiré' });
  }
}

const pool = require('./db');
const bcrypt = require('bcryptjs');

app.get('/', (req, res) => {
  res.send('SafeBase API is running');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'safebase-backend' });
});

app.get('/test-db', async (req, res) => {
  const result = await pool.query('SELECT NOW()');
  res.send(`Base connectée. Heure : ${result.rows[0].now}`);
});

app.post('/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING user_id, username, email, role',
      [username, email, hashedPassword]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message, details: error.detail });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { user_id: user.user_id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/me', authMiddleware, (req, res) => {
  res.json({ message: 'Tu es connecté.e', user: req.user });
});

// add a db
app.post('/databases', authMiddleware, async (req, res) => {
  const { name, description, type, host, port, database_name, username, password } = req.body;

  const missing = ['name', 'type', 'host', 'port', 'database_name', 'username', 'password']
    .filter((field) => req.body[field] === undefined || req.body[field] === null || req.body[field] === '');
  if (missing.length > 0) {
    return res.status(400).json({ error: `Champs obligatoires manquants : ${missing.join(', ')}` });
  }

  if (!SUPPORTED_TYPES.includes(type)) {
    return res.status(400).json({ error: `Type de base non supporté. Types acceptés : ${SUPPORTED_TYPES.join(', ')}` });
  }

  const portNumber = Number(port);
  if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) {
    return res.status(400).json({ error: 'Le port doit être un entier entre 1 et 65535' });
  }

  // the connection is saved only if it works
  const connectionTest = await testConnection({ type, host, port: portNumber, database_name, username, password });
  if (!connectionTest.ok) {
    return res.status(400).json({ error: `Échec du test de connexion : ${connectionTest.error}`, details: connectionTest.details });
  }

  try {
    const encryptedPassword = encrypt(password);

    const result = await pool.query(
      `INSERT INTO databases (name, description, type, host, port, database_name, username, password, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING database_id, name, description, type, host, port, database_name, username`,
      [name, description, type, host, portNumber, database_name, username, encryptedPassword, req.user.user_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message, details: error.detail });
  }
});

// list a bases
app.get('/databases', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.database_id, d.name, d.description, d.type, d.host, d.port, d.database_name, d.username,
              d.cron_expression, d.is_schedule_enabled,
              last.created_at AS last_backup_at, last.status AS last_backup_status
       FROM databases d
       LEFT JOIN LATERAL (
         SELECT created_at, status FROM backups
         WHERE backups.database_id = d.database_id
         ORDER BY created_at DESC LIMIT 1
       ) last ON TRUE
       WHERE d.user_id = $1 ORDER BY d.database_id`,
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// delete a db
// if the db has backups, deletion is refused unless ?force=true (backups are then deleted too)
app.delete('/databases/:id', authMiddleware, async (req, res) => {
  const databaseId = Number(req.params.id);
  if (!Number.isInteger(databaseId)) {
    return res.status(400).json({ error: 'Identifiant de base invalide' });
  }

  try {
    const backupsResult = await pool.query(
      `SELECT COUNT(b.backup_id)::int AS backups_count
       FROM databases d LEFT JOIN backups b ON b.database_id = d.database_id
       WHERE d.database_id = $1 AND d.user_id = $2
       GROUP BY d.database_id`,
      [databaseId, req.user.user_id]
    );

    if (backupsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Base introuvable' });
    }

    const { backups_count } = backupsResult.rows[0];
    if (backups_count > 0 && req.query.force !== 'true') {
      return res.status(409).json({
        error: `Cette base a ${backups_count} sauvegarde(s). Confirmez la suppression avec ?force=true : les sauvegardes seront aussi supprimées.`,
        backups_count,
      });
    }

    const result = await pool.query(
      'DELETE FROM databases WHERE database_id = $1 AND user_id = $2 RETURNING database_id',
      [databaseId, req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Base introuvable' });
    }

    res.json({ message: 'Base supprimée', database_id: result.rows[0].database_id, deleted_backups: backups_count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// run a manual backup of a db
app.post('/databases/:id/backup', authMiddleware, async (req, res) => {
  const databaseId = Number(req.params.id);
  if (!Number.isInteger(databaseId)) {
    return res.status(400).json({ error: 'Identifiant de base invalide' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM databases WHERE database_id = $1 AND user_id = $2',
      [databaseId, req.user.user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Base introuvable' });
    }

    const { backup, error } = await createBackup(result.rows[0]);
    if (error) {
      return res.status(500).json({ error: `Échec de la sauvegarde : ${error}`, backup });
    }

    res.status(201).json(backup);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// list the backups of a db, most recent first
app.get('/databases/:id/backups', authMiddleware, async (req, res) => {
  const databaseId = Number(req.params.id);
  if (!Number.isInteger(databaseId)) {
    return res.status(400).json({ error: 'Identifiant de base invalide' });
  }

  try {
    const owner = await pool.query(
      'SELECT 1 FROM databases WHERE database_id = $1 AND user_id = $2',
      [databaseId, req.user.user_id]
    );
    if (owner.rows.length === 0) {
      return res.status(404).json({ error: 'Base introuvable' });
    }

    const result = await pool.query(
      `SELECT backup_id, name, filename, filepath, size, status, trigger_type, created_at, database_id, description
       FROM backups WHERE database_id = $1 ORDER BY created_at DESC`,
      [databaseId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API démarrée sur http://localhost:${PORT}`);
});
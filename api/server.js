const express = require('express');
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'safebase_secret_key';
const { encrypt } = require('./encryption');

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

  try {
    const encryptedPassword = encrypt(password);

    const result = await pool.query(
      `INSERT INTO databases (name, description, type, host, port, database_name, username, password, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING database_id, name, description, type, host, port, database_name, username`,
      [name, description, type, host, port, database_name, username, encryptedPassword, req.user.user_id]
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
      `SELECT database_id, name, description, type, host, port, database_name, username,
              cron_expression, is_schedule_enabled
       FROM databases WHERE user_id = $1 ORDER BY database_id`,
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// delate a db
app.delete('/databases/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM databases WHERE database_id = $1 AND user_id = $2 RETURNING database_id',
      [req.params.id, req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Base introuvable' });
    }

    res.json({ message: 'Base supprimée', database_id: result.rows[0].database_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API démarrée sur http://localhost:${PORT}`);
});
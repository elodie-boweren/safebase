const express = require('express');
const app = express();
app.use(express.json());
const PORT = 3000;
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'safebase_secret_key';

const pool = require('./db');
const bcrypt = require('bcryptjs');

app.get('/', (req, res) => {
  res.send('SafeBase API is running');
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

app.listen(PORT, () => {
  console.log(`API démarrée sur http://localhost:${PORT}`);
});
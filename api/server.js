const express = require('express');
const app = express();
app.use(express.json());
const PORT = 3000;

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

app.listen(PORT, () => {
  console.log(`API démarrée sur http://localhost:${PORT}`);
});
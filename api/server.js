const express = require('express');
const app = express();
const PORT = 3000;

const pool = require('./db');

app.get('/', (req, res) => {
  res.send('SafeBase API is running');
});

app.get('/test-db', async (req, res) => {
  const result = await pool.query('SELECT NOW()');
  res.send(`Base connectée ! Heure : ${result.rows[0].now}`);
});

app.listen(PORT, () => {
  console.log(`API démarrée sur http://localhost:${PORT}`);
});
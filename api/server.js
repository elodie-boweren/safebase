const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('SafeBase API is running');
});

app.listen(PORT, () => {
  console.log(`API démarrée sur http://localhost:${PORT}`);
});
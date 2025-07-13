const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello from Render API Server!');
});

app.get('/name/:username', async (req, res) => {
  const username = req.params.username;
  try {
    const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
    if (response.ok) {
      const data = await response.json();
      if (data) {
        res.json({ username: data.name, uuid: data.id });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } else {
      res.status(response.status).json({ error: `Mojang API error: ${response.statusText}` });
    }
  } catch (error) {
    console.error('Error fetching UUID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
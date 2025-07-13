const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 3000;
const HYPIXEL_API_KEY = process.env.API_KEY;

app.get('/', (req, res) => {
  res.send('Hello from Render API Server!');
});

app.get('/name/:username', async (req, res) => {
  const username = req.params.username;
  try {
    // Fetch UUID from Mojang API
    const mojangResponse = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
    if (!mojangResponse.ok) {
      return res.status(mojangResponse.status).json({ error: `Mojang API error: ${mojangResponse.statusText}` });
    }
    const mojangData = await mojangResponse.json();

    if (!mojangData || !mojangData.id) {
      return res.status(404).json({ error: 'User not found on Mojang API' });
    }

    const uuid = mojangData.id;

    // Fetch Hypixel API data
    if (!HYPIXEL_API_KEY) {
      return res.status(500).json({ error: 'Hypixel API key not configured' });
    }

    const hypixelResponse = await fetch(`https://api.hypixel.net/v2/skyblock/profiles?key=${HYPIXEL_API_KEY}&uuid=${uuid}`);
    if (!hypixelResponse.ok) {
      return res.status(hypixelResponse.status).json({ error: `Hypixel API error: ${hypixelResponse.statusText}` });
    }
    const hypixelData = await hypixelResponse.json();

    let inventoryContents = null;

    // Find the active SkyBlock profile and extract inventory data
    if (hypixelData.profiles && Object.keys(hypixelData.profiles).length > 0) {
      const profileId = Object.keys(hypixelData.profiles)[0]; // Taking the first profile for simplicity
      const memberData = hypixelData.profiles[profileId].members[uuid];

      if (memberData && memberData.inventory && memberData.inventory.inv_contents && memberData.inventory.inv_contents.data) {
        const base64Data = memberData.inventory.inv_contents.data;
        // The data is typically gzipped NBT data, so simply decoding Base64 won't make it human-readable JSON.
        // It would require a library like 'nbt' to decompress and parse.
        inventoryContents = Buffer.from(base64Data, 'base64').toString('utf8');
      }
    }

    res.json({
      name: mojangData.name,
      uuid: mojangData.id,
      inventory: inventoryContents
    });

  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
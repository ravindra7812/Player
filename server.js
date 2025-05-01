const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());

app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Missing url param');

  try {
    // Agar m3u8 hai, toh usme rewrite karenge
    if (targetUrl.endsWith('.m3u8')) {
      const response = await axios.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://allinonereborn.com/',
          'Origin': 'https://allinonereborn.com/'
        }
      });

      let content = response.data;

      // Sab .ts links ko proxy route se rewrite karo
      content = content.replace(/(.*\.ts)/g, (match) => {
        const encodedTsUrl = encodeURIComponent(new URL(match, targetUrl).href);
        return `http://localhost:3000/proxy?url=${encodedTsUrl}`;
      });

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      return res.send(content);
    } else {
      // Direct .ts file ko proxy karo
      const stream = await axios({
        url: targetUrl,
        method: 'GET',
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://allinonereborn.com/',
          'Origin': 'https://allinonereborn.com/'
        }
      });

      res.setHeader('Content-Type', 'video/MP2T');
      stream.data.pipe(res);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error fetching stream');
  }
});

app.listen(3000, () => console.log('🚀 Proxy running at http://localhost:3000'));

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());

app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Missing url param');

  try {
    if (targetUrl.includes('.m3u8')) {
      const response = await axios.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://allinonereborn.com/',
          'Origin': 'https://allinonereborn.com/',
        }
      });

      let lines = response.data.split('\n');
      const segmentLines = lines.filter(line => line.endsWith('.ts'));
      const delayCount = 3; // Delay last 3 segments (~45-60s)

      const filteredLines = [];
      let skipIndex = segmentLines.length - delayCount;
      let segmentSeen = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.endsWith('.ts')) {
          if (segmentSeen >= skipIndex) break; // Stop after old chunks
          const absUrl = new URL(line, targetUrl).href;
          filteredLines.push(`https://yourdomain.com/proxy?url=${encodeURIComponent(absUrl)}`);
          segmentSeen++;
        } else {
          filteredLines.push(line);
        }
      }

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache');
      return res.send(filteredLines.join('\n'));
    } else {
      const stream = await axios({
        url: targetUrl,
        method: 'GET',
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://allinonereborn.com/',
          'Origin': 'https://allinonereborn.com/',
        }
      });

      res.setHeader('Content-Type', 'video/MP2T');
      res.setHeader('Cache-Control', 'no-cache');
      stream.data.pipe(res);
    }
  } catch (err) {
    console.error('Proxy error:', err.message);
    res.status(500).send('Stream fetch failed');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());

app.get('/', (req, res) => {
  res.send('🔁 HLS Proxy Running');
});

app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('❌ Missing url param');

  try {
    if (targetUrl.includes('.m3u8')) {
      const response = await axios.get(targetUrl, {
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://allinonereborn.com/',
          'Origin': 'https://allinonereborn.com/',
        }
      });

      let lines = response.data.split('\n');
      const segmentLines = lines.filter(line => line.endsWith('.ts'));
      const delayCount = 3;

      const filteredLines = [];
      let skipIndex = segmentLines.length - delayCount;
      let segmentSeen = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.endsWith('.ts')) {
          if (segmentSeen >= skipIndex) break;
          const absUrl = new URL(line, targetUrl).href;
          filteredLines.push(`${req.protocol}://${req.get('host')}/proxy?url=${encodeURIComponent(absUrl)}`);
          segmentSeen++;
        } else {
          filteredLines.push(line);
        }
      }

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.send(filteredLines.join('\n'));
    } else {
      const stream = await axios({
        url: targetUrl,
        method: 'GET',
        responseType: 'stream',
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://allinonereborn.com/',
          'Origin': 'https://allinonereborn.com/',
        }
      });

      res.setHeader('Content-Type', 'video/MP2T');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Access-Control-Allow-Origin', '*');
      stream.data.pipe(res);
    }
  } catch (err) {
    console.error('❌ Proxy error:', err.message);
    res.status(500).send('Stream fetch failed');
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

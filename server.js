const express = require('express');
const { Queue } = require('bullmq');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

const HOST_REDIS = '127.0.0.1';
const PORT_REDIS = 6379;

// Kết nối tới Redis
const timerQueue = new Queue('timerQueue', {
  connection: {
    host: HOST_REDIS,
    port: PORT_REDIS,
  },
});

const upload = multer({ dest: path.join(__dirname, 'uploads') });

app.post('/start-task', upload.single('image'), async (req, res) => {
  const duration = req.query.duration || 5000;
  const imagePath = req.file.path;

  await timerQueue.add('processTimer', { duration, imagePath });

  res.send(`Task started with duration ${duration}ms`);
});

app.get('/health-check', async (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

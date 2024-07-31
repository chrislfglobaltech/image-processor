const express = require('express');
const { Queue, QueueScheduler, Worker } = require('bullmq');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

const HOST_REDIS = '127.0.0.1';
const PORT_REDIS = 6379;

// Kết nối tới Redis
const imageQueue = new Queue('imageQueue', {
  connection: {
    host: HOST_REDIS,
    port: PORT_REDIS,
  },
});

// Thiết lập QueueScheduler để quản lý trạng thái của các job
new QueueScheduler('imageQueue', {
  connection: {
    host: HOST_REDIS,
    port: PORT_REDIS,
  },
});

// Thiết lập multer để lưu trữ file upload
const upload = multer({ dest: path.join(__dirname, 'uploads') });

// Endpoint để upload hình ảnh
app.post('/start-task', upload.single('image'), async (req, res) => {
  const imagePath = req.file.path;

  // Thêm tác vụ vào hàng đợi
  const job = await imageQueue.add('processImage', { imagePath });

  // Đợi cho tác vụ hoàn thành và trả về URL hình ảnh
  job
    .finished()
    .then((result) => {
      res.send({ imageUrl: result.imageUrl });
    })
    .catch((err) => {
      res.status(500).send(err.message);
    });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

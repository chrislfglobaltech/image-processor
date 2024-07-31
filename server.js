const express = require('express');
const { Queue, QueueEvents, Worker } = require("bullmq");
const multer = require('multer');
const path = require('path');
var CONFIGS = require("./configs");

const app = express();
const port = 3000;

// Kết nối tới Redis
const imageQueue = new Queue(CONFIGS.TASK_QUEUE_IMAGE_PROCESSOR, {
  connection: {
    host: CONFIGS.HOST_REDIS,
    port: CONFIGS.PORT_REDIS,
  },
});


app.get('/health-check', (req, res) => {
  res.send('OK');
});

// Tạo QueueEvents để theo dõi trạng thái của các job
const imageQueueEvents = new QueueEvents(CONFIGS.TASK_QUEUE_IMAGE_PROCESSOR, {
  connection: {
    host: CONFIGS.HOST_REDIS,
    port: CONFIGS.PORT_REDIS,
  },
});

// Thiết lập multer để lưu trữ file upload
const upload = multer({ dest: path.join(__dirname, 'uploads') });

// Endpoint để upload hình ảnh
app.post('/upload-image', upload.single('image'), async (req, res) => {
  const imagePath = req.file.path;

  // Thêm tác vụ vào hàng đợi
  const job = await imageQueue.add(CONFIGS.TASK_ADD_IMAGE_PROCESSOR, { imagePath });

  try {
    // Đợi cho tác vụ hoàn thành và trả về URL hình ảnh
    job
    const result = await job.waitUntilFinished(imageQueueEvents);
    res.json({ success: true, data: {imageUrl: result.imageUrl} });
  } catch (error) {
    res.status(500).send(error.message);
  }
  
});


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

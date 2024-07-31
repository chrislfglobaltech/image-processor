const express = require("express");
const { Queue, QueueEvents, Worker } = require("bullmq");
const multer = require("multer");
const cron = require("node-cron");
const path = require("path");
const fs = require("fs");
const { processImage } = require("./service");
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

app.get("/health-check", (req, res) => {
  res.send("OK");
});

// Tạo QueueEvents để theo dõi trạng thái của các job
const imageQueueEvents = new QueueEvents(CONFIGS.TASK_QUEUE_IMAGE_PROCESSOR, {
  connection: {
    host: CONFIGS.HOST_REDIS,
    port: CONFIGS.PORT_REDIS,
  },
});

// Thiết lập multer để lưu trữ file upload
const upload = multer({ dest: path.join(__dirname, "uploads") });

// Endpoint để upload hình ảnh
app.post("/upload-image", upload.single("image"), async (req, res) => {
  const imagePath = req.file.path;

  // Thêm tác vụ vào hàng đợi
  const job = await imageQueue.add(CONFIGS.TASK_ADD_IMAGE_PROCESSOR, {
    imagePath,
  });

  try {
    // Đợi cho tác vụ hoàn thành và trả về URL hình ảnh
    const result = await job.waitUntilFinished(imageQueueEvents);
    res.json({ success: true, data: { imageUrl: result.imageUrl } });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post(
  "/upload-image-without-bullmq",
  upload.single("image"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const imagePath = req.file.path;
    console.log("imagePath::", imagePath);

    try {
      const result = await processImage(imagePath);
      res.json({ success: true, data: { imageUrl: result.imageUrl } });
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

cron.schedule("*/10 * * * * *", () => {
  const uploadsDir = path.join(__dirname, "uploads");

  fs.readdir(uploadsDir, (err, files) => {
    console.log("Runs CronJob::start", uploadsDir);
    if (err) {
      console.error("Error reading uploads directory:", err);
      return;
    }

    files.forEach((file) => {
      const oldPath = path.join(uploadsDir, file);

      const newPath = path.join(uploadsDir, `200x200-${file}`);

      // Check if the file already has the prefix
      if (!file.startsWith("200x200-")) {
        fs.rename(oldPath, newPath, (err) => {
          if (err) {
            console.error(`Error renaming file ${file}:`, err);
          } else {
            console.log(`Renamed ${file} to 200x200-${file}`);
          }
        });
      }
    });
    console.log("Runs CronJob::end");
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

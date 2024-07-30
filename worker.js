const { Worker } = require('bullmq');
const sharp = require('sharp');
const path = require('path');

const HOST_REDIS = '127.0.0.1';
const PORT_REDIS = 6379;

// Kết nối tới Redis
const worker = new Worker(
  'timerQueue',
  async (job) => {
    const { duration, imagePath } = job.data;

    await new Promise((resolve) => setTimeout(resolve, duration));

    const inputPath = path.resolve(imagePath);
    const outputPath = path.resolve(
      __dirname,
      `uploads/thumbnail-${path.basename(imagePath)}.jpg`
    );

    // Xử lý hình ảnh: tạo thumbnail
    await sharp(inputPath).resize(200, 200).toFile(outputPath);

    console.log(`Processed job with duration ${duration}ms`);
  },
  {
    connection: {
      host: HOST_REDIS,
      port: PORT_REDIS,
    },
  }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed!`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed: ${err.message}`);
});

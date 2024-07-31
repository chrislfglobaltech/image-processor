const { Worker, Queue } = require('bullmq');
const path = require('path');
const sharp = require('sharp');
var CONFIGS = require("./configs");

const DEBOUNDCE_PROCESSOR_IMAGE = 0;

// Kết nối tới Redis
const worker = new Worker(
  CONFIGS.TASK_QUEUE_IMAGE_PROCESSOR,
  async (job) => {
    const { imagePath } = job.data;

    // Giả lập công việc cần thời gian để xử lý bằng cách sử dụng setTimeout
    await new Promise((resolve) =>
      setTimeout(resolve, DEBOUNDCE_PROCESSOR_IMAGE)
    );

    // Đảm bảo đường dẫn tệp đúng
    const inputPath = path.resolve(imagePath);
    const outputPath = path.resolve(
      __dirname,
      `uploads/thumbnail-${path.basename(imagePath)}.jpg`
    );

    // Xử lý hình ảnh: tạo thumbnail
    await sharp(inputPath).resize(200, 200).toFile(outputPath);

    console.log(`Processed job for image ${imagePath}`);

    // Lưu kết quả URL của hình ảnh
    return {
      imageUrl: `/uploads/thumbnail-${path.basename(
        imagePath
      )}.jpg`,
    };
  },
  {
    connection: {
      host: CONFIGS.HOST_REDIS,
      port: CONFIGS.PORT_REDIS,
    },
  }
);

worker.on('completed', (job) => {
  console.log(
    `Job ${job.id} completed with result: ${JSON.stringify(job.returnvalue)}`
  );
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed: ${err.message}`);
});

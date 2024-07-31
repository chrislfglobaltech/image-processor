const { Worker, Queue } = require('bullmq');
const path = require('path');
const sharp = require('sharp');

const HOST_REDIS = '127.0.0.1';
const PORT_REDIS = 6379;

// Kết nối tới Redis
const worker = new Worker(
  'imageQueue',
  async (job) => {
    const { imagePath } = job.data;

    // Giả lập công việc cần thời gian để xử lý bằng cách sử dụng setTimeout
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Đảm bảo đường dẫn tệp đúng
    const inputPath = path.resolve(imagePath);
    const outputPath = path.resolve(
      __dirname,
      `uploads/thumbnail-${path.basename(imagePath)}`
    );

    // Xử lý hình ảnh: tạo thumbnail
    await sharp(inputPath).resize(200, 200).toFile(outputPath);

    console.log(`Processed job for image ${imagePath}`);

    // Lưu kết quả URL của hình ảnh
    return {
      imageUrl: `http://localhost:3000/uploads/thumbnail-${path.basename(
        imagePath
      )}`,
    };
  },
  {
    connection: {
      host: HOST_REDIS,
      port: PORT_REDIS,
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

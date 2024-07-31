const path = require("path");
const sharp = require("sharp");

const DEBOUNDCE_PROCESSOR_IMAGE = 2000;

async function processImage(imagePath) {
  // Simulate a delay
  await new Promise((resolve) =>
    setTimeout(resolve, DEBOUNDCE_PROCESSOR_IMAGE)
  );

  // Ensure the file paths are correct
  const inputPath = path.resolve(imagePath);
  const outputPath = path.resolve(
    __dirname,
    `uploads/thumbnail-${path.basename(imagePath)}.jpg`
  );

  // Process the image: create a thumbnail
  await sharp(inputPath).resize(200, 200).toFile(outputPath);

  console.log(`Processed job for image ${imagePath}`);

  // Return the result with the image URL
  return {
    imageUrl: `/uploads/thumbnail-${path.basename(imagePath)}.jpg`,
  };
}

module.exports = { processImage };

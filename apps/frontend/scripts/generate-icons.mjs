import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const svgPath = path.resolve("apps/frontend/public/icons/icon.svg");
const outputDir = path.resolve("apps/frontend/public/icons");

const svgBuffer = fs.readFileSync(svgPath);

async function generate() {
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(outputDir, "icon-192.png"));
  console.log("Created icon-192.png");

  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(outputDir, "icon-512.png"));
  console.log("Created icon-512.png");

  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(outputDir, "icon-maskable-512.png"));
  console.log("Created icon-maskable-512.png");

  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(outputDir, "apple-touch-icon.png"));
  console.log("Created apple-touch-icon.png");
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});


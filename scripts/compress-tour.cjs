const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('ffmpeg-static');

const tourDir = path.join(__dirname, '..', 'public', 'tour');
const files = fs.readdirSync(tourDir).filter((f) => f.toLowerCase().endsWith('.gif'));

if (files.length === 0) {
  console.log('No gifs found in', tourDir);
  process.exit(0);
}

for (const file of files) {
  const inputPath = path.join(tourDir, file);
  const outputName = file.replace(/\.gif$/i, '.mp4');
  const outputPath = path.join(tourDir, outputName);

  const inputSize = fs.statSync(inputPath).size;
  console.log(`\nConverting ${file} (${(inputSize / 1024 / 1024).toFixed(2)} MB)...`);

  execFileSync(
    ffmpeg,
    [
      '-y',
      '-i', inputPath,
      '-movflags', 'faststart',
      '-pix_fmt', 'yuv420p',
      '-vf', "scale=trunc(iw/2)*2:trunc(ih/2)*2",
      '-vcodec', 'libx264',
      '-crf', '26',
      '-preset', 'medium',
      '-an',
      outputPath,
    ],
    { stdio: ['ignore', 'ignore', 'ignore'] },
  );

  const outputSize = fs.statSync(outputPath).size;
  const reduction = ((1 - outputSize / inputSize) * 100).toFixed(1);
  console.log(`  -> ${outputName} (${(outputSize / 1024 / 1024).toFixed(2)} MB, ${reduction}% smaller)`);

  fs.unlinkSync(inputPath);
}

console.log('\nDone.');

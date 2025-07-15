const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const glob = require('glob');

// Compression options
const COMPRESSION_OPTIONS = {
  level: 9, // Maximum compression
};

// File types to compress
const COMPRESS_EXTENSIONS = ['.js', '.css', '.html', '.json', '.svg'];

// Compress a single file
async function compressFile(filePath) {
  const content = await fs.promises.readFile(filePath);
  const compressed = zlib.gzipSync(content, COMPRESSION_OPTIONS);
  await fs.promises.writeFile(`${filePath}.gz`, compressed);
  console.log(`Compressed: ${filePath}`);
}

// Main optimization function
async function optimizeBuild() {
  const buildPath = path.join(__dirname, '../build');
  
  try {
    // Find all files in build directory
    const files = glob.sync(`${buildPath}/**/*.*`);
    
    // Filter and compress eligible files
    const compressionTasks = files
      .filter(file => COMPRESS_EXTENSIONS.includes(path.extname(file)))
      .map(file => compressFile(file));
    
    await Promise.all(compressionTasks);
    
    console.log('Build optimization completed successfully!');
  } catch (error) {
    console.error('Build optimization failed:', error);
    process.exit(1);
  }
}

optimizeBuild();
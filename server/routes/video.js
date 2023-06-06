const router = require('koa-router')();
const multer = require('@koa/multer');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { assert, Errors, throws } = require('../utils/validator');
const crypto = require('crypto');
const Video = require('../database/sequelize/video');
const config = require('../config');
const { trySendSocket } = require('../socket');

const maxMB = 20;

const checkFileSize = async (filePath) => {
  const maxMB = 20;
  const stats = fs.statSync(filePath);
  const fileSizeInBytes = stats.size;
  const mb = 1024 * 1024;
  const readableFileSize = fileSizeInBytes > mb ? 
    `${(fileSizeInBytes / mb).toFixed(1)} mb` :
    `${(fileSizeInBytes / 1024).toFixed(1)} kb`;
  assert(fileSizeInBytes < maxMB * mb, Errors.ERR_IS_REQUEST_FAILED(`File size is ${readableFileSize}, should not exceed ${maxMB}mb.`))
  console.log(`Video file size: ${readableFileSize}`);
  return fileSizeInBytes;
}

const upload = multer({
  fileFilter: videoFilter,
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxMB * 1024 * 1024
  }
});

router.post('/upload', async (ctx, next) => {
  const userAddress = ctx.headers['x-address'];
  try {
    await upload.single('file')(ctx, next);
  } catch (err) {
    console.error(err);
    ctx.set('Connection', 'close');
    throws(Errors.ERR_IS_REQUEST_FAILED(err.message));
  }

  const { file } = ctx;
  const buffer = file.buffer;
  const hash = bufferToHash(buffer);
  const fileName = `${hash}.mp4`;
  const inputFileName = `${hash}.input${path.extname(file.originalname)}`;

  const existVideo = await Video.findOne({ where: { fileName } });

  if (existVideo) {
    const origin = config.googleStorage ? `https://storage.googleapis.com/${config.googleStorage.bucketName}/${config.googleStorage.dest}`.slice(0, -1) : (config.serverOrigin || '');
    ctx.body = {
      fileName: existVideo.fileName,
      url: `${origin}/${existVideo.fileName}`,
      poster: `${origin}/${existVideo.fileName.replace('mp4', 'jpg')}`,
      mimetype: 'video/mp4',
      chunks: [],
      width: existVideo.width,
      height: existVideo.height,
      duration: existVideo.duration,
    };
    return;
  }

  if (!fs.existsSync('storage')) {
    fs.mkdirSync('storage');
  }
 
  const inputFilePath = path.join('storage', inputFileName);
  const outputFilePath = path.join('storage', fileName);
  const cacheFilePath = path.join('storage', `${hash}.cache.json`);

  const existCacheFile = fs.existsSync(cacheFilePath);
  const existOutputFile = fs.existsSync(outputFilePath);
  if (existCacheFile && existOutputFile) {
    const cache = await fs.promises.readFile(cacheFilePath);
    ctx.body = JSON.parse(cache);
    return; 
  }

  const existInputFile = fs.existsSync(inputFilePath);
  if (!existInputFile) {
    await fs.promises.writeFile(inputFilePath, buffer);
  }

  await checkFileSize(inputFilePath);

  let hasProgress = false;
  const { chunks, metadata } = await new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions('-crf', '30', '-vf', 'scale=-2:640')
      .on('end', async () => {
        console.log('Video compression complete!');
  
        await checkFileSize(outputFilePath);

        const metadata = await getVideoMetadata(outputFilePath);

        const posterFilePath = path.join('storage', `${hash}.jpg`);
        await new Promise((resolve, reject) => {
          ffmpeg(outputFilePath)
            .seekInput(0)
            .frames(1)
            .outputOptions('-vframes', '1', '-vf', 'scale=-2:640')
            .output(posterFilePath)
            .on('end', function() {
              console.log(`Poster generated at ${posterFilePath}`);
              resolve();
            })
            .on('error', function(err) {
              console.error(`Error generating poster: ${err.message}`);
              reject(`Error generating poster: ${err.message}`);
            })
            .run();
        })

        await fs.promises.unlink(inputFilePath)

        const chunks = await splitFileToBase64(outputFilePath, 180 * 1024);

        resolve({ chunks, metadata });
      })
      .on('progress', (progress) => {
        const percent = Math.round(progress.percent);
        if (!hasProgress && percent > 50) {
          return;
        }
        hasProgress = true;
        if (progress.frames > 0) {
          console.log(`Processing: ${percent}%`);
          trySendSocket(userAddress, 'videoUploadProgress', percent);
        }
      })
      .on('error', (err) => {
        reject(`Error compressing video: ${err.message}`);
      })
      .save(outputFilePath);
  });

  const origin = config.serverOrigin || '';
  const result = {
    fileName: `${hash}.mp4`,
    url: `${origin}/${hash}.mp4`,
    poster: `${origin}/${hash}.jpg`,
    mimetype: 'video/mp4',
    chunks,
    width: metadata.width,
    height: metadata.height,
    duration: formatTime(metadata.duration),
  };

  await fs.promises.writeFile(cacheFilePath, JSON.stringify(result));

  ctx.body = result;
});

function videoFilter (_, file, cb) {
  console.log({ file });
  if (!file.originalname.match(/\.(mp4|avi|mkv|mov)$/i)) {
    return cb(new Error(`${file.originalname} is not supported. Only mp4/avi/mkv/mov are allowed!`), false);
  }
  cb(null, true);
};

async function splitFileToBase64(filePath, chunkSize) {
  const fileStats = await fs.promises.stat(filePath);
  const fileSize = fileStats.size;
  const numChunks = Math.ceil(fileSize / chunkSize);

  const chunks = [];

  for (let i = 0; i < numChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, fileSize);

    const readStream = fs.createReadStream(filePath, { start, end });
    let buffer = await streamToBuffer(readStream);

    if (i > 0) {
      buffer = buffer.slice(1);
    }

    chunks.push(buffer.toString('base64'));
  }

  return chunks;
}

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    stream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    stream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer);
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
}

function bufferToHash(buffer) {
  const hash = crypto.createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

const getVideoMetadata = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) {
        reject(`Failed to get video size: ${err.message}`);
      } else {
        const metadata = data.streams.find(s => s.codec_type === 'video');
        resolve(metadata);
      }
    });
  });
};

function formatTime(seconds) {
  seconds = Math.max(Math.round(seconds), 1);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

module.exports = router;
const VideoChunk = require('../database/sequelize/videoChunk');
const Video = require('../database/sequelize/video');
const rumSDK = require('rum-sdk-nodejs');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const googleStorage = require('../utils/googleStorage');
const ffmpeg = require('fluent-ffmpeg');

module.exports = async (item) => {
  const {
    Data: {
      object: {
        id,
        content,
        mediaType,
        duration,
        width,
        height,
        totalItems,
      },
    },
    SenderPubkey,
  } = item;
  console.log(`[handle Video]:`);
  const userAddress = rumSDK.utils.pubkeyToAddress(SenderPubkey);
  const chunkName = id;
  const fileName = id.split('.part')[0];
  const chunk = {
    fileName,
    chunkName,
    content,
    userAddress,
    mediaType,
    duration,
    width,
    height,
  };
  const exists = await VideoChunk.findOne({ where: { chunkName }});
  if (exists) {
    return;
  }
  let chunks = await VideoChunk.findAll({ where: { fileName }});
  chunks = [chunk, ...chunks];
  if (chunks.length === totalItems) {
    const filePath = path.join('storage', fileName);
    if (!fs.existsSync(filePath)) {
      const sortedChunks = chunks.sort((a, b) => a.chunkName.slice(-1) - b.chunkName.slice(-1));
      const buffers = sortedChunks.map(chunk => Buffer.from(chunk.content, 'base64'));
      const combinedBuffer = Buffer.concat(buffers);
      await fs.promises.writeFile(filePath, combinedBuffer);
      console.log(`[write file]:`, { filePath });
    }
    if (config.googleStorage) {
      await googleStorage.tryUpload({
        src: filePath,
        ...config.googleStorage,
      });
    }
    const posterFilePath = path.join('storage', fileName.replace('mp4', 'jpg'));
    if (!fs.existsSync(filePath)) {
      ffmpeg(filePath)
      .seekInput(0)
      .frames(1)
      .outputOptions('-vframes 1')
      .output(posterFilePath)
      .on('end', function() {
        console.log(`Poster generated at ${posterFilePath}`);
      })
      .on('error', function(err) {
        console.error(`Error happened: ${err.message}`);
      })
      .run();
    }
    if (config.googleStorage) {
      await googleStorage.tryUpload({
        src: posterFilePath,
        ...config.googleStorage,
      });
      fs.unlinkSync(filePath);
      fs.unlinkSync(posterFilePath);
    }
    await VideoChunk.destroy({ where: { fileName }});
    await Video.create({
      fileName,
      userAddress,
      mediaType,
      duration,
      width,
      height,
    });
  } else {
    await VideoChunk.create({
      fileName,
      chunkName,
      content,
      userAddress,
    });
  }

  item.Data.object.content = '';
}

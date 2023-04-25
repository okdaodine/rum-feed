const axios = require('axios');
const sharp = require('sharp');

module.exports = async (url, options) => {
  const { maxWidth = 1000, maxHeight = 1000, maxKbSize = 70 } = options || {};
  const image = await axios.get(url, { responseType: 'arraybuffer' });
  let quality = 95;
  let buffer = Buffer.from(image.data);
  while (true) {
    buffer = await sharp(buffer)
                    .resize(maxWidth, maxHeight, {
                      fit: sharp.fit.inside,
                      withoutEnlargement: true
                    })
                    .jpeg({ quality })
                    .toBuffer();
    const length = buffer.length;
    const kbSize = length / 1024;
    if (kbSize < maxKbSize || quality < 60) {
      break;
    }
    quality -= 5;
  }
  return buffer.toString('base64');
}
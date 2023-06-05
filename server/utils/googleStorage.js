const { Storage } = require('@google-cloud/storage');
const { assert, Errors } = require('../utils/validator');

exports.tryUpload = async (options) => {
  const {
    keyFilename,
    src,
    dest,
    bucketName,
  } = options;

  assert(keyFilename, Errors.ERR_IS_REQUIRED('keyFilename'));
  assert(src, Errors.ERR_IS_REQUIRED('src'));
  assert(dest, Errors.ERR_IS_REQUIRED('dest'));
  assert(bucketName, Errors.ERR_IS_REQUIRED('bucketName'));

  const storage = new Storage({
    keyFilename,
  })
  
  const bucket = storage.bucket(bucketName);
  const destination = dest.endsWith('/') ? `${dest}${src.split('/').pop()}` : dest;

  const file = bucket.file(destination);
  const [ exists ] = await file.exists();
  if (exists) {
    console.log(`[file exists on google storage]:`, destination);
    return;
  }

  return new Promise((resolve, reject) => {
    bucket.upload(
      src,
      {
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
        destination,
      },
      function (err) {
        if (err) {
          console.error(`Error uploading ${src}: ${err}`)
          reject(err);
        } else {
          console.log(`${src} uploaded to ${bucketName}.`)
          resolve(true);
        }
      }
    )    
  });
}
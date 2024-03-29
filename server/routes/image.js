const router = require('koa-router')();
const Profile = require('../database/profile');
const Post = require('../database/post');
const Comment = require('../database/comment');
const { assert, Errors } = require('../utils/validator');
const urlToBase64 = require('../utils/urlToBase64');
const multiavatar = require('@multiavatar/multiavatar');
const sharp = require('sharp');

router.get('/posts/:id/:index', getPostImage);
router.get('/comments/:id/:index', getCommentImage);
router.get('/profiles/:userAddress', getProfileImage);

async function getPostImage(ctx) {
  const post = await Post.get(ctx.params.id);
  assert(post, Errors.ERR_NOT_FOUND('post'));
  assert(post.images, Errors.ERR_NOT_FOUND('post.images'));
  const image = post.images[ctx.params.index];
  assert(image && (image.content || image.url), Errors.ERR_NOT_FOUND('image'));

  if (image.url) {
    image.content = await urlToBase64(image.url, { maxKbSize: 200 });
  }
  
  const buffer = Buffer.from(image.content, 'base64');
  ctx.set('Content-Type', image.mediaType);
  ctx.set('Content-Length', buffer.length);
  ctx.set('Cache-Control', 'public, max-age=31557600');
  ctx.body = buffer;
}

async function getCommentImage(ctx) {
  const comment = await Comment.get(ctx.params.id);
  assert(comment, Errors.ERR_NOT_FOUND('comment'));
  assert(comment.images, Errors.ERR_NOT_FOUND('comment.images'));
  const image = comment.images[ctx.params.index];
  assert(image && (image.content || image.url), Errors.ERR_NOT_FOUND('image'));

  if (image.url) {
    image.content = await urlToBase64(image.url, { maxKbSize: 200 });
  }
  
  const buffer = Buffer.from(image.content, 'base64');
  ctx.set('Content-Type', image.mediaType);
  ctx.set('Content-Length', buffer.length);
  ctx.set('Cache-Control', 'public, max-age=31557600');
  ctx.body = buffer;
}

async function getProfileImage(ctx) {
  const profile = await Profile.get({
    userAddress: ctx.params.userAddress
  });
  if (!profile || !profile.avatar) {
    const svgCode = multiavatar(ctx.params.userAddress);
    const buffer = await sharp(Buffer.from(svgCode)).resize(200, 200).png({ quality: 90 }).toBuffer();
    ctx.set('Content-Type', 'image/png');
    ctx.set('Content-Length', buffer.length);
    ctx.set('Cache-Control', 'public, max-age=31557600');
    ctx.body = buffer;
    return;
  }

  const url = profile.avatar;
  let buffer = Buffer.from(getContent(url), 'base64');

  if (ctx.query.rounded) {
    const roundedCorners = '<svg><circle r="100" cx="100" cy="100"/></svg>';
    buffer = await sharp(buffer).resize(200, 200).composite([{
      input: Buffer.from(roundedCorners),
      blend: 'dest-in'
    }]).png({ quality: 80 }).toBuffer();
    ctx.set('Content-Type', 'image/png');
    ctx.set('Content-Length', buffer.length);
    ctx.set('Cache-Control', 'public, max-age=31557600');
    ctx.body = buffer;
    return;
  }

  ctx.set('Content-Type', getMimeType(url));
  ctx.set('Content-Length', buffer.length);
  ctx.set('Cache-Control', 'public, max-age=31557600');
  ctx.body = buffer;
}

const getMimeType = (url) => {
  return /data:(.*)(?=;base64)/.exec(url)[1];
};

const getContent = (url) => {
  return url.split(';base64,')[1];
};

module.exports = router;
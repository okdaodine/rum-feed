const router = require('koa-router')();
const Profile = require('../database/profile');
const Post = require('../database/post');
const Comment = require('../database/comment');
const { assert, Errors } = require('../utils/validator');
const getDefaultProfile = require('../utils/getDefaultProfile');

router.get('/posts/:trxId/:index', getPostImage);
router.get('/comments/:trxId/:index', getCommentImage);
router.get('/profiles/:userAddress', getProfileImage);

async function getPostImage(ctx) {
  const post = await Post.get(ctx.params.trxId);
  assert(post, Errors.ERR_NOT_FOUND('post'));
  assert(post.images, Errors.ERR_NOT_FOUND('post.images'));
  const image = post.images[ctx.params.index];
  assert(image, Errors.ERR_NOT_FOUND('image'));
  const buffer = Buffer.from(image.content, 'base64');
  ctx.set('Content-Type', image.mediaType);
  ctx.set('Content-Length', buffer.length);
  ctx.set('Cache-Control', 'public, max-age=31557600');
  ctx.body = buffer;
}

async function getCommentImage(ctx) {
  const comment = await Comment.get(ctx.params.trxId);
  assert(comment, Errors.ERR_NOT_FOUND('comment'));
  assert(comment.images, Errors.ERR_NOT_FOUND('comment.images'));
  const image = comment.images[ctx.params.index];
  assert(image, Errors.ERR_NOT_FOUND('image'));
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
    ctx.redirect(getDefaultProfile(ctx.params.userAddress).avatar);
    return;
  }
  const url = profile.avatar;
  const buffer = Buffer.from(getContent(url), 'base64');
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
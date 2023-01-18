const router = require('koa-router')();
const Profile = require('../database/profile');
const Post = require('../database/post');
const Comment = require('../database/comment');
const { assert, Errors } = require('../utils/validator');
const getDefaultProfile = require('../utils/getDefaultProfile');

router.get('/posts/:id/:index', getPostImage);
router.get('/comments/:id/:index', getCommentImage);
router.get('/profiles/:userAddress', getProfileImage);

async function getPostImage(ctx) {
  const post = await Post.get(ctx.params.id);
  assert(post, Errors.ERR_NOT_FOUND('post'));
  assert(post.images, Errors.ERR_NOT_FOUND('post.images'));
  const image = post.images[ctx.params.index];
  assert(image, Errors.ERR_NOT_FOUND('image'));

  const buffer = Buffer.from(getContent(image.content), 'base64');
  ctx.set('Content-Type', getMimeType(image.content));
  ctx.set('Content-Length', buffer.length);
  ctx.set('Cache-Control', 'public, max-age=31557600');
  ctx.body = buffer;
}

async function getCommentImage(ctx) {
  const comment = await Comment.get(ctx.params.id);
  assert(comment, Errors.ERR_NOT_FOUND('comment'));
  assert(comment.images, Errors.ERR_NOT_FOUND('comment.images'));
  const image = comment.images[ctx.params.index];
  assert(image, Errors.ERR_NOT_FOUND('image'));
  console.log(image)
  const buffer = Buffer.from(getContent(image.content), 'base64');
  ctx.set('Content-Type', getMimeType(image.content));
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
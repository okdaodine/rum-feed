const router = require('koa-router')();
const _ = require('lodash');
const Post = require('../database/sequelize/post');
const config = require('../config');
const { assert, Errors } = require('../utils/validator');

router.get('/', async ctx => {
  assert(config.origin, Errors.ERR_NOT_FOUND('config.origin'));
  const { origin } = config;
  const posts = [];
  let stop = false;
  while (!stop) {
    const _posts = await Post.findAll({
      raw: true,
      attributes: ['id', 'userAddress'],
      limit: 500,
      offset: Math.max(0, posts.length)
    });
    if (_posts.length > 0) {
      posts.push(..._posts.map(post => ({
        id: post.id,
        userAddress: post.userAddress
      })));
      console.log(`collected ${posts.length} posts`);
    } else {
      stop = true;
    }
  }
  const postUrls = posts.map(post => `${origin}/posts/${post.id}`);
  const userUrls = _.uniq(posts.map(post => post.userAddress)).map(address => `${origin}/users/${address}`);
  const urls = [...postUrls, ...userUrls];
  console.log(`Got ${urls.length} urls (${postUrls.length} posts + ${userUrls.length} users)`);
  ctx.body = urls.join('\n');
});

module.exports = router;
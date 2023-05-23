const router = require('koa-router')();
const Post = require('../database/sequelize/post');
const Content = require('../database/sequelize/content');
const Relation = require('../database/sequelize/relation');
const config = require('../config');

router.get('/:userAddress', get);

async function get(ctx) {
  const [
    postCount,
    followingCount,
    followerCount,
    following,
    muted,
    pubKey,
  ] = await Promise.all([
    Post.count({
      where: {
        userAddress: ctx.params.userAddress,
      }
    }),
    Relation.count({
      where: {
        type: 'following',
        from: ctx.params.userAddress
      }
    }),
    Relation.count({
      where: {
        type: 'following',
        to: ctx.params.userAddress
      }
    }),
    Relation.findOne({
      where: {
        type: 'following',
        to: ctx.params.userAddress,
        from: ctx.query.viewer || ''
      }
    }),
    Relation.findOne({
      where: {
        type: 'muted',
        to: ctx.params.userAddress,
        from: ctx.query.viewer || ''
      }
    }),
    getPubKey(ctx.params.userAddress),
  ]);
  ctx.body = {
    postCount,
    followingCount,
    followerCount,
    following: !!following,
    muted: !!muted,
    role: (config.admins || []).includes(ctx.params.userAddress) ? 'admin' : '',
    pubKey,
  };
}

const getPubKey = async userAddress => {
  const post = await Post.findOne({ attributes: { include: ['trxId'] }, where: { userAddress } });
  if (!post) {
    return '';
  }
  const content = await Content.findOne({ attributes: { include: ['SenderPubkey'] }, where: { TrxId: post.trxId } });
  if (!content) {
    return '';
  }
  return content.SenderPubkey;
}

module.exports = router;
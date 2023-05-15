const router = require('koa-router')();
const Favorite = require('../database/sequelize/favorite');
const Post = require('../database/post');
const { assert, Errors } = require('../utils/validator');

router.get('/', list);
router.get('/:objectId', get);

async function list(ctx) {
  assert(ctx.query.viewer, Errors.ERR_IS_REQUIRED('viewer'));
  const favorites = await Favorite.findAll({
    raw: true,
    where: {
      userAddress: ctx.query.viewer
    },
    order: [
      ['id', 'DESC']
    ],
    limit: Math.min(~~ctx.query.limit || 10, 100),
    offset: ctx.query.offset || 0,
  });
  ctx.body = await Promise.all(favorites.map(async favorite => {
    const post = await Post.get(favorite.objectId, {
      withReplacedImage: true,
      withExtra: true,
      viewer: ctx.query.viewer
    });
    return {
      ...favorite,
      extra: {
        object: post
      }
    }
  }));
};

async function get(ctx) {
  assert(ctx.query.viewer, Errors.ERR_IS_REQUIRED('viewer'));
  const favorite = await Favorite.findOne({
    raw: true,
    where: {
      userAddress: ctx.query.viewer,
      objectId: ctx.params.objectId,
    },
  });
  assert(favorite, Errors.ERR_NOT_FOUND('favorite'));
  ctx.body = favorite;
};

module.exports = router;
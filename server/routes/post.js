const router = require('koa-router')();
const Post = require('../database/post');
const truncate = require('../utils/truncate');
const { assert, Errors } = require('../utils/validator');
const Relation = require('../database/sequelize/relation');
const { Op, fn } = require("sequelize");
const { ensurePermission } = require('../middleware/api');

router.get('/:trxId', get);
router.delete('/:trxId', ensurePermission, remove);
router.get('/', list);

async function get(ctx) {
  const trxId = ctx.params.trxId;
  const post = await Post.get(trxId, {
    withReplacedImage: true,
    withExtra: true,
    viewer: ctx.query.viewer
  });
  assert(post, Errors.ERR_NOT_FOUND('post'));
  ctx.body = post;
}

async function list(ctx) {
  const where = {
    latestTrxId: '',
  };

  if (ctx.query.groupId) {
    where.groupId = ctx.query.groupId;
  }

  if (ctx.query.userAddress) {
    where.userAddress = ctx.query.userAddress;
  }

  if (ctx.query.viewer && ctx.query.type === 'following') {
    where[Op.and] ||= [];
    const following = await Relation.findAll({
      raw: true,
      where: {
        type: 'following',
        from: ctx.query.viewer
      }
    });

    if (following.length === 0) {
      ctx.body = [];
      return;
    }

    where[Op.and].push({
      userAddress: {
        [Op.in]: following.map(item => item.to)
      }
    })
  }

  if (ctx.query.viewer) {
    where[Op.and] ||= [];
    const muted = await Relation.findAll({
      raw: true,
      where: {
        type: 'muted',
        from: ctx.query.viewer
      }
    });

    if (muted.length > 0) {
      where[Op.and].push({
        userAddress: {
          [Op.notIn]: muted.map(item => item.to)
        }
      })
    };
  }

  if (ctx.query.q) {
    where.content = {
      [Op.iLike]: `%${ctx.query.q}%`
    }
  }

  if (ctx.query.minLike) {
    where.likeCount = {
      [Op.gte]: ~~ctx.query.minLike
    }
  }

  if (ctx.query.minComment) {
    where.commentCount = {
      [Op.gte]: ~~ctx.query.minComment
    }
  }

  let posts = await Post.list({
    where,
    order: [ctx.query.type === 'random' ? [ fn('RANDOM') ] : ['timestamp', ctx.query.order === 'ASC' ? 'ASC' : 'DESC']],
    limit: Math.min(~~ctx.query.limit || 10, 100),
    offset: ctx.query.offset || 0
  }, {
    withReplacedImage: true,
    withExtra: true,
    viewer: ctx.query.viewer
  });
  if (ctx.query.truncatedLength) {
    posts = posts.map((item) => {
      item.content = truncate(item.content, ~~ctx.query.truncatedLength)
      return item;
    })
  }
  ctx.body = posts;
}

async function remove(ctx) {
  await Post.destroy(ctx.params.trxId);
  ctx.body = true;
}

module.exports = router;
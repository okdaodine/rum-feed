const router = require('koa-router')();
const Comment = require('../database/comment');
const { assert, Errors } = require('../utils/validator');
const truncate = require('../utils/truncate');
const { Op } = require("sequelize");
const { groupBy } = require('lodash');

router.get('/:id', get);
router.get('/', list);

async function get(ctx) {
  const id = ctx.params.id;
  const comment = await Comment.get(id, {
    withReplacedImage: true,
    withExtra: true
  });
  assert(comment, Errors.ERR_NOT_FOUND('comment'));
  ctx.body = comment;
}

async function list(ctx) {
  const query = {
    where: {},
    limit: Math.min(~~ctx.query.limit || 10, 100),
    offset: ctx.query.offset || 0,
    order: [
      ['timestamp', ctx.query.order === 'DESC' ? 'DESC' : 'ASC']
    ],
  };
  if (ctx.query.objectId) {
    query.where.objectId = ctx.query.objectId;
    query.where.threadId = '';
  }
  let comments = await Comment.list(query, {
    withReplacedImage: true,
    withExtra: true,
    viewer: ctx.query.viewer
  });
  const subCommentIds = comments.map(item => item.id);
  let subComments = subCommentIds.length > 0 ? await Comment.list({
    where: {
      threadId: {
        [Op.or]: subCommentIds
      }
    },
    order: [
      ['timestamp', 'ASC']
    ],
  }, {
    withReplacedImage: true,
    withExtra: true,
    viewer: ctx.query.viewer
  }) : [];
  comments = comments.map((item) => {
    if (ctx.query.truncatedLength) {
      item.content = truncate(item.content, ~~ctx.query.truncatedLength)
    }
    const subItemsMap = groupBy(subComments, 'threadId');
    if (subItemsMap[item.id]) {
      item.extra.comments = subItemsMap[item.id];
    }
    return item;
  });
  ctx.body = comments;
}

module.exports = router;
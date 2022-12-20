const router = require('koa-router')();
const Notification = require('../database/notification');

router.get('/:to/:type', list);
router.get('/:to/:type/unread_count', getUnreadCount);

async function list(ctx) {
  const where = {
    groupId: '',
    to: ctx.params.to,
    type: ctx.params.type,
  };
  const notifications = await Notification.list({
    where,
    order: [
      ['timestamp', 'DESC']
    ],
    limit: Math.min(~~ctx.query.limit || 10, 50),
    offset: ctx.query.offset || 0
  });
  const hasUnread = notifications.some(n => n.status === 'unread');
  if (hasUnread) {
    await Notification.markAsRead(where);
  }
  ctx.body = await Promise.all(notifications.map(n => Notification.appendExtra(n)));
}

async function getUnreadCount(ctx) {
  const count = await Notification.getUnreadCount({
    groupId: '',
    to: ctx.params.to,
    type: ctx.params.type,
  });
  ctx.body = count;
}

module.exports = router;
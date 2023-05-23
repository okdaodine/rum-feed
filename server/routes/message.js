const router = require('koa-router')();
const Message = require('../database/sequelize/message');
const Profile = require('../database/profile')
const { assert, Errors } = require('../utils/validator');
const { keyBy, uniq } = require('lodash');
const sequelize = require('../database');
const getDefaultProfile = require('../utils/getDefaultProfile');
const { Op } = require("sequelize");
const { trySendSocket } = require('../socket');

router.get('/:userAddress/conversations', listConversations);
router.get('/:userAddress/unread_count', getUnreadCount);
router.get('/conversations/:conversationId', listMessages);
router.post('/conversations/:conversationId/:userAddress/read', markAsRead);
router.post('/', create);

async function listConversations(ctx) {
  const { userAddress } = ctx.params;
  let conversations = await sequelize.query(
    `SELECT DISTINCT "conversationId", ${[
      'id',
    ].map(col => `MAX("${col}") AS "${col}"`).join(', ')} FROM messages where "conversationId" like '%${userAddress}%' GROUP BY "conversationId"`,
    { type: sequelize.QueryTypes.SELECT }
  );
  conversations = await Message.findAll({
    raw: true,
    attributes: [
      'conversationId',
      'fromAddress',
      'fromPubKey',
      'fromContent',
      'toAddress',
      'toPubKey',
      'toContent',
      'timestamp',
    ], 
    where: {
      id: {
        [Op.in]: conversations.map(conversation => conversation.id)
      }
    }
  });

  if (conversations.length === 0) {
    ctx.body = [];
    return;
  }

  conversations = conversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const unreadMessages = await Message.findAll({
    raw: true,
    attributes: {
      include: ['conversationId']
    },
    where: {
      toAddress: userAddress,
      status: 'unread'
    },
  });
  const unreadCountMap = {};
  for (const unreadMessage of unreadMessages) {
    unreadCountMap[unreadMessage.conversationId] ||= 0;
    unreadCountMap[unreadMessage.conversationId]++;
  }

  let addresses = [];
  for (const conversation of conversations) {
    addresses.push(conversation.fromAddress);
    addresses.push(conversation.toAddress);
  }
  addresses = uniq(addresses);

  const profiles = await Profile.bulkGet(addresses.map((address) => ({
    userAddress: address
  })), {
    withReplacedImage: true
  });
  const profileMap = keyBy(profiles, 'userAddress');

  ctx.body = conversations.map(item => ({
    ...item,
    unreadCount: unreadCountMap[item.conversationId] || 0,
    fromUserProfile: profileMap[item.fromAddress] || getDefaultProfile(item.fromAddress),
    toUserProfile: profileMap[item.toAddress] || getDefaultProfile(item.toAddress),
  }));
};

async function listMessages(ctx) {
  const { conversationId } = ctx.params;
  const { viewer } = ctx.query;
  assert(viewer, Errors.ERR_IS_REQUIRED('viewer'));
  const messages = await Message.findAll({
    raw: true,
    where: {
      conversationId
    },
    order: [
      ['timestamp', 'ASC']
    ],
    limit: Math.min(~~ctx.query.limit || 10, 100),
    offset: ctx.query.offset || 0,
  });
  const hasUnread = messages.some(m => m.status === 'unread' && m.toAddress === viewer);
  if (hasUnread) {
    await Message.update({
      status: 'read'
    }, {
      where: {
        conversationId,
      }
    });
  }
  ctx.body = messages;
};

async function markAsRead(ctx) {
  const { conversationId, userAddress } = ctx.params;
  await Message.update({
    status: 'read'
  }, {
    where: {
      conversationId,
      toAddress: userAddress,
    }
  });
  ctx.body = true;
}

async function create(ctx) {
  const payload = ctx.request.body;
  assert(payload, Errors.ERR_IS_REQUIRED('payload'));
  const message = payload;
  await Message.create(message);
  trySendSocket(payload.toAddress, 'message', message);
  ctx.body = true;
}

async function getUnreadCount(ctx) {
  const { userAddress } = ctx.params;
  const count = await Message.count({
    where: {
      toAddress: userAddress,
      status: 'unread',
    }
  });
  ctx.body = count;
}

module.exports = router;
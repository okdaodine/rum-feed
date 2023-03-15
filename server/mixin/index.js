const { MixinApi } = require('@mixin.dev/mixin-node-sdk');
const config = require('../config');
const BotSubscription = require('../database/sequelize/botSubscription');
const sleep = require('../utils/sleep');

if (config.mixinBotKeystore) {
  const client = MixinApi({
    keystore: {
      ...config.mixinBotKeystore,
      user_id: config.mixinBotKeystore.user_id || config.mixinBotKeystore.client_id
    },
    blazeOptions: {
      parse: true,
      syncAck: true,
    },
  });
  
  client.blaze.loop({
    async onMessage(msg) {
      try {
        if (msg.status === 'SENT') {
          const where = { userId: msg.user_id };
          const botSub = await BotSubscription.findOne({ where });
          if (msg.data === 'cancel') {
            if (botSub) {
              await BotSubscription.update({ status: 'close' }, { where });
            }
            client.message.sendText(msg.user_id, `Subscription has been successfully canceled. Reply to any message to resubscribe`);
          } else {
            if (!botSub) {
              await BotSubscription.create({ status: 'open', ...where });
            }
            if (botSub && botSub.status === 'close') {
              await BotSubscription.update({ status: 'open' }, { where });
            }
            client.message.sendText(msg.user_id, `Welcome, you have successfully subscribed. If new content is released, we will send you a message. If you want to unsubscribe, you can reply "cancel"`);
            const me = await client.user.profile();
            client.message.sendAppCard(msg.user_id, {
              app_id: config.mixinBotKeystore.user_id,
              icon_url: me.app.icon_url,
              title: me.app.name,
              action: me.app.home_uri,
              description: 'Launch App',
              shareable: true
            });
          }
        }
      } catch (err) {
        console.log(err);
      }
    },
  });
}

let isBusy = false;
let cache = {};
exports.notifyByBot = async (data) => {
  if (!config.mixinBotKeystore) {
    return;
  }
  while (isBusy) {
    console.log(`别人正在 mixin notifying，我等待 ...`);
    await sleep(1000);
  }
  try {
    const { iconUrl, title, description, url } = data;

    if (cache[url]) {
      return;
    }
    cache[url] = true;

    isBusy = true;
    
    const botSubs = await BotSubscription.findAll({ where: { status: 'open' } });
    const client = MixinApi({
      keystore: {
        ...config.mixinBotKeystore,
        user_id: config.mixinBotKeystore.user_id || config.mixinBotKeystore.client_id
      },
    });
    for (const botSub of botSubs) {
      try {
        await sleep(100);
        client.message.sendAppCard(botSub.userId, {
          icon_url: iconUrl,
          title,
          description,
          action: url,
          app_id: config.mixinBotKeystore.user_id,
          shareable: true
        });
      } catch (err) {
        console.log(err);
      }
    }
  } catch (err) {
    console.log(err);
  }
  isBusy = false;
}
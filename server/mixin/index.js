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
          if (msg.data === '取消') {
            if (botSub) {
              await BotSubscription.update({ status: 'close' }, { where });
            }
            client.message.sendText(msg.user_id, `订阅已成功取消了。回复任意消息即可重新订阅`);
          } else {
            if (!botSub) {
              await BotSubscription.create({ status: 'open', ...where });
            }
            if (botSub && botSub.status === 'close') {
              await BotSubscription.update({ status: 'open' }, { where });
            }
            client.message.sendText(msg.user_id, `欢迎您，您已成功订阅动态。之后如果有新的内容发布，我们将会给您推送消息。如果您想取消订阅，可以回复"取消"`);
            const me = await client.user.profile();
            client.message.sendAppCard(msg.user_id, {
              app_id: config.mixinBotKeystore.user_id,
              icon_url: me.app.icon_url,
              title: me.app.name,
              action: me.app.home_uri,
              description: '点击打开首页',
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
exports.notifyByBot = async (data) => {
  if (!config.mixinBotKeystore) {
    return;
  }
  while (isBusy) {
    console.log(`别人正在 mixin notifying，我等待 ...`);
    await sleep(1000);
  }
  isBusy = true;
  try {
    const { iconUrl, title, description, url } = data;
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
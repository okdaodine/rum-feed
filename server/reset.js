const sleep = require('./utils/sleep');
const Group = require('./database/sequelize/group');
const Seed = require('./database/sequelize/seed');
const Content = require('./database/sequelize/content');
const Post = require('./database/sequelize/post');
const Comment = require('./database/sequelize/comment');
const Profile = require('./database/sequelize/profile');
const UniqueCounter = require('./database/sequelize/uniqueCounter');
const Notification = require('./database/sequelize/notification');
const Activity = require('./database/sequelize/activity');
const Relation = require('./database/sequelize/relation');
const Wallet = require('./database/sequelize/wallet');
const Orphan = require('./database/sequelize/orphan');

(async () => {
  await sleep(2000);
  try {
    await Group.sync({ force: true });
    await Seed.sync({ force: true });
    await Content.sync({ force: true });
    await Post.sync({ force: true });
    await Comment.sync({ force: true });
    await Profile.sync({ force: true });
    await UniqueCounter.sync({ force: true });
    await Notification.sync({ force: true });
    await Activity.sync({ force: true });
    await Relation.sync({ force: true });
    await Wallet.sync({ force: true });
    await Orphan.sync({ force: true });
  } catch (err) {
    console.log(err);
  }
  console.log("Reset all database tables ✅ ");
})();
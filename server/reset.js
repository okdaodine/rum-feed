const sleep = require('./utils/sleep');
const Group = require('./database/sequelize/group');
const Seed = require('./database/sequelize/seed');
const Content = require('./database/sequelize/content');
const Post = require('./database/sequelize/post');
const Comment = require('./database/sequelize/comment');
const Profile = require('./database/sequelize/profile');
const UniqueCounter = require('./database/sequelize/uniqueCounter');
const Notification = require('./database/sequelize/notification');
const Feature = require('./database/sequelize/feature');
const Activity = require('./database/sequelize/activity');
const Relation = require('./database/sequelize/relation');

(async () => {
  await sleep(5000);
  try {
    await Group.sync({ force: true });
    await Seed.sync({ force: true });
    await Content.sync({ force: true });
    await Post.sync({ force: true });
    await Comment.sync({ force: true });
    await Profile.sync({ force: true });
    await UniqueCounter.sync({ force: true });
    await Notification.sync({ force: true });
    await Feature.sync({ force: true });
    await Activity.sync({ force: true });
    await Relation.sync({ force: true });
  } catch (err) {
    console.log(err);
  }
  console.log("Reset all database tables ✅ ");
})();
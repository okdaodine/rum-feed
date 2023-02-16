const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const Post = require('../database/sequelize/post');
const config = require('../config');

exports.generate = async () => {
  try {
    const origin = config.origin;
    const posts = [];
    let stop = false;
    while (!stop) {
      const _posts = await Post.findAll({
        raw: true,
        attributes: ['trxId', 'userAddress'],
        limit: 500,
        offset: Math.max(0, posts.length)
      });
      if (_posts.length > 0) {
        posts.push(..._posts.map(post => ({
          trxId: post.trxId,
          userAddress: post.userAddress
        })));
        console.log(`collected ${posts.length} posts`);
      } else {
        stop = true;
      }
    }
    const postUrls = posts.map(post => `${origin}/posts/${post.trxId}`);
    const userUrls = _.uniq(posts.map(post => post.userAddress)).map(address => `${origin}/users/${address}`);
    const urls = [...postUrls, ...userUrls];
    console.log(`Got ${urls.length} urls (${postUrls.length} posts + ${userUrls.length} users)`);
    if (!fs.existsSync('build')){
      fs.mkdirSync('build');
    }
    const destPath = path.join('build', 'sitemap.txt');
    await fs.promises.writeFile(destPath, urls.join('\n'));
    console.log(`created ${destPath}`);
  } catch (err) {
    console.log(err);
  }
}

exports.generate();
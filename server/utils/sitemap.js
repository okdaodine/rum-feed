const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const Post = require('../database/sequelize/post');

(async () => {
  try {
    const origin = 'https://feed.base.one';
    const posts = [];
    let stop = false;
    while (!stop) {
      const _posts = await Post.findAll({
        attributes: ['trxId', 'userAddress'],
        limit: 500,
        offset: Math.max(0, posts.length - 1)
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
    console.log(`Got ${postUrls.length} posts`);
    console.log(`Got ${userUrls.length} users`);
    console.log(`Got ${urls.length} urls`);
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.map(url => `<url>
      <loc>${url}</loc>
    </url>
    `).join('')}
  </urlset>`;
    if (!fs.existsSync('build')){
      fs.mkdirSync('build');
    }
    await fs.promises.writeFile(path.join('build', 'sitemap.xml'), sitemap);
    console.log('created sitemap');
  } catch (err) {
    console.log(err);
  }
})();
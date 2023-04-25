const router = require('koa-router')();
const fs = require('fs');
const Post = require('../database/post');
const Profile = require('../database/profile');
const config = require('../config');

const siteName = config.siteName;

router.get('/', async ctx => {
  const { url } = ctx.req;
  if (url.startsWith('/posts')) {
    const postId = url.split('/').pop();
    let content = '';
    let title = '';
    let image = '';
    let userName = '';
    if (postId) {
      const post = await Post.get(postId, {
        withExtra: true,
      });
      if (post) {
        content = post.content;
        userName = post.extra.userProfile.name.replace(/\n/g, '');
        image = post.extra.userProfile.avatar;
        title = `${userName} "${content.replace(/\n/g, '').slice(0, 80)}" - ${siteName}`;
      }
    }
    let html = await fs.promises.readFile('./build/index.html', 'utf-8');
    html = html.replace(/(?<="root">)(.*(?=<\/div\>))/, () => `<article class="invisible"><div>${content}</div></article>`);
    html = html.replace(/(?<=<title>)(.*(?=<\/title>))/, () => title);
    html = html.replace(/<\/title>/, () => [
      '</title>',
      `<meta property="og:site_name" content="${siteName}" />`,
      `<meta property="og:title" content="${userName}">`,
      `<meta property="og:description" content="${content}">`,
      `<meta property="og:image" content="${image}">`,
      `<meta property="twitter:site" content="@Twitter" />`,
      `<meta property="twitter:card" content="summary" />`,
      `<meta property="twitter:image" content="${image}" />`,
      `<meta property="twitter:title" content="${title}" />`,
    ].join(''));
    ctx.type = 'text/html';
    ctx.body = html;
  } else if (url.startsWith('/users')) {
    const userAddress = url.split('/').pop();
    let content = '';
    let title = '';
    let image = '';
    let userName = '';
    if (userAddress) {
      const profile = await Profile.get({
        userAddress,
      }, {
        withReplacedImage: true,
      });
      userName = profile ? profile.name.replace('\n', '') : userAddress;
      image = profile.avatar;
      const posts = await Post.list({
        where: {
          userAddress,
        },
        limit: 10,
      });
      content = posts.map(post => `<a href="/posts/${post.id}">${post.content}</a>`).join('');
      title = `${userName} - ${siteName}`;
    }
    let html = await fs.promises.readFile('./build/index.html', 'utf-8');
    html = html.replace(/(?<="root">)(.*(?=<\/div\>))/, () => `<article class="invisible"><div>${content}</div></article>`)
    html = html.replace(/(?<=<title>)(.*(?=<\/title>))/, () => title);
    html = html.replace(/<\/title>/, () => [
      '</title>',
      `<meta property="og:site_name" content="${siteName}" />`,
      `<meta property="og:title" content="${title}">`,
      `<meta property="og:image" content="${image}">`,
      `<meta property="twitter:site" content="@Twitter" />`,
      `<meta property="twitter:card" content="summary" />`,
      `<meta property="twitter:image" content="${image}" />`,
      `<meta property="twitter:title" content="${title}" />`,
    ].join(''));
    ctx.type = 'text/html';
    ctx.body = html;
  }
});

module.exports = router;
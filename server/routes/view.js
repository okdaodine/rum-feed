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
    let description = '';
    if (postId) {
      const post = await Post.get(postId, {
        withExtra: true,
      });
      if (post) {
        content = post.content;
        title = `${content.replace(/\n/g, '').slice(0, 22)} - ${siteName}`;
        description = `${content.replace(/\n/g, '').slice(0, 100)} - ${post.extra.userProfile.name}`;
      }
    }
    let html = await fs.promises.readFile('./build/index.html', 'utf-8');
    html = html.replace(/(?<="root">)(.*(?=<\/div\>))/, () => `<article class="invisible"><div>${content}</div></article>`);
    html = html.replace(/(?<=<title>)(.*(?=<\/title>))/, () => title);
    html = html.replace(/(?<=name="description" content=")(.*(?="\/\>))/, () => description);
    html = html.replace(/<\/title>/, () => `</title><meta property="og:site_name" content="${siteName}" /><meta property="og:title" content="${title}">`);
    ctx.type = 'text/html';
    ctx.body = html;
  } else if (url.startsWith('/users')) {
    const userAddress = url.split('/').pop();
    let content = '';
    let title = '';
    let description = '';
    if (userAddress) {
      const profile = await Profile.get({
        userAddress
      });
      let userName = profile ? profile.name.replace('\n', '') : userAddress;
      const posts = await Post.list({
        where: {
          userAddress,
        },
        limit: 10,
      });
      content = posts.map(post => `<a href="/posts/${post.id}">${post.content}</a>`).join('');
      title = `${userName} - ${siteName}`;
      description = `${userName} - ${siteName}`;
    }
    let html = await fs.promises.readFile('./build/index.html', 'utf-8');
    html = html.replace(/(?<="root">)(.*(?=<\/div\>))/, () => `<article class="invisible"><div>${content}</div></article>`)
    html = html.replace(/(?<=name="description" content=")(.*(?="\/\>))/, () => description);
    html = html.replace(/(?<=<title>)(.*(?=<\/title>))/, () => title);
    html = html.replace(/<\/title>/, () => `</title><meta property="og:site_name" content="${siteName}" /><meta property="og:title" content="${title}">`);
    ctx.type = 'text/html';
    ctx.body = html;
  } else {
    return ctx.render('index');
  }
});

module.exports = router;
const router = require('koa-router')();
const fs = require('fs');
const Post = require('../database/post');
const Profile = require('../database/profile');

router.get('/', async ctx => {
  const { url } = ctx.req;
  if (url.startsWith('/posts')) {
    const postId = url.split('/').pop();
    let content = '';
    let summary = '';
    if (postId) {
      const post = await Post.get(postId, {
        withExtra: true,
      });
      if (post) {
        content = post.content;
        summary = `${post.content.slice(0, 100)} - ${post.extra.userProfile.name}`;
      }
    }
    let html = await fs.promises.readFile('./build/index.html', 'utf-8');
    html = html.replace(/(?<="root">)(.*(?=<\/div\>))/, () => `<article class="invisible"><div>${content}</div></article>`)
    html = html.replace(/(?<=name="description" content=")(.*(?="\/\>))/, () => summary);
    html = html.replace(/(?<=<title>)(.*(?=<\/title>))/, () => summary);
    ctx.type = 'text/html';
    ctx.body = html;
  } else if (url.startsWith('/users')) {
    const userAddress = url.split('/').pop();
    let content = '';
    let userName = '';
    if (userAddress) {
      const profile = await Profile.get({
        userAddress
      });
      userName = profile ? profile.name : userAddress;
      const posts = await Post.list({
        where: {
          userAddress,
        },
        limit: 10,
      });
      content = posts.map(post => `<a href="/posts/${post.id}">${post.content}</a>`).join('');
    }
    let html = await fs.promises.readFile('./build/index.html', 'utf-8');
    html = html.replace(/(?<="root">)(.*(?=<\/div\>))/, () => `<article class="invisible"><div>${content}</div></article>`)
    html = html.replace(/(?<=name="description" content=")(.*(?="\/\>))/, () => userName);
    html = html.replace(/(?<=<title>)(.*(?=<\/title>))/, () => userName);
    ctx.type = 'text/html';
    ctx.body = html;
  } else {
    return ctx.render('index');
  }
});

module.exports = router;
const router = require('koa-router')();
const fs = require('fs');
const Post = require('../database/post');
const Profile = require('../database/profile');
const config = require('../config');
const getDefaultProfile = require('../utils/getDefaultProfile');

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
        content = escapeHtml(post.content || '');
        userName = escapeHtml(post.extra.userProfile.name.replace(/\n/g, ''));
        image = post.extra.userProfile.avatar;
        title = `${userName} "${content.replace(/\n/g, '').slice(0, 80)}" - ${siteName}`;
      }
    }
    let html = await fs.promises.readFile('./build/index.html', 'utf-8');
    html = html.replace(/(?<=<\/title>)(([\w\W])*(?=<script defer="defer"))/, () => '');
    html = html.replace(/(?<="root">)(.*(?=<\/div\>))/, () => `<article class="invisible"><div>${content}</div></article>`);
    html = html.replace(/(?<=<title>)(.*(?=<\/title>))/, () => title);
    html = html.replace(/<\/title>/, () => [
      '</title>',
      `<meta property="og:site_name" content="${siteName}" />\n`,
      `<meta property="og:title" content="${userName}" />\n`,
      `<meta property="og:description" content="${content}" />\n`,
      `<meta property="og:image" content="${image}" />\n`,
      `<meta property="twitter:site" content="@Twitter" />\n`,
      `<meta property="twitter:card" content="summary" />\n`,
      `<meta property="twitter:image" content="${image}" />\n`,
      `<meta property="twitter:title" content="${title}" />\n`,
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
      userName = escapeHtml(profile ? profile.name.replace('\n', '') : userAddress);
      image = profile ? profile.avatar : getDefaultProfile(userAddress).avatar;
      const posts = await Post.list({
        where: {
          userAddress,
        },
        limit: 10,
      });
      content = posts.map(post => `<a href="/posts/${escapeHtml(post.id)}">${escapeHtml(post.content)}</a>`).join('');
      title = `${userName} - ${siteName}`;
    }
    let html = await fs.promises.readFile('./build/index.html', 'utf-8');
    html = html.replace(/(?<=<\/title>)(([\w\W])*(?=<script defer="defer"))/, () => '');
    html = html.replace(/(?<="root">)(.*(?=<\/div\>))/, () => `<article class="invisible"><div>${content}</div></article>`)
    html = html.replace(/(?<=<title>)(.*(?=<\/title>))/, () => title);
    html = html.replace(/<\/title>/, () => [
      '</title>',
      `<meta property="og:site_name" content="${siteName}" />\n`,
      `<meta property="og:title" content="${title}" />\n`,
      `<meta property="og:image" content="${image}" />\n`,
      `<meta property="twitter:site" content="@Twitter" />\n`,
      `<meta property="twitter:card" content="summary" />\n`,
      `<meta property="twitter:image" content="${image}" />\n`,
      `<meta property="twitter:title" content="${title}" />\n`,
    ].join(''));
    ctx.type = 'text/html';
    ctx.body = html;
  } else {
    return ctx.render('index');
  }
});

function escapeHtml(text) {
  var map = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;'
  };
  return text.replace(/[<>&]/g, function(m) {
    return map[m];
  });
}

module.exports = router;
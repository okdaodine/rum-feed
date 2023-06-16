const router = require('koa-router')();
const https = require('https');
const { assert, Errors } = require('../utils/validator');

router.get('/:url', getRedirectUrl);

async function getRedirectUrl(ctx) {
  const url = decodeURIComponent(ctx.params.url);
  assert(/(https?:\/\/)([\w&@.:/?=-]+)/g.test(url), Errors.ERR_IS_INVALID('url'));

  const redirectUrl = await new Promise((resolve, reject) => {
    try {
      https.get(url, (response) => {
        resolve(response.headers['location']);
      });
    } catch (err) {
      console.log(err);
      resolve('');
    }
  });

  ctx.body = {
    redirectUrl
  };
}

module.exports = router;
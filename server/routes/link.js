const router = require('koa-router')();
const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config');
const { assert, Errors } = require('../utils/validator');
const urlToBase64 = require('../utils/urlToBase64');
const Link = require('../database/sequelize/link');

router.get('/:url', get);

async function get(ctx) {
  const url = decodeURIComponent(ctx.params.url);
  assert(/(https?:\/\/)([\w&@.:/?=-]+)/g.test(url), Errors.ERR_IS_INVALID('url'));

  if (config.excludedLinks) {
    for (const excludedLink of config.excludedLinks || []) {
      assert(!url.includes(excludedLink), Errors.ERR_IS_INVALID('url'));
    }
  }

  const link = await Link.findOne({
    where: {
      url
    }
  });
  if (link) {
    ctx.body = link.data;
    return;
  }

  let data = null;
  try {
    const source = axios.CancelToken.source();
    const timeout = setTimeout(() => {
      source.cancel();
    }, 5 * 1000);
    const res = await axios.get(url, {
      cancelToken: source.token
    });
    clearTimeout(timeout);
    const $ = cheerio.load(res.data);
    data = {
      title: $('title').text().trim() || $('[property="og:title"]').attr('content'),
      description: $('meta[name="description"]').attr('content') || $('[property="og:description"]').attr('content'),
    };
    let imageUrl = $('[property="og:image"]').attr('content');
    if (imageUrl) {
      if (imageUrl.startsWith('//')) {
        imageUrl = `https:${imageUrl}`;
      }
      imageUrl = imageUrl.replace('100w_100h', '160w_160h');
      data.image = await urlToBase64(imageUrl, {
        maxWidth: 320,
        maxHeight: 320,
        maxKbSize: 60
      });
    }
  } catch (err) {
    console.log(err.message);
  }
  assert(data && data.title, Errors.ERR_IS_REQUEST_FAILED('Failed to fetch url'));
  if (!link) {
    await Link.create({
      url,
      data
    });
  }
  ctx.body = data;
}

module.exports = router;
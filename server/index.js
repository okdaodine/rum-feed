const path = require('path');
const fs = require('fs');
const isConfigExists = fs.existsSync(path.join(__dirname, './config.js'));
if (!isConfigExists) {
  console.log(`server/config.js not exists`);
  console.log(`Please get it from https://bitbucket.org/pressone/deploy/src/master/medium/nft-bbs.config/config.js`)
  process.exit(0);
}

const Koa = require('koa');
const http = require('http');
const convert = require('koa-convert');
const json = require('koa-json');
const bodyparser = require('koa-bodyparser')();
const logger = require('koa-logger');
const cors = require('@koa/cors');
const router = require('koa-router')();
const serve = require('koa-static');
const views = require('koa-views');
const Socket = require('./socket');

const pollingContent = require('./pollingContent');
require('./mixin');

const ping = require('./routes/ping');
const group = require('./routes/group');
const content = require('./routes/content');
const seed = require('./routes/seed');
const post = require('./routes/post');
const comment = require('./routes/comment');
const profile = require('./routes/profile');
const notification = require('./routes/notification');
const user = require('./routes/user');
const trx = require('./routes/trx');
const feature = require('./routes/feature');
const image = require('./routes/image');
const relation = require('./routes/relation');
const config = require('./routes/config');

const {
  errorHandler,
  extendCtx
} = require('./middleware/api');

const app = new Koa();
const port = 9000;
 
app.use(convert(bodyparser));
app.use(convert(json()));
app.use(convert(logger()));
app.use(cors({
  credentials: true
}));
app.use(views(__dirname + '/build'));
app.use(serve('build', {
  maxage: 365 * 24 * 60 * 60,
  gzip: true
}));
app.proxy = true;

router.all('(.*)', errorHandler);
router.all('(.*)', extendCtx);

router.use('/favicon.ico', async (ctx) => ctx.body = true);
router.use('/api/ping', ping.routes(), ping.allowedMethods());
router.use('/api/groups', group.routes(), group.allowedMethods());
router.use('/api/contents', content.routes(), content.allowedMethods());
router.use('/api/seeds', seed.routes(), seed.allowedMethods());
router.use('/api/features', feature.routes(), feature.allowedMethods());
router.use('/api/posts', post.routes(), post.allowedMethods());
router.use('/api/comments', comment.routes(), comment.allowedMethods());
router.use('/api/profiles', profile.routes(), profile.allowedMethods());
router.use('/api/notifications', notification.routes(), notification.allowedMethods());
router.use('/api/users', user.routes(), user.allowedMethods());
router.use('/api/images', image.routes(), image.allowedMethods());
router.use('/api/relations', relation.routes(), relation.allowedMethods());
router.use('/api/:groupId/trx', trx.routes(), trx.allowedMethods());
router.use('/api/config', config.routes(), config.allowedMethods());

router.use('(.*)', async ctx => ctx.render('index'));

app.use(router.routes(), router.allowedMethods());

app.on('error', function (err) {
  console.log(err)
});

const server = http.createServer(app.callback());
Socket.init(server);
server.listen(port, () => {
  console.log(`Node.js v${process.versions.node}`);
  console.log(`Server run at ${port}`);
  setTimeout(() => {
    pollingContent(2000);
  }, 2000);
});


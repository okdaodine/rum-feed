const Koa = require('koa');
const http = require('http');
const convert = require('koa-convert');
const json = require('koa-json');
const bodyparser = require('koa-bodyparser');
const logger = require('koa-logger');
const cors = require('@koa/cors');
const router = require('koa-router')();
const serve = require('koa-static');
const views = require('koa-views');
const Socket = require('./socket');

const pollingContent = require('./pollingContent');
const pollingV1Content = require('./pollingV1Content');
require('./mixin');
require('./preset');

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
const image = require('./routes/image');
const relation = require('./routes/relation');
const config = require('./routes/config');
const sitemap = require('./routes/sitemap');
const view = require('./routes/view');
const v1Content = require('./routes/v1Content');
const link = require('./routes/link');
const activity = require('./routes/activity');

const {
  errorHandler,
  extendCtx
} = require('./middleware/api');

const app = new Koa();
const port = 9000;
 
app.use(convert(bodyparser({ formLimit:"5mb", jsonLimit:"5mb" })));
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
router.use('/api/posts', post.routes(), post.allowedMethods());
router.use('/api/comments', comment.routes(), comment.allowedMethods());
router.use('/api/profiles', profile.routes(), profile.allowedMethods());
router.use('/api/notifications', notification.routes(), notification.allowedMethods());
router.use('/api/users', user.routes(), user.allowedMethods());
router.use('/api/images', image.routes(), image.allowedMethods());
router.use('/api/relations', relation.routes(), relation.allowedMethods());
router.use('/api/:groupId/trx', trx.routes(), trx.allowedMethods());
router.use('/api/config', config.routes(), config.allowedMethods());
router.use('/api/v1/contents', v1Content.routes(), v1Content.allowedMethods());
router.use('/api/sitemap.txt', sitemap.routes(), sitemap.allowedMethods());
router.use('/api/links', link.routes(), link.allowedMethods());
router.use('/api/activities', activity.routes(), activity.allowedMethods());

router.use('(.*)', view.routes(), view.allowedMethods());

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
    pollingContent();
    pollingV1Content();
  }, 2000);
});


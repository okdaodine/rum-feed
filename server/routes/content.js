const router = require('koa-router')();
const Content = require('../database/sequelize/content');
const { assert, Errors } = require('../utils/validator');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const rumSDK = require('rum-sdk-nodejs');

router.get('/:userPubKey/export', exportContents);
router.get('/:groupId', list);
router.get('/:groupId/:trxId', get);

async function list(ctx) {
  const attributes = {};
  if (ctx.query.minimal) {
    attributes.exclude = ['Data', 'log'];
  }
  const contents = await Content.findAll({
    attributes,
    where: {
      groupId: ctx.params.groupId
    },
    limit: Math.min(~~ctx.query.limit || 10, 100),
    offset: ctx.query.offset || 0,
    order: [
      ['id', 'DESC']
    ]
  });
  ctx.body = contents;
}

async function get(ctx) {
  const content = await Content.findOne({
    where: {
      groupId: ctx.params.groupId,
      TrxId: ctx.params.trxId,
    }
  });
  assert(content, Errors.ERR_NOT_FOUND('content'));
  ctx.body = content;
} 

async function exportContents(ctx) {
  const userAddress = rumSDK.utils.pubkeyToAddress(ctx.params.userPubKey);
  const exportPath = path.join('./build', `export-${userAddress}`);
  if (!fs.existsSync('build')) {
    fs.mkdirSync('build');
  }
  try {
    if (fs.existsSync(exportPath)) {
      fs.rmSync(exportPath, { recursive: true, force: true });
    }
    fs.mkdirSync(exportPath);
  } catch (err) {
    console.log(err);
  }
  const limit = 100;
  let index = 1;
  let exported = false;
  let offset = 0;
  while (true) {
    const contents = await Content.findAll({
      where: {
        SenderPubkey: ctx.params.userPubKey,
      },
      attributes: {
        exclude: ['id', 'log', 'groupId', 'Expired']
      },
      limit,
      offset,
    });
    if (contents.length > 0) {
      const fileName = `part-${index}.json`;
      const dest = path.join(exportPath, fileName);
      const fileContent = JSON.stringify(contents);
      await fs.promises.writeFile(dest, fileContent);
      console.log(`[Export]: Create file ${dest}`);
      index++;
      exported = true;
      offset += contents.length;
    }
    if (contents.length < limit) {
      break;
    }
  }

  assert(exported, Errors.ERR_NOT_FOUND('contents'));

  const exportZipName = `export-${userAddress}-${Date.now()}.zip`;
  const exportZipPath = path.join('./build', exportZipName);
  const output = fs.createWriteStream(exportZipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', function () {
    console.log(`Articles have been successfully archived into ${exportZipPath}`);
  });

  archive.pipe(output);
  archive.directory(exportPath, false);
  archive.finalize();

  ctx.body = {
    fileName: exportZipName
  };
}

module.exports = router;
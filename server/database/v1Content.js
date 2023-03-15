const V1Content = require('./sequelize/v1Content');

exports.create = async data => {
  const exist = await V1Content.findOne({ where: { trxId: data.trxId } });
  if (!exist) {
    console.log(`   ---- v1 ${data.trxId} ✅ `)
    await V1Content.create(data);
  }
}
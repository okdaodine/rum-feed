const { RumFullNodeClient } = require('rum-fullnode-sdk');
const Group = require('./database/sequelize/group');
const config = require('./config');
const createSeed = require('./utils/createSeed');

module.exports = async () => {
  await tryCreateDefaultGroup();
}

async function tryCreateDefaultGroup () {
  const defaultGroup = await Group.findOne({ where: { groupName: 'default' } });
  if (!defaultGroup) {
    const client = RumFullNodeClient(config.fullnode);
    const res = await client.Group.create({
      group_name: 'default',
      consensus_type: 'poa',
      encryption_type: 'public',
      app_key: 'group_timeline',
    });
    await createSeed(res.seed);
    console.log(`Create default group ${res.group_id} ✅`);
  }
}
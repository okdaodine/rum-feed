const router = require('koa-router')();
const ethers = require('ethers');
const config = require('../config');
const Group = require('../database/sequelize/group');
const { RumFullNodeClient } = require('rum-fullnode-sdk');
const createSeed = require('./utils/createSeed');
const { ERC721_ABI, RPC_MAPPING } = require('../utils/contract');

router.post('/:mainnet/:contractAddress', check);

async function check(ctx) {
  const { mainnet, contractAddress } = ctx.params;
  const groupName = `${mainnet.toLowerCase()}.${contractAddress.slice(0, 4).toLowerCase()}`;
  console.log(groupName);
  const group = await Group.findOne({
    where: {
      groupName
    }
  });
  console.log(group);
  if (!group) {
    const provider = new ethers.providers.JsonRpcProvider(RPC_MAPPING[mainnet]);
    const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
    const contractName = await contract.name();
    console.log({ contractName });
    const client = RumFullNodeClient(config.fullnode);
    {
      const res = await client.Group.create({
        group_name: groupName,
        consensus_type: 'poa',
        encryption_type: 'public',
        app_key: 'group_timeline',
      });
      console.log(res);
      await createSeed(res.seed);
      await Group.update({
        groupAlias: contractName
      }, {
        where: {
          groupId: res.group_id
        }
      });
    }
    {
      const res = await client.Group.create({
        group_name: `public.${groupName}`,
        consensus_type: 'poa',
        encryption_type: 'public',
        app_key: 'group_timeline',
      });
      await createSeed(res.seed);
      console.log(res);
    }
  }
  ctx.body = { groupName };
}

module.exports = router;
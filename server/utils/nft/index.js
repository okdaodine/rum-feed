const axios = require('axios');
const JsSHA = require('jssha');
const ethers = require('ethers');
const ERC721ABI = require('./erc721.json');
const { assert, Errors } = require('../validator');
const logger = require('../logger');

async function getOutputs(token, ids) {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const resp = await axios.get(`https://mixin-api.zeromesh.net/collectibles/outputs?members=${hashMembers(ids)}&threshold=1&state=unspent`, config)
    if (resp.data) {
      return resp.data.data
    }
  } catch (err) {
    console.log(err);
  }
  return [];
}

async function getUserId(token) {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const resp = await axios.get(`https://mixin-api.zeromesh.net/me`, config);
    return resp.data.data.user_id;
  } catch (err) {
    console.log(err);
  }
  return null;
};

async function getNFT(userId, token, collectionId) {
  const outputs = await getOutputs(token, [userId]);
  console.log(`[getNFT]:`, { outputs });
  for (const output of outputs) {
    try {
      if (output.token_id) {
        const nft = await getNFTToken(token, output.token_id);
        if (nft && nft.collection_id === collectionId) {
          return nft;
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
  return null;
}

async function getNFTToken(token, id) {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const resp = await axios.get(`https://mixin-api.zeromesh.net/collectibles/tokens/${id}`, config)
    if (resp.data) {
      return resp.data.data
    }
  } catch (err) {
    console.log(err);
  }
  return null;
};

function hashMembers(ids) {
  const key = ids.sort().join('');
  const sha = new JsSHA('SHA3-256', 'TEXT', { encoding: 'UTF8' });
  sha.update(key);
  return sha.getHash('HEX');
};

async function getTokensFromExplorer(address) {
  try {
    const resp = await axios.get(`https://scan.mvm.dev/api?module=account&action=tokenlist&address=${address}`);
    return resp.data.result
  } catch (err) {
    console.log(err);
  }
  return [];
}

async function getERC721TokensFromExplorer(address) {
  const fetchTokens = await getTokensFromExplorer(address);
  return fetchTokens.filter(token => token.type === 'ERC-721');
}

async function getNFTFromExplorer(address, collectionId) {
  try {
    assert(address, Errors.ERR_IS_REQUIRED('address'));
    const provider = new ethers.providers.JsonRpcProvider('https://geth.mvm.dev');
    const erc721Tokens = await getERC721TokensFromExplorer(address);
    for (let i = 0; i < erc721Tokens.length; i++) {
      const contract = new ethers.Contract(erc721Tokens[i].contractAddress, ERC721ABI, provider);
      for (let j = 0; j < erc721Tokens[i].balance; j++) {
        try {
          const _collectionId = await contract.collection();
          if (_collectionId._hex.length !== 34) continue;
          const tokenId = await contract.tokenOfOwnerByIndex(address, j);
          const tokenURI = await contract.tokenURI(tokenId);
          const NFTinfo = await getNFTByTokenURI(tokenURI);
          logger.info(`[getNFTFromExplorer]:`)
          logger.info({ tokenId, tokenURI, NFTinfo });
          if (NFTinfo.collection.id === collectionId) {
            return NFTinfo;
          }
        } catch (err) {
          console.log(err)
          continue;
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
  return null;
}

async function getNFTByTokenURI(tokenURI) {
  const resp = await axios.get(tokenURI);
  return resp.data;
}

module.exports = {
  mixin: {
    getUserId,
    getNFT,
  },
  mvm: {
    getERC721TokensFromExplorer,
    getNFTFromExplorer
  },
}
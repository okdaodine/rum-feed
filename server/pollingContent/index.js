const rumSDK = require('rum-sdk-nodejs');
const sleep = require('../utils/sleep');
const handlePost = require('./handlePost');
const handleComment = require('./handleComment');
const handleCounter = require('./handleCounter');
const handleProfile = require('./handleProfile');
const handleRelation = require('./handleRelation');
const handleFavorite = require('./handleFavorite');
const getTrxType = require('../utils/getTrxType');
const Content = require('../database/sequelize/content');
const Group = require('../database/sequelize/group');
const config = require('../config');
const { shuffle } = require('lodash');
const moment = require('moment');
const shuffleChainApi = require('../utils/shuffleChainApi');
const pendingTrxHelper = require('../utils/pendingTrxHelper');
const handlePostDelete = require('./handlePostDelete');
const Orphan = require('../database/sequelize/orphan');
const getGroupVersion = require('../utils/getGroupVersion');

const jobShareData = {
  limit: 0,
  activeGroupMap: {},
  handling: false,
  jobMap: {}
}

module.exports = (duration = config.polling?.duration || 1000) => {
  let stop = false;

  rumSDK.cache.Group.clear();

  (async () => {
    while (!stop) {
      const groups = (await Group.findAll()).filter(group => getGroupVersion(group) === 'v2');
      for (const group of groups) {
        rumSDK.cache.Group.add(group.seedUrl);
      }
      if (process.env.NODE_ENV === 'production-debug') {
        stop = true;
        console.log('==================================================');
        console.log('Disabled polling content for production debug mode');
        console.log('==================================================');
        return;
      }
      jobShareData.activeGroupMap = await getActiveGroupMap(groups);
      jobShareData.limit = getLimit(groups);
      for (const group of groups) {
        if (!jobShareData.jobMap[group.groupId]) {
          jobShareData.jobMap[group.groupId] = startJob(group.groupId, duration);
          await sleep(500);
        }
      }
      await sleep(5 * 1000);
    }
  })();
}

const startJob = async (groupId, duration) => {
  while (true) {
    const group = await Group.findOne({ where: { groupId } });
    if (!group) {
      delete jobShareData.jobMap[groupId];
      break;
    }
    const isActive = !!jobShareData.activeGroupMap[groupId];
    if (isActive) {
      const isLazyGroup = (config.polling?.lazyGroupIds || []).includes(group.groupId);
      if (isLazyGroup) {
        await sleep(5 * 60 * 1000);
      }
      const where = { groupId: group.groupId };
      try {
        const listOptions = {
          groupId: group.groupId,
          count: jobShareData.limit,
        };
        if (group.startTrx) {
          listOptions.startTrx = group.startTrx;
        }
        if (pendingTrxHelper.isTimeOut(group.groupId)) {
          const chainAPIs = await shuffleChainApi(group.groupId);
          if (chainAPIs.length > 1) {
            console.log(`[shuffleChainApi]:`, { groupId, chainAPIs });
          }
        }
        const contents = await rumSDK.chain.Content.list(listOptions);
        console.log(`${moment().format('HH:mm:ss')} ${group.groupName}: fetched and got ${contents.length} contents`);
        while (jobShareData.handling) {
          await sleep(200);
        }
        jobShareData.handling = true;
        try {
          if (contents.length > 0) {
            await handleContents(groupId, contents.sort((a, b) => a.TimeStamp - b.TimeStamp));
            const contentCount = await Content.count({ where });
            await Group.update({ contentCount }, { where });
          }
          await Group.update({ status: 'connected' }, { where });
          if (!group.loaded && contents.length === 0) {
            await Group.update({ loaded: true }, { where });
          }
        } catch(err) {
          throw err;
        } finally {
          jobShareData.handling = false;
        }
      } catch (err) {
        try {
          console.log({ err });
          await sleep(2000);
        } catch (_) {}
        await Group.update({ status: 'disconnected' }, { where });
      }
    }
    await sleep(duration);
  }
}

const handleContents = async (groupId, contents) => {
  const group = await Group.findOne({ where: { groupId } });
  try {
    for (const content of contents) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(content);
      }
      let success = false;
      let log = '';
      try {
        pendingTrxHelper.tryRemove(group.groupId, content.TrxId);
        const existContent = await Content.findOne({ where: { TrxId: content.TrxId }});
        if (existContent && existContent.GroupId === content.GroupId) {
          continue;
        }
        if (!existContent) {
          const type = getTrxType(content);
          switch(type) {
            case 'post': await handlePost(content, group); break;
            case 'delete': await handlePostDelete(content, group); break;
            case 'comment': await handleComment(content, group); break;
            case 'counter': await handleCounter(content, group); break;
            case 'profile': await handleProfile(content); break;
            case 'relation': await handleRelation(content, group); break;
            case 'favorite': await handleFavorite(content); break;
            default: break;
          }
          console.log(`${content.TrxId} ✅`);
          success = true;
        }
      } catch (err) {
        if (err.message === 'Orphan') {
          const type = getTrxType(content);
          console.log(`[${type}]: ${content.TrxId} is an orphan 👶`);
          continue;
        }
        console.log(content);
        console.log(err);
        log = err;
        console.log(`${content.TrxId} ❌ ${err.message}`);
      }

      try {
        await Content.create({
          ...content,
          groupId,
          log
        });
      } catch (err) {
        console.log(err);
      }

      if (success) {
        try {
          const type = getTrxType(content);
          if (type === 'post' || type === 'comment') {
            if (content.Data.object?.id) {
              const orphans = await Orphan.findAll({
                raw: true,
                where: {
                  parentId: content.Data.object.id
                }
              });
              if (orphans.length > 0) {
                console.log(`[handle orphans 👶]:`, orphans.map(o => `${o.content.TrxId}`));
                for (const orphan of orphans) {
                  await handleContents(orphan.content.GroupId, [orphan.content]);
                }
              }
            }
          }
        } catch (err) {
          console.log(err);
        }
      }

    }
    await Group.update({
      startTrx: contents[contents.length - 1].TrxId
    }, {
      where: {
        groupId
      }
    });
  } catch (err) {
    console.log(err);
  }
}


const getActiveGroupMap = async groups => {
  const map = {};
  const loadedGroups = groups.filter(group => group.loaded);
  const unloadedGroups = groups.filter(group => !group.loaded);
  const temRandomUnloadedGroups = shuffle(unloadedGroups).slice(0, config.polling?.maxIndexingUnloadedGroup || 3);
  for (const group of temRandomUnloadedGroups) {
    map[group.groupId] = group;
  }

  const towRandomLoadedGroups = shuffle(loadedGroups).slice(0, 2);
  for (const group of towRandomLoadedGroups) {
    map[group.groupId] = group;
  }

  for (const group of loadedGroups) {
    if (map[group.groupId]) {
      continue;
    }
    const latestContent = await Content.findOne({
      attributes: ['TimeStamp'],
      where: {
        TrxId: group.startTrx
      }
    });
    if (!latestContent) {
      continue;
    }
    const timestamp = parseInt(String(latestContent.TimeStamp / 1000000), 10);
    const hours = Math.abs(moment(timestamp).diff(new Date(), 'hours'));
    if (hours < 72) {
      map[group.groupId] = group;
    }
  }
  return map;
}

const getLimit = groups => {
  const unloadedCount = groups.filter(group => !group.loaded).length;
  const configLimit = config.polling?.limit || 50;
  const limit = unloadedCount >= 2 ? Math.max(Math.round(configLimit/Math.pow(2, unloadedCount)), 10) : configLimit
  return limit;
}
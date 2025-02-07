import {lineConfigs, TLineConfig, isCheckingTime} from '../../config';
import {toTLApi, toTwitterPromise, parseTweets, parsedTweetToDB, logger} from '../../helper';
import {addRecord, getTodayLatestRecord} from '../../db/record';
import {TParsedTweet} from '../../helper';
import {Record} from '@prisma/client';

type TFetchRes = {
  res: 'OK' | 'FAILED';
  msg: string;
};

const shouldAdd = (latestData: TParsedTweet, latestRecord: Record | undefined) => {
  if (!isCheckingTime(new Date(latestData.created_at))) {
    return false;
  }
  if (!latestRecord) {
    logger.info(`add for latestRecord is undefine`);
    return true;
  }
  if (latestData.id_str === latestRecord.msgId) {
    return false;
  }
  const res = latestData.statusCd === 'IN_TROUBLE' || latestRecord.statusCd === 'IN_TROUBLE';
  if (res) {
    logger.info(`add for status is different`);
  }
  return res;
};

const fetchData = async (cfg: TLineConfig): Promise<TFetchRes> => {
  try {
    const tlApi = toTLApi(cfg.screenName);
    logger.info(`fetch api ${cfg.name}`);
    const {data} = await toTwitterPromise(tlApi);
    logger.info(`fetch api ok ${cfg.name}`);
    const tweets = data.map(({text, created_at, id_str}) => ({created_at, text, id_str}));
    const parsedRes = parseTweets(tweets);
    const latestData = parsedRes[0];
    const latestRecord = await getTodayLatestRecord(cfg.id);
    logger.info(`compare ${latestData.statusCd}, ${latestRecord?.statusCd}`);
    if (shouldAdd(latestData, latestRecord)) {
      await addRecord(parsedTweetToDB(latestData, cfg.id));
    }
    logger.info(`parse ${cfg.name} ok`);
    return {res: 'OK', msg: ''};
  } catch (err) {
    logger.error(`parse ${cfg.name} Error! ${err}`);
    return {res: 'FAILED', msg: cfg.name};
  }
};

export default async () => {
  if (!isCheckingTime()) {
    return;
  }
  const promises = lineConfigs.map(cfg => fetchData(cfg));
  const results = await Promise.all(promises);
  const failedResults = results.filter(({res}) => res === 'FAILED');
  if (failedResults.length) {
    const names = failedResults.map(({msg}) => msg);
    logger.info(`failed ${failedResults.length}, ${names}`);
    return;
  }
  logger.info(`parse all ok`);
};

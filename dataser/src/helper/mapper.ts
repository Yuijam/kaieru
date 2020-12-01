import {TParsedTweet} from '../types';
import {TRecordDB, TRecord, TPartialRecord} from 'shared/model';
import {toDateStr} from 'shared/lib/dateFns';

export const parsedTweetToDB = (tweet: TParsedTweet, lineId: number): TPartialRecord => ({
  line_id: lineId,
  status_cd: tweet.statusCd,
  message: tweet.text,
  created_at: toDateStr(tweet.created_at),
});

export const recordDBToModel = (data: TRecordDB): TRecord => ({
  id: data.id,
  lineId: data.line_id,
  statusCd: data.status_cd,
  message: data.message,
  createdAt: toDateStr(data.created_at),
  deletedAt: '',
});
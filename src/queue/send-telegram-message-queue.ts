import Queue from 'bull'
import { IProduct } from '../domains/parser';
import { Config } from '../domains/config';

type JobType = {
  userId: string,
  data?: any,
  requestId: string,
  merchantName: string,
  requestType: "setShopName" | "setMerchantProductsParsingState" | "setPositionsParsingState" | "sendParsingResult" | "sendPositionProducts"
}

export const salesSendTelegramMessageQueue = new Queue<JobType>(
  'send-telegram-message-queue',
  Config.redisUrl,
);
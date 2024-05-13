import Queue from 'bull'
import { IProduct } from '../domains/parser';
import { Config } from '../domains/config';

type JobType = {
  merchantId: string,
  requestId: string,
  pageNum: number,
  userId: string,
  merchantName: string,
}

export const salesParseKaspiMerchantProductsQueue = new Queue<JobType>(
  'parse-kaspi-merchant-products-queue',
  Config.redisUrl,
);
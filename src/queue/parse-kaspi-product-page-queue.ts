
import Queue from 'bull'
import { IProduct } from '../domains/parser';
import { Config } from '../domains/config';

type JobType = {
  userId: string,
  merchantId: string,
  product: IProduct,
  requestId: string,
  productsAmount: number,
  merchantName: string,
}

export const parseKaspiProductPageQueue = new Queue<JobType>(
  'parse-kaspi-product-page-queue',
  Config.redisUrl,
);
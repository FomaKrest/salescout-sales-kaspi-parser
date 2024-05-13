import { HttpRequestResultDto } from '../http.dto'

import { initRedis } from "../redis/init-redis"
import { MongoDatabase } from '../db'
import { ParserUtils } from '../utils/parser'
import { PositionProcessData } from '../data/positions-process'
import { salesSendTelegramMessageQueue } from '../queue/send-telegram-message-queue'
import axios from 'axios'
import { salesParseKaspiMerchantProductsQueue } from '../queue/parse-kaspi-merhant-products-queue'
import { IProduct } from '../domains/parser'
import { salesParseKaspiProductPageQueue } from '../queue/parse-kaspi-product-page-queue'

const parsedPagesAmount: any = {};

const start = () => {
  salesParseKaspiMerchantProductsQueue.process(6, async (job) => {
    const { merchantId, merchantName, requestId, pageNum, userId } = job.data;

    console.log(`${requestId} Started`);
    let products: IProduct[] = [];

    let refererUrl = `https://kaspi.kz/shop/search/?q=%3AallMerchants%3A${merchantId}&c=750000000`;

    if (pageNum > 1) {
      refererUrl += `&page=${pageNum}`
    } else {
      salesSendTelegramMessageQueue.add({ userId, requestId, merchantName, requestType: "setMerchantProductsParsingState" });
    }

    //console.log((await ParserUtils.getFilterUrlAndPayload(+merchantId, pageNum, refererUrl)).url);
    axios(await ParserUtils.getFilterUrlAndPayload(+merchantId, pageNum, refererUrl)).then(async (res) => {
      console.log(res.data.data);
      let cards = pageNum == 1 ? res.data.data.cards : res.data.data;
      cards.forEach((card: any) => {
        //console.log(card);
        products.push({
          url: card.shopLink,
          productName: card.title,
          position: 6,
          id: card.id,
          hasVariants: card.hasVariants
        })
      })

      //await getPrices(products, merchantId, refererUrl);
      //console.log("Prices ^")


      if (pageNum == 1) {
        const pagesCount = Math.ceil(res.data.data.total / res.data.data.limit);
        PositionProcessData.addNewProcess(requestId, products, userId, merchantId);

        for (let i = 2; i <= pagesCount; i++) {
          salesParseKaspiMerchantProductsQueue.add({ merchantId, requestId, pageNum: i, userId, merchantName });
        }
        parsedPagesAmount[requestId] = { products, pagesCount }
      } else {
        PositionProcessData.addNewProductsInProcess(requestId, products);
        parsedPagesAmount[requestId].products = products.concat(parsedPagesAmount[requestId].products);
        //parsedPagesAmount[requestId].pagesCount = products.length
      }

      //console.log(Math.ceil(parsedPagesAmount[requestId].products.length / 12), parsedPagesAmount[requestId].pagesCount)
      if (Math.ceil(parsedPagesAmount[requestId].products.length / 12) == parsedPagesAmount[requestId].pagesCount) {
        console.log("TEST")
        const numericIdProducts = parsedPagesAmount[requestId].products.filter((product: IProduct) => { return !isNaN(+product.id.at(-1)!) })
        console.log(numericIdProducts.length)
        numericIdProducts.forEach((product: IProduct) => {
          salesParseKaspiProductPageQueue.add({
            userId,
            merchantId,
            requestId,
            product,
            productsAmount: numericIdProducts.length,
            merchantName
          })
        })
      }
    }).catch(async (err) => {
      console.log(err)
      salesParseKaspiMerchantProductsQueue.add(job.data)
    })
  });
}


async function getPrices(products: IProduct[], merchantId: string, refererUrl: string) {
  const url = `https://kaspi.kz/yml/offer-view/offers/`
  const entries: any[] = [];

  products.forEach((product) => {
    entries.push({ sku: product.id, merchantId, hasVariants: product.hasVariants || false })
  })

  const body = {
    cityId: '750000000',
    entries,
    options: ["PRICE"],
    installationId: '-1',
  }
  const timeout = 7500

  const options: any = await {
    headers: await ParserUtils.getHeadersForOffers(refererUrl),
    httpsAgent: await ParserUtils.getRandomProxy(),
    timeout,
  }

  console.log(options.headers);

  console.log(body);

  const result: HttpRequestResultDto = await ParserUtils.postRequest(url, body, options, timeout)
  console.log(result)
}


MongoDatabase.initMainDataBaseConnection().then(() => {
  initRedis().then(() => {
    start()
  })
})

import { HttpRequestResultDto } from '../http.dto'
import { parseKaspiProductPageQueue } from '../queue/parse-kaspi-product-page-queue'

import { initRedis } from "../redis/init-redis"
import { MongoDatabase } from '../db'
import { ParserUtils } from '../utils/parser'
import { PositionProcessData } from '../data/positions-process'
import { sendTelegramMessageQueue } from '../queue/send-telegram-message-queue'


//const productsData: {userId: string, merchants: {merchantId: string, , products: {}}[]}[] = [{}]


const start = () => {
  parseKaspiProductPageQueue.process(6, async (job) => {
    //console.log(job.data)
    try {


      const { merchantId, merchantName, product, requestId, productsAmount, userId } = job.data;

      //console.log(`Positions search ${product.id} Started`);
      const url = `https://kaspi.kz/yml/offer-view/offers/${product.id}`
      const body = {
        cityId: '750000000',
        id: product.id,
        page: 0,
        limit: 5,
        sort: true,
        merchantUID: null,
        installationId: '-1',
      }
      const timeout = 7500

      const options: any = {
        headers: await ParserUtils.getHeadersForOffers(),
        httpsAgent: await ParserUtils.getRandomProxy(),
        timeout,
      }

      const result: HttpRequestResultDto = await ParserUtils.postRequest(url, body, options, timeout)

      let position = 6;
      let price = "0";
      //console.log(result)
      let minPrice = -1;
      //console.log(result.data.offers.length, product.id, product.productName)
      if (result.data.offers) {
        if (result.data.offers.length == 0) {
          return
        }
        //console.log(result.data.offers.length, product.id, product.productName)
        minPrice = +(result.data.offers[0]["price"]);
        //console.log("TEST")
        result.data.offers.forEach((offer: any, index: number) => {
          //console.log(offer);
          if (offer.merchantId == merchantId) {
            position = index + 1
            price = `${Math.floor(offer.price)}`;
          }
        })

        if (price == "0") {
          price = ">" + `${Math.floor(result.data.offers[result.data.offers.length - 1].price)}`;
        }
        //console.log("TEST3")
        //console.log(price);
      } else {
        console.log("ERROR")
        parseKaspiProductPageQueue.add(job.data)
        return
      }

      //console.log(`DB ${product.id} Started`)
      PositionProcessData.finishOneProductProcess(requestId, product.id, position, minPrice, price);
      //console.log(`DB ${product.id} Finished`)

      //console.log(`${product.id} Finished`);
      //productsData.products.push({id: product.id, position})
      //console.log(productsData)
      sendTelegramMessageQueue.add({
        userId,
        requestId,
        data: { productsAmount },
        requestType: "setPositionsParsingState",
        merchantName
      })
    } catch (err) {
      console.log(err)
    }
  });

}


MongoDatabase.initMainDataBaseConnection().then(() => {
  initRedis().then(() => {
    start()
  })
})

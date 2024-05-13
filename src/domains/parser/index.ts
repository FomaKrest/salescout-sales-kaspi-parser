import axios, { AxiosRequestConfig } from 'axios';
import cheerio from "cheerio";

import { telegramBot } from "../../index"

import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpRequestResultDto } from '../../http.dto';
import UserAgent from 'user-agents'
import { salesParseKaspiProductPageQueue } from '../../queue/parse-kaspi-product-page-queue';
import { PositionProcessData } from '../../data/positions-process';
import { ParserUtils } from '../../utils/parser';
import { salesParseKaspiMerchantProductsQueue } from '../../queue/parse-kaspi-merhant-products-queue';
import { salesSendTelegramMessageQueue } from '../../queue/send-telegram-message-queue';

export interface IProduct {
  url: string,
  productName: string,
  position: number,
  id: string,
  hasVariants?: boolean
}


function pause(milliseconds: number) {
  console.log("Pause " + milliseconds)
  var dt: number = (new Date()).valueOf();
  while ((new Date()).valueOf() - dt <= milliseconds) { }
}


export class Parser {
  public static async isLinkValid(link: string) {
    "https://kaspi.kz/shop/info/merchant/30075963/address-tab/?merchantId=30075963"

    var RegExp = /^https:\/\/kaspi.kz\/shop\/info\/merchant\//g;

    if (RegExp.test(link)) {
      const r = /\d+/;
      const id = link.match(r)?.[0];
      if (id) {
        const link = `https://kaspi.kz/shop/info/merchant/${id}/address-tab/?merchantId=${id}`
        return axios.get(link, { headers: ParserUtils.getHeaders() })
          .then((response) => {
            console.log("Response")
            return true;
          })
          .catch((err) => {
            console.log(err.response.status)
            return false;
          })
      }
    }
    return false
  }

  public static async getMerchantName(merchantId: string) {
    return axios({
      url: `https://kaspi.kz/shop/info/merchant/${merchantId}/address-tab/?merchantId=${merchantId}`,
      proxy: false,
      httpsAgent: await ParserUtils.getRandomProxy(),
      data: { merchantId: merchantId },
      headers: await ParserUtils.getHeaders(),
    }).then((res) => {
      const data = res.data;
      const $ = cheerio.load(data);
      const title = $("title").text();
      if (title == "Страница не найдена | Kaspi Магазин") {
        return ""
      } else {
        return title.substring(0, title.length - " – товары в кредит – Kaspi Магазин".length)
      }
    }).catch((err) => {
      return ""
    })
  }

  public static async getPosition(merchantId: string, product: IProduct) {
    console.log("Started")
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
    const timeout = 3000

    const options: any = {
      headers: ParserUtils.getHeadersForOffers(),
      httpsAgent: ParserUtils.getRandomProxy(),
      timeout,
    }

    let isFound = false
    let totalCount = 0
    const result: HttpRequestResultDto = await ParserUtils.postRequest(url, body, options, timeout)
    let position = 6;
    if (result.data.offers) {
      result.data.offers.forEach((offer: any, index: number) => {
        if (offer.merchantId == merchantId) {
          position = index + 1
        }
      })
    } else {
      return -1
    }
    return position;
  }

  public static async getPositions(baseUrl: string, replyId: string, ctx: any, messageId: number) {
    const id = baseUrl.match(/\d+/)?.[0];

    if (!id) {
      telegramBot.bot.telegram.sendMessage(replyId, "Некорректная ссылка");
      return
    }

    let merchantName = await this.getMerchantName(id);

    if (merchantName == "") {
      telegramBot.bot.telegram.sendMessage(replyId, "Некорректная ссылка");
      return
    }
    const requestId = ctx.message.from.id + ":" + messageId
    salesSendTelegramMessageQueue.add({ merchantName, requestId, userId: ctx.message.from.id, requestType: "setShopName" })

    salesParseKaspiMerchantProductsQueue.add({ merchantId: id, merchantName, requestId, userId: ctx.message.from.id, pageNum: 1 })


    //productsData.productsAmount = positionsArray.length

    // PositionProcessData.addNewProcess(requestId, positionsArray);
    // for (let [index, product] of positionsArray.entries()) {
    //   console.log(product)
    //   parseKaspiProductPageQueue.add({merchantId: id, product, requestId, userId: ctx.message.from.id, productsAmount: positionsArray.length})
    //this.addToQueue(id, product, ctx.message.from.id);
    //await ctx.telegram.editMessageText(ctx.chat.id, messageId, 0, `Ожидайте...Собираем данные магазина ${merchantName} \n${index + 1}/${positionsArray.length}`)
    //}
  }
}
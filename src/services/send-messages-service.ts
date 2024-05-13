import { sendTelegramMessageQueue } from '../queue/send-telegram-message-queue'

import { telegramBot } from '..'
import { PositionProcessData } from '../data/positions-process';
import { Markup } from 'telegraf';


//const productsData: {userId: string, merchants: {merchantId: string, , products: {}}[]}[] = [{}]

let parsedPositionsAmounts: any = {};


export const sendMessagesProcessStart = () => {
  sendTelegramMessageQueue.process(1, async (job) => {
    const { userId, requestId, data, requestType, merchantName } = job.data;

    switch (requestType) {
      case "setPositionsParsingState":
        setPositionsParsingState(requestId, userId, data.productsAmount, merchantName);
        break;
      case "setMerchantProductsParsingState":
        setMerchantProductsParsingState(requestId, userId, merchantName);
        break;
      case "sendParsingResult":
        sendParsingResult(requestId, userId, merchantName);
        break;
      case "setShopName":
        setShopName(requestId, userId, merchantName);
        break;
      case "sendPositionProducts":
        sendPositionProducts(requestId, userId, merchantName, data.position);
        break;
    }
  });
}


async function sendParsingResult(requestId: string, userId: string, merchantName: string) {
  const messageId = requestId.split(":")[1]
  telegramBot.bot.telegram.editMessageText(userId, +messageId, undefined, `Готово!`).catch(console.log)
  let products = await PositionProcessData.getProductsByRequestId(requestId);
  let message: string = "";

  message += `Магазин ${merchantName}\n`
  const notFirstProductsLength = products.filter((product) => { return product.position != 1 }).length;
  message += `\n${notFirstProductsLength} из ${products.length} товаров магазина находятся не на первом месте.\n\n`;
  const inline_keyboard: any[] = [];
  [1, 2, 3, 4, 5, 6].forEach((position: number) => {
    let positionProducts = products.filter((product) => { return product.position == position }).length;
    inline_keyboard.push([Markup.button.callback(`Товары на ${position == 6 ? ">5" : position} месте (${positionProducts} шт)`, `position-${position}`)]);
    //  message += `${position == 6 ? ">5" : position} место - ${positionProducts} товаров\n`
  })

  telegramBot.bot.telegram.editMessageText(
    userId,
    +messageId,
    undefined,
    message,
    {
      reply_markup: {
        inline_keyboard
      }
    }

  );
}

async function sendPositionProducts(requestId: string, userId: string, merchantName: string, position: number) {
  console.log(requestId)
  let products = await PositionProcessData.getProductsByRequestId(requestId);
  let message: string = `${merchantName}\n`;
  message += `Товары на ${position == 6 ? ">5" : position} позиции:\n\n`;

  products = products.sort((a, b) => { return a.position - b.position });
  let index = 1;
  for (let product of products) {
    if (product.position == position) {
      const link = `https://kaspi.kz/shop/p/-${product.productId}/?c=750000000`
      message += `<a href="${link}">`;
      message += `${index}) : ${product.name}</a>\n`;
      message += `Минимальная цена: ${product.minPrice}₸\n`;
      message += `Цена магазина: ${product.price}₸\n\n`;
      index += 1;
    }
  }
  sendMsgInChunks(+userId, message, 4096);
}


function setShopName(requestId: string, userId: string, merchantName: string) {
  let message = `Магазин найден - ${merchantName}\nНачинаем поиск товаров`;
  const messageId = requestId.split(":")[1];
  telegramBot.bot.telegram.editMessageText(userId, +messageId, undefined, message).catch(console.log);
}


function setMerchantProductsParsingState(requestId: string, userId: string, merchantName: string) {
  let message = `Магазин найден - ${merchantName}\n`;
  message += "Ищу товары..."
  const messageId = requestId.split(":")[1];
  telegramBot.bot.telegram.editMessageText(userId, +messageId, undefined, message).catch(console.log);
}


function setPositionsParsingState(requestId: string, userId: string, productsAmount: number, merchantName: string) {
  //console.log("sdfsdf")
  if (parsedPositionsAmounts[requestId]) {
    parsedPositionsAmounts[requestId] += 1;
  } else {
    parsedPositionsAmounts[requestId] = 1
  }

  const messageId = requestId.split(":")[1]
  if (parsedPositionsAmounts[requestId] == productsAmount) {
    sendParsingResult(requestId, userId, merchantName);
  } else {
    let message = `Магазин ${merchantName}\n`
    message += `Найдено ${productsAmount} товаров\n`
    message += `Собираю позиции магазина: ${parsedPositionsAmounts[requestId]}/${productsAmount}`
    telegramBot.bot.telegram.editMessageText(userId, +messageId, undefined, message).catch(console.log)
  }
  console.log(`${requestId} Finished`);
}


async function sendMsgInChunks(chatId: number, message: string, maxLength: number) {
  const chunks = []
  let currentChunk = ''
  for (const line of message.split('\n\n')) {
    const proposedChunk = `${currentChunk}\n\n${line}`
    if (proposedChunk.length <= maxLength) {
      currentChunk = proposedChunk
    } else {
      chunks.push(currentChunk.trim())
      currentChunk = line
    }
  }
  if (currentChunk) {
    chunks.push(currentChunk.trim())
  }
  for (const chunk of chunks) {
    try {
      await telegramBot.bot.telegram.sendMessage(chatId, chunk, { parse_mode: 'HTML' }).catch(console.log)
    } catch (error) {
      console.error(`Error sending message chunnk:`, error)
    }
  }
}
import { Markup, Telegraf, session, type Context } from 'telegraf';
import type { Update } from "telegraf/types";
import LocalSession from 'telegraf-session-local';

import { Config } from "./domains/config/index.js"
//import { Parser } from './domains/parser/index.js';
import { initRedis } from './redis/init-redis.js';
import { MongoDatabase } from './db/index.js';
import { Parser } from './domains/parser/index.js';
import { salesSendTelegramMessageQueue } from './queue/send-telegram-message-queue.js';
import { sendMessagesProcessStart } from "./services/send-messages-service.js";
import { UserData } from './data/user/index.js';

//Parser.isLinkValid("https://kaspi.kz/shop/info/merchant/30075963/address-tab/?merchantId=30075963");

interface UserContext<U extends Update = Update> extends Context<U> {
  session: {

  },
};


export class KaspiTelegramBot {
  public bot: Telegraf<UserContext>
  public localSession: any
  constructor() {
    this.bot = new Telegraf<UserContext>(Config.bot);
  }

  public setup() {
    this.setupLocalSession();
    this.setupListeners();
    console.log("bot started")
    this.bot.launch();

    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }

  private setupLocalSession() {
    this.localSession = session({
      defaultSession: () => ({

      })
    })

    this.localSession = new LocalSession({
      database: 'sessions.json',
      storage: LocalSession.storageFileAsync,
      format: {
        serialize: (obj: any) => JSON.stringify(obj, null, 2),
        deserialize: (str: any) => JSON.parse(str),
      },
      state: {
        sessions: [],
      },
    })

    this.bot.use(this.localSession.middleware())
  }

  private setupListeners() {
    this.bot.start(this.handleStart.bind(this));
    this.bot.hears("Собрать позиции", this.handleParseNewShop.bind(this));
    this.bot.on("text", this.handleText.bind(this));
    this.bot.action(/^position-(\d+)$/, this.handleGetPositionProducts.bind(this));
  }

  private async handleStart(ctx: any) {
    ctx.session.reply_to_message = "start";

    let message = `Привет, ${ctx.message.from.first_name}!\n`
    message += `Я бот, который определяет позиции товаров на Kaspi. Отправь мне ссылку на магазин в Kaspi и я отправлю вам позиции его товаров`
    console.log(ctx.message.from)
    UserData.addNewUser(ctx.message.from.id, ctx.message.from.username, ctx.message.from.first_name)
    ctx.reply(
      message,
      Markup
        .keyboard(["Собрать позиции"])
        .resize()
    ).catch(console.log);
  }

  private async handleParseNewShop(ctx: any) {
    ctx.session.reply_to_message = "start";

    let message = "";
    message += `Отправь мне ссылку на магазин в Kaspi и я отправлю вам позиции его товаров`
    console.log(ctx.message.from)
    UserData.addNewUser(ctx.message.from.id, ctx.message.from.username, ctx.message.from.first_name)
    ctx.reply(
      message
    ).catch(console.log);
  }

  private async handleGetPositionProducts(ctx: any) {
    const position = ctx.match[1]
    const merchantName = ctx.update.callback_query.message.text.split("\n")[0];
    console.log(merchantName);
    console.log(ctx.match)
    const requestId = ctx.update.callback_query.from.id + ":" + ctx.update.callback_query.message.message_id
    salesSendTelegramMessageQueue.add({
      userId: ctx.update.callback_query.from.id,
      requestId: requestId,
      merchantName: merchantName,
      requestType: "sendPositionProducts",
      data: { position }
    })
  }

  private async handleText(ctx: any) {
    const message = ctx.message.text
    const reply = await ctx.reply("Ищу магазин...").catch(console.log);

    Parser.getPositions(message, ctx.message.from.id, ctx, reply.message_id);
  }

}


MongoDatabase.initMainDataBaseConnection();
initRedis();
export const telegramBot = new KaspiTelegramBot();
telegramBot.setup();
sendMessagesProcessStart();
type ConfigType = {
  bot: string,
  redisUrl: string,
  mongoUrl: string,
}

const TestConfig = {
  bot: '7177387378:AAGTQiOcf14X-jb9IZst6vcjilH8KzscRN4',
  redisUrl: 'redis://127.0.0.1:6379/0',
  mongoUrl: "mongodb://localhost:27017/KaspiPositionsParser",
}

const ProdConfig = {
  bot: '7177387378:AAGTQiOcf14X-jb9IZst6vcjilH8KzscRN4',
  redisUrl: 'redis://:7VcyTDr6Wd6hwA9519HDRIy2olmFumgO1SzQRVPOCuTci4rwHZ@64.225.104.94:6379',
  mongoUrl: "mongodb+srv://imran:2A78avbW43o0wn95@ss-database-tech-216ca340.mongo.ondigitalocean.com/KaspiPositionsParser?replicaSet=ss-database-tech&tls=true&authSource=admin",
}

export const Config: ConfigType = ProdConfig

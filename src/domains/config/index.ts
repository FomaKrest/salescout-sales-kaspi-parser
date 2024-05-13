type ConfigType = {
  bot: string,
  redisUrl: string,
  mongoUrl: string,
}

const ProdConfig = {
  bot: '7177387378:AAGTQiOcf14X-jb9IZst6vcjilH8KzscRN4',
  redisUrl: 'redis://127.0.0.1:6379/0',
  mongoUrl: "mongodb://localhost:27017/KaspiPositionsParser",
}

export const Config: ConfigType = ProdConfig

import { redisClient} from './index'

export const initRedis = async (): Promise<void> => {
    console.log(`Trying to connect to redis client...`)
    await redisClient
        .connect()
        .then(() => console.log(`Connected to redis client...`))
        .catch(() => console.log(`Couldn't connect to redis client...`))
}
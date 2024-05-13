import { createClient } from 'redis'
import { Config } from '../domains/config'

export const redisClient = createClient({
    url: Config.redisUrl,
})


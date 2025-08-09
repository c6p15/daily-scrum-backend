require('dotenv').config()
const { createClient } = require('redis')

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
  password: process.env.REDIS_PASSWORD || undefined,
})

const connectRedis = async () => {
  try {
    await redisClient.connect()
    console.log('✅ Connected to Redis')

    if (process.env.REDIS_CLEAR_ON_START === 'true') {
      await redisClient.flushAll()
      console.log('🧹 Redis cache cleared on server start')
    }
  } catch (err) {
    console.error('❌ Redis connection error:', err)
    process.exit(1)
  }
}

module.exports = {
  redisClient,
  connectRedis,
}
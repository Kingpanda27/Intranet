import Redis from "ioredis"

const getRedisUrl = () => {
  if (process.env.REDIS_URL) return process.env.REDIS_URL
  return "redis://localhost:6379"
}

const redis = new Redis(getRedisUrl(), {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    // Only retry 3 times then stop trying to avoid flooding logs if Redis is not installed
    if (times > 3) return null
    return Math.min(times * 50, 2000)
  }
})

redis.on("error", (err) => {
  console.warn("Redis error:", err.message)
})

export { redis }
export default redis

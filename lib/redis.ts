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

export async function invalidateUserSessionsInRedis(userId: string): Promise<number> {
  if (!userId) return 0
  try {
    const directKeys = [
      `session:${userId}`,
      `user:session:${userId}`,
      `sessions:${userId}`,
      `auth:${userId}`,
      `token:${userId}`,
      `friends:${userId}`,
      `user:${userId}`,
      `cache:user:${userId}`
    ]
    let deletedCount = 0
    try {
      deletedCount += await redis.del(...directKeys)
    } catch (e) {}

    try {
      const matchingKeys = await redis.keys(`*${userId}*`)
      if (matchingKeys && matchingKeys.length > 0) {
        deletedCount += await redis.del(...matchingKeys)
      }
    } catch (e) {}

    try {
      // Bandera de usuario desactivado en Redis (TTL 30 días)
      await redis.set(`user:deactivated:${userId}`, "true", "EX", 30 * 24 * 3600)
    } catch (e) {}

    return deletedCount
  } catch (error) {
    console.warn(`[Redis] Error al invalidar sesiones para ${userId}:`, error)
    return 0
  }
}

export { redis }
export default redis


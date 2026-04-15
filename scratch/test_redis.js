import 'dotenv/config';
import Redis from 'ioredis';

async function test() {
  console.log('Testing Upstash Redis connection...');
  const redis = new Redis(process.env.REDIS_URL);

  try {
    const pong = await redis.ping();
    console.log(`✅ Success! Redis responded: ${pong}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed! Redis connection error:', err.message);
    process.exit(1);
  } finally {
    redis.disconnect();
  }
}

test();

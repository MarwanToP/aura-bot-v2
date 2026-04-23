import 'dotenv/config';
import database from '../database/index.js';
import logger from '../utils/logger.js';

async function migrate() {
  try {
    logger.info('[Migration] Connecting to database...');
    await database.authenticate();
    logger.info('[Migration] Connection verified ✓');

    logger.info('[Migration] Syncing models (alter: true)...');
    await database.sync({ alter: true });
    logger.info('[Migration] Database schema synchronized ✓');

    process.exit(0);
  } catch (err) {
    logger.error('[Migration] Failed:', err.message);
    process.exit(1);
  }
}

migrate();

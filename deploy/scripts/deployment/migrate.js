import 'dotenv/config';
import database from '../../database/index.js';
import logger from '../../utils/logger.js';

async function migrate() {
  try {
    // Guard: sync({ alter: true }) can silently drop columns that exist in the database
    // but are not yet declared in models (staged rollouts) or reconcile drift unsafely.
    // Never allow this in production — apply reviewed SQL via Neon instead.
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[Migration] Refusing to run sync({ alter: true }) in production. Apply reviewed SQL (Neon) instead.'
      );
    }

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

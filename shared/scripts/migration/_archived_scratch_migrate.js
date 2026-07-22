import 'dotenv/config';
import database from './shared/database/index.js';
import logger from './shared/utils/logger.js';

async function migrate() {
  try {
    logger.info('[Migration] Connecting to database...');
    await database.authenticate();
    
    logger.info('[Migration] Adding "staffSystemEnabled" column to guild_settings...');
    await database.query('ALTER TABLE guild_settings ADD COLUMN IF NOT EXISTS "staffSystemEnabled" BOOLEAN DEFAULT FALSE;');
    
    logger.info('[Migration] Adding "staffRoleIds" column to guild_settings...');
    await database.query('ALTER TABLE guild_settings ADD COLUMN IF NOT EXISTS "staffRoleIds" JSONB DEFAULT \'[]\';');
    
    logger.info('[Migration] Database schema updated successfully ✓');
    process.exit(0);
  } catch (err) {
    logger.error('[Migration] Failed:', err);
    process.exit(1);
  }
}

migrate();

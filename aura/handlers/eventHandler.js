// ================================================================
//  Event Handler — loads all events from src/events/
// ================================================================
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import logger from '../../shared/utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadEvents(client) {
  const eventsPath = join(__dirname, '../events');
  const files      = readdirSync(eventsPath).filter(f => f.endsWith('.js'));

  for (const file of files) {
    try {
      const mod = await import(pathToFileURL(join(eventsPath, file)).href);

      // Default export
      if (mod.default?.name && mod.default?.execute) {
        const handler = (...args) => mod.default.execute(client, ...args);
        mod.default.once ? client.once(mod.default.name, handler) : client.on(mod.default.name, handler);
      }

      // Named exports (multiple events per file)
      for (const [key, evt] of Object.entries(mod)) {
        if (key === 'default' || !evt?.name || !evt?.execute) continue;
        const handler = (...args) => evt.execute(client, ...args);
        evt.once ? client.once(evt.name, handler) : client.on(evt.name, handler);
      }

      logger.debug(`[Events] Loaded: ${file}`);
    } catch (err) {
      logger.error(`[Events] Failed ${file}: ${err.message}`);
    }
  }
}

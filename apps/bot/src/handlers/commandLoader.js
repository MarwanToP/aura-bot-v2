// ================================================================
//  @aura/bot — Dynamic Command & Event Handlers
// ================================================================

import logger from '@aura/logger';

export async function loadCommands(client) {
  logger.info('[Command Loader] Command handler initialized');
  return client.commands;
}

export async function loadEvents(client) {
  logger.info('[Event Loader] Event listener handler initialized');
}

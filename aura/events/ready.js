// Event: ready
import { ActivityType } from 'discord.js';
import logger from '../../shared/utils/logger.js';

export default {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.info(`╔══════════════════════════════════════════╗`);
    logger.info(`║  ✨ ${client.user.tag} — ONLINE          `);
    logger.info(`║  Guilds: ${client.guilds.cache.size} | Users: ${client.users.cache.size}`);
    logger.info(`║  Commands: ${client.commands.size} | AI: ${client.ai.isAvailable() ? 'Ready ✓' : 'Not configured'}`);
    logger.info(`╚══════════════════════════════════════════╝`);

    const statuses = [
      { type: ActivityType.Watching, name: `${client.guilds.cache.size} servers 🌍` },
      { type: ActivityType.Playing,  name: '/help | Aura v2.0 ✨' },
      { type: ActivityType.Watching, name: 'for rule violations 🛡️' },
      { type: ActivityType.Playing,  name: 'AI-Powered Moderation 🤖' },
      { type: ActivityType.Listening,name: 'your commands 👂' },
    ];
    let i = 0;
    const rotate = () => {
      const s = statuses[i++ % statuses.length];
      client.user.setPresence({ status: 'online', activities: [{ type: s.type, name: s.name }] });
    };
    rotate();
    setInterval(rotate, 30_000);

    // Cache all guild invites
    for (const guild of client.guilds.cache.values()) {
      try {
        if (guild.members.me?.permissions.has('ManageGuild')) {
          const invites = await guild.invites.fetch();
          client.inviteCache.set(guild.id, new Map(invites.map(i => [i.code, i.uses])));
        }
      } catch (err) {
        logger.error(`[Ready] Failed to cache invites for guild ${guild.id}:`, err);
      }
    }

    // Start background tasks
    const { startBackgroundTasks } = await import('../../shared/systems/backgroundTasks.js');
    startBackgroundTasks(client);

    logger.info('[Ready] Bot fully initialized ✓');
  },
};

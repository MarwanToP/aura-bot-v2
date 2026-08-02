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
      } catch {}
    }

    // Start background tasks
    const { startBackgroundTasks } = await import('../../shared/systems/backgroundTasks.js');
    startBackgroundTasks(client);

    // Auto-sync slash commands to Discord API on boot so slash commands pop up instantly
    if (client.commands.size > 0 && process.env.AUTO_DEPLOY !== 'false') {
      (async () => {
        try {
          const body = [...client.commands.values()].map(c => c.data.toJSON());
          const clientId = client.user.id;
          const token = process.env.DISCORD_TOKEN;
          
          logger.info(`[Ready] Auto-registering ${body.length} slash commands across ${client.guilds.cache.size} guild(s)...`);
          for (const guild of client.guilds.cache.values()) {
            try {
              const res = await fetch(`https://discord.com/api/v10/applications/${clientId}/guilds/${guild.id}/commands`, {
                method: 'PUT',
                headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
              });
              if (res.ok) {
                logger.info(`[Ready] Slash commands registered instantly to guild: ${guild.name} (${guild.id})`);
              } else if (res.status === 429) {
                logger.warn(`[Ready] Rate limited registering to ${guild.name}, skipping instant guild deploy.`);
              }
            } catch (gErr) {
              logger.warn(`[Ready] Failed guild command sync for ${guild.id}: ${gErr.message}`);
            }
          }

          const globalRes = await fetch(`https://discord.com/api/v10/applications/${clientId}/commands`, {
            method: 'PUT',
            headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          if (globalRes.ok) {
            logger.info('[Ready] Global slash commands synced successfully ✓');
          }
        } catch (syncErr) {
          logger.warn(`[Ready] Slash command auto-sync error: ${syncErr.message}`);
        }
      })();
    }

    logger.info('[Ready] Bot fully initialized ✓');
  },
};

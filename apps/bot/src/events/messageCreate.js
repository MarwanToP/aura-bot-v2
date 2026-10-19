import { redis, enqueueAIJob } from '../../../../packages/redis/src/queue.js';
import { awardMessageXp } from '../../../../packages/systems/leveling/levelingSystem.js';
import { handleCustomCommand } from '../../../../packages/systems/customcommands/customCommands.js';

export async function handleMessageCreate(client, message) {
  // Ignore bots and direct messages
  if (message.author.bot || !message.guild) return;

  try {
    const cacheKey = `aura:guild:${message.guild.id}:config`;
    let neuralEnabled = true;

    const cached = await redis.get(cacheKey).catch(() => null);

    if (cached !== null) {
      neuralEnabled = cached === '1';
    } else {
      // Check database
      const settings = await client.db.models.GuildSettings.findOne({
        where: { guildId: message.guild.id },
        attributes: ['aiModEnabled'],
      });

      neuralEnabled = settings ? settings.aiModEnabled === true : true;
      // Cache result in Redis for 5 minutes (300 seconds)
      await redis.setex(cacheKey, 300, neuralEnabled ? '1' : '0').catch(() => null);
    }

    if (neuralEnabled) {
      // Enqueue message for asynchronous Gemini analysis
      await enqueueAIJob('MODERATION_ANALYZE', {
        messageId: message.id,
        channelId: message.channel.id,
        guildId: message.guild.id,
        authorId: message.author.id,
        messageText: message.content,
      });
    }
  } catch (error) {
    console.error('⚠️ Error queuing message for neural moderation:', error.message);
  }

  // Community features — isolated per subsystem so one failure can't skip the others
  try {
    await awardMessageXp(client, message);
  } catch (error) {
    console.error('⚠️ Error awarding message XP:', error.message);
  }

  try {
    await handleCustomCommand(client, message);
  } catch (error) {
    console.error('⚠️ Error executing custom command:', error.message);
  }

  // Auto-responders — isolated so a failure can't break the other flows above
  try {
    const cacheKey = `autoresponder:${message.guild.id}`;
    let responders = null;

    // Redis cache pattern mirrors the guild-config block: read → DB fallback on miss/error.
    // Cache value: JSON array of { id, trigger, triggerType, response, allowedChannels, requiredRoles },
    // invalidated by /autoresponder (add/remove/toggle/edit) via redis.del(cacheKey).
    const cached = await redis.get(cacheKey).catch(() => null);

    if (cached !== null) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) responders = parsed;
      } catch {
        responders = null; // Corrupt cache entry → fall through to the DB query
      }
    }

    if (responders === null) {
      const rows = await client.db.models.AutoResponder.findAll({
        where: { guildId: message.guild.id, enabled: true },
        // Deterministic match order: lowest id first (matches /autoresponder list ordering).
        // The cached array preserves this order because it is built from this ordered query.
        order: [['id', 'ASC']],
        limit: 25,
      });
      responders = rows.map(r => ({
        id: r.id,
        trigger: r.trigger,
        triggerType: r.triggerType,
        response: r.response,
        allowedChannels: r.allowedChannels ?? [],
        requiredRoles: r.requiredRoles ?? [],
      }));
      await redis.setex(cacheKey, 300, JSON.stringify(responders)).catch(() => null);
    }

    // First enabled responder (ascending id) whose trigger matches wins; no dedupe/cooldown handling.
    let matched = null;
    for (const r of responders) {
      // Empty arrays (the defaults) mean the restriction does not apply.
      if ((r.allowedChannels ?? []).length > 0 && !r.allowedChannels.includes(message.channel.id)) continue;
      if ((r.requiredRoles ?? []).length > 0 && !r.requiredRoles.some(roleId => message.member?.roles?.cache?.has(roleId))) continue;

      let hit = false;
      try {
        switch (r.triggerType) {
          case 'exact':      hit = message.content === r.trigger; break;
          case 'contains':   hit = message.content.includes(r.trigger); break;
          case 'startsWith': hit = message.content.startsWith(r.trigger); break;
          case 'regex':      hit = new RegExp(r.trigger).test(message.content); break;
          default:           hit = false;
        }
      } catch {
        hit = false; // Malformed regex (e.g. stored via /autoresponder edit) → skip this responder
      }

      if (hit) {
        matched = r;
        break;
      }
    }

    if (matched) {
      // {user} placeholder is the documented author-mention syntax from /autoresponder add
      const text = String(matched.response).replace(/\{user\}/gi, `<@${message.author.id}>`);
      await message.reply(text.slice(0, 2000));
    }
  } catch (error) {
    console.error('⚠️ Error handling auto-responders:', error.message);
  }
}

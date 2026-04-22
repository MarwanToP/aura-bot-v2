import { Sequelize, DataTypes } from 'sequelize';
import { performance } from 'perf_hooks';

// Mock DB
const sequelize = new Sequelize('sqlite::memory:', { logging: false });
const ReactionRole = sequelize.define('ReactionRole', {
  guildId:   { type: DataTypes.STRING, allowNull: false },
  channelId: { type: DataTypes.STRING, allowNull: false },
  messageId: { type: DataTypes.STRING, allowNull: false },
  emoji:     { type: DataTypes.STRING, allowNull: false },
  roleId:    { type: DataTypes.STRING, allowNull: false },
  type:      { type: DataTypes.ENUM('toggle','add_only','remove_only','unique'), defaultValue: 'toggle' },
});

const client = {
  db: { models: { ReactionRole } }
};

// Mock Discord.js objects
const roleCache = new Map();
const memberRoleCache = new Map();
for (let i=0; i<100; i++) {
    roleCache.set(`role-${i}`, { id: `role-${i}` });
    memberRoleCache.set(`role-${i}`, true);
}

const reaction = {
  partial: false,
  message: {
    id: 'msg-1',
    guild: {
      roles: { cache: roleCache },
      members: { fetch: async () => member }
    }
  },
  emoji: { toString: () => '👍' }
};

const member = {
  roles: {
    cache: {
      has: (id) => memberRoleCache.has(id)
    },
    remove: async () => {},
    add: async () => {}
  }
};

const user = { id: 'user-1' };

async function setup() {
  await sequelize.sync();
  // Create 50 reaction roles for the same emoji
  const roles = [];
  for (let i = 0; i < 50; i++) {
    roles.push({
      guildId: 'guild-1',
      channelId: 'channel-1',
      messageId: 'msg-1',
      emoji: '👍',
      roleId: `role-${i}`,
      type: 'unique'
    });
  }
  // Create 50 more for other emojis on the same message
  for (let i = 50; i < 100; i++) {
    roles.push({
      guildId: 'guild-1',
      channelId: 'channel-1',
      messageId: 'msg-1',
      emoji: '👎',
      roleId: `role-${i}`,
      type: 'unique'
    });
  }
  await ReactionRole.bulkCreate(roles);
}

// Inline version of handleReactionRole
async function handleReactionRole(client, reaction, user, adding) {
  try {
    if (reaction.partial) await reaction.fetch();
    const { ReactionRole } = client.db.models;
    const rroles = await ReactionRole.findAll({ where: { messageId: reaction.message.id, emoji: reaction.emoji.toString() } });
    if (!rroles.length) return;

    const guild  = reaction.message.guild;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    for (const rr of rroles) {
      const role = guild.roles.cache.get(rr.roleId);
      if (!role) continue;

      if (rr.type === 'unique' && adding) {
        // Remove all other roles from same message
        const others = await ReactionRole.findAll({ where: { messageId: reaction.message.id } });
        for (const o of others) {
          if (o.roleId !== rr.roleId && member.roles.cache.has(o.roleId)) {
            await member.roles.remove(o.roleId, '[Aura] Reaction Role').catch(() => {});
          }
        }
      }

      if (adding && rr.type !== 'remove_only')  await member.roles.add(role, '[Aura] Reaction Role').catch(() => {});
      if (!adding && rr.type !== 'add_only')     await member.roles.remove(role, '[Aura] Reaction Role').catch(() => {});
    }
  } catch (e) { console.error(e) }
}

async function runBenchmark() {
  await setup();
  const start = performance.now();
  await handleReactionRole(client, reaction, user, true);
  const end = performance.now();
  console.log(`Baseline Execution Time: ${(end - start).toFixed(2)} ms`);
}

runBenchmark();

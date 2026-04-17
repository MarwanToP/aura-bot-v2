// ================================================================
//  AURA BOT v2.0 — Economy System (Premium: 300 items)
// ================================================================

import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { buildEmbed } from '../../utils/embedBuilder.js';
import config         from '../../../config/config.js';
import logger         from '../../utils/logger.js';

// ─── DB Helper ───────────────────────────────────────────────
async function getWallet(client, userId, guildId) {
  const { Economy } = client.db.models;
  const [wallet] = await Economy.findOrCreate({
    where:    { userId, guildId },
    defaults: { balance: 0, bank: 0, totalEarned: 0, reputation: 0, dailyStreak: 0 },
  });
  return wallet;
}

async function addCoins(client, userId, guildId, amount) {
  const wallet = await getWallet(client, userId, guildId);
  await wallet.increment({ balance: amount, totalEarned: Math.max(0, amount) });
  return wallet;
}

async function removeCoins(client, userId, guildId, amount) {
  const wallet = await getWallet(client, userId, guildId);
  if (Number(wallet.balance) < amount) return { success: false, balance: Number(wallet.balance) };
  await wallet.decrement('balance', { by: amount });
  return { success: true, balance: Number(wallet.balance) - amount };
}

// ─── /credits (Balance) ──────────────────────────────────────
export const credits = {
  data: new SlashCommandBuilder()
    .setName('credits')
    .setDescription('Check your Aura Credits and Reputation')
    .addUserOption(o => o.setName('user').setDescription('User to check')),

  guildOnly: true,
  cooldown:  3000,

  async execute(client, interaction) {
    await interaction.deferReply();
    const target = interaction.options.getUser('user') || interaction.user;
    const wallet = await getWallet(client, target.id, interaction.guildId);
    const { currencyEmoji, currencyName } = config.economy;

    return interaction.editReply({
      embeds: [buildEmbed({
        type:      'premium',
        title:     `${currencyEmoji} ${currencyName} — ${target.username}`,
        thumbnail: target.displayAvatarURL({ size: 128 }),
        fields: [
          { name: `💰 Credits`,   value: `**${Number(wallet.balance).toLocaleString()}**`, inline: true },
          { name: `🏦 Bank`,      value: `**${Number(wallet.bank).toLocaleString()}**`,    inline: true },
          { name: `✨ Reputation`, value: `**${Number(wallet.reputation).toLocaleString()}**`, inline: true },
          { name: `🔥 Streak`,    value: `**${wallet.dailyStreak} days**`, inline: true },
          { name: `💎 Total`,     value: `**${Number(wallet.totalEarned).toLocaleString()}**`, inline: true },
        ],
        footer: `Rank cards and badges coming soon!`,
        timestamp: true,
      })],
    });
  },
};

export const balance = { ...credits, data: new SlashCommandBuilder().setName('balance').setDescription('Alias for /credits').addUserOption(o => o.setName('user').setDescription('User to check')) };
export const money   = { ...credits, data: new SlashCommandBuilder().setName('money').setDescription('Alias for /credits').addUserOption(o => o.setName('user').setDescription('User to check')) };

// ─── /daily ──────────────────────────────────────────────────
export const daily = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily Aura Credits reward'),

  guildOnly: true,
  cooldown:  1000,

  async execute(client, interaction) {
    await interaction.deferReply();
    const { dailyReward, dailyCooldown, currencyEmoji, streakBonus } = config.economy;
    const key = `daily:${interaction.user.id}:${interaction.guildId}`;
    const ttl = await client.redis.pttl(key);

    if (ttl > 0) {
      const hours   = Math.floor(ttl / 3600000);
      const minutes = Math.floor((ttl % 3600000) / 60000);
      return interaction.editReply({ embeds: [buildEmbed({ type: 'warning', description: `⏳ Daily reward resets in **${hours}h ${minutes}m**.` })] });
    }

    const wallet = await getWallet(client, interaction.user.id, interaction.guildId);
    
    // Streak logic
    const lastDaily = await client.redis.get(`last_daily:${interaction.user.id}`);
    const now = Date.now();
    let currentStreak = wallet.dailyStreak;

    if (lastDaily) {
      const diff = now - parseInt(lastDaily);
      if (diff < 48 * 60 * 60 * 1000) { // Within 48 hours
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }

    const baseAmount = Math.floor(Math.random() * (dailyReward.max - dailyReward.min + 1)) + dailyReward.min;
    const bonus      = (currentStreak - 1) * streakBonus;
    const total      = baseAmount + bonus;

    await wallet.update({ 
      balance: Number(wallet.balance) + total, 
      dailyStreak: currentStreak,
      totalEarned: Number(wallet.totalEarned) + total 
    });
    
    await client.redis.setex(key, Math.ceil(dailyCooldown / 1000), '1');
    await client.redis.set(`last_daily:${interaction.user.id}`, now.toString());

    return interaction.editReply({
      embeds: [buildEmbed({
        type:        'economy',
        title:       `${currencyEmoji} Daily Credits Claimed!`,
        description: `You received **${total.toLocaleString()} ${currencyEmoji}**!\n🔥 **Streak:** ${currentStreak} days (+${bonus} bonus)\n**New Balance:** ${Number(wallet.balance).toLocaleString()}`,
        timestamp:   true,
      })],
    });
  },
};

// ─── /work ───────────────────────────────────────────────────
export const work = {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Work to earn coins (4hr cooldown)'),

  guildOnly: true,
  cooldown:  1000,

  async execute(client, interaction) {
    await interaction.deferReply();
    const { workReward, workCooldown, currencyEmoji } = config.economy;
    const key = `work:${interaction.user.id}:${interaction.guildId}`;
    const ttl = await client.redis.pttl(key);

    if (ttl > 0) {
      const hours   = Math.floor(ttl / 3600000);
      const minutes = Math.floor((ttl % 3600000) / 60000);
      return interaction.editReply({ embeds: [buildEmbed({ type: 'warning', description: `⏳ You can work again in **${hours}h ${minutes}m**.` })] });
    }

    const jobs = [
      'wrote code for a startup',        'delivered packages',         'tutored students',
      'sold lemonade',                   'streamed on Twitch',         'fixed computers',
      'walked dogs',                     'designed a logo',            'taught Discord classes',
      'drove for a rideshare company',   'sold handmade crafts',       'wrote blog posts',
    ];

    const amount = Math.floor(Math.random() * (workReward.max - workReward.min + 1)) + workReward.min;
    const job    = jobs[Math.floor(Math.random() * jobs.length)];

    await addCoins(client, interaction.user.id, interaction.guildId, amount);
    await client.redis.setex(key, Math.ceil(workCooldown / 1000), '1');

    return interaction.editReply({
      embeds: [buildEmbed({
        type:        'economy',
        description: `💼 You **${job}** and earned **${amount.toLocaleString()} ${currencyEmoji} coins**!`,
        timestamp:   true,
      })],
    });
  },
};


// ─── /shop ───────────────────────────────────────────────────
export const shop = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Browse the server shop')
    .addSubcommand(s => s.setName('browse').setDescription('Browse available items'))
    .addSubcommand(s => s
      .setName('buy')
      .setDescription('Purchase an item')
      .addIntegerOption(o => o.setName('id').setDescription('Item ID').setRequired(true))
      .addIntegerOption(o => o.setName('quantity').setDescription('Quantity').setMinValue(1).setMaxValue(10))
    )
    .addSubcommand(s => s
      .setName('add')
      .setDescription('[Admin] Add item to shop')
      .addStringOption(o => o.setName('name').setDescription('Item name').setRequired(true))
      .addIntegerOption(o => o.setName('price').setDescription('Price in coins').setRequired(true).setMinValue(1))
      .addStringOption(o => o.setName('description').setDescription('Item description'))
      .addRoleOption(o => o.setName('role').setDescription('Role reward (optional)'))
      .addIntegerOption(o => o.setName('stock').setDescription('Stock quantity (-1 = unlimited)'))
    )
    .addSubcommand(s => s
      .setName('remove')
      .setDescription('[Admin] Remove item from shop')
      .addIntegerOption(o => o.setName('id').setDescription('Item ID').setRequired(true))
    ),

  guildOnly: true,
  cooldown:  3000,

  async execute(client, interaction) {
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();
    const { ShopItem, Economy, Inventory } = client.db.models;
    const { currencyEmoji } = config.economy;

    if (sub === 'browse') {
      const items = await ShopItem.findAll({
        where: { guildId: interaction.guildId, enabled: true },
        order: [['price', 'ASC']],
        limit: 20,
      });

      if (!items.length) return interaction.editReply({ embeds: [buildEmbed({ type: 'info', description: '🛒 The shop is empty.' })] });

      const fields = items.map(item => ({
        name:  `#${item.id} ${item.name}`,
        value: `${item.description || 'No description'}\n**Price:** ${item.price.toLocaleString()} ${currencyEmoji} ${item.stock === -1 ? '' : `• **Stock:** ${item.stock}`}`,
        inline: false,
      }));

      return interaction.editReply({ embeds: [buildEmbed({ type: 'economy', title: `🛒 Server Shop`, fields, footer: 'Use /shop buy <id> to purchase', timestamp: true })] });
    }

    if (sub === 'buy') {
      const itemId   = interaction.options.getInteger('id');
      const quantity = interaction.options.getInteger('quantity') || 1;
      const item     = await ShopItem.findOne({ where: { id: itemId, guildId: interaction.guildId, enabled: true } });

      if (!item) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Item not found.' })] });
      if (item.stock !== -1 && item.stock < quantity) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: `❌ Only ${item.stock} in stock.` })] });

      const total = item.price * quantity;
      const result = await removeCoins(client, interaction.user.id, interaction.guildId, total);

      if (!result.success) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: `❌ Insufficient funds. Need ${total.toLocaleString()} ${currencyEmoji}.` })] });

      // Decrement stock
      if (item.stock !== -1) await item.decrement('stock', { by: quantity });

      // Add to inventory
      const [inv] = await Inventory.findOrCreate({ where: { userId: interaction.user.id, guildId: interaction.guildId, itemId }, defaults: { quantity: 0 } });
      await inv.increment('quantity', { by: quantity });

      // Award role if configured
      if (item.roleId) {
        const role = interaction.guild.roles.cache.get(item.roleId);
        if (role) await interaction.member.roles.add(role, '[Aura Shop] Item purchase').catch(() => {});
      }

      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', title: '✅ Purchase Successful!', description: `You bought **${quantity}x ${item.name}** for **${total.toLocaleString()} ${currencyEmoji}**!\n**New Balance:** ${result.balance.toLocaleString()} coins`, timestamp: true })] });
    }

    if (sub === 'add') {
      if (!interaction.member.permissions.has('ManageGuild')) {
        return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ You need Manage Server permission.' })] });
      }

      // Premium limit check
      const isPremium = await checkPremium(client, interaction.guildId);
      const count     = await ShopItem.count({ where: { guildId: interaction.guildId } });
      const limit     = isPremium ? config.limits.premium.economyItems : config.limits.free.economyItems;

      if (count >= limit) {
        return interaction.editReply({ embeds: [buildEmbed({ type: 'warning', description: `⚠️ Shop limit reached (${limit} items). ${!isPremium ? 'Upgrade to Premium for up to 300 items!' : ''}` })] });
      }

      const name  = interaction.options.getString('name');
      const price = interaction.options.getInteger('price');
      const desc  = interaction.options.getString('description');
      const role  = interaction.options.getRole('role');
      const stock = interaction.options.getInteger('stock') ?? -1;

      const item = await ShopItem.create({ guildId: interaction.guildId, name, price, description: desc, roleId: role?.id, stock });
      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `✅ **${name}** added to shop for **${price.toLocaleString()} ${currencyEmoji}**. (ID: ${item.id})` })] });
    }

    if (sub === 'remove') {
      if (!interaction.member.permissions.has('ManageGuild')) {
        return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ No permission.' })] });
      }
      const id   = interaction.options.getInteger('id');
      const item = await ShopItem.findOne({ where: { id, guildId: interaction.guildId } });
      if (!item) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Item not found.' })] });
      await item.destroy();
      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `✅ Item #${id} removed from shop.` })] });
    }
  },
};

// ─── /transfer ───────────────────────────────────────────────
export const transfer = {
  data: new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Transfer coins to another user')
    .addUserOption(o => o.setName('user').setDescription('Recipient').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true).setMinValue(1)),

  guildOnly: true,
  cooldown:  5000,

  async execute(client, interaction) {
    await interaction.deferReply();
    const { currencyEmoji } = config.economy;
    const target = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    if (target.id === interaction.user.id) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Cannot transfer to yourself.' })] });
    if (target.bot) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Cannot transfer to bots.' })] });

    const fee    = Math.floor(amount * config.economy.transferFee);
    const net    = amount - fee;

    const result = await removeCoins(client, interaction.user.id, interaction.guildId, amount);
    if (!result.success) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: `❌ Insufficient funds.` })] });

    await addCoins(client, target.id, interaction.guildId, net);

    return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: `✅ Transferred **${net.toLocaleString()} ${currencyEmoji}** to <@${target.id}> (Fee: ${fee})\n**Your Balance:** ${result.balance.toLocaleString()} credits` })] });
  },
};

// ─── /rep (Reputation) ───────────────────────────────────────
export const rep = {
  data: new SlashCommandBuilder()
    .setName('rep')
    .setDescription('Give a reputation point to another user')
    .addUserOption(o => o.setName('user').setDescription('User to give rep to').setRequired(true)),

  guildOnly: true,
  cooldown:  3000,

  async execute(client, interaction) {
    await interaction.deferReply();
    const target = interaction.options.getUser('user');
    const sender = interaction.user;

    if (target.id === sender.id) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ You cannot give reputation to yourself.' })] });
    if (target.bot) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Bots do not need reputation.' })] });

    const { repCooldown } = config.economy;
    const walletSender = await getWallet(client, sender.id, interaction.guildId);
    
    if (walletSender.lastRepAt) {
      const elapsed = Date.now() - new Date(walletSender.lastRepAt).getTime();
      if (elapsed < repCooldown) {
        const remaining = Math.ceil((repCooldown - elapsed) / 3600000);
        return interaction.editReply({ embeds: [buildEmbed({ type: 'warning', description: `⌛ You can give another reputation point in **${remaining} hours**.` })] });
      }
    }

    const walletTarget = await getWallet(client, target.id, interaction.guildId);
    await walletTarget.increment('reputation');
    await walletSender.update({ lastRepAt: new Date() });

    return interaction.editReply({
      embeds: [buildEmbed({
        type: 'success',
        description: `✨ You gave a reputation point to <@${target.id}>!\nThey now have **${Number(walletTarget.reputation) + 1}** reputation.`
      })]
    });
  },
};

// ─── Economy Leaderboard ─────────────────────────────────────
export const richlist = {
  data: new SlashCommandBuilder()
    .setName('richlist')
    .setDescription('View the richest members in the server'),

  guildOnly: true,
  cooldown:  10000,

  async execute(client, interaction) {
    await interaction.deferReply();
    const { Economy } = client.db.models;
    const { currencyEmoji } = config.economy;

    const top = await Economy.findAll({
      where:  { guildId: interaction.guildId },
      order:  [['balance', 'DESC']],
      limit:  10,
    });

    const medals = ['🥇', '🥈', '🥉'];
    const fields = top.map((e, i) => ({
      name:  `${medals[i] || `**${i + 1}.**`} <@${e.userId}>`,
      value: `**${Number(e.balance).toLocaleString()} ${currencyEmoji}**`,
      inline: false,
    }));

    return interaction.editReply({ embeds: [buildEmbed({ type: 'economy', title: `💰 Richest Members — ${interaction.guild.name}`, fields, timestamp: true })] });
  },
};

async function checkPremium(client, guildId) {
  try {
    const { GuildSettings } = client.db.models;
    const s = await GuildSettings.findOne({ where: { guildId } });
    return (s?.premiumTier || 0) > 0;
  } catch { return false; }
}

export default balance;

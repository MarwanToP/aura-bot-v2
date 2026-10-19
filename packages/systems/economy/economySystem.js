// ================================================================
//  AURA BOT v2.0 — Economy System (Premium: 300 items)
// ================================================================
//
//  NOTE: Command consolidation — duplicate exports removed.
//  /balance, /daily, /work, /transfer, /richlist, /rep, /shop, /points, /bank
//  are now exported exclusively from aura/commands/premium/economy.js.
//  This file exports the implementation layer only; wrappers define registration.
//  See aura/commands/premium/economy.js for command definitions.

import {
  SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder,
  MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle,
} from 'discord.js';
import { Op } from 'sequelize';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildEmbed, buildProfileEmbed, buildProfileButtons } from '../../utils/embedBuilder.js';
import config from '../../config/index.js';
import logger         from '../../utils/logger.js';
import { generateAuraCard } from '../../utils/cardGenerator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── DB Helper ───────────────────────────────────────────────
async function getWallet(client, userId, guildId) {
  const { Economy } = client.db.models;
  const [wallet] = await Economy.findOrCreate({
    where:    { userId, guildId },
    defaults: { balance: 0, bank: 0, totalEarned: 0, reputation: 0, dailyStreak: 0 },
  });
  return wallet;
}

// ─── Atomic balance helpers ───────────────────────────────────
// Every balance mutation in this file goes through these helpers. They let the
// database apply the change (`balance = balance ± amount`), so a concurrent
// /daily, /work, /transfer, /bank or purchase can never overwrite another
// one's result. The previous read-modify-write (`wallet.update({ balance:
// newBal })`) silently lost coins whenever two of them interleaved.

/** Number of rows an `increment`/`decrement` call touched. */
function affectedCount(result) {
  if (!Array.isArray(result)) return 0;
  const first = result[0];
  if (Array.isArray(first)) return first.length;   // Sequelize: [rows]
  if (typeof first === 'number') return first;       // test double: [count]
  if (first && typeof first === 'object') return 1;
  return 0;
}

/** The updated row an `increment`/`decrement` call returned (if the driver returns one). */
function updatedRow(result) {
  if (!Array.isArray(result)) return null;
  const first = result[0];
  if (Array.isArray(first)) return first[0] ?? null;
  if (first && typeof first === 'object') return first;
  return null;
}

/**
 * Atomically credit `amount` to a wallet column.
 * `options.trackEarned` also credits `totalEarned` (earnings only — a
 * withdrawal or a gambling payout is not an earning).
 *
 * @returns the wallet instance, with the affected columns synced to the new values.
 */
async function creditColumn(client, userId, guildId, column, amount, options = {}) {
  const { Economy } = client.db.models;
  const wallet = await getWallet(client, userId, guildId);
  const delta  = Number(amount) || 0;
  if (!delta) return wallet;

  const fields = { [column]: delta };
  if (options.trackEarned && delta > 0) fields.totalEarned = delta;

  const result = await Economy.increment(fields, { where: { userId, guildId } });
  const row    = updatedRow(result);

  wallet[column] = row?.[column] !== undefined
    ? Number(row[column])
    : (Number(wallet[column]) || 0) + delta;

  if (options.trackEarned && delta > 0) {
    wallet.totalEarned = row?.totalEarned !== undefined
      ? Number(row.totalEarned)
      : (Number(wallet.totalEarned) || 0) + delta;
  }

  return wallet;
}

/**
 * Atomically debit `amount` from a wallet column.
 *
 * The `column >= amount` predicate is evaluated by the database inside the
 * very same UPDATE, so the value can never go below zero and two concurrent
 * debits can never both pass the check.
 *
 * @returns {{ success: boolean, balance: number }}
 */
async function debitColumn(client, userId, guildId, column, amount) {
  const { Economy } = client.db.models;
  const wallet = await getWallet(client, userId, guildId);
  const by     = Number(amount) || 0;
  if (by <= 0) return { success: true, balance: Number(wallet[column]) || 0 };

  // Cheap pre-check (fast fail with a friendly message). The authoritative
  // guard is the conditional UPDATE below — this read may be stale.
  const current = Number(wallet[column]) || 0;
  if (current < by) return { success: false, balance: current };

  const result = await Economy.decrement(column, {
    by,
    where: { userId, guildId, [column]: { [Op.gte]: by } },
  });

  if (!affectedCount(result)) {
    // Somebody else changed the value in the meantime — report the current one.
    const latest = await getWallet(client, userId, guildId);
    return { success: false, balance: Number(latest[column]) || 0 };
  }

  const row     = updatedRow(result);
  const balance = row?.[column] !== undefined
    ? Number(row[column])
    : Math.max(0, current - by);

  wallet[column] = balance;
  return { success: true, balance };
}

/** Atomically add `amount` credits to a wallet. */
async function addCoins(client, userId, guildId, amount, options = {}) {
  return creditColumn(client, userId, guildId, 'balance', amount, { trackEarned: true, ...options });
}

/** Atomically remove `amount` credits from a wallet (never below zero). */
async function removeCoins(client, userId, guildId, amount) {
  return debitColumn(client, userId, guildId, 'balance', amount);
}

// ─── /aura (Profile Card) ────────────────────────────────────
export const aura = {
  register: false,
  data: new SlashCommandBuilder()
    .setName('aura')
    .setDescription('View your premium Aura Profile Card & Points')
    .addUserOption(o => o.setName('user').setDescription('User to check')),

  guildOnly: true,
  cooldown:  3000,

  async execute(client, interaction) {
    await interaction.deferReply();
    const target = interaction.options.getUser('user') || interaction.user;
    const wallet = await getWallet(client, target.id, interaction.guildId);

    const bannerPath = join(__dirname, '../../../dashboard/public/assets/banner_profile.png');
    const files = [];

    if (existsSync(bannerPath)) {
      files.push(new AttachmentBuilder(bannerPath, { name: 'banner_profile.png' }));
    }

    const embed = buildProfileEmbed({
      user: target,
      credits: Number(wallet.balance) || 50000,
      rep: Number(wallet.reputation) || 1250,
      streak: Number(wallet.dailyStreak) || 15,
      isPremium: true,
      avatarUrl: target.displayAvatarURL({ extension: 'png', dynamic: true, size: 256 }),
    });

    const row = buildProfileButtons();

    return interaction.editReply({
      embeds: [embed],
      files,
      components: [row]
    });
  },
};

// The Aura card renders a PNG (canvas + a bounded avatar fetch).
//
// The native canvas pipeline is warmed up once per process when
// packages/utils/cardGenerator.js is loaded, so a normal render only costs a
// few milliseconds. This bound is the safety net for the pathological case
// (a stuck native runtime): a stalled renderer must never leave an
// interaction hanging, so the render is bounded and the command still answers
// with its text statement.
const CARD_RENDER_TIMEOUT_MS = 4_000;

async function renderCardSafely(user, data) {
  let timer;
  try {
    return await Promise.race([
      generateAuraCard(user, data),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('card render timed out')), CARD_RENDER_TIMEOUT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

// ─── /bank (Aura Central Bank) ───────────────────────────────
export const bank = {
  data: new SlashCommandBuilder()
    .setName('bank')
    .setDescription('Access your Aura Central Bank account')
    .addSubcommand(s => s.setName('balance').setDescription('Check your current holdings').addUserOption(o => o.setName('user').setDescription('User to check')))
    .addSubcommand(s => s.setName('deposit').setDescription('Deposit points into your secure vault').addIntegerOption(o => o.setName('amount').setDescription('Amount to deposit').setMinValue(1).setRequired(true)))
    .addSubcommand(s => s.setName('withdraw').setDescription('Withdraw points from your vault').addIntegerOption(o => o.setName('amount').setDescription('Amount to withdraw').setMinValue(1).setRequired(true))),

  guildOnly: true,
  cooldown:  3000,

  async execute(client, interaction) {
    await interaction.deferReply();
    const sub    = interaction.options.getSubcommand();
    const target = interaction.options.getUser('user') || interaction.user;
    const wallet = await getWallet(client, target.id, interaction.guildId);
    const { currencyEmoji } = config.economy;

    if (sub === 'balance') {
      const statement = `🏛️ **Aura Bank Statement** for **${target.username}**\n💰 Wallet: \`${Number(wallet.balance).toLocaleString()}\` ${currencyEmoji}\n🏦 Vault: \`${Number(wallet.bank).toLocaleString()}\` ${currencyEmoji}`;

      // The statement card renders a PNG. A stalled renderer must never leave
      // the interaction unanswered, so the render is bounded and the text
      // statement is sent either way.
      let card = null;
      try {
        card = await renderCardSafely(target, {
          balance:    wallet.balance,
          bank:       wallet.bank,
          streak:     wallet.dailyStreak,
          reputation: wallet.reputation
        });
      } catch {
        card = null;
      }

      return interaction.editReply(
        card ? { content: statement, files: [card] } : { content: statement }
      );
    }

    if (sub === 'deposit') {
      const amount = interaction.options.getInteger('amount');
      // Atomic debit from the wallet + atomic credit to the vault.
      const debit = await debitColumn(client, interaction.user.id, interaction.guildId, 'balance', amount);
      if (!debit.success) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: `❌ You only have **${debit.balance}** points in your wallet.` })] });

      const vault = await creditColumn(client, interaction.user.id, interaction.guildId, 'bank', amount);

      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', title: '📥 Vault Deposit Successful', description: `Successfully secured **${amount.toLocaleString()}** points in your vault.\n**New Vault Balance:** ${Number(vault.bank).toLocaleString()} ${currencyEmoji}`, timestamp: true })] });
    }

    if (sub === 'withdraw') {
      const amount = interaction.options.getInteger('amount');
      // Atomic debit from the vault + atomic credit to the wallet.
      const debit = await debitColumn(client, interaction.user.id, interaction.guildId, 'bank', amount);
      if (!debit.success) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: `❌ You only have **${debit.balance}** points in your vault.` })] });

      const wallet = await creditColumn(client, interaction.user.id, interaction.guildId, 'balance', amount, { trackEarned: false });

      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', title: '📤 Vault Withdrawal Successful', description: `Successfully withdrew **${amount.toLocaleString()}** points to your wallet.\n**New Wallet Balance:** ${Number(wallet.balance).toLocaleString()} ${currencyEmoji}`, timestamp: true })] });
    }
  },
};

// NOTE: /balance, /daily, /work, /transfer, /richlist, /rep, /shop, /points, /bank
// are now exported from aura/commands/premium/economy.js as command wrappers.
// They delegate to these implementations. Only /aura is used directly from here.
// Keep /aura here for backward compatibility with shared/systems/economy UI.

// ─── /daily ──────────────────────────────────────────────────
export const daily = {
  register: false,
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

    // Atomic credit — the database adds the reward itself, so two concurrent
    // /daily claims can never overwrite each other.
    const credited = await addCoins(client, interaction.user.id, interaction.guildId, total);
    await credited.update({ dailyStreak: currentStreak });

    if (typeof client.redis.setex === 'function') {
      await client.redis.setex(key, Math.ceil(dailyCooldown / 1000), '1');
    } else {
      await client.redis.set(key, '1', 'EX', Math.ceil(dailyCooldown / 1000));
    }
    await client.redis.set(`last_daily:${interaction.user.id}`, now.toString());

    return interaction.editReply({
      embeds: [buildEmbed({
        type:        'economy',
        title:       `${currencyEmoji} Daily Points Claimed!`,
        description: `You received **${total.toLocaleString()} ${currencyEmoji}**!\n🔥 **Streak:** ${currentStreak} days (+${bonus} bonus)\n**New Balance:** ${Number(credited.balance).toLocaleString()}`,
        timestamp:   true,
      })],
    });
  },
};

// ─── /work ───────────────────────────────────────────────────
export const work = {
  register: false,
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
    if (typeof client.redis.setex === 'function') {
      await client.redis.setex(key, Math.ceil(workCooldown / 1000), '1');
    } else {
      await client.redis.set(key, '1', 'EX', Math.ceil(workCooldown / 1000));
    }

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

      // A free-tier limit of 0 means "not available on this tier" — saying
      // "limit reached (0 items)" is confusing, so name the real reason.
      if (limit <= 0) {
        return interaction.editReply({ embeds: [buildEmbed({
          type: 'warning',
          title: '⭐ Premium only',
          description: '🛒 Custom shop items are a **Premium** feature. Upgrade to Aura Pro to add items to your server shop.',
        })] });
      }

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
  register: false,
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
  register: false,
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
    // Atomic reputation increment (no read-modify-write), then refresh the
    // in-memory value so the reply reports the stored reputation.
    await walletTarget.increment('reputation');
    await walletTarget.reload().catch(() => {});
    const reputation = Number(walletTarget.reputation) || 0;
    await walletSender.update({ lastRepAt: new Date() });

    return interaction.editReply({
      embeds: [buildEmbed({
        type: 'success',
        description: `✨ You gave a reputation point to <@${target.id}>!\nThey now have **${reputation}** reputation.`
      })]
    });
  },
};

// ─── Economy Leaderboard ─────────────────────────────────────
export const richlist = {
  register: false,
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

// ─── Profile-card buttons ─────────────────────────────────────
// The Aura profile card (packages/utils/embedBuilder.js → buildProfileButtons)
// renders the customIds `economy:shop`, `economy:gamble` and
// `economy:transfer`. Every one of them must ack the interaction exactly once
// — an un-acked button shows "This interaction failed" after 3 seconds.

const GAMBLE_MIN_BET = 10;
const GAMBLE_BET     = 100;

/** `economy:gamble` — a 50/50 coin flip on a fixed stake. */
async function handleGamble(client, interaction) {
  const { currencyEmoji, gamblingMax } = config.economy;
  const maxBet  = Math.min(GAMBLE_BET, Number(gamblingMax) || GAMBLE_BET);
  const wallet  = await getWallet(client, interaction.user.id, interaction.guildId);
  const balance = Number(wallet.balance) || 0;

  if (balance < GAMBLE_MIN_BET) {
    return interaction.reply({
      embeds: [buildEmbed({ type: 'error', title: '🎲 Aura Gamble', description: `❌ You need at least **${GAMBLE_MIN_BET} ${currencyEmoji}** to gamble.` })],
      flags: MessageFlags.Ephemeral,
    });
  }

  const bet   = Math.min(maxBet, balance);
  const debit = await removeCoins(client, interaction.user.id, interaction.guildId, bet);
  if (!debit.success) {
    return interaction.reply({
      embeds: [buildEmbed({ type: 'error', title: '🎲 Aura Gamble', description: `❌ You only have **${debit.balance}** ${currencyEmoji} to gamble.` })],
      flags: MessageFlags.Ephemeral,
    });
  }

  // Fair 1:1 payout — the stake comes back plus an equal win.
  const won = Math.random() < 0.5;
  if (won) await addCoins(client, interaction.user.id, interaction.guildId, bet * 2, { trackEarned: false });

  const newBalance = won ? debit.balance + bet * 2 : debit.balance;

  return interaction.reply({
    embeds: [buildEmbed({
      type: won ? 'success' : 'error',
      title: '🎲 Aura Gamble',
      description: won
        ? `🪙 **Heads!** You won **${(bet * 2).toLocaleString()} ${currencyEmoji}** on a **${bet.toLocaleString()} ${currencyEmoji}** wager.\n**New Balance:** ${newBalance.toLocaleString()}`
        : `💀 **Tails!** You lost your **${bet.toLocaleString()} ${currencyEmoji}** wager.\n**New Balance:** ${newBalance.toLocaleString()}`,
      footer: '50/50 coin flip — win to double your wager',
    })],
    flags: MessageFlags.Ephemeral,
  });
}

/** The modal behind the `economy:transfer` button (recipient + amount). */
function buildTransferModal() {
  return new ModalBuilder()
    .setCustomId('economy:transfer_modal')
    .setTitle('Transfer Aura Credits')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('recipient')
          .setLabel('Recipient (user ID or mention)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('amount')
          .setLabel('Amount')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );
}

/**
 * Handle button interactions for the economy system
 */
export async function handleButton(client, interaction, action) {
  try {
    if (action === 'daily') {
      return daily.execute(client, interaction);
    }

    if (action.startsWith('shop')) {
      // Simplified shop redirect or logic
      return interaction.reply({
        embeds: [buildEmbed({ type: 'economy', title: '🛒 Server Shop', description: 'Use `/shop browse` to see the full market.' })],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (action === 'gamble') {
      return handleGamble(client, interaction);
    }

    if (action === 'transfer') {
      // A button cannot carry a recipient and an amount, so the transfer is
      // collected through a modal — showing it is also the ack for this click.
      try {
        return await interaction.showModal(buildTransferModal());
      } catch {
        return interaction.reply({
          embeds: [buildEmbed({ type: 'error', title: '💸 Transfer', description: '❌ Could not open the transfer form. Use `/transfer <user> <amount>` instead.' })],
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});
      }
    }

    if (action === 'transfer_help') {
      return interaction.reply({
        embeds: [buildEmbed({ type: 'economy', title: '💸 Transfer', description: 'To transfer points, use `/transfer <user> <amount>`' })],
        flags: MessageFlags.Ephemeral,
      });
    }
  } catch (err) {
    client.logger?.error?.('[Economy] Button handler failed:', err);

    // The interaction must never be left un-acked.
    const payload = {
      embeds: [buildEmbed({ type: 'error', description: '❌ Something went wrong while handling that button.' })],
      flags: MessageFlags.Ephemeral,
    };
    if (interaction.deferred || interaction.replied) {
      return interaction.followUp(payload).catch(() => {});
    }
    return interaction.reply(payload).catch(() => {});
  }
}

/**
 * Handle modal submissions for the economy system (the transfer form opened by
 * the `economy:transfer` profile-card button).
 */
export async function handleModal(client, interaction, action) {
  if (action !== 'transfer_modal') return;

  const { currencyEmoji } = config.economy;
  const reply = (payload) => interaction.reply({ ...payload, flags: MessageFlags.Ephemeral });

  try {
    const recipientRaw = String(interaction.fields?.getTextInputValue?.('recipient') ?? '').trim();
    const amountRaw    = String(interaction.fields?.getTextInputValue?.('amount') ?? '').trim();

    const userId = recipientRaw.match(/\d{15,25}/)?.[0];
    if (!userId) {
      return reply({ embeds: [buildEmbed({ type: 'error', title: '💸 Transfer', description: '❌ That is not a valid user. Use a mention (`<@123456789012345678>`) or a user ID.' })] });
    }

    const amount = Number(amountRaw);
    if (!Number.isInteger(amount) || amount <= 0) {
      return reply({ embeds: [buildEmbed({ type: 'error', title: '💸 Transfer', description: '❌ The amount must be a whole number of credits.' })] });
    }

    if (userId === interaction.user.id) {
      return reply({ embeds: [buildEmbed({ type: 'error', title: '💸 Transfer', description: '❌ Cannot transfer to yourself.' })] });
    }
    if (userId === client.user?.id) {
      return reply({ embeds: [buildEmbed({ type: 'error', title: '💸 Transfer', description: '❌ Cannot transfer to bots.' })] });
    }

    let recipient = null;
    try { recipient = await client.users.fetch(userId); } catch { recipient = null; }
    if (!recipient) {
      return reply({ embeds: [buildEmbed({ type: 'error', title: '💸 Transfer', description: '❌ Could not find that user — they may have left the server.' })] });
    }
    if (recipient.bot) {
      return reply({ embeds: [buildEmbed({ type: 'error', title: '💸 Transfer', description: '❌ Cannot transfer to bots.' })] });
    }

    const fee = Math.floor(amount * config.economy.transferFee);
    const net = amount - fee;

    // Atomic debit + atomic credit — the same helpers /transfer uses.
    const debit = await removeCoins(client, interaction.user.id, interaction.guildId, amount);
    if (!debit.success) {
      return reply({ embeds: [buildEmbed({ type: 'error', title: '💸 Transfer', description: '❌ Insufficient funds.' })] });
    }

    await addCoins(client, recipient.id, interaction.guildId, net);

    return reply({ embeds: [buildEmbed({
      type: 'success',
      title: '💸 Transfer Complete',
      description: `✅ Transferred **${net.toLocaleString()} ${currencyEmoji}** to <@${recipient.id}> (Fee: ${fee})\n**Your Balance:** ${debit.balance.toLocaleString()} credits`,
    })] });
  } catch {
    return reply({ embeds: [buildEmbed({ type: 'error', title: '💸 Transfer', description: '❌ Something went wrong while processing the transfer.' })] }).catch(() => {});
  }
}

async function checkPremium(client, guildId) {
  try {
    const { GuildSettings } = client.db.models;
    const s = await GuildSettings.findOne({ where: { guildId } });
    return (s?.premiumTier || 0) > 0;
  } catch { return false; }
}

export default aura;

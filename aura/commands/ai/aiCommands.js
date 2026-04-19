// ================================================================
//  Commands: /ask /chat /imagine /translate /summarize /aimod
// ================================================================

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
} from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';

const PERMISSION_PROPOSAL_TTL_SECONDS = 900;
const AI_PERMISSION_STORE_PREFIX = 'ai:perm:proposal:';

// ── /ask — Single AI question ──────────────────────────────
export const ask = {
  data: new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask the AI assistant anything')
    .addStringOption(o => o
      .setName('question')
      .setDescription('Your question')
      .setRequired(true)
      .setMaxLength(1000)
    )
    .addBooleanOption(o => o.setName('ephemeral').setDescription('Only you can see the response')),

  cooldown: 5000,

  async execute(client, interaction) {
    const ephemeral = interaction.options.getBoolean('ephemeral') ?? false;
    await interaction.deferReply({ ephemeral });

    if (!client.ai.isAvailable()) {
      return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ AI is not configured on this bot.' })] });
    }

    const question = interaction.options.getString('question');
    const lang     = await client.i18n.resolveLanguage(client, interaction.user.id, interaction.guildId);

    // Check usage limits
    const isPremium = await checkPremium(client, interaction.guildId);
    const usage     = await client.ai.checkUsage(client.redis, interaction.user.id, isPremium);

    if (usage.exceeded) {
      return interaction.editReply({ embeds: [buildEmbed({ type: 'warning', description: `⚠️ Daily AI limit reached (${usage.limit} requests). ${!isPremium ? 'Upgrade to Premium for more!' : 'Resets at midnight.'}` })] });
    }

    try {
      const langInstr = lang === 'ar' ? 'Please respond in Arabic.' : '';
      const result    = await client.ai.prompt(question + (langInstr ? `\n\n${langInstr}` : ''));

      await client.ai.incrementUsage(client.redis, interaction.user.id);

      return interaction.editReply({
        embeds: [buildEmbed({
          type:        'ai',
          author:      `🤖 Aura AI • Gemini 2.5`,
          description: result.content.slice(0, 4000),
          footer:      `Asked by ${interaction.user.tag} • ${usage.usage + 1}/${usage.limit} requests today`,
          timestamp:   true,
        })],
      });
    } catch (err) {
      client.logger.error('[AI] ask error:', err);
      return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ AI request failed. Please try again.' })] });
    }
  },
};

// ── /chat — Persistent AI conversation ─────────────────────
export const chat = {
  data: new SlashCommandBuilder()
    .setName('chat')
    .setDescription('Have a conversation with the AI (remembers context)')
    .addSubcommand(s => s
      .setName('message')
      .setDescription('Send a message to the AI')
      .addStringOption(o => o.setName('text').setDescription('Your message').setRequired(true).setMaxLength(1000))
    )
    .addSubcommand(s => s
      .setName('clear')
      .setDescription('Clear your conversation history with the AI')
    )
    .addSubcommand(s => s
      .setName('history')
      .setDescription('View your conversation history')
    ),

  cooldown: 3000,

  async execute(client, interaction) {
    await interaction.deferReply();
    const sub  = interaction.options.getSubcommand();
    const lang = await client.i18n.resolveLanguage(client, interaction.user.id, interaction.guildId);

    if (!client.ai.isAvailable()) {
      return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ AI not configured.' })] });
    }

    if (sub === 'clear') {
      await client.ai.clearContext(client.redis, interaction.user.id, interaction.guildId);
      return interaction.editReply({ embeds: [buildEmbed({ type: 'success', description: '🗑️ Conversation history cleared.' })] });
    }

    if (sub === 'history') {
      const ctx = await client.ai.getContext(client.redis, interaction.user.id, interaction.guildId);
      if (!ctx.length) return interaction.editReply({ embeds: [buildEmbed({ type: 'info', description: '📭 No conversation history.' })] });

      const preview = ctx.slice(-6).map(m => `**${m.role === 'user' ? '👤 You' : '🤖 AI'}:** ${m.content.slice(0, 200)}`).join('\n\n');
      return interaction.editReply({ embeds: [buildEmbed({ type: 'ai', title: '💬 Recent Conversation', description: preview })] });
    }

    if (sub === 'message') {
      const isPremium = await checkPremium(client, interaction.guildId);
      const usage     = await client.ai.checkUsage(client.redis, interaction.user.id, isPremium);

      if (usage.exceeded) {
        return interaction.editReply({ embeds: [buildEmbed({ type: 'warning', description: `⚠️ Daily AI limit (${usage.limit}) reached.` })] });
      }

      const text     = interaction.options.getString('text');
      const history  = await client.ai.getContext(client.redis, interaction.user.id, interaction.guildId);
      const langNote = lang === 'ar' ? '\n\nPlease respond in Arabic.' : '';

      const messages = [...history, { role: 'user', content: text + langNote }];

      try {
        const result = await client.ai.chat({ messages });

        const newHistory = [...messages, { role: 'assistant', content: result.content }];
        await client.ai.saveContext(client.redis, interaction.user.id, interaction.guildId, newHistory);
        await client.ai.incrementUsage(client.redis, interaction.user.id);

        return interaction.editReply({
          embeds: [buildEmbed({
            type:        'ai',
            author:      `🤖 Aura AI Chat`,
            description: result.content.slice(0, 4000),
            footer:      `${history.length / 2 + 1} exchanges • ${usage.usage + 1}/${usage.limit} today • /chat clear to reset`,
            timestamp:   true,
          })],
        });
      } catch (err) {
        client.logger.error('[AI] chat error:', err);
        return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ AI request failed.' })] });
      }
    }
  },
};

// ── /imagine — AI Image Generation ─────────────────────────
export const imagine = {
  data: new SlashCommandBuilder()
    .setName('imagine')
    .setDescription('Generate an image with AI (DALL-E 3)')
    .addStringOption(o => o.setName('prompt').setDescription('Describe the image').setRequired(true).setMaxLength(800))
    .addStringOption(o => o
      .setName('style')
      .setDescription('Art style')
      .addChoices(
        { name: '🎨 Vivid',   value: 'vivid' },
        { name: '🖼️ Natural', value: 'natural' },
      )
    )
    .addStringOption(o => o
      .setName('size')
      .setDescription('Image size')
      .addChoices(
        { name: '1024×1024 (Square)',     value: '1024x1024' },
        { name: '1792×1024 (Landscape)', value: '1792x1024' },
        { name: '1024×1792 (Portrait)',  value: '1024x1792' },
      )
    ),

  cooldown:    30000,
  premiumTier: 0,    // Free but limited

  async execute(client, interaction) {
    await interaction.deferReply();

    if (!client.ai.isAvailable()) {
      return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ AI not configured.' })] });
    }

    const isPremium = await checkPremium(client, interaction.guildId);
    const usage     = await client.ai.checkUsage(client.redis, interaction.user.id, isPremium);

    if (usage.exceeded) {
      return interaction.editReply({ embeds: [buildEmbed({ type: 'warning', description: `⚠️ Daily AI limit reached.` })] });
    }

    const prompt = interaction.options.getString('prompt');
    const style  = interaction.options.getString('style')  || 'vivid';
    const size   = interaction.options.getString('size')   || '1024x1024';

    try {
      const result = await client.ai.generateImage(prompt, { size, style });
      await client.ai.incrementUsage(client.redis, interaction.user.id);

      return interaction.editReply({
        embeds: [buildEmbed({
          type:    'ai',
          title:   '🎨 AI Generated Image',
          description: `**Prompt:** ${prompt}\n**Revised:** ${result.revisedPrompt?.slice(0, 200) || 'N/A'}`,
          image:   result.url,
          footer:  `Requested by ${interaction.user.tag} • DALL-E 3`,
          timestamp: true,
        })],
      });
    } catch (err) {
      client.logger.error('[AI] imagine error:', err);
      return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: `❌ Image generation failed: ${err.message}` })] });
    }
  },
};

// ── /translate — AI Translation ─────────────────────────────
export const translate = {
  data: new SlashCommandBuilder()
    .setName('translate')
    .setDescription('Translate text between languages using AI')
    .addStringOption(o => o.setName('text').setDescription('Text to translate').setRequired(true).setMaxLength(1500))
    .addStringOption(o => o
      .setName('to')
      .setDescription('Target language')
      .setRequired(true)
      .addChoices(
        { name: '🇬🇧 English',            value: 'en' },
        { name: '🇸🇦 Arabic (العربية)',   value: 'ar' },
        { name: '🇫🇷 French',             value: 'fr' },
        { name: '🇩🇪 German',             value: 'de' },
        { name: '🇪🇸 Spanish',            value: 'es' },
        { name: '🇯🇵 Japanese',           value: 'ja' },
        { name: '🇨🇳 Chinese',            value: 'zh' },
        { name: '🇷🇺 Russian',            value: 'ru' },
        { name: '🇹🇷 Turkish',            value: 'tr' },
        { name: '🇮🇩 Indonesian',         value: 'id' },
      )
    ),

  cooldown: 5000,

  async execute(client, interaction) {
    await interaction.deferReply();
    const text = interaction.options.getString('text');
    const to   = interaction.options.getString('to');

    if (!client.ai.isAvailable()) {
      return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ AI not configured.' })] });
    }

    try {
      const result = await client.ai.translate(text, to);
      const langFlags = { en: '🇬🇧', ar: '🇸🇦', fr: '🇫🇷', de: '🇩🇪', es: '🇪🇸', ja: '🇯🇵', zh: '🇨🇳', ru: '🇷🇺', tr: '🇹🇷', id: '🇮🇩' };

      return interaction.editReply({
        embeds: [buildEmbed({
          type:  'ai',
          title: `🌐 Translation → ${langFlags[to] || ''} ${to.toUpperCase()}`,
          fields: [
            { name: '📝 Original', value: text.slice(0, 1000),           inline: false },
            { name: '✅ Translated', value: result.content.slice(0, 1000), inline: false },
          ],
          footer:    `Powered by Gemini 2.5 Flash`,
          timestamp: true,
        })],
      });
    } catch (err) {
      return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Translation failed.' })] });
    }
  },
};

// ── /summarize — AI Text Summarizer ─────────────────────────
export const summarize = {
  data: new SlashCommandBuilder()
    .setName('summarize')
    .setDescription('Summarize long text with AI')
    .addStringOption(o => o.setName('text').setDescription('Text to summarize').setRequired(true).setMaxLength(4000))
    .addIntegerOption(o => o.setName('words').setDescription('Max summary words (default: 100)').setMinValue(50).setMaxValue(300)),

  cooldown: 5000,

  async execute(client, interaction) {
    await interaction.deferReply();
    const text     = interaction.options.getString('text');
    const maxWords = interaction.options.getInteger('words') || 100;
    const lang     = await client.i18n.resolveLanguage(client, interaction.user.id, interaction.guildId);

    if (!client.ai.isAvailable()) {
      return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ AI not configured.' })] });
    }

    try {
      const result = await client.ai.summarize(text, { language: lang, maxWords });

      return interaction.editReply({
        embeds: [buildEmbed({
          type:        'ai',
          title:       '📄 AI Summary',
          description: result.content,
          footer:      `Summarized from ${text.split(' ').length} words → ~${maxWords} words`,
          timestamp:   true,
        })],
      });
    } catch (err) {
      return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ Summarization failed.' })] });
    }
  },
};

// ── /aimod — AI Moderation Analysis (Staff only) ───────────
export const aimod = {
  data: new SlashCommandBuilder()
    .setName('aimod')
    .setDescription('[Staff] Analyze a message with AI moderation')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addStringOption(o => o.setName('message').setDescription('Message content to analyze').setRequired(true).setMaxLength(2000))
    .addStringOption(o => o
      .setName('depth')
      .setDescription('Analysis depth')
      .addChoices(
        { name: '⚡ Quick (Gemini Moderation)', value: 'quick' },
        { name: '🧠 Deep (Gemini Analysis)',    value: 'deep' },
      )
    ),

  userPermissions: [PermissionFlagsBits.ModerateMembers],
  guildOnly:       true,
  cooldown:        5000,

  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const message = interaction.options.getString('message');
    const depth   = interaction.options.getString('depth') || 'quick';

    if (!client.ai.isAvailable()) {
      return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ AI not configured.' })] });
    }

    try {
      const result = await client.ai.moderateContent(message, { context: depth });
      const suggestedAction = getSuggestedModerationAction(result);

      const severityColors = { low: 'success', medium: 'warning', high: 'error', critical: 'error' };
      const severityEmoji  = { low: '🟢', medium: '🟡', high: '🔴', critical: '💀' };

      return interaction.editReply({
        embeds: [buildEmbed({
          type:  result.violation ? (severityColors[result.severity] || 'error') : 'success',
          title: `🤖 AI Moderation Analysis`,
          fields: [
            { name: '📝 Content',       value: message.slice(0, 500),                                    inline: false },
            { name: '✅ Violation',     value: result.violation ? '⚠️ **YES**' : '✅ **No violation**', inline: true },
            { name: '📂 Category',      value: result.category || 'N/A',                                 inline: true },
            { name: '⚡ Severity',      value: `${severityEmoji[result.severity] || '⚪'} ${result.severity || 'N/A'}`, inline: true },
            { name: '🎯 Confidence',    value: `${result.confidence || 0}%`,                             inline: true },
            { name: '🔍 Analysis Source', value: result.source || 'N/A',                                inline: true },
            { name: '🧭 Suggested Action', value: suggestedAction,                                       inline: true },
            { name: '📋 Reason',        value: result.reason || 'No issues found',                      inline: false },
          ],
          footer:    `Analyzed with ${depth} mode`,
          timestamp: true,
        })],
      });
    } catch (err) {
      return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: `❌ Analysis failed: ${err.message}` })] });
    }
  },
};

// ── /ai-permissions — AI Role Audit ────────────────────────
export const aiPermissions = {
  data: new SlashCommandBuilder()
    .setName('ai-permissions')
    .setDescription('[Professional] AI role permission analysis & suggestion')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addRoleOption(o => o.setName('role').setDescription('Role to analyze').setRequired(true))
    .addStringOption(o => o.setName('purpose').setDescription('What is this role for? (Higher accuracy)').setMaxLength(500)),

  userPermissions: [PermissionFlagsBits.ManageRoles],
  guildOnly:       true,
  cooldown:        10000,

  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    if (!client.ai.isAvailable()) {
      return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ AI is not configured.' })] });
    }

    const role    = interaction.options.getRole('role');
    const purpose = interaction.options.getString('purpose') || 'Unspecified';

    try {
      // Get role permissions
      const perms = role.permissions.toArray();
      
      const analysis = await client.ai.suggestPermissions(role.name, perms, purpose);
      const suggestions = normalizePermissionSuggestions(analysis?.suggestions || []);
      const toAdd = suggestions.filter((perm) => !role.permissions.has(PermissionFlagsBits[perm]));
      const alreadyIncluded = suggestions.filter((perm) => role.permissions.has(PermissionFlagsBits[perm]));

      const proposalId = interaction.id;
      const proposalKey = `${AI_PERMISSION_STORE_PREFIX}${proposalId}`;
      await client.redis.setJSON(proposalKey, {
        guildId: interaction.guildId,
        roleId: role.id,
        roleName: role.name,
        requesterId: interaction.user.id,
        suggestions,
        createdAt: Date.now(),
      }, PERMISSION_PROPOSAL_TTL_SECONDS);
      
      const embed = buildEmbed({
        type:  analysis.dangerZone ? 'warning' : 'ai',
        title: `🤖 Neural Role Analysis — ${role.name}`,
        description: `**AI Rationale:** ${analysis.rationale}`,
        fields: [
          { name: '📋 Suggested Permissions', value: suggestions.length ? suggestions.map((p) => `\`${p}\``).join(', ') : 'No valid permission suggestions.', inline: false },
          { name: '➕ New Permissions',       value: toAdd.length ? toAdd.map((p) => `\`${p}\``).join(', ') : 'No new permissions to add.', inline: false },
          { name: '✅ Already Granted',       value: alreadyIncluded.length ? alreadyIncluded.map((p) => `\`${p}\``).join(', ') : 'None.', inline: false },
          { name: '🛡️ Vulnerability Status',  value: analysis.dangerZone ? '🟠 **Caution**: High-level permissions suggested.' : '🟢 **Secure**: Standards mapping applied.', inline: true },
        ],
        footer: 'Powered by Aura Neural Logic Core',
        timestamp: true,
      });

      const components = [];
      if (suggestions.length > 0) {
        components.push(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`ai:perm:apply:${proposalId}`)
              .setLabel('Apply Suggested Permissions')
              .setStyle(ButtonStyle.Danger)
              .setEmoji('🛠️'),
            new ButtonBuilder()
              .setCustomId(`ai:perm:diff:${proposalId}`)
              .setLabel('Show Diff')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('📋'),
            new ButtonBuilder()
              .setCustomId(`ai:perm:cancel:${proposalId}`)
              .setLabel('Dismiss')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('🗑️'),
          ),
        );
      }

      return interaction.editReply({ embeds: [embed], components });
    } catch (err) {
      client.logger.error('[AI] Permissions audit failed:', err);
      return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: '❌ AI analysis failed.' })] });
    }
  },
};

export async function handleButton(client, interaction, actionRaw) {
  const [scope, action, proposalId] = (actionRaw || '').split(':');
  if (scope !== 'perm' || !action || !proposalId) return;

  const proposalKey = `${AI_PERMISSION_STORE_PREFIX}${proposalId}`;
  const proposal = await client.redis.getJSON(proposalKey);

  if (!proposal) {
    return interaction.reply({
      embeds: [buildEmbed({ type: 'warning', description: '⚠️ This AI permission proposal has expired. Run `/ai-permissions` again.' })],
      ephemeral: true,
    }).catch(() => {});
  }

  if (proposal.requesterId !== interaction.user.id) {
    return interaction.reply({
      embeds: [buildEmbed({ type: 'error', description: '❌ Only the staff member who generated this proposal can apply it.' })],
      ephemeral: true,
    }).catch(() => {});
  }

  if (!interaction.guildId || interaction.guildId !== proposal.guildId) {
    return interaction.reply({
      embeds: [buildEmbed({ type: 'error', description: '❌ This proposal is bound to a different server.' })],
      ephemeral: true,
    }).catch(() => {});
  }

  if (action === 'cancel') {
    await client.redis.del(proposalKey);
    return interaction.update({
      embeds: [buildEmbed({ type: 'info', title: 'AI Permission Proposal Closed', description: 'This recommendation has been dismissed.' })],
      components: [],
    }).catch(() => {});
  }

  if (action === 'diff') {
    const role = await interaction.guild.roles.fetch(proposal.roleId).catch(() => null);
    if (!role) {
      await client.redis.del(proposalKey);
      return interaction.reply({
        embeds: [buildEmbed({ type: 'error', description: '❌ Target role no longer exists.' })],
        ephemeral: true,
      }).catch(() => {});
    }

    const suggestions = normalizePermissionSuggestions(proposal.suggestions || []);
    const toAdd = suggestions.filter((perm) => !role.permissions.has(PermissionFlagsBits[perm]));
    const alreadyIncluded = suggestions.filter((perm) => role.permissions.has(PermissionFlagsBits[perm]));

    return interaction.reply({
      embeds: [buildEmbed({
        type: 'info',
        title: `📋 Permission Diff — ${role.name}`,
        fields: [
          { name: '➕ To Add', value: toAdd.length ? toAdd.map((p) => `\`${p}\``).join(', ') : 'No new permissions.', inline: false },
          { name: '✅ Already Present', value: alreadyIncluded.length ? alreadyIncluded.map((p) => `\`${p}\``).join(', ') : 'None.', inline: false },
        ],
      })],
      ephemeral: true,
    }).catch(() => {});
  }

  if (action !== 'apply') return;

  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return interaction.reply({
      embeds: [buildEmbed({ type: 'error', description: '❌ You need `Manage Roles` permission to apply this proposal.' })],
      ephemeral: true,
    }).catch(() => {});
  }

  await interaction.deferUpdate();

  const role = await interaction.guild.roles.fetch(proposal.roleId).catch(() => null);
  if (!role) {
    await client.redis.del(proposalKey);
    return interaction.followUp({
      embeds: [buildEmbed({ type: 'error', description: '❌ Target role no longer exists.' })],
      ephemeral: true,
    }).catch(() => {});
  }

  const suggestions = normalizePermissionSuggestions(proposal.suggestions || []);
  const toAdd = suggestions.filter((perm) => !role.permissions.has(PermissionFlagsBits[perm]));
  const alreadyIncluded = suggestions.filter((perm) => role.permissions.has(PermissionFlagsBits[perm]));

  if (!role.editable) {
    return interaction.followUp({
      embeds: [buildEmbed({ type: 'error', description: '❌ I cannot edit this role (check role hierarchy and bot permissions).' })],
      ephemeral: true,
    }).catch(() => {});
  }

  const updatedPermissions = new PermissionsBitField(role.permissions.bitfield);
  for (const permissionName of toAdd) {
    updatedPermissions.add(PermissionFlagsBits[permissionName]);
  }

  await role.setPermissions(
    updatedPermissions,
    `AI permissions applied by ${interaction.user.tag} (${interaction.user.id})`,
  );

  await client.redis.del(proposalKey);
  return interaction.editReply({
    embeds: [buildEmbed({
      type: 'success',
      title: `✅ AI Permissions Applied — ${role.name}`,
      fields: [
        { name: '➕ Added', value: toAdd.length ? toAdd.map((p) => `\`${p}\``).join(', ') : 'Nothing new was required.', inline: false },
        { name: 'ℹ️ Already Present', value: alreadyIncluded.length ? alreadyIncluded.map((p) => `\`${p}\``).join(', ') : 'None.', inline: false },
      ],
      footer: `Applied by ${interaction.user.tag}`,
      timestamp: true,
    })],
    components: [],
  }).catch(() => {});
}

// ── Utility ──────────────────────────────────────────────────
function normalizePermissionSuggestions(suggestions) {
  if (!Array.isArray(suggestions)) return [];

  const validPermissionKeys = new Set(Object.keys(PermissionFlagsBits));
  const mapped = suggestions
    .map((permission) => String(permission).trim())
    .filter(Boolean)
    .map((permission) => permission.replace(/\s+/g, ''));

  return Array.from(new Set(mapped.filter((permission) => validPermissionKeys.has(permission))));
}

function getSuggestedModerationAction(result) {
  if (!result?.violation) return 'No immediate action needed.';

  switch (result.severity) {
    case 'critical':
      return 'Immediate escalation to senior moderation + consider instant timeout/ban.';
    case 'high':
      return 'Delete content and apply strong action (timeout), then escalate if repeated.';
    case 'medium':
      return 'Remove/warn and monitor repeat behavior.';
    case 'low':
      return 'Soft warning and track user behavior.';
    default:
      return 'Manual moderator review recommended.';
  }
}

async function checkPremium(client, guildId) {
  try {
    const { GuildSettings } = client.db.models;
    const s = await GuildSettings.findOne({ where: { guildId } });
    return (s?.premiumTier || 0) > 0;
  } catch { return false; }
}

export default ask;

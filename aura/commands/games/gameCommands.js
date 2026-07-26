// ================================================================
//  AURA BOT v2.0 — Games & Entertainment
// ================================================================
import { 
  SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder 
} from 'discord.js';
import { buildEmbed } from '../../../shared/utils/embedBuilder.js';
import config         from '../../../shared/config/config.js';

// ─── Blackjack ────────────────────────────────────────────────
export const blackjack = {
  register: false,
  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Play a game of Blackjack against Aura AI')
    .addIntegerOption(o => o.setName('bet').setDescription('Amount of points to bet').setMinValue(10).setRequired(true)),

  guildOnly: true,
  cooldown:  10000,

  async execute(client, interaction) {
    await interaction.deferReply();
    const { Economy } = client.db.models;
    const bet = interaction.options.getInteger('bet');
    const { currencyEmoji } = config.economy;

    const [wallet] = await Economy.findOrCreate({ where: { userId: interaction.user.id, guildId: interaction.guildId } });
    if (wallet.balance < bet) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: `❌ Insufficient funds. You only have **${wallet.balance}** points.` })] });

    await wallet.decrement('balance', { by: bet });

    const deck = createDeck();
    const playerHand = [drawCard(deck), drawCard(deck)];
    const dealerHand = [drawCard(deck), drawCard(deck)];

    const getScore = (hand) => {
      let score = hand.reduce((sum, card) => sum + card.value, 0);
      let aces = hand.filter(c => c.rank === 'A').length;
      while (score > 21 && aces > 0) { score -= 10; aces -= 1; }
      return score;
    };

    const buildGameEmbed = (status = 'playing') => {
      const pScore = getScore(playerHand);
      const dScore = status === 'playing' ? '?' : getScore(dealerHand);
      
      const pCards = playerHand.map(c => `\`${c.rank}${c.suit}\``).join(' ');
      const dCards = status === 'playing' 
        ? `\`${dealerHand[0].rank}${dealerHand[0].suit}\` \`??\`` 
        : dealerHand.map(c => `\`${c.rank}${c.suit}\``).join(' ');

      return buildEmbed({
        type:  status === 'win' ? 'success' : status === 'lost' ? 'error' : 'primary',
        title: `🃏 Blackjack — ${status.toUpperCase()}`,
        fields: [
          { name: `👤 Your Hand (${pScore})`, value: pCards, inline: true },
          { name: `🤖 Aura Hand (${dScore})`, value: dCards, inline: true },
        ],
        footer: `Bet: ${bet.toLocaleString()} points`,
      });
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('bj:hit').setLabel('Hit').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('bj:stand').setLabel('Stand').setStyle(ButtonStyle.Secondary)
    );

    const msg = await interaction.editReply({ embeds: [buildGameEmbed()], components: [row] });

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 60000
    });

    collector.on('collect', async i => {
      if (i.customId === 'bj:hit') {
        playerHand.push(drawCard(deck));
        if (getScore(playerHand) > 21) {
          collector.stop('lost');
          await i.update({ embeds: [buildGameEmbed('lost')], components: [] });
        } else {
          await i.update({ embeds: [buildGameEmbed()] });
        }
      } else {
        collector.stop('stand');
        await i.deferUpdate();
      }
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') return interaction.editReply({ components: [] });
      if (reason === 'lost') return; // Already handled

      // Dealer Turn
      let dScore = getScore(dealerHand);
      while (dScore < 17) {
        dealerHand.push(drawCard(deck));
        dScore = getScore(dealerHand);
      }

      const pScore = getScore(playerHand);
      let status = 'lost';
      let multiplier = 0;

      if (dScore > 21 || pScore > dScore) {
        status = 'win';
        multiplier = 2;
      } else if (pScore === dScore) {
        status = 'draw';
        multiplier = 1;
      }

      if (multiplier > 0) {
        await wallet.increment('balance', { by: bet * multiplier });
      }

      await interaction.editReply({ 
        embeds: [buildGameEmbed(status)], 
        components: [],
        content: status === 'win' ? `🎉 Congratulations! You won **${(bet * multiplier).toLocaleString()}** points!` : status === 'draw' ? `⚖️ It's a draw. Your **${bet}** points were returned.` : `💀 Better luck next time.`
      });
    });
  },
};

// ─── Slots ────────────────────────────────────────────────────
export const slots = {
  register: false,
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Spin the Aura Slots')
    .addIntegerOption(o => o.setName('bet').setDescription('Amount to bet').setMinValue(10).setRequired(true)),

  guildOnly: true,
  cooldown:  5000,

  async execute(client, interaction) {
    await interaction.deferReply();
    const { Economy } = client.db.models;
    const bet = interaction.options.getInteger('bet');
    const { currencyEmoji } = config.economy;

    const [wallet] = await Economy.findOrCreate({ where: { userId: interaction.user.id, guildId: interaction.guildId } });
    if (wallet.balance < bet) return interaction.editReply({ embeds: [buildEmbed({ type: 'error', description: `❌ Insufficient funds.` })] });

    await wallet.decrement('balance', { by: bet });

    const fruits = ['🍒', '🍋', '🍇', '💎', '🔔', '7️⃣'];
    const rolls  = [
      fruits[Math.floor(Math.random() * fruits.length)],
      fruits[Math.floor(Math.random() * fruits.length)],
      fruits[Math.floor(Math.random() * fruits.length)],
    ];

    const isWin = rolls[0] === rolls[1] && rolls[1] === rolls[2];
    const isPartial = rolls[0] === rolls[1] || rolls[1] === rolls[2] || rolls[0] === rolls[2];

    let multiplier = 0;
    if (isWin) multiplier = rolls[0] === '7️⃣' ? 10 : 5;
    else if (isPartial) multiplier = 1.5;

    if (multiplier > 0) {
      const winAmt = Math.floor(bet * multiplier);
      await wallet.increment('balance', { by: winAmt });
    }

    const embed = buildEmbed({
      type:  multiplier > 0 ? 'success' : 'error',
      title: '🎰 Aura Slots',
      description: `\n**[ ${rolls.join(' | ')} ]**\n\n${multiplier > 0 ? `✨ You won **${Math.floor(bet * multiplier).toLocaleString()}** points!` : '💀 Better luck next time.'}`,
      footer: `Bet: ${bet} points • Balance: ${Number(wallet.balance) - bet + (multiplier > 0 ? Math.floor(bet * multiplier) : 0)}`,
    });

    return interaction.editReply({ embeds: [embed] });
  },
};

// ─── Helpers ──────────────────────────────────────────────────
function createDeck() {
  const suits  = ['♠️', '♥️', '♦️', '♣️'];
  const ranks  = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const values = { '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, '10':10, 'J':10, 'Q':10, 'K':10, 'A':11 };
  const deck   = [];
  for (const suit of suits) {
    for (const rank of ranks) deck.push({ rank, suit, value: values[rank] });
  }
  return deck.sort(() => Math.random() - 0.5);
}

function drawCard(deck) { return deck.pop(); }

export default blackjack;

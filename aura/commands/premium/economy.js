// ================================================================
//  AURA BOT v2.0 — Economy Commands (Aura Credits)
// ================================================================
import * as economy from '../../../shared/systems/economy/economySystem.js';

/**
 * /credits — Main economy profile
 */
export const credits = {
  data: economy.balance.data,
  guildOnly: true,
  cooldown: 3000,
  async execute(client, interaction) {
    return economy.balance.execute(client, interaction);
  }
};

/**
 * /rep — Reputation system
 */
export const rep = {
  data: economy.rep.data,
  guildOnly: true,
  cooldown: 3000,
  async execute(client, interaction) {
    return economy.rep.execute(client, interaction);
  }
};

/**
 * /daily — Daily reward with streaks
 */
export const daily = {
  data: economy.daily.data,
  guildOnly: true,
  cooldown: 1000,
  async execute(client, interaction) {
    return economy.daily.execute(client, interaction);
  }
};

/**
 * /transfer — Peer-to-peer transfers with fees
 */
export const transfer = {
  data: economy.transfer.data,
  guildOnly: true,
  cooldown: 5000,
  async execute(client, interaction) {
    return economy.transfer.execute(client, interaction);
  }
};

/**
 * /work — Standard work command
 */
export const work = {
  data: economy.work.data,
  guildOnly: true,
  cooldown: 1000,
  async execute(client, interaction) {
    return economy.work.execute(client, interaction);
  }
};


/**
 * /richlist — Richest members
 */
export const richlist = {
  data: economy.richlist.data,
  guildOnly: true,
  cooldown: 10000,
  async execute(client, interaction) {
    return economy.richlist.execute(client, interaction);
  }
};

export default credits;

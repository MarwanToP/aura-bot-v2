// ================================================================
//  Shared permission gate for slash + prefix command dispatchers
//  Behavior is identical to the gate that previously lived only in
//  aura/events/interactionCreate.js. Lifted here so the prefix
//  dispatcher (messageCreate.js) can apply the same checks.
// ================================================================

/**
 * Check the userPermissions / botPermissions arrays declared on a command.
 * Returns `{ ok: true }` if no check applies, otherwise `{ ok: false, kind: 'user' | 'bot' }`.
 *
 * @param {object} command    Command module (slash or prefix).
 * @param {object} ctx        Context with `member`, `guild`, and `channel`.
 * @returns {{ ok: boolean, kind?: 'user' | 'bot' }}
 */
export function checkCommandPermissions(command, ctx) {
  if (!command || !ctx) return { ok: true };

  // User permissions
  if (command.userPermissions?.length && ctx.member) {
    const memberPerms = ctx.member.permissions;
    if (memberPerms && typeof memberPerms.has === 'function') {
      const missing = command.userPermissions.filter((p) => !memberPerms.has(p));
      if (missing.length) return { ok: false, kind: 'user' };
    }
  }

  // Bot permissions
  if (command.botPermissions?.length && ctx.guild) {
    const botMember = ctx.guild.members?.me;
    if (botMember && typeof botMember.permissionsIn === 'function' && ctx.channel) {
      const botPerms = botMember.permissionsIn(ctx.channel);
      const missingBot = command.botPermissions.filter((p) => !botPerms?.has?.(p));
      if (missingBot.length) return { ok: false, kind: 'bot' };
    }
  }

  return { ok: true };
}

// ================================================================
//  AURA BOT v2.0 — Smoke test: existing safe commands
// ================================================================
import { Collection } from 'discord.js';
import { loadCommands } from '../../../bot/core/commandHandler.js';
import database from '../../database/index.js';

const client = {
  commands: new Collection(),
  logger: { info:()=>{}, warn:()=>{}, error:(...a)=>console.log('  err',...a) },
  db: database,
  redis: { get:async()=>null, set:async()=>'OK', setex:async()=>'OK', del:async()=>0, getJSON:async()=>null, setJSON:async()=>'OK', duplicate:()=>({ on:()=>{} }), on:()=>{} },
  i18n:  { init:async()=>{}, t:(k)=>k, resolveLanguage:async()=>'en' },
  ai:    { isAvailable:()=>true, chat:async()=>({content:'mock'}), moderateContent:async()=>({violation:false}), translate:async(t)=>({content:t}), summarize:async()=>({content:'mock'}) },
  guilds:{ cache:new Collection() },
  user:  { id:'bot', tag:'Aura#0', displayAvatarURL:()=>'' },
};

await loadCommands(client);

function mockI(name, options = {}) {
  return {
    isChatInputCommand: () => true, isButton: () => false, isAutocomplete: () => false, isRepliable: () => true,
    commandName: name, user: { id:'1', username:'T', bot:false, tag:'T#1' },
    member: { permissions: { has: () => true }, roles: { cache: { has: () => true } } },
    guild: { id:'g1', name:'G', memberCount:1, channels:{cache:new Map()}, members:{me:{permissions:{has:()=>true}},cache:{get:()=>null}}, roles:{cache:{get:()=>null}} },
    guildId: 'g1', channelId: 'c1',
    channel: { isTextBased:()=>true, send:async()=>({}), sendTyping:async()=>{} },
    options: { getString:k=>options[k]??null, getInteger:k=>options[k]??null, getNumber:k=>options[k]??null, getBoolean:k=>options[k]??null, getUser:k=>options[k]??null, getChannel:k=>options[k]??null, getRole:k=>options[k]??null, getMentionable:k=>options[k]??null, getAttachment:k=>options[k]??null, getSubcommand:()=>options._subcommand||null, getSubcommandGroup:()=>options._subgroup||null },
    replied:false, deferred:false,
    reply: async (p) => { console.log(`    [${name}] ${p?.embeds?.[0]?.description?.slice(0,80) || p?.content || '(embed)'}`); },
    followUp: async () => {}, editReply: async () => {}, deferReply: async () => {}, update: async()=>{}, showModal: async()=>{}, respond: async()=>{},
    inGuild: () => true, locale:'en', guildLocale:'en',
  };
}

const SAFE = ['ping','aura','help','userinfo','serverinfo','roleinfo','avatar','rank','leaderboard','richlist','case','history','warnings','note','aimod','clan','aesthetic','modstaff'];

let pass = 0, fail = 0;
for (const name of SAFE) {
  const cmd = client.commands.get(name);
  if (!cmd) { console.log(`  ✗ ${name} — not registered`); fail++; continue; }
  try {
    await cmd.execute(client, mockI(name), 'en');
    pass++;
  } catch (err) {
    console.log(`  ✗ ${name} — ${err.message.split('\n')[0]}`);
    fail++;
  }
}
console.log(`\n${pass} pass, ${fail} fail (of ${SAFE.length} existing safe commands)`);
process.exit(fail > 0 ? 1 : 0);

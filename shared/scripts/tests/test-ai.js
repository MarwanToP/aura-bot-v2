// Live test of the AI service through the bot's actual code path
import 'dotenv/config';
import logger from '../../utils/logger.js';
import aiService from '../../systems/ai/aiService.js';

logger.info = (...a) => console.log(...a);
logger.warn = (...a) => console.warn(...a);
logger.error = (...a) => console.error(...a);
logger.debug = () => {};

await aiService.init();
console.log(`AI available: ${aiService.isAvailable()}`);

if (!aiService.isAvailable()) {
  console.error('AI not available, aborting test.');
  process.exit(1);
}

const tests = [
  { name: 'Simple Q&A (EN)',  fn: () => aiService.chat({ messages: [{ role: 'user', content: 'What is the capital of France? One short sentence.' }] }) },
  { name: 'Arabic Q&A',       fn: () => aiService.chat({ messages: [{ role: 'user', content: 'ما هي عاصمة السعودية؟' }] }) },
  { name: 'Moderation: toxic', fn: () => aiService.moderateContent('You are an idiot and your mom is trash') },
  { name: 'Moderation: clean', fn: () => aiService.moderateContent('Hello, how are you today?') },
  { name: 'Moderation: threat',fn: () => aiService.moderateContent('I will kill you tonight') },
  { name: 'Translate',        fn: () => aiService.translate('Good morning, friend', 'ar') },
  { name: 'Summarize',        fn: () => aiService.summarize('The quick brown fox jumps over the lazy dog. The dog barks at the fox. The fox runs away.') },
];

let pass = 0, fail = 0;
for (const t of tests) {
  try {
    const r = await t.fn();
    const text = r.content?.slice(0, 100) || JSON.stringify(r).slice(0, 100);
    console.log(`  ✓ ${t.name}: ${text}${text.length >= 100 ? '...' : ''}`);
    pass++;
  } catch (e) {
    console.error(`  ✗ ${t.name}: ${e.message.split('\n')[0]}`);
    fail++;
  }
}

console.log(`\nResults: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);


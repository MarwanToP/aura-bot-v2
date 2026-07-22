// Direct Cloudflare moderation test — shows raw response
import 'dotenv/config';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const token     = process.env.CLOUDFLARE_API_TOKEN;
const model     = '@cf/meta/llama-3.2-3b-instruct';

async function callCF(system, userMsg) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: userMsg },
        ],
        max_tokens: 200,
      }),
    }
  );
  const data = await res.json();
  console.log('Status:', res.status, '| success:', data.success);
  console.log('Raw response:', JSON.stringify(data, null, 2));
  return data;
}

console.log('--- Test A: Simple Q&A (sanity check) ---');
await callCF(null, 'Say "OK" and nothing else.');

console.log('\n--- Test B: Simple moderation (no JSON) ---');
await callCF('You are a moderator. Reply with only "SAFE" or "UNSAFE".',
  'Is "hello world" harassment?');

console.log('\n--- Test C: JSON moderation prompt ---');
await callCF('You output strict JSON only.',
  `Perform a quick check on this Discord message for: Hate speech, Harassment, NSFW, Threats, Spam, or Privacy violations.\n\nMessage: "you are an idiot"\n\nRespond ONLY in valid JSON format:\n{"violation": boolean, "category": string, "severity": "low|medium|high|critical", "confidence": number(0-100), "reason": string}`);

console.log('\n--- Test D: Direct toxic check ---');
await callCF('Output only JSON: {"violation":bool,"category":str,"severity":"low|medium|high|critical","confidence":0-100,"reason":str}',
  'Analyze: "I will kill you tonight"');

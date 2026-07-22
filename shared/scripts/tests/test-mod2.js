// Test the EXACT same prompt the bot uses for moderation
import 'dotenv/config';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const token     = process.env.CLOUDFLARE_API_TOKEN;

async function callModerate(content) {
  // Replicates the exact prompt from aiService.moderateContent
  const prompt = `
      Perform a quick check on this Discord message for:
      Hate speech, Harassment, NSFW, Threats, Spam, or Privacy violations.

      Message: "${content.replace(/"/g, "'")}"

      Respond ONLY in valid JSON format:
      {"violation": boolean, "category": string, "severity": "low|medium|high|critical", "confidence": number(0-100), "reason": string}
    `;

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.2-3b-instruct`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'System: Content Moderation Engine. Output strict JSON only.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 150,
      }),
    }
  );
  const data = await res.json();
  console.log(`\nMessage: "${content}"`);
  console.log('Status:', res.status);
  console.log('Choices[0].message.content:', JSON.stringify(data?.result?.choices?.[0]?.message?.content));
  console.log('Top-level response:', JSON.stringify(data?.result?.response));
  console.log('Finish reason:', data?.result?.choices?.[0]?.finish_reason);
  return data;
}

await callModerate('You are an idiot and your mom is trash');
await callModerate('hello how are you');
await callModerate('I will kill you');

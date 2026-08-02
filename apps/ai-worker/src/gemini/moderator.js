import { generateContentWithRetry } from './client.js';
import { sanitizePrompt } from './sanitizer.js';

/**
 * Analyzes a message payload using Gemini 1.5 Flash for neural moderation.
 */
export async function analyzeContent(messageText, authorId, guildId) {
  const sanitized = sanitizePrompt(messageText);

  const prompt = `You are the Neural Moderation Engine for Aura Bot v2.
Analyze the following user input and return STRICT JSON with NO markdown formatting:

{
  "flagged": boolean,
  "category": "none" | "toxicity" | "spam" | "phishing" | "harassment",
  "severityScore": number (0 to 100),
  "reason": "short explanation",
  "recommendedAction": "none" | "warn" | "delete" | "timeout" | "ban"
}

${sanitized}`;

  try {
    const rawResponse = await generateContentWithRetry(prompt);
    // Clean potential markdown code blocks from response
    const cleanedJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanedJson);

    return {
      success: true,
      data: result,
      authorId,
      guildId,
    };
  } catch (error) {
    console.error('❌ Neural Moderation Analysis failed:', error.message);
    return {
      success: false,
      error: 'Failed to process content through Neural Moderation Engine',
      authorId,
      guildId,
    };
  }
}

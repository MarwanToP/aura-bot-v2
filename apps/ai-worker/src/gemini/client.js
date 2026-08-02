import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { env } from '../../../../packages/config/src/env.js';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || 'dummy_key_if_missing');

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
  generationConfig: {
    temperature: 0.2, // Low temperature for deterministic JSON output
    topP: 0.8,
    maxOutputTokens: 1024,
  },
});

/**
 * Executes a Gemini 1.5 Flash prompt with exponential backoff retry.
 */
export async function generateContentWithRetry(prompt, retries = 3, delay = 1000) {
  let currentDelay = delay;
  for (let i = 0; i < retries; i++) {
    try {
      const result = await geminiModel.generateContent(prompt);
      return await result.response.text();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.warn(`⚠️ Gemini API call failed (attempt ${i + 1}/${retries}). Retrying in ${currentDelay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      currentDelay *= 2;
    }
  }
}

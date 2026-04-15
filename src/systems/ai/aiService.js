// ================================================================
//  AURA BOT v2.0 — AI Service (Google Gemini)
//  All AI features powered by Gemini 2.5 Flash
// ================================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import config    from '../../../config/config.js';
import logger    from '../../utils/logger.js';

class AIService {
  constructor() {
    this.gemini   = null;
    this.model    = null;
    this.enabled  = process.env.AI_ENABLED !== 'false';
  }

  async init() {
    if (!this.enabled) { logger.info('[AI] Disabled via env'); return; }

    if (!process.env.GEMINI_API_KEY) {
      logger.warn('[AI] No GEMINI_API_KEY set — AI features disabled');
      this.enabled = false;
      return;
    }

    try {
      this.gemini  = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model   = process.env.AI_CHAT_MODEL || 'gemini-2.5-flash';
      this.modModel = process.env.AI_MOD_MODEL || 'gemini-2.5-flash';
      logger.info(`[AI] Gemini initialized ✓ (model: ${this.model})`);
    } catch (err) {
      logger.error('[AI] Gemini init failed:', err.message);
      this.enabled = false;
    }
  }

  // ── Check if AI is available ────────────────────────────────
  isAvailable() { return this.enabled && !!this.gemini; }

  // ── Internal helper: call Gemini ────────────────────────────
  async _generate(prompt, { system, modelName, maxTokens = 1000 } = {}) {
    if (!this.isAvailable()) throw new Error('AI not configured');

    const mdl = modelName || this.model;
    const sysPrompt = system || config.ai.systemPrompt;

    const genModel = this.gemini.getGenerativeModel({
      model: mdl,
      systemInstruction: sysPrompt,
      generationConfig: { maxOutputTokens: maxTokens },
    });

    const result = await genModel.generateContent(prompt);
    return result.response.text();
  }

  // ── Chat Completion (multi-turn) ────────────────────────────
  async chat({ messages, system, model, maxTokens = 1000 }) {
    if (!this.isAvailable()) throw new Error('AI not configured');

    const sysPrompt  = system || config.ai.systemPrompt;
    const modelName  = model  || this.model;

    try {
      const genModel = this.gemini.getGenerativeModel({
        model: modelName,
        systemInstruction: sysPrompt,
        generationConfig: { maxOutputTokens: maxTokens },
      });

      if (messages.length === 1) {
        const result = await genModel.generateContent(messages[0].content);
        return { content: result.response.text(), provider: 'gemini' };
      }

      // Multi-turn: map history (all but last message)
      const history = messages.slice(0, -1).map(m => ({
        role:  m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const chat   = genModel.startChat({ history });
      const result = await chat.sendMessage(messages[messages.length - 1].content);
      return { content: result.response.text(), provider: 'gemini' };

    } catch (err) {
      logger.error('[AI] chat error:', err.message);
      throw err;
    }
  }

  // ── Single Prompt ────────────────────────────────────────────
  async prompt(text, { system, model, maxTokens = 800 } = {}) {
    return this.chat({ messages: [{ role: 'user', content: text }], system, model, maxTokens });
  }

  // ── AI Moderation (Gemini-based) ─────────────────────────────
  async moderateContent(content, options = {}) {
    if (!this.isAvailable()) return { violation: false, confidence: 0, source: 'disabled' };

    const depth = options?.context || 'quick';
    const isDeep = depth === 'deep';

    const moderationPrompt = isDeep
      ? `You are an expert content moderation AI. Perform a DEEP analysis of this Discord message for ALL of the following violations:
1. Hate speech, racism, or discrimination
2. Harassment, bullying, or personal attacks
3. Spam, scams, or excessive self-promotion
4. NSFW, sexual, or explicit content
5. Threats, violence, or dangerous behavior
6. Doxxing or privacy violations
7. Phishing links or malware
8. Misinformation or manipulation

Analyze the tone, intent, and context carefully.
Respond ONLY with valid JSON:
{"violation": true/false, "category": "hate|harassment|spam|nsfw|threats|doxxing|phishing|clean", "severity": "low|medium|high|critical", "confidence": 0-100, "reason": "detailed explanation"}

Message: "${content.replace(/"/g, "'")}"`
      : `You are a content moderation AI. Quickly check this message for obvious violations.
Respond ONLY with valid JSON:
{"violation": true/false, "category": "hate|spam|nsfw|threats|clean", "severity": "low|medium|high|critical", "confidence": 0-100, "reason": "brief reason"}

Message: "${content.replace(/"/g, "'")}"`;

    try {
      const genModel = this.gemini.getGenerativeModel({
        model: this.modModel,
        systemInstruction: 'You are a content moderation system. Always respond with valid JSON only. No markdown, no explanation, just the JSON object.',
        generationConfig: { maxOutputTokens: isDeep ? 300 : 150 },
      });

      const result = await genModel.generateContent(moderationPrompt);
      const raw = result.response.text();

      // Robust JSON extraction — handle markdown code blocks and extra text
      let jsonStr = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      
      // Try to extract JSON object if there's extra text around it
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];

      const parsed = JSON.parse(jsonStr);
      return {
        violation:  Boolean(parsed.violation),
        category:   parsed.category || 'clean',
        severity:   parsed.severity || 'low',
        confidence: parseInt(parsed.confidence) || 0,
        reason:     parsed.reason || 'No details provided',
        source:     `gemini_${depth}`,
      };
    } catch (err) {
      logger.warn('[AI] moderateContent error:', err.message);
      return { violation: false, confidence: 0, category: 'error', severity: 'low', reason: err.message, source: 'error' };
    }
  }

  _scoreToSeverity(score) {
    if (score >= 0.9) return 'critical';
    if (score >= 0.7) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }

  // ── Generate Image (not available on free Gemini key) ────────
  async generateImage(prompt) {
    throw new Error('Image generation requires a paid Gemini API plan.');
  }

  // ── Conversation Context Manager ────────────────────────────
  async getContext(redis, userId, guildId) {
    const key  = `ai:ctx:${guildId}:${userId}`;
    const data = await redis.getJSON(key);
    return data?.messages || [];
  }

  async saveContext(redis, userId, guildId, messages) {
    const key     = `ai:ctx:${guildId}:${userId}`;
    const trimmed = messages.slice(-config.ai.maxHistory);
    await redis.setJSON(key, { messages: trimmed }, config.cache.aiContextTTL);
  }

  async clearContext(redis, userId, guildId) {
    await redis.del(`ai:ctx:${guildId}:${userId}`);
  }

  // ── Check daily AI usage ─────────────────────────────────────
  async checkUsage(redis, userId, isPremium) {
    const key   = `ai:usage:${userId}:${new Date().toDateString()}`;
    const usage = parseInt(await redis.get(key) || '0');
    const limit = isPremium ? config.limits.premium.aiRequests : config.limits.free.aiRequests;
    return { usage, limit, exceeded: usage >= limit };
  }

  async incrementUsage(redis, userId) {
    const key = `ai:usage:${userId}:${new Date().toDateString()}`;
    await redis.incr(key);
    await redis.expire(key, 86400);
  }

  // ── Summarize Text ───────────────────────────────────────────
  async summarize(text, { language = 'en', maxWords = 150 } = {}) {
    const langInstr = language === 'ar' ? 'Respond in Arabic.' : 'Respond in English.';
    return this.prompt(
      `Summarize the following in ${maxWords} words or less. ${langInstr}\n\n${text}`,
      { maxTokens: 300 }
    );
  }

  // ── Translate ────────────────────────────────────────────────
  async translate(text, targetLang = 'ar') {
    const langNames = {
      ar: 'Arabic (Modern Standard)', en: 'English', fr: 'French',
      de: 'German', es: 'Spanish', ja: 'Japanese', zh: 'Chinese',
      ru: 'Russian', tr: 'Turkish', id: 'Indonesian',
    };
    return this.prompt(
      `Translate the following text to ${langNames[targetLang] || targetLang}. Provide only the translation, no explanations.\n\n${text}`,
      { maxTokens: 500 }
    );
  }

  // ── Search & Summarize ───────────────────────────────────────
  async searchSummary(query, searchResults) {
    return this.prompt(
      `Based on these search results, provide a helpful summary answering: "${query}"\n\nResults:\n${searchResults}`,
      { maxTokens: 600 }
    );
  }

  // ── Generate Poll Options ────────────────────────────────────
  async generatePollOptions(topic, count = 4) {
    const res = await this.prompt(
      `Generate ${count} poll answer options for this topic: "${topic}". Return as JSON array of strings only. No explanations.`,
      { maxTokens: 200 }
    );
    try { return JSON.parse(res.content.replace(/```json|```/g, '').trim()); }
    catch { return []; }
  }

  // ── Generate Welcome Message ─────────────────────────────────
  async generateWelcomeMessage(username, guildName, lang = 'en') {
    const langInstr = lang === 'ar' ? 'Write in Arabic.' : 'Write in English.';
    const res = await this.prompt(
      `Write a warm, friendly welcome message for "${username}" joining "${guildName}" Discord server. Keep it under 3 sentences. Be enthusiastic and welcoming. ${langInstr}`,
      { maxTokens: 150 }
    );
    return res.content;
  }

  // ── Analyze Server Stats ─────────────────────────────────────
  async analyzeServerStats(stats) {
    const res = await this.prompt(
      `Analyze these Discord server statistics and provide 3 actionable insights for server growth:\n${JSON.stringify(stats, null, 2)}`,
      { maxTokens: 400 }
    );
    return res.content;
  }

  // ── Generate Custom Command Response ─────────────────────────
  async generateCommandResponse(trigger, context) {
    return this.prompt(
      `A Discord user triggered a command with: "${trigger}". Server context: ${context}. Provide a helpful, engaging response under 200 characters.`,
      { maxTokens: 200 }
    );
  }
}

export default new AIService();

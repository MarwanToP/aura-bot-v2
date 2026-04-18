// ================================================================
//  AURA BOT v2.0 — AI Service (Google Gemini)
//  All AI features powered by Gemini 1.5 Flash
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

  /**
   * Initialize the Google Gemini client
   */
  async init() {
    if (!this.enabled) { 
      logger.info('[AI] Dashboard/Bot AI features are disabled via configuration.');
      return; 
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.warn('[AI] GEMINI_API_KEY is missing. Disabling AI features.');
      this.enabled = false;
      return;
    }

    try {
      this.gemini   = new GoogleGenerativeAI(apiKey);
      this.model    = process.env.AI_CHAT_MODEL || 'gemini-1.5-flash';
      this.modModel = process.env.AI_MOD_MODEL  || 'gemini-1.5-flash';
      logger.info(`[AI] Gemini successfully initialized (Model: ${this.model}) ✓`);
    } catch (err) {
      logger.error(`[AI] Gemini initialization failed: ${err.message}`);
      this.enabled = false;
    }
  }

  isAvailable() { 
    return this.enabled && !!this.gemini; 
  }

  /**
   * Standard Chat Completion (Multi-turn Support)
   */
  async chat({ messages, system, model, maxTokens = 1000 }) {
    if (!this.isAvailable()) throw new Error('AI Service is not configured or available.');

    const sysInstruction = system || config.ai.systemPrompt;
    const modelName      = model  || this.model;

    try {
      const genModel = this.gemini.getGenerativeModel({
        model: modelName,
        systemInstruction: sysInstruction,
        generationConfig: { maxOutputTokens: maxTokens },
      });

      // optimization: simple prompt for single message
      if (messages.length === 1) {
        const result = await genModel.generateContent(messages[0].content);
        return { content: result.response.text(), provider: 'gemini' };
      }

      // Handle Gemini's specific history format
      const history = messages.slice(0, -1).map(m => ({
        role:  m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const chatInstance = genModel.startChat({ history });
      const result       = await chatInstance.sendMessage(messages[messages.length - 1].content);
      
      return { content: result.response.text(), provider: 'gemini' };
    } catch (err) {
      logger.error(`[AI] Chat generation failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Simple one-off prompt wrapper
   */
  async prompt(text, options = {}) {
    return this.chat({ 
      messages: [{ role: 'user', content: text }], 
      ...options 
    });
  }

  /**
   * AI-Powered Moderation Analyze
   * Uses Gemini to check for violations based on context depth
   */
  async moderateContent(content, options = {}) {
    if (!this.isAvailable()) return { violation: false, confidence: 0, source: 'disabled' };

    const isDeep = options?.context === 'deep';
    const complexity = isDeep ? 'DEEP analysis' : 'quick check';

    const moderationPrompt = `
      Perform a ${complexity} on this Discord message for: 
      Hate speech, Harassment, NSFW, Threats, Spam, or Privacy violations.
      
      Message: "${content.replace(/"/g, "'")}"
      
      Respond ONLY in valid JSON format:
      {"violation": boolean, "category": string, "severity": "low|medium|high|critical", "confidence": number(0-100), "reason": string}
    `;

    try {
      const genModel = this.gemini.getGenerativeModel({
        model: this.modModel,
        systemInstruction: 'System: Content Moderation Engine. Output strict JSON only.',
        generationConfig: { maxOutputTokens: isDeep ? 300 : 150 },
      });

      const result = await genModel.generateContent(moderationPrompt);
      const parsed = this._parseJSON(result.response.text());

      return {
        violation:  !!parsed.violation,
        category:   parsed.category   || 'clean',
        severity:   parsed.severity   || 'low',
        confidence: parsed.confidence || 0,
        reason:     parsed.reason     || 'Analysis completed.',
        source:     `gemini_mod_${isDeep ? 'deep' : 'standard'}`,
      };
    } catch (err) {
      logger.warn(`[AI] Moderation analysis failed: ${err.message}`);
      return { violation: false, confidence: 0, category: 'error', reason: 'Internal error', source: 'system_error' };
    }
  }

  /**
   * Reliable JSON parsing from AI responses
   */
  _parseJSON(text) {
    try {
      // Clean markdown code blocks if present
      const cleaned = text.replace(/```json\s?|```\s?/gi, '').trim();
      const match   = cleaned.match(/\{[\s\S]*\}/);
      return JSON.parse(match ? match[0] : cleaned);
    } catch (err) {
      throw new Error(`Failed to parse AI JSON response: ${err.message}`);
    }
  }

  // ── Usage & Context Management ──────────────────────────────
  
  async checkUsage(redis, userId, isPremium) {
    const key   = `ai:usage:${userId}:${new Date().toDateString()}`;
    const usage = parseInt(await redis.get(key) || '0');
    const limit = isPremium ? config.limits.premium.aiRequests : config.limits.free.aiRequests;
    return { usage, limit, exceeded: usage >= limit };
  }

  async incrementUsage(redis, userId) {
    const key = `ai:usage:${userId}:${new Date().toDateString()}`;
    await redis.incr(key);
    await redis.expire(key, 86400); // 24h reset
  }

  async getContext(redis, userId, guildId) {
    const key  = `ai:ctx:${guildId}:${userId}`;
    const data = await redis.getJSON(key);
    return data?.messages || [];
  }

  async saveContext(redis, userId, guildId, messages) {
    const key      = `ai:ctx:${guildId}:${userId}`;
    const historical = messages.slice(-(config.ai?.maxHistory || 10));
    await redis.setJSON(key, { messages: historical }, config.cache?.aiContextTTL || 3600);
  }

  // ── High-level Utilities ─────────────────────────────────────

  async summarize(text, { language = 'en', maxWords = 150 } = {}) {
    return this.prompt(
      `Summarize the following in ${maxWords} words or less (Language: ${language}):\n\n${text}`,
      { maxTokens: 300 }
    );
  }

  async translate(text, targetLang = 'ar') {
    return this.prompt(
      `Translate to ${targetLang}. Only return the translation:\n\n${text}`,
      { maxTokens: 500 }
    );
  }

  async generatePollOptions(topic, count = 4) {
    const res = await this.prompt(
      `Generate ${count} poll options for topic: "${topic}". Response format: ["option1", "option2"].`,
      { maxTokens: 200 }
    );
    try { return this._parseJSON(res.content); } catch { return []; }
  }

  async generateWelcomeMessage(username, guildName, lang = 'en') {
    const res = await this.prompt(
      `Write a warm welcome for "${username}" joining "${guildName}". Keep it short and friendly. Language: ${lang}.`,
      { maxTokens: 150 }
    );
    return res.content;
  }
}

export default new AIService();

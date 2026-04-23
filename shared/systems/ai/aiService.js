// ================================================================
//  AURA BOT v2.0 — AI Service (Multi-Provider)
//  Providers: Google Gemini + Cloudflare Workers AI (+ OpenAI image)
// ================================================================
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import config    from '../../config/config.js';
import logger    from '../../utils/logger.js';

class AIService {
  constructor() {
    this.gemini   = null;
    this.model    = process.env.AI_CHAT_MODEL || 'gemini-1.5-flash';
    this.modModel = process.env.AI_MOD_MODEL  || 'gemini-1.5-flash';
    this.enabled  = process.env.AI_ENABLED !== 'false';
    this.openai   = null;
    this.cloudflare = {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      apiToken:  process.env.CLOUDFLARE_API_TOKEN,
      gatewayId: process.env.CLOUDFLARE_GATEWAY_ID,
      model:     process.env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct'
    };
  }

  /**
   * Initialize the Google Gemini client
   */
  async init() {
    if (!this.enabled) { 
      logger.info('[AI] Dashboard/Bot AI features are disabled via configuration.');
      return; 
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      try {
        this.gemini = new GoogleGenerativeAI(geminiApiKey);
        logger.info(`[AI] Gemini successfully initialized (Model: ${this.model}) ✓`);
      } catch (err) {
        logger.error(`[AI] Gemini initialization failed: ${err.message}`);
      }
    } else {
      logger.warn('[AI] GEMINI_API_KEY is missing. Gemini provider unavailable.');
    }

    if (this._hasCloudflare()) {
      const gatewaySuffix = this.cloudflare.gatewayId ? ` via Gateway ${this.cloudflare.gatewayId}` : '';
      logger.info(`[AI] Cloudflare Workers AI initialized (Model: ${this.cloudflare.model}${gatewaySuffix}) ✓`);
    } else if ((process.env.AI_PROVIDER || '').toLowerCase() === 'cloudflare') {
      logger.warn('[AI] AI_PROVIDER=cloudflare but CLOUDFLARE_ACCOUNT_ID/CLOUDFLARE_API_TOKEN are missing.');
    }

    if (!this._hasAnyChatProvider()) {
      logger.warn('[AI] No chat provider configured. Set GEMINI_API_KEY or Cloudflare credentials.');
      this.enabled = false;
    }
  }

  isAvailable() { 
    return this.enabled && this._hasAnyChatProvider(); 
  }

  /**
   * Standard Chat Completion (Multi-turn Support)
   */
  async chat({ messages, system, model, maxTokens = 1000 }) {
    const sysInstruction = system || config.ai.systemPrompt;
    const modelName      = model  || this.model;
    const provider       = this._resolveChatProvider(modelName);

    if (!provider) {
      throw new Error('No AI chat provider available. Configure GEMINI_API_KEY or Cloudflare credentials.');
    }

    if (provider === 'cloudflare') {
      const cloudflareModel = modelName && modelName.startsWith('@cf/')
        ? modelName
        : this.cloudflare.model;

      return this._chatCloudflare({
        messages,
        system: sysInstruction,
        model: cloudflareModel,
        maxTokens,
      });
    }

    try {
      const genModel = this.gemini.getGenerativeModel({
        model: modelName,
        systemInstruction: sysInstruction,
        generationConfig: { maxOutputTokens: maxTokens },
      });

      // optimization: simple prompt for single message
      if (messages.length === 1) {
        const result = await genModel.generateContent(messages[0].content);
        try {
           return { content: result.response.text(), provider: 'gemini' };
        } catch (e) {
           return { content: "⚠️ The AI core refused to generate a response for this request (Safety Filter).", provider: 'gemini' };
        }
      }

      // Handle Gemini's specific history format
      const history = messages.slice(0, -1).map(m => ({
        role:  m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const chatInstance = genModel.startChat({ history });
      const result       = await chatInstance.sendMessage(messages[messages.length - 1].content);
      
      try {
         return { content: result.response.text(), provider: 'gemini' };
      } catch (e) {
         return { content: "⚠️ The AI conversation was interrupted by safety filters.", provider: 'gemini' };
      }
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
      const result = await this.prompt(moderationPrompt, {
        model: this.modModel,
        maxTokens: isDeep ? 300 : 150,
        system: 'System: Content Moderation Engine. Output strict JSON only.',
      });

      const parsed = this._parseJSON(result.content);

      return {
        violation:  !!parsed.violation,
        category:   parsed.category   || 'clean',
        severity:   parsed.severity   || 'low',
        confidence: parsed.confidence || 0,
        reason:     parsed.reason     || 'Analysis completed.',
        source:     `${result.provider || 'ai'}_mod_${isDeep ? 'deep' : 'standard'}`,
      };
    } catch (err) {
      logger.warn(`[AI] Moderation analysis failed: ${err.message}`);
      return { violation: false, confidence: 0, category: 'error', reason: 'Internal error', source: 'system_error' };
    }
  }

  async _chatCloudflare({ messages, system, model, maxTokens = 1000 }) {
    const accountId = this.cloudflare.accountId;
    const apiToken  = this.cloudflare.apiToken;
    const modelName = model || this.cloudflare.model;

    if (!accountId || !apiToken) {
      throw new Error('Cloudflare AI is not configured. Missing ACCOUNT_ID or API_TOKEN.');
    }

    try {
      const endpoint = this.cloudflare.gatewayId
        ? `https://gateway.ai.cloudflare.com/v1/${accountId}/${this.cloudflare.gatewayId}/workers-ai/${modelName}`
        : `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${modelName}`;

      const payload = {
        messages: this._normalizeCloudflareMessages(messages, system),
        max_tokens: maxTokens,
      };

      const res = await fetch(
        endpoint,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = data?.errors?.[0]?.message || data?.error || `Cloudflare AI HTTP ${res.status}`;
        throw new Error(message);
      }

      if (typeof data?.success === 'boolean' && !data.success) {
        throw new Error(data?.errors?.[0]?.message || 'Cloudflare AI request failed');
      }

      const content = this._extractCloudflareContent(data);
      if (!content) {
        throw new Error('Cloudflare AI returned no text response.');
      }

      return { 
        content,
        provider: 'cloudflare' 
      };
    } catch (err) {
      logger.error(`[AI] Cloudflare AI call failed: ${err.message}`);
      throw err;
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

  _hasGemini() {
    return !!this.gemini;
  }

  _hasCloudflare() {
    return !!(this.cloudflare.accountId && this.cloudflare.apiToken);
  }

  _hasAnyChatProvider() {
    return this._hasGemini() || this._hasCloudflare();
  }

  _resolveChatProvider(modelName = '') {
    const provider = String(process.env.AI_PROVIDER || 'gemini').toLowerCase();
    const model = String(modelName || '');

    if (model.startsWith('@cf/')) {
      if (this._hasCloudflare()) return 'cloudflare';
      if (this._hasGemini()) return 'gemini';
      return null;
    }

    if (provider === 'cloudflare') {
      if (this._hasCloudflare()) return 'cloudflare';
      if (this._hasGemini()) return 'gemini';
      return null;
    }

    if (this._hasGemini()) return 'gemini';
    if (this._hasCloudflare()) return 'cloudflare';
    return null;
  }

  _normalizeCloudflareMessages(messages = [], system = '') {
    const normalized = [];

    if (typeof system === 'string' && system.trim()) {
      normalized.push({ role: 'system', content: system.trim() });
    }

    for (const message of messages) {
      const content = String(message?.content || '').trim();
      if (!content) continue;

      const role = message?.role === 'assistant' || message?.role === 'system'
        ? message.role
        : 'user';

      normalized.push({ role, content });
    }

    return normalized;
  }

  _extractCloudflareContent(payload) {
    const result = payload?.result ?? payload ?? {};

    if (typeof result.response === 'string' && result.response.trim()) {
      return result.response.trim();
    }

    if (typeof result.output_text === 'string' && result.output_text.trim()) {
      return result.output_text.trim();
    }

    if (typeof result.text === 'string' && result.text.trim()) {
      return result.text.trim();
    }

    const messages = Array.isArray(result.messages) ? result.messages : [];
    const assistant = [...messages].reverse().find((message) => message?.role === 'assistant');
    if (!assistant) return '';

    if (typeof assistant.content === 'string') {
      return assistant.content.trim();
    }

    if (Array.isArray(assistant.content)) {
      return assistant.content
        .map((part) => {
          if (typeof part === 'string') return part;
          if (typeof part?.text === 'string') return part.text;
          return '';
        })
        .join(' ')
        .trim();
    }

    return '';
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

  async clearContext(redis, userId, guildId) {
    const key = `ai:ctx:${guildId}:${userId}`;
    await redis.del(key);
  }

  async generateResponse(text, system = '') {
    return this.prompt(text, system ? { system } : {});
  }

  _getOpenAI() {
    if (this.openai) return this.openai;
    if (!process.env.OPENAI_API_KEY) return null;
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return this.openai;
  }

  async generateImage(prompt, { size = '1024x1024', style = 'vivid' } = {}) {
    const ai = this._getOpenAI();
    if (!ai) {
      throw new Error('Image generation requires OPENAI_API_KEY.');
    }

    const response = await ai.images.generate({
      model: process.env.AI_IMAGE_MODEL || 'dall-e-3',
      prompt,
      size,
      style,
    });

    const image = response?.data?.[0];
    if (!image?.url) {
      throw new Error('Image provider returned no URL.');
    }

    return {
      url: image.url,
      revisedPrompt: image.revised_prompt || prompt,
      provider: 'openai',
    };
  }

  // ── High-level Utilities ─────────────────────────────────────

  /**
   * AI-Driven Permission Suggestion
   */
  async suggestPermissions(roleName, currentPermissions = [], rolePurpose = 'None') {
    if (!this.isAvailable()) return { suggestions: [], rationale: 'AI Service disabled.' };

    const prompt = `
      Analyze a Discord role and suggest the most appropriate permissions.
      Role Name: "${roleName}"
      Role Purpose: "${rolePurpose}"
      Current Permissions: ${JSON.stringify(currentPermissions)}

      Consider: 
      1. Role names like "Admin", "Staff", "Mod" should have management permissions.
      2. Role names like "Vip", "Premium", "Member" should have basic but enhanced permissions.
      3. Global Context: This is a professional-grade bot for Discord servers.
      4. Security: Do not suggest dangerous permissions (Administrator, Manage Guild) unless the name strongly implies high trust like "Founder" or "Owner".

      Respond ONLY in valid JSON format:
      {
        "suggestions": ["PERMISSION_NAME", ...],
        "rationale": "Briefly explain why these were suggested in one or two sentences.",
        "dangerZone": boolean
      }

      Permission Names must be valid Discord.js PermissionFlagsBits keys (e.g., ManageChannels, KickMembers).
    `;

    try {
      const result = await this.prompt(prompt, { maxTokens: 500 });
      return this._parseJSON(result.content);
    } catch (err) {
      logger.error(`[AI] Permission suggestion failed: ${err.message}`);
      return { suggestions: [], rationale: 'Internal AI error.', dangerZone: false };
    }
  }

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

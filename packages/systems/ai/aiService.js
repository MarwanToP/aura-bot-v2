// ================================================================
//  AURA BOT v2.0 — AI Service (Multi-Provider)
//  Providers: Google Gemini + Cloudflare Workers AI (+ OpenAI image)
// ================================================================
import { GoogleGenerativeAI } from '@google/generative-ai';
import config    from '../../config/index.js';
import logger    from '../../utils/logger.js';

// The only `style` values the OpenAI images API accepts (dall-e-3).
// Any other value makes the API reject the entire request.
const OPENAI_IMAGE_STYLES = new Set(['vivid', 'natural']);

class AIService {
  constructor() {
    this.gemini   = null;
    const envChatModel = process.env.AI_CHAT_MODEL;
    // A Cloudflare model id (e.g. '@cf/meta/llama-3.2-3b-instruct') is not a valid
    // Gemini model, so keep the two provider namespaces separate.
    this.model       = envChatModel || 'gemini-1.5-flash';
    this.geminiModel = process.env.AI_GEMINI_MODEL
      || (typeof envChatModel === 'string' && !envChatModel.startsWith('@cf/') ? envChatModel : 'gemini-1.5-flash');
    this.modModel    = process.env.AI_MOD_MODEL || this.geminiModel;
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
        logger.info(`[AI] Gemini successfully initialized (Model: ${this.geminiModel}) ✓`);
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
   * The chat provider that would be used for a request right now
   * ('gemini' | 'cloudflare'), or null when no provider is configured.
   *
   * Read-only and never throws: the health probe (/doctor) reads it to report
   * the active provider. Resolving it here keeps a single source of truth
   * with _resolveChatProvider() — the chat/mod request path is untouched.
   */
  get provider() {
    try {
      return this._resolveChatProvider(this.model) || null;
    } catch {
      return null;
    }
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
      const geminiModelName = typeof modelName === 'string' && modelName.startsWith('@cf/')
        ? this.geminiModel
        : modelName;
      const genModel = this.gemini.getGenerativeModel({
        model: geminiModelName,
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
          signal: AbortSignal.timeout(15000),
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

  /**
   * Resolve the optional OpenAI SDK.
   *
   * The `openai` package is an OPTIONAL dependency — it is not installed by
   * default (and is not declared in packages/systems/package.json), so the
   * dynamic import below can fail with ERR_MODULE_NOT_FOUND. That failure
   * must never be reported as a missing API key: the two problems need
   * completely different fixes (install the package vs. set a key).
   *
   * @returns {Promise<{ ok: true, client: object }
   *                  | { ok: false, reason: 'module-missing' | 'no-key' | 'init-failed' }>}
   */
  async _resolveOpenAI() {
    if (this.openai) return { ok: true, client: this.openai };

    let OpenAI;
    try {
      ({ default: OpenAI } = await import('openai'));
    } catch {
      // The optional dependency is not installed — this is NOT a key problem.
      return { ok: false, reason: 'module-missing' };
    }

    if (!process.env.OPENAI_API_KEY) return { ok: false, reason: 'no-key' };

    try {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      return { ok: true, client: this.openai };
    } catch {
      return { ok: false, reason: 'init-failed' };
    }
  }

  /** @returns {Promise<object|null>} the OpenAI client, or null when unusable. */
  async _getOpenAI() {
    const resolved = await this._resolveOpenAI();
    return resolved.ok ? resolved.client : null;
  }

  async generateImage(prompt, { size = '1024x1024', style = 'vivid' } = {}) {
    const resolved = await this._resolveOpenAI();
    if (!resolved.ok) {
      // Honest, actionable error per failure mode — never blame the API key
      // for a missing optional dependency.
      if (resolved.reason === 'no-key') {
        throw new Error('Image generation requires OPENAI_API_KEY to be set.');
      }
      if (resolved.reason === 'init-failed') {
        throw new Error('Image generation is unavailable: the OpenAI client could not be initialized.');
      }
      throw new Error(
        "Image generation is unavailable: the optional 'openai' package is not installed " +
        '(run `npm install openai` inside packages/systems to enable it).',
      );
    }

    const ai = resolved.client;

    const model = process.env.AI_IMAGE_MODEL || 'dall-e-3';
    const request = { model, prompt, size };

    // `style` is only accepted by dall-e-3 and only with the values
    // "vivid" / "natural" — any other value (or a model that does not
    // support the option at all) makes the API reject the whole request.
    // An unsupported style is therefore dropped instead of being sent.
    const normalizedStyle = typeof style === 'string' ? style.trim().toLowerCase() : '';
    if (model === 'dall-e-3' && OPENAI_IMAGE_STYLES.has(normalizedStyle)) {
      request.style = normalizedStyle;
    }

    const response = await ai.images.generate(request);

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

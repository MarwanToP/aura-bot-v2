// ================================================================
//  AURA BOT v2.0 — AI Service
//  Supports: OpenAI (GPT-4o) + Anthropic (Claude)
//  Features: Chat, Moderation, Image Gen, Search Summaries
// ================================================================

import OpenAI    from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import config    from '../../../config/config.js';
import logger    from '../../utils/logger.js';

class AIService {
  constructor() {
    this.openai    = null;
    this.anthropic = null;
    this.provider  = process.env.AI_PROVIDER || 'openai';
    this.enabled   = process.env.AI_ENABLED !== 'false';
  }

  async init() {
    if (!this.enabled) { logger.info('[AI] Disabled via env'); return; }

    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      logger.info('[AI] OpenAI initialized ✓');
    }

    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      logger.info('[AI] Anthropic Claude initialized ✓');
    }

    if (!this.openai && !this.anthropic) {
      logger.warn('[AI] No AI provider configured — AI features disabled');
      this.enabled = false;
    }
  }

  // ── Check if AI is available ────────────────────────────────
  isAvailable() { return this.enabled && (!!this.openai || !!this.anthropic); }

  // ── Chat Completion ─────────────────────────────────────────
  async chat({ messages, system, model, maxTokens = 1000, userId, guildId }) {
    if (!this.isAvailable()) throw new Error('AI not configured');

    const sysPrompt = system || config.ai.systemPrompt;
    const mdl       = model  || config.ai.chatModel;

    try {
      if (this.provider === 'anthropic' && this.anthropic) {
        const res = await this.anthropic.messages.create({
          model:      'claude-sonnet-4-20250514',
          max_tokens: maxTokens,
          system:     sysPrompt,
          messages:   messages.map(m => ({ role: m.role, content: m.content })),
        });
        return { content: res.content[0].text, provider: 'anthropic', tokens: res.usage };
      }

      if (this.openai) {
        const res = await this.openai.chat.completions.create({
          model:      mdl,
          max_tokens: maxTokens,
          messages:   [{ role: 'system', content: sysPrompt }, ...messages],
        });
        return { content: res.choices[0].message.content, provider: 'openai', tokens: res.usage };
      }

    } catch (err) {
      logger.error('[AI] chat error:', err.message);
      throw err;
    }
  }

  // ── Single Prompt ────────────────────────────────────────────
  async prompt(text, { system, model, maxTokens = 800 } = {}) {
    return this.chat({ messages: [{ role: 'user', content: text }], system, model, maxTokens });
  }

  // ── AI Moderation ────────────────────────────────────────────
  async moderateContent(content, { context = '' } = {}) {
    if (!this.isAvailable()) return { violation: false, confidence: 0 };

    try {
      // First use OpenAI's built-in moderation (free & fast)
      if (this.openai) {
        const modRes = await this.openai.moderations.create({ input: content });
        const result = modRes.results[0];

        if (result.flagged) {
          const categories = Object.entries(result.categories)
            .filter(([, v]) => v)
            .map(([k]) => k);

          return {
            violation: true,
            category:  categories[0] || 'policy_violation',
            severity:  result.category_scores ? this._scoreToSeverity(Math.max(...Object.values(result.category_scores))) : 'medium',
            reason:    `Flagged by content policy: ${categories.join(', ')}`,
            confidence: Math.round(Math.max(...Object.values(result.category_scores || {})) * 100),
            source:    'openai_moderation',
          };
        }
      }

      // Deep analysis with GPT for edge cases
      if (context === 'deep' && this.openai) {
        const res = await this.openai.chat.completions.create({
          model:       config.ai.modModel,
          max_tokens:  200,
          temperature: 0,
          messages: [
            { role: 'system', content: config.ai.moderationPrompt },
            { role: 'user',   content: `Message: "${content}"` },
          ],
          response_format: { type: 'json_object' },
        });

        const parsed = JSON.parse(res.choices[0].message.content);
        return { ...parsed, source: 'gpt_analysis' };
      }

      return { violation: false, confidence: 0, source: 'clean' };

    } catch (err) {
      logger.warn('[AI] moderateContent error:', err.message);
      return { violation: false, confidence: 0, source: 'error' };
    }
  }

  _scoreToSeverity(score) {
    if (score >= 0.9) return 'critical';
    if (score >= 0.7) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }

  // ── Generate Image ───────────────────────────────────────────
  async generateImage(prompt, { size = '1024x1024', quality = 'standard', style = 'vivid' } = {}) {
    if (!this.openai) throw new Error('OpenAI not configured for image generation');

    const res = await this.openai.images.generate({
      model:   config.ai.imageModel,
      prompt:  `${prompt}\n\nSafe for work, appropriate for all ages, Discord server artwork.`,
      n:       1,
      size,
      quality,
      style,
    });

    return { url: res.data[0].url, revisedPrompt: res.data[0].revised_prompt };
  }

  // ── Conversation Context Manager ────────────────────────────
  async getContext(redis, userId, guildId) {
    const key = `ai:ctx:${guildId}:${userId}`;
    const data = await redis.getJSON(key);
    return data?.messages || [];
  }

  async saveContext(redis, userId, guildId, messages) {
    const key = `ai:ctx:${guildId}:${userId}`;
    const trimmed = messages.slice(-config.ai.maxHistory); // keep last N
    await redis.setJSON(key, { messages: trimmed }, config.cache.aiContextTTL);
  }

  async clearContext(redis, userId, guildId) {
    const key = `ai:ctx:${guildId}:${userId}`;
    await redis.del(key);
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
    await redis.expire(key, 86400); // 24h TTL
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
    const langNames = { ar: 'Arabic (Modern Standard)', en: 'English' };
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

  // ── Generate Welcome Message ────────────────────────────────
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

// ================================================================
//  AURA BOT v2.0 — Cloudflare Workers AI Endpoint
//  Standalone AI worker that exposes a REST API for chat,
//  moderation, and utility completions via Workers AI models.
// ================================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function errorResponse(message, status = 400) {
  return json({ success: false, error: message }, status);
}

/**
 * Validate the shared secret so only the bot/dashboard can call this worker.
 */
function authenticate(request, env) {
  const secret = env.API_SECRET;
  if (!secret) return true; // no secret configured = open (dev mode)
  const header = request.headers.get('Authorization') || '';
  return header === `Bearer ${secret}`;
}

/**
 * Run a chat completion against Cloudflare Workers AI.
 */
async function runChat(env, { messages, model, maxTokens, system }) {
  const modelId = model || env.DEFAULT_MODEL || '@cf/meta/llama-3.1-8b-instruct';
  const max = Math.min(Number(maxTokens) || Number(env.MAX_TOKENS) || 1000, 4096);

  const payload = [];
  if (system) {
    payload.push({ role: 'system', content: String(system).trim() });
  }
  for (const msg of messages) {
    const content = String(msg?.content || '').trim();
    if (!content) continue;
    const role = msg?.role === 'assistant' || msg?.role === 'system' ? msg.role : 'user';
    payload.push({ role, content });
  }

  if (payload.length === 0) {
    throw new Error('No valid messages provided.');
  }

  const gatewayId = String(env.GATEWAY_ID || '').trim();
  const accountId = String(env.CF_ACCOUNT_ID || '').trim();

  let url;
  if (gatewayId && accountId) {
    url = `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/workers-ai/${modelId}`;
  } else {
    // Use the AI binding if available (preferred), otherwise fall back to REST API
    if (env.AI) {
      const result = await env.AI.run(modelId, { messages: payload, max_tokens: max });
      return extractContent(result);
    }
    if (!accountId) {
      throw new Error('CF_ACCOUNT_ID is required when AI binding is not available.');
    }
    url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${modelId}`;
  }

  const token = String(env.CF_API_TOKEN || '').trim();
  if (!token) throw new Error('CF_API_TOKEN is required for REST API calls.');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages: payload, max_tokens: max }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.errors?.[0]?.message || `Workers AI HTTP ${res.status}`);
  }

  return extractContent(data);
}

function extractContent(payload) {
  const result = payload?.result ?? payload ?? {};
  if (typeof result.response === 'string' && result.response.trim()) return result.response.trim();
  if (typeof result.output_text === 'string' && result.output_text.trim()) return result.output_text.trim();
  if (typeof result.text === 'string' && result.text.trim()) return result.text.trim();

  const messages = Array.isArray(result.messages) ? result.messages : [];
  const assistant = [...messages].reverse().find((m) => m?.role === 'assistant');
  if (assistant) {
    if (typeof assistant.content === 'string') return assistant.content.trim();
    if (Array.isArray(assistant.content)) {
      return assistant.content
        .map((p) => (typeof p === 'string' ? p : p?.text || ''))
        .join(' ')
        .trim();
    }
  }
  throw new Error('Workers AI returned no text response.');
}

// ── Route handlers ─────────────────────────────────────────────

async function handleChat(request, env) {
  const body = await request.json().catch(() => null);
  if (!body) return errorResponse('Invalid JSON body.');

  const { messages, model, maxTokens, max_tokens, system } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return errorResponse('messages[] is required.');
  }

  try {
    const content = await runChat(env, {
      messages,
      model,
      maxTokens: maxTokens || max_tokens,
      system,
    });
    return json({ success: true, content, provider: 'cloudflare' });
  } catch (err) {
    return errorResponse(err.message, 502);
  }
}

async function handleModerate(request, env) {
  const body = await request.json().catch(() => null);
  if (!body?.content) return errorResponse('content is required.');

  const isDeep = body.context === 'deep';
  const moderationPrompt = `Perform a ${isDeep ? 'DEEP analysis' : 'quick check'} on this Discord message for: 
Hate speech, Harassment, NSFW, Threats, Spam, or Privacy violations.

Message: "${String(body.content).replace(/"/g, "'")}"

Respond ONLY in valid JSON format:
{"violation": boolean, "category": string, "severity": "low|medium|high|critical", "confidence": number(0-100), "reason": string}`;

  try {
    const raw = await runChat(env, {
      messages: [{ role: 'user', content: moderationPrompt }],
      model: body.model,
      maxTokens: isDeep ? 300 : 150,
      system: 'System: Content Moderation Engine. Output strict JSON only.',
    });

    const cleaned = raw.replace(/```json\s?|```\s?/gi, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : cleaned);

    return json({
      success: true,
      violation: !!parsed.violation,
      category: parsed.category || 'clean',
      severity: parsed.severity || 'low',
      confidence: parsed.confidence || 0,
      reason: parsed.reason || 'Analysis completed.',
      source: `cloudflare_mod_${isDeep ? 'deep' : 'standard'}`,
    });
  } catch (err) {
    return json({
      success: true,
      violation: false,
      confidence: 0,
      category: 'error',
      reason: `Worker error: ${err.message}`,
      source: 'cloudflare_error',
    });
  }
}

async function handleHealth(env) {
  return json({
    status: 'ok',
    model: env.DEFAULT_MODEL || '@cf/meta/llama-3.1-8b-instruct',
    hasAIBinding: !!env.AI,
  });
}

// ── Main fetch handler ─────────────────────────────────────────

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Health check (no auth)
    if (path === '/health' || path === '/') {
      return handleHealth(env);
    }

    // Auth check for all other routes
    if (!authenticate(request, env)) {
      return errorResponse('Unauthorized', 401);
    }

    if (request.method !== 'POST') {
      return errorResponse('Method not allowed. Use POST.', 405);
    }

    switch (path) {
      case '/chat':
        return handleChat(request, env);
      case '/moderate':
        return handleModerate(request, env);
      default:
        return errorResponse('Not found', 404);
    }
  },
};

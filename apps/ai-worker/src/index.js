// ================================================================
//  @aura/ai-worker — AI Worker Service Entrypoint
// ================================================================

import logger from '@aura/logger';
import { sanitizePrompt } from './gemini/sanitizer.js';
import { processAiJob } from './queues/jobHandler.js';

logger.info('[AI Worker] Initialized asynchronous neural processing worker.');

export { sanitizePrompt, processAiJob };

// ================================================================
//  @aura/ai-worker — Background AI Job Queue Handler
// ================================================================

import logger from '@aura/logger';
import { generateProtectedResponse } from '../gemini/pipeline.js';

export async function processAiJob(jobData) {
  logger.info(`[AI Job Queue] Processing job ${jobData.id || 'unknown'}...`);
  const result = await generateProtectedResponse(jobData.prompt);
  return { id: jobData.id, status: 'completed', result };
}

export default { processAiJob };

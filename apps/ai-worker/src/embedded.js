// ================================================================
//  Embedded AI moderation worker
//
//  Runs the AI job consumer inside the bot process. The Docker image only
//  starts the bot (`npm start`), so without an embedded consumer the
//  "aura:ai:jobs" queue is never drained and AI moderation is silently dead.
//
//  It reuses the existing consumer contract (dequeueAIJob from
//  ./queues/aiQueue.js, the same "aura:ai:jobs" key and the same job shape)
//  and the shared loop implementation from ./consumer.js — there is no second
//  queue implementation.
//
//  Opt out with AI_WORKER_STANDALONE=true on hosts that run
//  `npm run start:worker` as a separate service.
// ================================================================

import { startConsumerLoop, stopConsumerLoop } from './consumer.js';
import { closeAIQueue } from './queues/aiQueue.js';

let state = { started: false, loop: null };

/**
 * Starts the embedded AI moderation worker.
 * Never throws: a failure is logged and the bot keeps running.
 *
 * @param {object} client - The Discord client (kept for future use / logging).
 * @returns {boolean} true when the worker was started.
 */
export function startEmbeddedWorker(client) {
  if (String(process.env.AI_WORKER_STANDALONE || '').toLowerCase() === 'true') {
    console.warn(
      'ℹ️ [AI Worker] AI_WORKER_STANDALONE=true — a standalone worker is expected, the embedded worker was not started.'
    );
    return false;
  }

  if (state.started) {
    console.log('ℹ️ [AI Worker] Embedded worker is already running.');
    return true;
  }

  try {
    state.loop = startConsumerLoop();
    state.started = true;
    console.log('🧠 [AI Worker] Embedded AI moderation worker started (queue: aura:ai:jobs).');
    return true;
  } catch (error) {
    state.started = false;
    console.warn('⚠️ [AI Worker] Failed to start the embedded AI worker:', error?.message);
    return false;
  }
}

/**
 * Stops the embedded AI moderation worker and closes its queue connection.
 *
 * @returns {Promise<boolean>} true when a running worker was stopped.
 */
export async function stopEmbeddedWorker() {
  if (!state.started) return false;

  state.started = false;
  stopConsumerLoop();

  try {
    if (state.loop) await state.loop;
  } catch (error) {
    console.warn('⚠️ [AI Worker] Embedded worker stopped with an error:', error?.message);
  }

  try {
    await closeAIQueue();
  } catch (error) {
    console.warn('⚠️ [AI Worker] Failed to close the queue connection:', error?.message);
  }

  state.loop = null;
  console.log('🛑 [AI Worker] Embedded AI moderation worker stopped.');
  return true;
}

/**
 * Whether the embedded worker is currently running.
 */
export function isEmbeddedWorkerRunning() {
  return state.started;
}

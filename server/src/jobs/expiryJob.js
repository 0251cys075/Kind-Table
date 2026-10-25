/**
 * Background Expiry Job
 * Automatically finds batches past their expiry date and updates their status to Expired.
 * Operates on an asynchronous interval without blocking incoming claims or donor submissions.
 */

import { checkAndExpireBatches } from '../db/database.js';
import { broadcastBatchExpired } from '../services/websocket.js';

let intervalId = null;

export function startExpiryJob(intervalMs = 5000) {
  if (intervalId) return;

  // Run initial check right away
  runExpiryCheck();

  intervalId = setInterval(() => {
    runExpiryCheck();
  }, intervalMs);

  console.log(`[ExpiryJob] Started background job checking every ${intervalMs / 1000}s`);
}

export function stopExpiryJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[ExpiryJob] Stopped background job');
  }
}

export function runExpiryCheck() {
  try {
    const expiredBatches = checkAndExpireBatches();
    if (expiredBatches && expiredBatches.length > 0) {
      for (const batch of expiredBatches) {
        console.log(`[ExpiryJob] Auto-expired batch ${batch.id} (${batch.quantity} portions of ${batch.category})`);
        broadcastBatchExpired(batch);
      }
    }
    return expiredBatches;
  } catch (err) {
    console.error('[ExpiryJob] Error during expiry check:', err.message);
    return [];
  }
}

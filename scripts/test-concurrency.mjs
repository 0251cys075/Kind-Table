/**
 * Concurrency Test Script for Acceptance Test T1
 * 
 * Requirement:
 * "50 simultaneous claim requests on one batch (provide a script npm run test:concurrency):
 *  Exactly 1 succeeds, 49 get 'already claimed', 0 duplicates"
 */

import http from 'http';

import { spawn } from 'child_process';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4000';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isServerRunning() {
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log('='.repeat(65));
  console.log('  KIND TABLE - ACCEPTANCE TEST T1: ATOMIC CONCURRENCY');
  console.log('  Scenario: 50 simultaneous claim requests on 1 surplus batch');
  console.log('='.repeat(65));

  let spawnedProcess = null;

  // Auto-start server if not already running
  if (!(await isServerRunning())) {
    console.log('[Setup] Server not running on :4000, spawning server process...');
    spawnedProcess = spawn('node', ['server/src/index.js'], {
      stdio: 'ignore',
      detached: false,
    });
    // Wait until server is up
    for (let i = 0; i < 20; i++) {
      await wait(300);
      if (await isServerRunning()) break;
    }
  } else {
    console.log('[Setup] Connected to active server at ' + BASE_URL);
  }

  // 1. Create a fresh test donation batch
  console.log('\n[Step 1] Creating a fresh surplus food donation batch...');
  const createRes = await fetch(`${BASE_URL}/api/batches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      donor: 'Royal Feast Banquet Hall',
      category: 'Cooked meal',
      quantity: 50,
      location: 'Main Ballroom Kitchen, Door 4',
      expiryTime: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    console.error('Failed to create test batch:', errText);
    process.exit(1);
  }

  const { batch: testBatch } = await createRes.json();
  console.log(`[Step 1] Created batch ${testBatch.id} ("${testBatch.donor}", ${testBatch.quantity} portions)`);

  // 2. Fire 50 simultaneous claim requests
  const CONCURRENT_REQUESTS = 50;
  console.log(`\n[Step 2] Firing ${CONCURRENT_REQUESTS} simultaneous claim requests for batch ${testBatch.id}...`);

  const startTime = Date.now();
  const promises = [];

  for (let i = 1; i <= CONCURRENT_REQUESTS; i++) {
    const ngoName = `Hope Community NGO #${i}`;
    promises.push(
      fetch(`${BASE_URL}/api/batches/${testBatch.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ngoName }),
      }).then(async (res) => {
        const body = await res.json().catch(() => ({}));
        return {
          status: res.status,
          ngo: ngoName,
          body,
        };
      })
    );
  }

  const results = await Promise.all(promises);
  const elapsed = Date.now() - startTime;
  console.log(`[Step 2] All ${CONCURRENT_REQUESTS} requests completed in ${elapsed}ms!`);

  // 3. Analyze results
  const successful = results.filter((r) => r.status === 200);
  const alreadyClaimed = results.filter((r) => r.status === 409);
  const otherFailures = results.filter((r) => r.status !== 200 && r.status !== 409);

  console.log('\n[Step 3] Breakdown of Results:');
  console.log(`  - HTTP 200 (Claim Won):           ${successful.length} (Target: Exactly 1)`);
  console.log(`  - HTTP 409 (Already Claimed):      ${alreadyClaimed.length} (Target: Exactly 49)`);
  console.log(`  - Unexpected Responses / Errors:  ${otherFailures.length} (Target: Exactly 0)`);

  if (successful.length === 1) {
    console.log(`\n  🏆 WINNER: "${successful[0].ngo}" claimed the batch successfully.`);
    console.log(`     Server message: "${successful[0].body.message}"`);
  }

  if (alreadyClaimed.length > 0) {
    console.log(`\n  ✋ LOSER POLITE MESSAGE (Sample):`);
    console.log(`     Server message: "${alreadyClaimed[0].body.message}"`);
  }

  // 4. Verification in database
  console.log('\n[Step 4] Verifying database integrity...');
  const verifyRes = await fetch(`${BASE_URL}/api/batches/${testBatch.id}`);
  const { batch: finalBatch } = await verifyRes.json();

  console.log(`  - Batch Status: ${finalBatch.status}`);
  console.log(`  - Claimed By:   ${finalBatch.claimedBy}`);
  console.log(`  - Claimed At:   ${finalBatch.claimedAt}`);

  // 5. Verification in audit log
  const logRes = await fetch(`${BASE_URL}/api/logs`);
  const { logs } = await logRes.json();
  const claimLogsForBatch = logs.filter(
    (l) => l.action === 'CLAIMED' && (l.batch_id === testBatch.id || l.batchId === testBatch.id)
  );
  console.log(`  - Audit log entries for this claim: ${claimLogsForBatch.length} (Target: Exactly 1)`);

  // Pass / Fail Determination
  const pass =
    successful.length === 1 &&
    alreadyClaimed.length === CONCURRENT_REQUESTS - 1 &&
    otherFailures.length === 0 &&
    finalBatch.status === 'Claimed' &&
    finalBatch.claimedBy === successful[0].ngo &&
    claimLogsForBatch.length === 1;

  console.log('\n' + '='.repeat(65));
  if (pass) {
    console.log('  TEST RESULT: PASS! (Atomic Concurrency Guarantee Satisfied)');
    console.log(`  Exactly 1 NGO won, 49 NGOs received the calm rejection message.`);
    console.log(`  0 duplicate claims occurred.`);
  } else {
    console.error('  TEST RESULT: FAILED! Concurrency constraint violated.');
  }
  console.log('='.repeat(65) + '\n');

  if (spawnedProcess) {
    spawnedProcess.kill();
  }

  process.exit(pass ? 0 : 1);
}

main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

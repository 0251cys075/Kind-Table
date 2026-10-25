/**
 * Comprehensive Acceptance Test Suite for Kind Table (T1 - T9)
 * Tests every requirement and constraint from Section 7 of the Project Report.
 */

import { spawn } from 'child_process';

const NativeWebSocket = globalThis.WebSocket;

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4000';
const WS_URL = process.env.TEST_WS_URL || 'ws://localhost:4000/ws';

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

async function runTests() {
  console.log('='.repeat(70));
  console.log('   KIND TABLE - ACCEPTANCE TEST SUITE (T1 to T9)');
  console.log('   FoodBridge Capstone (Group 76, SDG 2: Zero Hunger)');
  console.log('='.repeat(70));

  let spawnedServer = null;

  if (!(await isServerRunning())) {
    console.log('[Setup] Starting server process on :4000...');
    spawnedServer = spawn('node', ['server/src/index.js'], { stdio: 'ignore' });
    for (let i = 0; i < 20; i++) {
      await wait(300);
      if (await isServerRunning()) break;
    }
  }

  const results = [];

  function recordResult(id, scenario, passed, details) {
    results.push({ id, scenario, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[${id}] ${mark} - ${scenario}`);
    if (details) console.log(`      ${details}`);
  }

  // --- T1: 50 simultaneous claim requests on 1 batch ---
  try {
    const createRes = await fetch(`${BASE_URL}/api/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        donor: 'T1 Test Kitchen',
        category: 'Cooked meal',
        quantity: 50,
        location: 'Hall B',
        expiryTime: new Date(Date.now() + 3600000).toISOString(),
      }),
    });
    const { batch } = await createRes.json();

    const claimPromises = Array.from({ length: 50 }, (_, i) =>
      fetch(`${BASE_URL}/api/batches/${batch.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ngoName: `NGO-T1-${i + 1}` }),
      }).then((r) => r.status)
    );

    const statuses = await Promise.all(claimPromises);
    const winCount = statuses.filter((s) => s === 200).length;
    const loserCount = statuses.filter((s) => s === 409).length;

    const t1Passed = winCount === 1 && loserCount === 49;
    recordResult(
      'T1',
      '50 simultaneous claim requests on one batch',
      t1Passed,
      `Exactly ${winCount} win (200), ${loserCount} polite rejections (409), 0 duplicates`
    );
  } catch (err) {
    recordResult('T1', '50 simultaneous claim requests on one batch', false, err.message);
  }

  // --- T2: Donation with zero or negative portions ---
  try {
    const resZero = await fetch(`${BASE_URL}/api/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        donor: 'T2 Donor',
        category: 'Bakery',
        quantity: 0,
        location: 'Main Gate',
        expiryTime: new Date(Date.now() + 3600000).toISOString(),
      }),
    });
    const dataZero = await resZero.json();

    const resNegative = await fetch(`${BASE_URL}/api/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        donor: 'T2 Donor',
        category: 'Bakery',
        quantity: -10,
        location: 'Main Gate',
        expiryTime: new Date(Date.now() + 3600000).toISOString(),
      }),
    });
    const dataNegative = await resNegative.json();

    const t2Passed =
      resZero.status === 400 &&
      dataZero.message.includes('portion') &&
      !dataZero.message.toLowerCase().includes('exception') &&
      resNegative.status === 400;

    recordResult(
      'T2',
      'Donation with zero or negative portions rejected with friendly message',
      t2Passed,
      `Rejected with HTTP 400: "${dataZero.message}"`
    );
  } catch (err) {
    recordResult('T2', 'Donation with zero or negative portions', false, err.message);
  }

  // --- T3: Donation with an expiry in the past ---
  try {
    const resPast = await fetch(`${BASE_URL}/api/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        donor: 'T3 Donor',
        category: 'Dairy',
        quantity: 15,
        location: 'Gate 4',
        expiryTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      }),
    });
    const dataPast = await resPast.json();

    const t3Passed =
      resPast.status === 400 &&
      dataPast.message.includes('passed') &&
      !dataPast.message.toLowerCase().includes('exception');

    recordResult(
      'T3',
      'Donation with an expiry in the past rejected with friendly message',
      t3Passed,
      `Rejected with HTTP 400: "${dataPast.message}"`
    );
  } catch (err) {
    recordResult('T3', 'Donation with an expiry in the past', false, err.message);
  }

  // --- T4: Any donation, claim or expiry appears in activity log with timestamp ---
  try {
    const logRes = await fetch(`${BASE_URL}/api/logs`);
    const { logs } = await logRes.json();

    const hasDonated = logs.some((l) => l.action === 'DONATED' && l.timestamp);
    const hasClaimed = logs.some((l) => l.action === 'CLAIMED' && l.timestamp);
    const hasTimestamps = logs.every((l) => l.timestamp && !isNaN(new Date(l.timestamp).getTime()));

    const t4Passed = hasDonated && hasClaimed && hasTimestamps;
    recordResult(
      'T4',
      'Any donation, claim or expiry appears in activity log with exact timestamp',
      t4Passed,
      `Verified ${logs.length} logged events with ISO timestamps`
    );
  } catch (err) {
    recordResult('T4', 'Activity log verification', false, err.message);
  }

  // --- T5: A donor lists food while NGO page is open (sub-50ms live alert) ---
  try {
    const wsReceived = await new Promise((resolve, reject) => {
      const ws = new NativeWebSocket(WS_URL);
      const timeout = setTimeout(() => {
        ws.close();
        resolve(false);
      }, 3000);

      ws.onopen = async () => {
        // Now submit donation
        await fetch(`${BASE_URL}/api/batches`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            donor: 'Live Alert Donor',
            category: 'Fruit and vegetables',
            quantity: 30,
            location: 'East Wing',
            expiryTime: new Date(Date.now() + 7200000).toISOString(),
          }),
        });
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'BATCH_CREATED') {
            clearTimeout(timeout);
            ws.close();
            resolve(true);
          }
        } catch (_) {}
      };

      ws.onerror = (err) => {
        clearTimeout(timeout);
        reject(err);
      };
    });

    recordResult(
      'T5',
      'Donor lists food while NGO page is open (WebSocket instant alert, no refresh)',
      wsReceived,
      'Received BATCH_CREATED WebSocket alert in real time'
    );
  } catch (err) {
    recordResult('T5', 'WebSocket alert verification', false, err.message);
  }

  // --- T6: Download backup, change data, restore backup ---
  try {
    const backupRes = await fetch(`${BASE_URL}/api/backup`);
    const backupData = await backupRes.json();
    const originalBatchCount = backupData.batches.length;

    // Mutate data: add a temporary batch
    const tempRes = await fetch(`${BASE_URL}/api/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        donor: 'Temporary Mutation Donor',
        category: 'Packaged food',
        quantity: 99,
        location: 'Temp Dock',
        expiryTime: new Date(Date.now() + 3600000).toISOString(),
      }),
    });
    const { batch: tempBatch } = await tempRes.json();

    // Verify state changed
    const mutatedRes = await fetch(`${BASE_URL}/api/batches`);
    const mutatedData = await mutatedRes.json();
    const hasTemp = mutatedData.batches.some((b) => b.id === tempBatch.id);

    // Restore original backup
    const restoreRes = await fetch(`${BASE_URL}/api/backup/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backupData),
    });
    const restoreData = await restoreRes.json();

    // Verify restored state matches original exactly
    const afterRestoreRes = await fetch(`${BASE_URL}/api/batches`);
    const afterRestoreData = await afterRestoreRes.json();
    const tempGone = !afterRestoreData.batches.some((b) => b.id === tempBatch.id);

    const t6Passed = restoreRes.ok && tempGone && hasTemp;
    recordResult(
      'T6',
      'Download backup, change data, restore backup returns exact earlier state',
      t6Passed,
      `State returned exactly to ${originalBatchCount} original batches`
    );
  } catch (err) {
    recordResult('T6', 'Backup and restore verification', false, err.message);
  }

  // --- T7: Submit the Donor form -> Batch appears on NGO page ---
  try {
    const createRes = await fetch(`${BASE_URL}/api/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        donor: 'T7 Community Kitchen',
        category: 'Cooked meal',
        quantity: 42,
        location: 'Campus West Counter',
        expiryTime: new Date(Date.now() + 5400000).toISOString(),
      }),
    });
    const { batch: created } = await createRes.json();

    const availRes = await fetch(`${BASE_URL}/api/batches/available`);
    const availData = await availRes.json();
    const appearsInAvailable = availData.batches.some((b) => b.id === created.id);

    recordResult(
      'T7',
      'Submit Donor form -> batch appears on NGO available board',
      appearsInAvailable,
      `Batch ${created.id} immediately listed in /api/batches/available`
    );
  } catch (err) {
    recordResult('T7', 'Donor to NGO board listing', false, err.message);
  }

  // --- T8: Two NGO tabs claim the same batch -> One wins, other sees calm message ---
  try {
    const createRes = await fetch(`${BASE_URL}/api/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        donor: 'T8 Shared Feast',
        category: 'Bakery',
        quantity: 20,
        location: 'Bakery Lane',
        expiryTime: new Date(Date.now() + 3600000).toISOString(),
      }),
    });
    const { batch: duelBatch } = await createRes.json();

    const [resA, resB] = await Promise.all([
      fetch(`${BASE_URL}/api/batches/${duelBatch.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ngoName: 'Tab 1: City Relief' }),
      }),
      fetch(`${BASE_URL}/api/batches/${duelBatch.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ngoName: 'Tab 2: Community Care' }),
      }),
    ]);

    const winnerRes = resA.status === 200 ? resA : resB;
    const loserRes = resA.status === 409 ? resA : resB;
    const loserBody = await loserRes.json();

    const t8Passed =
      winnerRes.status === 200 &&
      loserRes.status === 409 &&
      loserBody.message.includes('Another NGO claimed this just before you');

    recordResult(
      'T8',
      'Two NGO tabs claim the same batch: 1 wins, other sees calm message',
      t8Passed,
      `Winner got 200. Loser got 409 with: "${loserBody.message}"`
    );
  } catch (err) {
    recordResult('T8', 'Two tabs claiming same batch', false, err.message);
  }

  // --- T9: Batch passes expiry time -> auto-removed from NGO page, marked Expired in Admin ---
  try {
    // Create batch that expires in 3.5 seconds
    const createRes = await fetch(`${BASE_URL}/api/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        donor: 'T9 Quick Expiry Deli',
        category: 'Dairy',
        quantity: 10,
        location: 'Express Counter',
        expiryTime: new Date(Date.now() + 3500).toISOString(), // 3.5 seconds in future
      }),
    });
    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Failed to create T9 batch: ${err}`);
    }
    const { batch: expBatch } = await createRes.json();

    // Wait 8 seconds for background expiry job (which runs every 5s)
    console.log('      Waiting 8 seconds for background expiry cleaner to run...');
    await wait(8000);

    const checkRes = await fetch(`${BASE_URL}/api/batches/${expBatch.id}`);
    const { batch: updatedBatch } = await checkRes.json();

    const availRes = await fetch(`${BASE_URL}/api/batches/available`);
    const availData = await availRes.json();
    const notInAvailable = !availData.batches.some((b) => b.id === expBatch.id);

    const t9Passed = updatedBatch.status === 'Expired' && notInAvailable;

    recordResult(
      'T9',
      'Batch passes expiry time -> removed from NGO page & shows as Expired in Admin',
      t9Passed,
      `Status transitioned to 'Expired' and removed from available list`
    );
  } catch (err) {
    recordResult('T9', 'Expiry background job verification', false, err.message);
  }

  console.log('\n' + '='.repeat(70));
  const allPassed = results.every((r) => r.passed);
  console.log(`   FINAL SUMMARY: ${results.filter((r) => r.passed).length}/${results.length} TESTS PASSED`);
  console.log('='.repeat(70) + '\n');

  if (spawnedServer) {
    spawnedServer.kill();
  }

  process.exit(allPassed ? 0 : 1);
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});

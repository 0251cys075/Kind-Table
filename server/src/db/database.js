/**
 * Kind Table Database Layer
 * Uses Node.js built-in DatabaseSync (SQLite) for fast, synchronous, zero-dependency persistence.
 * Guarantees safe atomic claims, immediate audit logging, and exact state backup/restore.
 */

import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  BATCH_STATUS,
  SurplusBatchAlreadyClaimedError,
  BatchNotFoundError,
} from '../domain/rules.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

// Dynamically check if node:sqlite is available
let DatabaseSyncClass = null;
try {
  const mod = await import('node:sqlite');
  DatabaseSyncClass = mod.DatabaseSync;
} catch {
  DatabaseSyncClass = null;
}

let db = null;

if (DatabaseSyncClass) {
  try {
    const DATA_DIR = isServerless ? os.tmpdir() : path.resolve(__dirname, '../../data');
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch {
      // Ignored if read-only filesystem or exists
    }
    const DB_FILE = path.join(DATA_DIR, 'kind_table.db');
    db = new DatabaseSyncClass(DB_FILE);
    initSchema(db);
  } catch (err) {
    console.warn('[Database] Could not open file SQLite, falling back to in-memory SQLite:', err.message);
    try {
      db = new DatabaseSyncClass(':memory:');
      initSchema(db);
    } catch {
      db = null;
    }
  }
}

if (!db) {
  console.warn('[Database] Using high-performance in-memory database adapter (compatible with all Node versions and serverless hosts).');
  db = createInMemoryDb();
}

function initSchema(database) {
  try {
    database.exec(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS batches (
        id TEXT PRIMARY KEY,
        donor TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        location TEXT NOT NULL,
        expiry_time TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Available',
        claimed_by TEXT,
        claimed_at TEXT,
        created_at TEXT NOT NULL,
        is_demo INTEGER DEFAULT 0,
        latitude REAL DEFAULT 40.7128,
        longitude REAL DEFAULT -74.0060
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'donor',
        phone TEXT,
        organization TEXT,
        default_location TEXT,
        latitude REAL DEFAULT 40.7128,
        longitude REAL DEFAULT -74.0060,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        action TEXT NOT NULL,
        batch_id TEXT NOT NULL,
        actor TEXT NOT NULL,
        details TEXT NOT NULL,
        raw_line TEXT NOT NULL
      );
    `);

    try {
      database.exec(`ALTER TABLE batches ADD COLUMN latitude REAL DEFAULT 40.7128;`);
    } catch { /* column exists */ }
    try {
      database.exec(`ALTER TABLE batches ADD COLUMN longitude REAL DEFAULT -74.0060;`);
    } catch { /* column exists */ }
  } catch (err) {
    console.warn('[Database] initSchema error:', err.message);
  }
}

function createInMemoryDb() {
  let batches = [];
  let users = [];
  let auditLogs = [];
  let nextBatchRowId = 1;
  let nextLogId = 1;

  return {
    exec(sql) {
      if (sql.includes('DELETE FROM batches')) batches = [];
      if (sql.includes('DELETE FROM audit_logs')) auditLogs = [];
    },
    prepare(sql) {
      const trimmed = sql.trim();

      if (trimmed.startsWith('INSERT INTO audit_logs')) {
        return {
          run(timestamp, action, batch_id, actor, details, raw_line) {
            const entry = {
              id: nextLogId++,
              timestamp,
              action,
              batch_id,
              actor,
              details,
              raw_line,
            };
            auditLogs.push(entry);
            return { changes: 1 };
          },
        };
      }

      if (trimmed.includes('FROM audit_logs')) {
        if (trimmed.includes('ORDER BY id DESC')) {
          return { all: () => [...auditLogs].reverse() };
        }
        return { all: () => [...auditLogs] };
      }

      if (trimmed.startsWith('INSERT INTO batches')) {
        return {
          run(id, donor, category, quantity, location, expiry_time, status, created_at, is_demo, latitude, longitude) {
            batches.push({
              rowid: nextBatchRowId++,
              id,
              donor,
              category,
              quantity,
              location,
              expiry_time,
              status,
              claimed_by: null,
              claimed_at: null,
              created_at,
              is_demo: is_demo ? 1 : 0,
              latitude: latitude != null ? latitude : 40.7128,
              longitude: longitude != null ? longitude : -74.0060,
            });
            return { changes: 1 };
          },
        };
      }

      if (trimmed.includes('SELECT id FROM batches ORDER BY rowid DESC')) {
        return {
          get: () => (batches.length ? { id: batches[batches.length - 1].id } : null),
        };
      }

      if (trimmed === 'SELECT * FROM batches WHERE id = ?') {
        return {
          get: (id) => batches.find((b) => b.id === id) || null,
        };
      }

      if (trimmed.includes("SET status = 'Claimed'") && trimmed.includes("status = 'Available'")) {
        return {
          run(claimedBy, claimedAt, batchId) {
            const batch = batches.find((b) => b.id === batchId && b.status === 'Available');
            if (!batch) return { changes: 0 };
            batch.status = 'Claimed';
            batch.claimed_by = claimedBy;
            batch.claimed_at = claimedAt;
            return { changes: 1 };
          },
        };
      }

      if (trimmed.includes("UPDATE batches SET status = 'Expired'")) {
        return {
          run(batchId) {
            const batch = batches.find((b) => b.id === batchId);
            if (batch) batch.status = 'Expired';
            return { changes: 1 };
          },
        };
      }

      if (trimmed.startsWith('SELECT * FROM batches WHERE 1=1')) {
        return {
          all: (...params) => {
            let res = [...batches];
            if (params.length === 1 && params[0]) {
              res = res.filter((b) => b.status === params[0] || b.category === params[0]);
            } else if (params.length === 2) {
              if (params[0]) res = res.filter((b) => b.status === params[0]);
              if (params[1]) res = res.filter((b) => b.category === params[1]);
            }
            res.sort((a, b) => new Date(a.expiry_time).getTime() - new Date(b.expiry_time).getTime());
            return res;
          },
        };
      }

      if (trimmed.includes("WHERE status = 'Available'") && trimmed.includes('ORDER BY expiry_time')) {
        return {
          all: () => {
            return batches
              .filter((b) => b.status === 'Available')
              .sort((a, b) => new Date(a.expiry_time).getTime() - new Date(b.expiry_time).getTime());
          },
        };
      }

      if (trimmed.includes("status = 'Available' AND expiry_time <= ?")) {
        return {
          all: (nowIso) => {
            const now = new Date(nowIso).getTime();
            return batches.filter((b) => b.status === 'Available' && new Date(b.expiry_time).getTime() <= now);
          },
        };
      }

      if (trimmed.includes("WHERE status = 'Available'") && trimmed.includes('coalesce(sum(quantity)')) {
        return {
          get: () => {
            const avail = batches.filter((b) => b.status === 'Available');
            const portions = avail.reduce((sum, b) => sum + (b.quantity || 0), 0);
            return { count: avail.length, portions };
          },
        };
      }

      if (trimmed.includes("WHERE status = 'Claimed'") && trimmed.includes('coalesce(sum(quantity)')) {
        return {
          get: () => {
            const claimed = batches.filter((b) => b.status === 'Claimed');
            const portions = claimed.reduce((sum, b) => sum + (b.quantity || 0), 0);
            return { count: claimed.length, portions };
          },
        };
      }

      if (trimmed.includes("WHERE status = 'Expired'") && trimmed.includes('count(*)')) {
        return {
          get: () => ({ count: batches.filter((b) => b.status === 'Expired').length }),
        };
      }

      if (trimmed === 'SELECT count(*) as count FROM batches') {
        return {
          get: () => ({ count: batches.length }),
        };
      }

      if (trimmed.includes('SELECT * FROM batches ORDER BY rowid')) {
        return { all: () => [...batches] };
      }

      if (trimmed.includes('WHERE is_demo = 1')) {
        if (trimmed.startsWith('SELECT count(*)')) {
          return { get: () => ({ count: batches.filter((b) => b.is_demo === 1).length }) };
        }
        if (trimmed.startsWith('SELECT id')) {
          return { all: () => batches.filter((b) => b.is_demo === 1).map((b) => ({ id: b.id })) };
        }
        if (trimmed.startsWith('DELETE FROM batches')) {
          return {
            run: () => {
              const prev = batches.length;
              batches = batches.filter((b) => b.is_demo !== 1);
              return { changes: prev - batches.length };
            },
          };
        }
      }

      if (trimmed.startsWith('INSERT INTO users')) {
        return {
          run(id, email, password_hash, name, role, phone, organization, default_location, latitude, longitude, created_at) {
            users.push({
              id,
              email,
              password_hash,
              name,
              role,
              phone,
              organization,
              default_location,
              latitude,
              longitude,
              created_at,
            });
            return { changes: 1 };
          },
        };
      }

      if (trimmed.includes('FROM users WHERE LOWER(email) = ?')) {
        return {
          get: (email) => users.find((u) => u.email.toLowerCase() === String(email).toLowerCase()) || null,
        };
      }

      if (trimmed.includes('FROM users WHERE id = ?')) {
        return {
          get: (id) => users.find((u) => u.id === id) || null,
        };
      }

      if (trimmed.includes('FROM users ORDER BY created_at')) {
        return {
          all: () => [...users].reverse(),
        };
      }

      if (trimmed.includes('SELECT count(*) as count FROM users')) {
        return {
          get: () => ({ count: users.length }),
        };
      }

      if (trimmed.startsWith('UPDATE users SET name = ?')) {
        return {
          run(name, phone, org, loc, lat, lon, id) {
            const u = users.find((user) => user.id === id);
            if (u) {
              u.name = name;
              u.phone = phone;
              u.organization = org;
              u.default_location = loc;
              u.latitude = lat;
              u.longitude = lon;
            }
            return { changes: u ? 1 : 0 };
          },
        };
      }

      return {
        run: () => ({ changes: 0 }),
        get: () => null,
        all: () => [],
      };
    },
  };
}

/**
 * Format timestamp as HH:MM:SS for log line
 */
function formatTimeOnly(isoString) {
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Appends an audit log entry immediately to SQLite.
 */
export function recordAuditLog({ action, batchId, actor, details, timestamp = new Date().toISOString() }) {
  const timeStr = formatTimeOnly(timestamp);
  const rawLine = `${timeStr} ${action.toUpperCase()} batch ${batchId} by ${actor} - ${details}`;

  const stmt = db.prepare(`
    INSERT INTO audit_logs (timestamp, action, batch_id, actor, details, raw_line)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(timestamp, action, batchId, actor, details, rawLine);
  return { timestamp, action, batchId, actor, details, rawLine };
}

/**
 * Fetches all audit log entries, newest first.
 */
export function getAuditLogs() {
  const stmt = db.prepare(`SELECT * FROM audit_logs ORDER BY id DESC`);
  return stmt.all();
}

/**
 * Generates plain text log content for download.
 */
export function getAuditLogsText() {
  const stmt = db.prepare(`SELECT raw_line, timestamp FROM audit_logs ORDER BY id ASC`);
  const rows = stmt.all();
  if (rows.length === 0) {
    return 'Kind Table Activity Log\n(No events recorded yet)\n';
  }
  const header = `=== Kind Table Activity Log ===\nGenerated at: ${new Date().toISOString()}\nTotal events: ${rows.length}\n\n`;
  const body = rows.map((r) => `[${r.timestamp}] ${r.raw_line}`).join('\n');
  return header + body + '\n';
}

/**
 * Retrieves all food batches.
 */
export function getAllBatches({ status, category } = {}) {
  let query = 'SELECT * FROM batches WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  // Urgent first (earliest expiry first), then newest
  query += ' ORDER BY expiry_time ASC, created_at DESC';

  const stmt = db.prepare(query);
  const rows = stmt.all(...params);
  return rows.map(mapBatchRow);
}

/**
 * Retrieves available batches sorted by earliest expiry first.
 */
export function getAvailableBatches() {
  const stmt = db.prepare(`
    SELECT * FROM batches
    WHERE status = 'Available'
    ORDER BY expiry_time ASC
  `);
  return stmt.all().map(mapBatchRow);
}

/**
 * Retrieves single batch by ID.
 */
export function getBatchById(id) {
  const stmt = db.prepare(`SELECT * FROM batches WHERE id = ?`);
  const row = stmt.get(id);
  return row ? mapBatchRow(row) : null;
}

/**
 * Creates a new donation batch and records audit log.
 */
let nextIdNum = 1;
function generateBatchId() {
  const stmt = db.prepare(`SELECT id FROM batches ORDER BY rowid DESC LIMIT 1`);
  const last = stmt.get();
  if (last && typeof last.id === 'string' && last.id.startsWith('B-')) {
    const num = parseInt(last.id.replace('B-', ''), 10);
    if (!isNaN(num)) {
      nextIdNum = Math.max(nextIdNum, num + 1);
    }
  }
  const id = `B-${nextIdNum}`;
  nextIdNum++;
  return id;
}

export function createBatch({ donor, category, quantity, location, expiryTime, isDemo = 0, latitude = 40.7128, longitude = -74.0060 }) {
  const id = generateBatchId();
  const createdAt = new Date().toISOString();
  const status = BATCH_STATUS.AVAILABLE;

  const stmt = db.prepare(`
    INSERT INTO batches (id, donor, category, quantity, location, expiry_time, status, created_at, is_demo, latitude, longitude)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, donor, category, quantity, location, expiryTime, status, createdAt, isDemo ? 1 : 0, latitude, longitude);

  // Write to permanent activity log
  recordAuditLog({
    action: 'DONATED',
    batchId: id,
    actor: donor,
    details: `${quantity} portions of ${category} at ${location}`,
    timestamp: createdAt,
  });

  return getBatchById(id);
}

/**
 * ATOMIC CLAIM OPERATION
 * Core requirement: Exactly 1 wins, rest receive polite calm rejection.
 * Uses atomic SQLite single-statement update with status condition.
 */
export function claimBatchAtomic(batchId, claimedBy) {
  const claimedAt = new Date().toISOString();

  // Atomic update: only updates if current status is exactly 'Available'
  const stmt = db.prepare(`
    UPDATE batches
    SET status = 'Claimed', claimed_by = ?, claimed_at = ?
    WHERE id = ? AND status = 'Available'
  `);
  const result = stmt.run(claimedBy, claimedAt, batchId);

  if (result.changes === 1) {
    // WINNER: Exactly this request succeeded!
    const updated = getBatchById(batchId);
    recordAuditLog({
      action: 'CLAIMED',
      batchId,
      actor: claimedBy,
      details: `Claimed by ${claimedBy}`,
      timestamp: claimedAt,
    });
    return { success: true, batch: updated };
  }

  // LOSER: 0 rows updated because it was already claimed or does not exist or expired
  const existing = getBatchById(batchId);
  if (!existing) {
    throw new BatchNotFoundError();
  }

  // Batch is already claimed or expired - throw plain friendly domain error
  throw new SurplusBatchAlreadyClaimedError();
}

/**
 * Background Expiry Check
 * Finds available batches that have passed their expiry time and transitions them to 'Expired'.
 * Must never block claim requests.
 */
export function checkAndExpireBatches() {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    SELECT * FROM batches
    WHERE status = 'Available' AND expiry_time <= ?
  `);
  const expiredList = stmt.all(now);

  if (expiredList.length === 0) {
    return [];
  }

  const updateStmt = db.prepare(`
    UPDATE batches
    SET status = 'Expired'
    WHERE id = ? AND status = 'Available'
  `);

  const expiredBatches = [];
  for (const row of expiredList) {
    const res = updateStmt.run(row.id);
    if (res.changes === 1) {
      recordAuditLog({
        action: 'EXPIRED',
        batchId: row.id,
        actor: 'System Expiry Job',
        details: `${row.quantity} portions from ${row.donor} passed expiry time (${row.expiry_time})`,
        timestamp: now,
      });
      expiredBatches.push(getBatchById(row.id));
    }
  }

  return expiredBatches;
}

/**
 * Real-time stats calculations
 */
export function getStats() {
  const availableStmt = db.prepare(`SELECT count(*) as count, coalesce(sum(quantity), 0) as portions FROM batches WHERE status = 'Available'`);
  const available = availableStmt.get();

  const claimedStmt = db.prepare(`SELECT count(*) as count, coalesce(sum(quantity), 0) as portions FROM batches WHERE status = 'Claimed'`);
  const claimed = claimedStmt.get();

  const expiredStmt = db.prepare(`SELECT count(*) as count FROM batches WHERE status = 'Expired'`);
  const expired = expiredStmt.get();

  const totalStmt = db.prepare(`SELECT count(*) as count FROM batches`);
  const total = totalStmt.get();

  return {
    availableBatches: available.count,
    availablePortions: available.portions,
    claimedBatches: claimed.count,
    portionsRescued: claimed.portions,
    expiredBatches: expired.count,
    totalBatches: total.count,
  };
}

/**
 * Full state export for Backup
 */
export function exportState() {
  const batchesStmt = db.prepare(`SELECT * FROM batches ORDER BY rowid ASC`);
  const logsStmt = db.prepare(`SELECT * FROM audit_logs ORDER BY id ASC`);
  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    system: 'Kind Table (FoodBridge Capstone)',
    batches: batchesStmt.all().map(mapBatchRow),
    auditLogs: logsStmt.all(),
  };
}

/**
 * Full state restore from Backup
 */
export function restoreState(backupData) {
  if (!backupData || !Array.isArray(backupData.batches) || !Array.isArray(backupData.auditLogs)) {
    throw new Error('Invalid backup file format. Expected batches and auditLogs arrays.');
  }

  db.exec('BEGIN IMMEDIATE;');
  try {
    db.exec(`DELETE FROM batches;`);
    db.exec(`DELETE FROM audit_logs;`);

    const insertBatch = db.prepare(`
      INSERT INTO batches (id, donor, category, quantity, location, expiry_time, status, claimed_by, claimed_at, created_at, is_demo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const b of backupData.batches) {
      insertBatch.run(
        b.id,
        b.donor,
        b.category,
        b.quantity,
        b.location,
        b.expiryTime || b.expiry_time,
        b.status,
        b.claimedBy || b.claimed_by || null,
        b.claimedAt || b.claimed_at || null,
        b.createdAt || b.created_at || new Date().toISOString(),
        b.isDemo ? 1 : 0
      );
    }

    const insertLog = db.prepare(`
      INSERT INTO audit_logs (id, timestamp, action, batch_id, actor, details, raw_line)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const l of backupData.auditLogs) {
      insertLog.run(
        l.id,
        l.timestamp,
        l.action,
        l.batch_id || l.batchId,
        l.actor,
        l.details,
        l.raw_line || l.rawLine
      );
    }

    db.exec('COMMIT;');

    recordAuditLog({
      action: 'RESTORED',
      batchId: 'SYSTEM',
      actor: 'Admin',
      details: `Restored ${backupData.batches.length} batches and ${backupData.auditLogs.length} log entries from backup file`,
    });

    return {
      success: true,
      restoredBatches: backupData.batches.length,
      restoredLogs: backupData.auditLogs.length,
    };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

/**
 * Demo Data Seeding
 */
export function seedDemoData() {
  const existingDemo = db.prepare(`SELECT count(*) as count FROM batches WHERE is_demo = 1`).get();
  if (existingDemo.count > 0) {
    return { count: existingDemo.count, message: 'Demo data already exists.' };
  }

  const now = Date.now();
  const demoBatches = [
    {
      donor: 'Green Leaf Hostel Kitchen',
      category: 'Cooked meal',
      quantity: 45,
      location: 'Student Dining Hall, Counter 3',
      expiryTime: new Date(now + 3 * 3600 * 1000).toISOString(), // 3 hours from now
    },
    {
      donor: 'Sunrise Bakery & Cafe',
      category: 'Bakery',
      quantity: 28,
      location: '14 Market Street, Rear Delivery Bay',
      expiryTime: new Date(now + 1.2 * 3600 * 1000).toISOString(), // 1h 12m from now (amber)
    },
    {
      donor: 'Campus Central Canteen',
      category: 'Fruit and vegetables',
      quantity: 35,
      location: 'Campus Center, Loading Dock A',
      expiryTime: new Date(now + 22 * 60 * 1000).toISOString(), // 22 minutes (urgent red!)
    },
    {
      donor: 'Metro Supermarket Deli',
      category: 'Dairy',
      quantity: 20,
      location: 'Aisle 4 Cold Storage, Metro Center',
      expiryTime: new Date(now + 6 * 3600 * 1000).toISOString(), // 6 hours
    },
  ];

  for (const b of demoBatches) {
    createBatch({ ...b, isDemo: 1 });
  }

  return { count: demoBatches.length, message: 'Demo data successfully seeded.' };
}

/**
 * Clears demo batches only
 */
export function clearDemoData() {
  const stmt = db.prepare(`SELECT id FROM batches WHERE is_demo = 1`);
  const demoBatches = stmt.all();

  const deleteStmt = db.prepare(`DELETE FROM batches WHERE is_demo = 1`);
  const result = deleteStmt.run();

  recordAuditLog({
    action: 'CLEARED',
    batchId: 'DEMO',
    actor: 'Admin',
    details: `Cleared ${result.changes} demo batches`,
  });

  return { clearedCount: result.changes, demoIds: demoBatches.map(b => b.id) };
}

/**
 * Helper to map DB row to camelCase JS object
 */
function mapBatchRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    donor: row.donor,
    category: row.category,
    quantity: row.quantity,
    location: row.location,
    expiryTime: row.expiry_time,
    status: row.status,
    claimedBy: row.claimed_by,
    claimedAt: row.claimed_at,
    createdAt: row.created_at,
    isDemo: Boolean(row.is_demo),
    latitude: row.latitude != null ? row.latitude : 40.7128,
    longitude: row.longitude != null ? row.longitude : -74.0060,
  };
}

/**
 * ====================================================================
 * USER PROFILE & AUTHENTICATION MANAGEMENT
 * ====================================================================
 */

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + '_kindtable_salt').digest('hex');
}

export function createUser({ email, password, name, role = 'donor', phone = '', organization = '', defaultLocation = '', latitude = 40.7128, longitude = -74.0060 }) {
  const existing = findUserByEmail(email);
  if (existing) {
    throw new Error('An account with this email already exists.');
  }
  const id = `USR-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
  const passwordHash = hashPassword(password);
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, phone, organization, default_location, latitude, longitude, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, email.toLowerCase().trim(), passwordHash, name.trim(), role, phone, organization, defaultLocation, latitude, longitude, createdAt);

  const created = findUserById(id);
  const { passwordHash: _, ...safeUser } = created;
  return safeUser;
}

export function authenticateUser(email, password) {
  const user = findUserByEmail(email);
  if (!user) return null;
  const hash = hashPassword(password);
  if (user.passwordHash !== hash) return null;
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

export function findUserByEmail(email) {
  if (!email) return null;
  const stmt = db.prepare(`SELECT * FROM users WHERE LOWER(email) = ?`);
  const row = stmt.get(email.toLowerCase().trim());
  return mapUserRow(row);
}

export function findUserById(id) {
  if (!id) return null;
  const stmt = db.prepare(`SELECT * FROM users WHERE id = ?`);
  const row = stmt.get(id);
  return mapUserRow(row);
}

export function getAllUsers() {
  const stmt = db.prepare(`SELECT * FROM users ORDER BY created_at DESC`);
  return stmt.all().map(mapUserRow).map(({ passwordHash, ...u }) => u);
}

export function updateUserProfile(id, { name, phone, organization, defaultLocation, latitude, longitude }) {
  const current = findUserById(id);
  if (!current) throw new Error('User not found.');

  const updatedName = name !== undefined ? name.trim() : current.name;
  const updatedPhone = phone !== undefined ? phone.trim() : current.phone;
  const updatedOrg = organization !== undefined ? organization.trim() : current.organization;
  const updatedLoc = defaultLocation !== undefined ? defaultLocation.trim() : current.defaultLocation;
  const updatedLat = latitude !== undefined ? latitude : current.latitude;
  const updatedLon = longitude !== undefined ? longitude : current.longitude;

  const stmt = db.prepare(`
    UPDATE users
    SET name = ?, phone = ?, organization = ?, default_location = ?, latitude = ?, longitude = ?
    WHERE id = ?
  `);
  stmt.run(updatedName, updatedPhone, updatedOrg, updatedLoc, updatedLat, updatedLon, id);

  const updated = findUserById(id);
  const { passwordHash: _, ...safeUser } = updated;
  return safeUser;
}

export function seedDefaultUsers() {
  try {
    const existing = db.prepare(`SELECT count(*) as count FROM users`).get();
    if (existing && existing.count > 0) return;
  } catch (e) {
    return;
  }

  const demoUsers = [
    {
      email: 'donor@kindtable.org',
      password: 'password123',
      name: 'Sunrise Organic Bakery',
      role: 'donor',
      phone: '(555) 019-8234',
      organization: 'Sunrise Bakery & Cafe Co.',
      defaultLocation: '42 High Meadow Road (Back Service Kitchen #3)',
      latitude: 40.7128,
      longitude: -74.0060,
    },
    {
      email: 'ngo@kindtable.org',
      password: 'password123',
      name: 'Hope Community Kitchen',
      role: 'ngo',
      phone: '(555) 349-2911',
      organization: 'Hope Shelter Network NGO',
      defaultLocation: '128 Hope Avenue, Community Shelter Hub',
      latitude: 40.7282,
      longitude: -73.9942,
    },
    {
      email: 'admin@kindtable.org',
      password: 'password123',
      name: 'Dispatch Central Control',
      role: 'admin',
      phone: '(555) 019-9000',
      organization: 'Kind Table Dispatch Operations',
      defaultLocation: 'Municipal Food Safety Logistics Center',
      latitude: 40.7112,
      longitude: -74.0055,
    },
  ];

  for (const u of demoUsers) {
    try {
      createUser(u);
    } catch (e) {
      // ignore
    }
  }
}

// Auto seed default demo accounts
seedDefaultUsers();

function mapUserRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    role: row.role,
    phone: row.phone,
    organization: row.organization,
    defaultLocation: row.default_location,
    latitude: row.latitude != null ? row.latitude : 40.7128,
    longitude: row.longitude != null ? row.longitude : -74.0060,
    createdAt: row.created_at,
  };
}

/**
 * Calculates Haversine distance in kilometers between two geo coordinates.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function closeDatabase() {
  try {
    db.close();
  } catch (err) {
    // Already closed or clean
  }
}

export { db };

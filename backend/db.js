import dotenv from "dotenv";
dotenv.config();

import mysql from "mysql2/promise";

// ---------------------------------------------------------------------------
// Pool configuration
// ---------------------------------------------------------------------------
let connectionConfig = {
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Pool tuning
  connectionLimit:      10,
  waitForConnections:   true,   // queue requests instead of throwing immediately
  queueLimit:           0,      // unlimited queue
  connectTimeout:       10_000, // 10 s TCP connect timeout
  idleTimeout:          60_000, // release idle connections after 60 s

  // Keep-alive
  enableKeepAlive:       true,
  keepAliveInitialDelay: 30_000, // first keep-alive ping after 30 s
};

console.log("[Aura DB] Initial connection configuration loaded:", {
  host:     connectionConfig.host     ? "configured" : "not set",
  port:     connectionConfig.port,
  user:     connectionConfig.user     ? "configured" : "not set",
  password: connectionConfig.password ? "configured" : "not set",
  database: connectionConfig.database ? "configured" : "not set",
});

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------
let isConfigured = !!(
  connectionConfig.host &&
  connectionConfig.user &&
  connectionConfig.database
);

let pool       = null;
let dbConnected = false;

if (isConfigured) {
  try {
    pool = mysql.createPool(connectionConfig);
    console.log(`[Aura DB] Connection pool created for host: ${connectionConfig.host}`);
  } catch (err) {
    console.error("[Aura DB] Initial pool creation failure:", err.message);
  }
} else {
  console.log(
    "[Aura DB] MySQL environment variables not fully set. " +
    "Server is operating in elegant SQLite/In-Memory mode."
  );
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/** Returns true if real MySQL is active and connected. */
export function isRealDb() {
  return dbConnected;
}

/** Returns a sanitised snapshot of the current connection settings. */
export function getDbConfig() {
  return {
    host:      connectionConfig.host     || "",
    port:      connectionConfig.port     || 3306,
    user:      connectionConfig.user     || "",
    database:  connectionConfig.database || "",
    connected: dbConnected,
    mode:      dbConnected ? "MySQL Server" : "In-Memory Sandbox",
  };
}

/** Returns the underlying mysql2 pool (or null when not connected). */
export function getPool() {
  return pool;
}

// ---------------------------------------------------------------------------
// query() — with simple retry on transient connection errors
// ---------------------------------------------------------------------------
const RETRYABLE_CODES = new Set(["ECONNRESET", "ECONNREFUSED", "PROTOCOL_CONNECTION_LOST", "ER_CON_COUNT_ERROR"]);
const MAX_RETRIES     = 2;
const RETRY_DELAY_MS  = 300;

/**
 * Executes a prepared statement against the active pool.
 * Retries up to MAX_RETRIES times on transient network errors.
 */
export async function query(sql, params) {
  if (!pool) throw new Error("Active MySQL pool is unavailable.");

  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES && RETRYABLE_CODES.has(err.code)) {
        console.warn(`[Aura DB] Transient error (${err.code}), retrying attempt ${attempt + 1}…`);
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
      } else {
        throw err;
      }
    }
  }
  throw lastErr;
}

// ---------------------------------------------------------------------------
// reconnectDatabase() — test → swap → setup, no double-pool waste
// ---------------------------------------------------------------------------

/**
 * Validates a new set of DB credentials, swaps the active pool if successful,
 * then re-runs schema bootstrapping.
 */
export async function reconnectDatabase(newConfig) {
  const testPoolConfig = {
    host:            newConfig.host,
    port:            Number(newConfig.port) || 3306,
    user:            newConfig.user,
    password:        newConfig.password,
    database:        newConfig.database,
    connectionLimit: 3,
    connectTimeout:  5_000,
    waitForConnections: true,
  };

  let testPool = null;
  let conn     = null;

  try {
    console.log("[Aura DB] Testing dynamic connection to:", newConfig.host);
    testPool = mysql.createPool(testPoolConfig);

    conn = await testPool.getConnection();
    await conn.query("SELECT 1");
    conn.release();
    conn = null;

    // Tear down the old pool gracefully
    if (pool) {
      try { await pool.end(); } catch (err) {
        console.error("[Aura DB] Failed ending old pool:", err.message);
      }
    }

    // Promote the test pool to active
    connectionConfig = {
      ...connectionConfig,
      ...testPoolConfig,
      connectionLimit:      10,   // upgrade to full limit
      waitForConnections:   true,
      queueLimit:           0,
      idleTimeout:          60_000,
      enableKeepAlive:      true,
      keepAliveInitialDelay: 30_000,
    };

    // Recreate pool with full production settings (keeps test pool ref for cleanup if needed)
    await testPool.end();
    pool        = mysql.createPool(connectionConfig);
    dbConnected = true;
    isConfigured = true;

    console.log("[Aura DB] Dynamic connection established successfully.");
    await setupDatabase();

    return { success: true, config: getDbConfig() };
  } catch (err) {
    console.error("[Aura DB] Reconnection failed:", err.message);
    if (testPool) {
      try { await testPool.end(); } catch (_) {}
    }
    throw new Error(`Connection failed: ${err.message}`);
  } finally {
    if (conn) conn.release();
  }
}

// ---------------------------------------------------------------------------
// setupDatabase() — schema bootstrapping + smart migrations
// ---------------------------------------------------------------------------

/**
 * Creates all required tables and applies any pending column migrations.
 * Uses INFORMATION_SCHEMA checks instead of silent ALTER TABLE try/catches.
 */
export async function setupDatabase() {
  if (!pool) return;

  let conn = null;
  try {
    conn = await pool.getConnection();
    console.log("[Aura DB] Connection test passed. Verifying database table schemas…");

    // ── 1. users ──────────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        username      VARCHAR(100) PRIMARY KEY,
        passwordHash  VARCHAR(255) NOT NULL,
        email         VARCHAR(150) NOT NULL UNIQUE,
        fullName      VARCHAR(200) NOT NULL,
        preferredVibe VARCHAR(100) DEFAULT 'All',
        avatarUrl     VARCHAR(255),
        isAdmin       TINYINT(1)   DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // ── 2. products ───────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS products (
        id           VARCHAR(50)      PRIMARY KEY,
        name         VARCHAR(200)     NOT NULL,
        description  TEXT,
        price        DECIMAL(10, 2)   NOT NULL,
        category     VARCHAR(100)     NOT NULL,
        rating       DECIMAL(3, 2)    DEFAULT 0.0,
        reviewsCount INT              DEFAULT 0,
        image        VARCHAR(512),
        badge        VARCHAR(100)     DEFAULT NULL,
        inStock      TINYINT(1)       DEFAULT 1,
        stockCount   INT              DEFAULT 15,
        featured     TINYINT(1)       DEFAULT 0,
        colors       JSON             DEFAULT NULL,
        sizes        JSON             DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Smart migration: only add stockCount if truly missing
    await addColumnIfMissing(conn, "products", "stockCount", "INT DEFAULT 15");

    // ── 3. reviews ────────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id        VARCHAR(50)  PRIMARY KEY,
        productId VARCHAR(50)  NOT NULL,
        author    VARCHAR(200) NOT NULL,
        rating    INT          NOT NULL,
        comment   TEXT,
        date      VARCHAR(50),
        FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // ── 4. orders ─────────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS orders (
        orderId             VARCHAR(50)  PRIMARY KEY,
        cartItems           JSON         NOT NULL,
        shippingFullName    VARCHAR(200) NOT NULL,
        shippingAddressLine TEXT         NOT NULL,
        shippingCity        VARCHAR(100) NOT NULL,
        shippingPostalCode  VARCHAR(50)  NOT NULL,
        estimatedDelivery   VARCHAR(100) NOT NULL,
        authCode            VARCHAR(100) NOT NULL,
        deliveryStatus      VARCHAR(100) DEFAULT 'Processing',
        paymentStatus       VARCHAR(100) DEFAULT 'Completed',
        date                TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Smart migrations for orders columns
    await addColumnIfMissing(conn, "orders", "deliveryStatus", "VARCHAR(100) DEFAULT 'Processing'");
    await addColumnIfMissing(conn, "orders", "paymentStatus",  "VARCHAR(100) DEFAULT 'Completed'");
    await addColumnIfMissing(conn, "orders", "username",       "VARCHAR(100) DEFAULT NULL");

    // ── 5. carts ──────────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS carts (
        username  VARCHAR(100) PRIMARY KEY,
        items     JSON DEFAULT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // ── 6. wishlists ──────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS wishlists (
        username  VARCHAR(100) PRIMARY KEY,
        items     JSON DEFAULT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // ── 7. Seed catalog if empty ──────────────────────────────────────────
    const [countRows] = await conn.query("SELECT COUNT(*) AS cnt FROM products");
    if (countRows[0].cnt === 0) {
      await seedCatalog(conn);
    }

    dbConnected = true;
    console.log("[Aura DB] Schemas validated. High-performance live integration ready.");
  } catch (error) {
    dbConnected = false;
    console.error("[Aura DB] setupDatabase error:", error);
  } finally {
    if (conn) conn.release();
  }
}

// ---------------------------------------------------------------------------
// Internal utilities
// ---------------------------------------------------------------------------

/**
 * Adds a column to a table only if it does not already exist,
 * using INFORMATION_SCHEMA to avoid silent swallowed errors.
 */
async function addColumnIfMissing(conn, table, column, definition) {
  const [rows] = await conn.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME   = ?
       AND COLUMN_NAME  = ?
     LIMIT 1`,
    [table, column]
  );
  if (rows.length === 0) {
    await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`[Aura DB] Migration: added column '${column}' to '${table}'.`);
  }
}

/**
 * Bulk-inserts the curated product catalog and associated reviews inside a
 * single transaction, minimising round-trips to the server.
 */
async function seedCatalog(conn) {
  console.log("[Aura DB] Seeding product records and verified reviews into MySQL tables…");
  const { CURATED_PRODUCTS } = await import("../src/data.ts");

  const productPlaceholders = [];
  const productData         = [];
  const reviewPlaceholders  = [];
  const reviewData          = [];

  for (const prod of CURATED_PRODUCTS) {
    const seedStock   = prod.id === "prod-6" ? 0 : 15;
    const seedInStock = seedStock > 0 ? 1 : 0;

    productPlaceholders.push("(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    productData.push(
      prod.id,
      prod.name,
      prod.description,
      prod.price,
      prod.category,
      prod.rating,
      prod.reviewsCount,
      prod.image,
      prod.badge  || null,
      seedInStock,
      seedStock,
      prod.featured ? 1 : 0,
      prod.colors ? JSON.stringify(prod.colors) : null,
      prod.sizes  ? JSON.stringify(prod.sizes)  : null
    );

    if (prod.reviews?.length > 0) {
      for (const rev of prod.reviews) {
        reviewPlaceholders.push("(?, ?, ?, ?, ?, ?)");
        reviewData.push(rev.id, prod.id, rev.author, rev.rating, rev.comment, rev.date);
      }
    }
  }

  await conn.beginTransaction();
  try {
    if (productPlaceholders.length > 0) {
      await conn.query(
        `INSERT INTO products (id, name, description, price, category, rating, reviewsCount, image, badge, inStock, stockCount, featured, colors, sizes)
         VALUES ${productPlaceholders.join(", ")}`,
        productData
      );
    }
    if (reviewPlaceholders.length > 0) {
      await conn.query(
        `INSERT INTO reviews (id, productId, author, rating, comment, date)
         VALUES ${reviewPlaceholders.join(", ")}`,
        reviewData
      );
    }
    await conn.commit();
    console.log("[Aura DB] Catalog seeded successfully.");
  } catch (err) {
    await conn.rollback();
    console.error("[Aura DB] Seeding transaction failed, rolled back:", err);
    throw err;
  }
}

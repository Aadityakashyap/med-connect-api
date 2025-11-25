const mysql = require("mysql2/promise");
const { config } = require("./config");

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: config.db.waitForConnections,
  connectionLimit: config.db.connectionLimit,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    conn.release();
    return result;
  } catch (err) {
    try {
      await conn.rollback();
    } catch {}
    conn.release();
    throw err;
  }
}

module.exports = { pool, withTransaction };

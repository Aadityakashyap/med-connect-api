const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { config } = require("../config");

const logStream = fs.createWriteStream(
  path.join(__dirname, "../../log/db-setup.log"),
  { flags: "a" }
);
function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  logStream.write(line + "\n");
}

async function runSqlFile(filePath, pool) {
  const sql = fs.readFileSync(filePath, "utf8");
  const statements = sql
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    try {
      await pool.query(stmt);
      log(`Executed: ${stmt.substring(0, 80)}...`);
    } catch (err) {
      log(`Error executing statement: ${stmt}`, err.message);
      throw err;
    }
  }
}

async function main() {
  const pool = await mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    waitForConnections: true,
    connectionLimit: 10,
  });

  try {
    log("Running migrations.sql...");
    await runSqlFile(path.join(__dirname, "../sql/migrations.sql"), pool);

    log("Running seed.sql...");
    await runSqlFile(path.join(__dirname, "../sql/seed.sql"), pool);

    log("Database setup complete");
  } catch (err) {
    log("Database setup failed", err);
  } finally {
    await pool.end();
  }
}

main();

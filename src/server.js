const { config } = require("./config");
const { pool } = require("./db");
const app = require("./app");
const { logger } = require("./logger");

async function start() {
  try {
    await pool.query("SELECT 1");
    app.listen(config.port, () =>
      logger.info(`Server listening on http://localhost:${config.port}`)
    );
  } catch (e) {
    logger.error("Failed to start server:", e);
    process.exit(1);
  }
}

start();

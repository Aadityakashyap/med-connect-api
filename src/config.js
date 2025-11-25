const dotenv = require("dotenv");
dotenv.config();

const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "4000", 10),

  db: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "medconnectapi",
    connectionLimit: 10,
    waitForConnections: true,
  },

  security: {
    jwtSecret: process.env.JWT_SECRET || "dev_only_secret",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || "120", 10),
  },

  observability: {
    metricsEnabled: process.env.METRICS_ENABLED === "true",
  },
};

module.exports = { config };

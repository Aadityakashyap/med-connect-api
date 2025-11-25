const crypto = require("crypto");
const { pool } = require("../db");

function hashKey(key) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

function idempotency() {
  return async function (req, res, next) {
    const key = req.headers["idempotency-key"];
    if (!key || req.method === "GET") return next();

    const keyHash = hashKey(key);
    const fingerprint = crypto
      .createHash("sha256")
      .update(JSON.stringify({ url: req.originalUrl, body: req.body }))
      .digest("hex");

    const [rows] = await pool.query(
      "SELECT response_body, status_code, request_fingerprint FROM idempotency_keys WHERE key_hash = ?",
      [keyHash]
    );
    if (rows.length) {
      if (rows[0].request_fingerprint !== fingerprint) {
        return res
          .status(409)
          .json({ error: "Idempotency key replay with different request" });
      }
      res.setHeader("X-Idempotent", "true");
      return res
        .status(rows[0].status_code)
        .json(JSON.parse(rows[0].response_body));
    }

    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      try {
        await pool.query(
          "INSERT INTO idempotency_keys (key_hash, request_fingerprint, response_body, status_code) VALUES (?, ?, ?, ?)",
          [keyHash, fingerprint, JSON.stringify(body), res.statusCode]
        );
      } catch {}
      return originalJson(body);
    };

    next();
  };
}

module.exports = { idempotency };

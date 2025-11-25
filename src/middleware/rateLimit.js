const { config } = require("../config");

const windowMs = config.rateLimit.windowMs;
const max = config.rateLimit.max;
const buckets = new Map();

function rateLimit() {
  return function (req, res, next) {
    const key = req.ip;
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || now - bucket.start > windowMs) {
      bucket = { start: now, count: 0 };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      return res.status(429).json({ error: "Too Many Requests" });
    }
    next();
  };
}

module.exports = { rateLimit };

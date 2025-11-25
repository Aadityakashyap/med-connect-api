const { pool } = require("../db");

function audit(
  action,
  resource,
  resourceIdSelector = () => null,
  metadataSelector = () => ({})
) {
  return async function (req, res, next) {
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      try {
        const resourceId = resourceIdSelector(req, body);
        const metadata = metadataSelector(req, body);
        await pool.query(
          "INSERT INTO audit_logs (user_id, action, resource, resource_id, metadata, ip) VALUES (?, ?, ?, ?, ?, ?)",
          [
            req.user?.id || null,
            action,
            resource,
            resourceId,
            JSON.stringify(metadata),
            req.ip,
          ]
        );
      } catch {}
      return originalJson(body);
    };
    next();
  };
}

module.exports = { audit };

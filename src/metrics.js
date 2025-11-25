const client = require("prom-client");
const { config } = require("./config");

const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"],
});
const httpLatencyHistogram = new client.Histogram({
  name: "http_request_duration_ms",
  help: "HTTP request latency in ms",
  labelNames: ["method", "route", "status"],
  buckets: [50, 100, 200, 300, 500, 1000, 2000],
});

registry.registerMetric(httpRequestCounter);
registry.registerMetric(httpLatencyHistogram);

function metricsMiddleware(req, res, next) {
  if (!config.observability.metricsEnabled) return next();
  const start = Date.now();
  res.on("finish", () => {
    const route = req.route?.path || req.path;
    const status = String(res.statusCode);
    const duration = Date.now() - start;
    httpRequestCounter.labels(req.method, route, status).inc();
    httpLatencyHistogram.labels(req.method, route, status).observe(duration);
  });
  next();
}

module.exports = {
  registry,
  httpRequestCounter,
  httpLatencyHistogram,
  metricsMiddleware,
};

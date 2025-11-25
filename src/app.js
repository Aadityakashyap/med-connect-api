const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const { config } = require("./config");
const { metricsMiddleware } = require("./metrics");
const { idempotency } = require("./middleware/idempotency");
const { rateLimit } = require("./middleware/rateLimit");
const { requestId } = require("./middleware/requestId");

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const doctorRoutes = require("./routes/doctors");
const availabilityRoutes = require("./routes/availability");
const consultationRoutes = require("./routes/consultations");
const prescriptionRoutes = require("./routes/prescriptions");
const paymentRoutes = require("./routes/payments");
const searchRoutes = require("./routes/search");
const adminRoutes = require("./routes/admin");
const healthRoute = require("./routes/health");
const metricsRoute = require("./routes/metrics");

const app = express();

app.use(helmet());
app.use(express.json());
app.use(requestId());
app.use(rateLimit());
app.use(idempotency());
app.use(metricsMiddleware);
app.use(morgan(config.env === "development" ? "dev" : "combined"));

app.use("/api", healthRoute);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", metricsRoute);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal Server Error" });
});

module.exports = app;

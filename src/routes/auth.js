const express = require("express");
const { validate } = require("../middleware/requestValidation");
const { registerSchema, loginSchema } = require("../utils/validators");
const {
  register,
  login,
  setupMfa,
  enableMfa,
} = require("../services/authService");
const { audit } = require("../middleware/audit");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/register",
  validate(registerSchema),
  audit("register", "user", (req, body) => body.id),
  async (req, res) => {
    try {
      const user = await register(req.validated.body);
      res.status(201).json(user);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);

router.post(
  "/login",
  validate(loginSchema),
  audit("login", "user", (req) => req.body.email),
  async (req, res) => {
    try {
      const data = await login(req.validated.body);
      res.json(data);
    } catch (e) {
      res.status(401).json({ error: e.message });
    }
  }
);

router.post("/mfa/setup", requireAuth(), async (req, res) => {
  try {
    const setup = await setupMfa(req.user.id);
    res.json(setup);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/mfa/enable", requireAuth(), async (req, res) => {
  try {
    const { token } = req.body;
    const result = await enableMfa(req.user.id, token);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;

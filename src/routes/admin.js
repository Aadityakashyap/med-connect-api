const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { getAdminStats } = require("../services/analyticsService");

const router = express.Router();

router.get("/stats", requireAuth(["admin"]), async (req, res) => {
  const stats = await getAdminStats();
  res.json(stats);
});

module.exports = router;

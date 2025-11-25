const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { pool } = require("../db");

const router = express.Router();

router.post("/authorize", requireAuth(["patient"]), async (req, res) => {
  const { consultation_id, amount } = req.body;
  if (!consultation_id || !amount)
    return res.status(400).json({ error: "Missing fields" });
  const [existing] = await pool.query(
    'SELECT id FROM payments WHERE consultation_id = ? AND status = "authorized"',
    [consultation_id]
  );
  if (existing.length)
    return res.json({ id: existing[0].id, status: "authorized" });

  const [result] = await pool.query(
    "INSERT INTO payments (consultation_id, amount, status) VALUES (?, ?, ?)",
    [consultation_id, amount, "authorized"]
  );
  res.status(201).json({ id: result.insertId, status: "authorized" });
});

module.exports = router;

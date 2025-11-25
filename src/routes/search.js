const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { pool } = require("../db");

const router = express.Router();

router.get("/", requireAuth(), async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  const term = `%${q}%`;
  const [rows] = await pool.query(
    `
    SELECT 'doctor' AS type, d.id, p.full_name, d.specialization FROM doctors d
    JOIN users u ON u.id = d.user_id
    JOIN profiles p ON p.user_id = u.id
    WHERE p.full_name LIKE ? OR d.specialization LIKE ?
    UNION ALL
    SELECT 'consultation' AS type, c.id, p.full_name, c.status FROM consultations c
    JOIN profiles p ON p.user_id = c.patient_id
    WHERE p.full_name LIKE ? OR c.status LIKE ?
  `,
    [term, term, term, term]
  );
  res.json(rows);
});

module.exports = router;

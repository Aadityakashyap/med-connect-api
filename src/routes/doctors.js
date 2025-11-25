const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { audit } = require("../middleware/audit");
const { pool } = require("../db");

const router = express.Router();

router.post(
  "/",
  requireAuth(["doctor", "admin"]),
  audit("create", "doctor", (req, body) => body.id),
  async (req, res) => {
    try {
      const { specialization, experience_years, license_number } = req.body;
      const [exists] = await pool.query(
        "SELECT id FROM doctors WHERE user_id = ?",
        [req.user.id]
      );
      if (exists.length)
        return res.status(400).json({ error: "Doctor profile already exists" });

      const [result] = await pool.query(
        "INSERT INTO doctors (user_id, specialization, experience_years, license_number) VALUES (?, ?, ?, ?)",
        [req.user.id, specialization, experience_years || 0, license_number]
      );
      res.status(201).json({ id: result.insertId });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);

router.get("/", requireAuth(), async (req, res) => {
  const { q, specialization } = req.query;
  let sql = `
    SELECT d.id, d.specialization, d.experience_years, p.full_name
    FROM doctors d
    JOIN users u ON u.id = d.user_id
    JOIN profiles p ON p.user_id = u.id
    WHERE 1=1`;
  const params = [];
  if (specialization) {
    sql += " AND d.specialization LIKE ?";
    params.push(`%${specialization}%`);
  }
  if (q) {
    sql += " AND p.full_name LIKE ?";
    params.push(`%${q}%`);
  }
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

module.exports = router;

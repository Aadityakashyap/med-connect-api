const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { pool } = require("../db");

const router = express.Router();

router.get("/me", requireAuth(), async (req, res) => {
  const [[row]] = await pool.query(
    `
    SELECT u.id, u.email, u.role, p.full_name, p.phone, p.date_of_birth, p.gender, p.address
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    WHERE u.id = ?`,
    [req.user.id]
  );
  res.json(row || {});
});

module.exports = router;

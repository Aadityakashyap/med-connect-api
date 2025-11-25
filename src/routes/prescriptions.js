const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/requestValidation");
const { prescriptionSchema } = require("../utils/validators");
const { pool } = require("../db");

const router = express.Router();

router.post(
  "/",
  requireAuth(["doctor"]),
  validate(prescriptionSchema),
  async (req, res) => {
    try {
      const { consultation_id, content } = req.validated.body;
      const [[cons]] = await pool.query(
        "SELECT doctor_id, patient_id FROM consultations WHERE id = ?",
        [consultation_id]
      );
      if (!cons)
        return res.status(404).json({ error: "Consultation not found" });
      if (cons.doctor_id !== req.user.id)
        return res.status(403).json({ error: "Not your consultation" });

      const [result] = await pool.query(
        "INSERT INTO prescriptions (consultation_id, doctor_id, patient_id, content) VALUES (?, ?, ?, ?)",
        [consultation_id, req.user.id, cons.patient_id, content]
      );
      res.status(201).json({ id: result.insertId });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);

router.get("/me", requireAuth(), async (req, res) => {
  const role = req.user.role;
  let sql, params;
  if (role === "doctor") {
    sql =
      "SELECT * FROM prescriptions WHERE doctor_id = ? ORDER BY created_at DESC";
    params = [req.user.id];
  } else {
    sql =
      "SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY created_at DESC";
    params = [req.user.id];
  }
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

module.exports = router;

const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/requestValidation");
const { bookSchema } = require("../utils/validators");
const { bookSlot } = require("../services/bookingService");
const { audit } = require("../middleware/audit");
const { pool } = require("../db");

const router = express.Router();

router.post(
  "/book",
  requireAuth(["patient"]),
  validate(bookSchema),
  audit("book", "consultation", (req, body) => body.consultation_id),
  async (req, res) => {
    try {
      const { slot_id } = req.validated.body;
      const result = await bookSlot({
        patientId: req.user.id,
        slotId: slot_id,
      });
      res.status(201).json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);

router.patch(
  "/:id/status",
  requireAuth(["doctor", "admin"]),
  async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ["scheduled", "in_progress", "completed", "cancelled"];
    if (!allowed.includes(status))
      return res.status(400).json({ error: "Invalid status" });
    await pool.query("UPDATE consultations SET status = ? WHERE id = ?", [
      status,
      id,
    ]);
    res.json({ id, status });
  }
);

router.get("/me", requireAuth(), async (req, res) => {
  const isDoctor = req.user.role === "doctor";
  const [rows] = await pool.query(
    `SELECT c.id, c.status, c.created_at, p.full_name AS patient_name, duser.email AS doctor_email
     FROM consultations c
     JOIN users duser ON duser.id = c.doctor_id
     JOIN profiles p ON p.user_id = c.patient_id
     WHERE ${
       isDoctor ? "c.doctor_id = ?" : "c.patient_id = ?"
     } ORDER BY c.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

module.exports = router;

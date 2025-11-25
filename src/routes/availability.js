const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/requestValidation");
const { availabilityCreateSchema } = require("../utils/validators");
const { createAvailability } = require("../services/bookingService");
const { pool } = require("../db");

const router = express.Router();

router.post(
  "/",
  requireAuth(["doctor"]),
  validate(availabilityCreateSchema),
  async (req, res) => {
    try {
      const { start_time, end_time } = req.validated.body;
      const created = await createAvailability({
        doctorId: req.user.id,
        start: new Date(start_time),
        end: new Date(end_time),
      });
      res.status(201).json(created);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);

router.get("/:doctorId", requireAuth(), async (req, res) => {
  const { doctorId } = req.params;
  const [rows] = await pool.query(
    'SELECT id, start_time, end_time, status FROM availability_slots WHERE doctor_id = ? AND status = "available" ORDER BY start_time ASC',
    [doctorId]
  );
  res.json(rows);
});

module.exports = router;

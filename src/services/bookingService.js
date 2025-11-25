const { withTransaction } = require("../db");

async function createAvailability({ doctorId, start, end }) {
  return withTransaction(async (conn) => {
    const [res] = await conn.query(
      "INSERT INTO availability_slots (doctor_id, start_time, end_time, status) VALUES (?, ?, ?, ?)",
      [doctorId, start, end, "available"]
    );
    return {
      id: res.insertId,
      doctor_id: doctorId,
      start_time: start,
      end_time: end,
      status: "available",
    };
  });
}

async function bookSlot({ patientId, slotId }) {
  return withTransaction(async (conn) => {
    const [slots] = await conn.query(
      "SELECT id, doctor_id, status FROM availability_slots WHERE id = ? FOR UPDATE",
      [slotId]
    );
    if (!slots.length) throw new Error("Slot not found");
    const slot = slots[0];
    if (slot.status !== "available") throw new Error("Slot not available");

    await conn.query("UPDATE availability_slots SET status = ? WHERE id = ?", [
      "booked",
      slotId,
    ]);

    const [res] = await conn.query(
      "INSERT INTO consultations (patient_id, doctor_id, slot_id, status) VALUES (?, ?, ?, ?)",
      [patientId, slot.doctor_id, slotId, "scheduled"]
    );

    return {
      consultation_id: res.insertId,
      slot_id: slotId,
      doctor_id: slot.doctor_id,
    };
  });
}

module.exports = { createAvailability, bookSlot };

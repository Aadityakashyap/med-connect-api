const { pool } = require("../db");

async function getAdminStats() {
  const [[usersCount]] = await pool.query(
    "SELECT COUNT(*) AS users FROM users"
  );
  const [[doctorsCount]] = await pool.query(
    "SELECT COUNT(*) AS doctors FROM doctors"
  );
  const [[consToday]] = await pool.query(
    "SELECT COUNT(*) AS consultations_today FROM consultations WHERE DATE(created_at) = CURDATE()"
  );
  const [[completed]] = await pool.query(
    "SELECT COUNT(*) AS completed FROM consultations WHERE status='completed'"
  );
  return {
    users: usersCount.users,
    doctors: doctorsCount.doctors,
    consultations_today: consToday.consultations_today,
    completed_consultations: completed.completed,
  };
}

module.exports = { getAdminStats };

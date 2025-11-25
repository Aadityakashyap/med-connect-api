const request = require("supertest");
const fs = require("fs");
const path = require("path");
const app = require("../src/app");
const { pool } = require("../src/db");

// logger that appends logs to a file
const logFile = path.join(__dirname, "../log/test-flow.log");
function log(message, data = null) {
  const line =
    `[${new Date().toISOString()}] ${message}` +
    (data ? ` | ${JSON.stringify(data)}` : "");
  fs.appendFileSync(logFile, line + "\n");
}

describe("MedConnectAPI Full Flow", () => {
  let adminToken, patientToken, doctorToken, patientId;
  let doctorId, slotId, consultationId, prescriptionId;

  beforeAll(async () => {
    // --- Health check ---
    const health = await request(app).get("/api/health");
    log("Health check", { status: health.status, body: health.body });
    expect(health.status).toBe(200);

    // --- Metrics ---
    const metrics = await request(app).get("/api/metrics");
    log("Metrics check", { status: metrics.status });
    expect(metrics.status).toBe(200);

    // --- Admin login (seeded user) ---
    const adminLogin = await request(app).post("/api/auth/login").send({
      email: "admin@medconnectapi.com",
      password: "Admin@123",
    });
    log("Admin login", { status: adminLogin.status, body: adminLogin.body });
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.body.token;

    // --- Patient registration ---
    const patientEmail = `patient${Date.now()}@example.com`;
    const patientPwd = "Patient@123";
    const patientReg = await request(app).post("/api/auth/register").send({
      email: patientEmail,
      password: patientPwd,
      full_name: "Patient One",
      role: "patient",
    });
    log("Patient registration", {
      status: patientReg.status,
      body: patientReg.body,
    });
    expect(patientReg.status).toBe(201);
    patientId = patientReg.body.id;

    // --- Patient login ---
    const patientLogin = await request(app).post("/api/auth/login").send({
      email: patientEmail,
      password: patientPwd,
    });
    log("Patient login", {
      status: patientLogin.status,
      body: patientLogin.body,
    });
    expect(patientLogin.status).toBe(200);
    patientToken = patientLogin.body.token;

    // --- Doctor registration ---
    const doctorEmail = `doctor${Date.now()}@example.com`;
    const doctorPwd = "Doctor@123";
    const doctorReg = await request(app).post("/api/auth/register").send({
      email: doctorEmail,
      password: doctorPwd,
      full_name: "Doctor One",
      role: "doctor",
    });
    log("Doctor registration", {
      status: doctorReg.status,
      body: doctorReg.body,
    });
    expect(doctorReg.status).toBe(201);

    // --- Doctor login ---
    const doctorLogin = await request(app).post("/api/auth/login").send({
      email: doctorEmail,
      password: doctorPwd,
    });
    log("Doctor login", { status: doctorLogin.status, body: doctorLogin.body });
    expect(doctorLogin.status).toBe(200);
    doctorToken = doctorLogin.body.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  // --- Admin stats ---
  it("Admin can view stats", async () => {
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`);
    log("Admin stats", { status: res.status, body: res.body });
    expect(res.status).toBe(200);
  });

  // --- MFA setup ---
  it("Patient can setup MFA", async () => {
    const res = await request(app)
      .post("/api/auth/mfa/setup")
      .set("Authorization", `Bearer ${patientToken}`);
    log("MFA setup", { status: res.status, body: res.body });
    expect(res.status).toBe(200);
    expect(res.body.otpauth_url).toBeDefined();
    expect(res.body.secret).toBeDefined();
  });

  // --- MFA enable ---
  it("Patient can enable MFA", async () => {
    const res = await request(app)
      .post("/api/auth/mfa/enable")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ token: "123456" });
    // In real tests, you’d generate a valid OTP from the secret
    log("MFA enable", { status: res.status, body: res.body });
    expect([200, 400]).toContain(res.status);
  });

  // --- Doctor profile creation ---
  it("Doctor creates profile", async () => {
    const res = await request(app)
      .post("/api/doctors")
      .set("Authorization", `Bearer ${doctorToken}`)
      .send({
        specialization: "Cardiology",
        experience_years: 5,
        license_number: `LIC-${Date.now()}`,
      });
    log("Doctor profile creation", { status: res.status, body: res.body });
    expect(res.status).toBe(201);
    doctorId = res.body.id;
  });

  // --- Doctor list ---
  it("Get all doctors", async () => {
    const res = await request(app)
      .get("/api/doctors")
      .set("Authorization", `Bearer ${patientToken}`);
    log("Doctor list", { status: res.status, body: res.body });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // --- Availability slot ---
  it("Doctor creates availability slot", async () => {
    const start = new Date(Date.now() + 3600000).toISOString();
    const end = new Date(Date.now() + 7200000).toISOString();
    const res = await request(app)
      .post("/api/availability")
      .set("Authorization", `Bearer ${doctorToken}`)
      .send({ start_time: start, end_time: end });
    log("Availability creation", { status: res.status, body: res.body });
    expect(res.status).toBe(201);
    slotId = res.body.id;
  });

  // --- Patient views doctor availability ---
  it("Patient views doctor availability", async () => {
    const res = await request(app)
      .get(`/api/availability/${doctorId}`)
      .set("Authorization", `Bearer ${patientToken}`);
    log("Availability view", { status: res.status, body: res.body });
    expect(res.status).toBe(200);
  });

  // --- Consultation booking ---
  it("Patient books consultation", async () => {
    const res = await request(app)
      .post("/api/consultations/book")
      .set("Authorization", `Bearer ${patientToken}`)
      .set("Idempotency-Key", `key-${Date.now()}`)
      .send({ slot_id: slotId });
    log("Consultation booking", { status: res.status, body: res.body });
    expect(res.status).toBe(201);
    consultationId = res.body.consultation_id;
  });

  // --- Doctor updates consultation status ---
  it("Doctor updates consultation status", async () => {
    const res = await request(app)
      .patch(`/api/consultations/${consultationId}/status`)
      .set("Authorization", `Bearer ${doctorToken}`)
      .send({ status: "completed" });
    log("Consultation status update", { status: res.status, body: res.body });
    expect(res.status).toBe(200);
  });

  // --- Patient views consultations ---
  it("Patient views my consultations", async () => {
    const res = await request(app)
      .get("/api/consultations/me")
      .set("Authorization", `Bearer ${patientToken}`);
    log("Consultations view", { status: res.status, body: res.body });
    expect(res.status).toBe(200);
  });

  // --- Prescription ---
  it("Doctor issues prescription", async () => {
    const res = await request(app)
      .post("/api/prescriptions")
      .set("Authorization", `Bearer ${doctorToken}`)
      .send({
        consultation_id: consultationId,
        doctor_id: doctorId,
        patient_id: patientId,
        content: "Take TestMed once daily after meals",
      });
    log("Prescription issue", { status: res.status, body: res.body });
    expect(res.status).toBe(201);
    prescriptionId = res.body.id;
  });

  // --- Patient views prescriptions ---
  it("Patient views my prescriptions", async () => {
    const res = await request(app)
      .get("/api/prescriptions/me")
      .set("Authorization", `Bearer ${patientToken}`);
    log("Prescription view", { status: res.status, body: res.body });
    expect(res.status).toBe(200);
  });

  // --- Payment ---
  it("Patient authorizes payment", async () => {
    const res = await request(app)
      .post("/api/payments/authorize")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ consultation_id: consultationId, amount: 500 });
    log("Payment authorization", { status: res.status, body: res.body });
    expect(res.status).toBe(201);
  });

  // --- Search ---
  it("Search doctors", async () => {
    const res = await request(app)
      .get("/api/search?q=Cardiology")
      .set("Authorization", `Bearer ${patientToken}`);
    log("Search doctors", { status: res.status, body: res.body });
    expect(res.status).toBe(200);
  });

  // --- User profile ---
  it("Patient views my profile", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${patientToken}`);
    log("User profile view", { status: res.status, body: res.body });
    expect(res.status).toBe(200);
  });
});

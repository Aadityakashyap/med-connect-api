const { pool } = require("../db");
const { hashPassword, verifyPassword } = require("../utils/crypto");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const { config } = require("../config");

async function register({ email, password, full_name, role }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [existing] = await conn.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (existing.length) throw new Error("Email already registered");
    const pwdHash = await hashPassword(password);
    const [result] = await conn.query(
      "INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
      [email, pwdHash, role]
    );
    const userId = result.insertId;
    await conn.query(
      "INSERT INTO profiles (user_id, full_name) VALUES (?, ?)",
      [userId, full_name]
    );
    await conn.commit();
    return { id: userId, email, role };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function login({ email, password, mfa_token }) {
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
    email,
  ]);
  if (!rows.length) throw new Error("Invalid credentials");
  const user = rows[0];
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) throw new Error("Invalid credentials");

  if (user.mfa_enabled) {
    if (!mfa_token) throw new Error("MFA required");
    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: "base32",
      token: mfa_token,
      window: 1,
    });
    if (!verified) throw new Error("Invalid MFA token");
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    config.security.jwtSecret,
    {
      expiresIn: config.security.jwtExpiresIn,
    }
  );
  return { token };
}

async function setupMfa(userId) {
  const secret = speakeasy.generateSecret({ length: 20 });
  await pool.query(
    "UPDATE users SET mfa_secret = ?, mfa_enabled = 0 WHERE id = ?",
    [secret.base32, userId]
  );
  return { secret: secret.base32, otpauth_url: secret.otpauth_url };
}

async function enableMfa(userId, token) {
  const [rows] = await pool.query("SELECT mfa_secret FROM users WHERE id = ?", [
    userId,
  ]);
  if (!rows.length || !rows[0].mfa_secret)
    throw new Error("MFA not initialized");
  const verified = speakeasy.totp.verify({
    secret: rows[0].mfa_secret,
    encoding: "base32",
    token,
    window: 1,
  });
  if (!verified) throw new Error("Invalid MFA token");
  await pool.query("UPDATE users SET mfa_enabled = 1 WHERE id = ?", [userId]);
  return { enabled: true };
}

module.exports = { register, login, setupMfa, enableMfa };

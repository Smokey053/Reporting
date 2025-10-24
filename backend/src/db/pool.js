import "../config/env.js";
import mysql from "mysql2/promise";

const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];

const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.warn(
    `Database configuration is incomplete. Missing env vars: ${missing.join(
      ", "
    )}`
  );
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_LIMIT || 10),
  queueLimit: 0,
  timezone: "Z",
  namedPlaceholders: true,
});

export default pool;

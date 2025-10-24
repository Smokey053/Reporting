import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import pool from "../db/pool.js";

const router = Router();
const defaultSecret = "dev-secret-change-me";
const approvalRequired =
  (process.env.REQUIRE_APPROVAL ?? "true").toLowerCase() === "true";

const rolePrefixes = {
  student: "STU",
  lecturer: "LEC",
  principal_lecturer: "PRL",
  program_leader: "PLD",
  admin: "ADM",
};

const makeUserId = (role) => {
  const prefix = rolePrefixes[role] || "USR";
  const suffix = nanoid(6).toUpperCase();
  return `${prefix}-${suffix}`.slice(0, 20);
};

const mapUserRow = (row) => ({
  id: row.id,
  userId: row.user_id,
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  role: row.role,
  facultyId: row.faculty_id,
  facultyName: row.faculty_name ?? null,
  approved: Boolean(row.is_approved),
});

const signToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      role: user.role,
      name: `${user.firstName} ${user.lastName}`,
      facultyId: user.facultyId,
    },
    process.env.JWT_SECRET || defaultSecret,
    { expiresIn: "12h" }
  );

router.get("/faculties", async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, faculty_code AS code, faculty_name AS name
       FROM faculties
       ORDER BY faculty_name`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const [rows] = await pool.execute(
      `SELECT u.*, f.faculty_name
       FROM users u
       LEFT JOIN faculties f ON f.id = u.faculty_id
       WHERE LOWER(u.email) = LOWER(?)
       LIMIT 1`,
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const userRow = rows[0];
    if (!userRow.password_hash) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, userRow.password_hash);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (approvalRequired && !userRow.is_approved) {
      return res.status(403).json({ message: "Account pending approval" });
    }

    const user = mapUserRow(userRow);
    const token = signToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        facultyId: user.facultyId,
        facultyName: user.facultyName,
        userId: user.userId,
        email: user.email,
        approved: user.approved,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/register", async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      facultyId,
      registrationCode,
    } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedEmail = email.toLowerCase();

    const [existing] = await pool.execute(
      `SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1`,
      [normalizedEmail]
    );

    if (existing.length) {
      return res.status(409).json({ message: "Email already exists" });
    }

    let resolvedFacultyId = facultyId ? Number(facultyId) : null;

    if (role !== "student") {
      if (!registrationCode) {
        return res
          .status(400)
          .json({ message: "Registration code is required" });
      }

      const [codes] = await pool.execute(
        `SELECT *
         FROM registration_codes
         WHERE code = ?
           AND role = ?
           AND is_active = 1
           AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)
         LIMIT 1`,
        [registrationCode, role]
      );

      if (!codes.length) {
        return res
          .status(400)
          .json({ message: "Invalid or expired registration code" });
      }

      resolvedFacultyId = codes[0].faculty_id ?? resolvedFacultyId;
    }

    if (!resolvedFacultyId) {
      return res.status(400).json({ message: "Faculty selection is required" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = makeUserId(role);
    const autoApproved = !approvalRequired || role === "student";

    const [result] = await pool.execute(
      `INSERT INTO users
        (user_id, first_name, last_name, email, password_hash, role, faculty_id, is_approved)
       VALUES
        (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        firstName,
        lastName,
        normalizedEmail,
        passwordHash,
        role,
        resolvedFacultyId,
        autoApproved ? 1 : 0,
      ]
    );

    const insertedId = result.insertId;

    const [rows] = await pool.execute(
      `SELECT u.*, f.faculty_name
       FROM users u
       LEFT JOIN faculties f ON f.id = u.faculty_id
       WHERE u.id = ?`,
      [insertedId]
    );

    const user = mapUserRow(rows[0]);
    const token = signToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        facultyId: user.facultyId,
        facultyName: user.facultyName,
        userId: user.userId,
        email: user.email,
        approved: user.approved,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

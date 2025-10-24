import bcrypt from "bcryptjs";
import pool from "./pool.js";

const demoUsers = [
  {
    userId: "ADM001",
    firstName: "System",
    lastName: "Administrator",
    email: "admin@luct.ac.ls",
    role: "admin",
    facultyCode: null,
    approved: true,
    password: process.env.DEMO_ADMIN_PASSWORD || "admin123",
  },
  {
    userId: "PL001",
    firstName: "Naledi",
    lastName: "Molefe",
    email: "naledi.molefe@luct.ac.ls",
    role: "program_leader",
    facultyCode: "FICT",
    approved: true,
    password: process.env.DEMO_STAFF_PASSWORD || "secure123",
  },
  {
    userId: "PRL001",
    firstName: "Thabo",
    lastName: "Makoanyane",
    email: "thabo.makoanyane@luct.ac.ls",
    role: "principal_lecturer",
    facultyCode: "FICT",
    approved: true,
    password: process.env.DEMO_STAFF_PASSWORD || "secure123",
  },
  {
    userId: "LEC001",
    firstName: "Boitumelo",
    lastName: "Tebello",
    email: "boitumelo.tebello@luct.ac.ls",
    role: "lecturer",
    facultyCode: "FICT",
    approved: true,
    password: process.env.DEMO_STAFF_PASSWORD || "secure123",
  },
  {
    userId: "STU001",
    firstName: "Lerato",
    lastName: "Sechele",
    email: "lerato.sechele@luct.ac.ls",
    role: "student",
    facultyCode: "FICT",
    approved: true,
    password: process.env.DEMO_STUDENT_PASSWORD || "learn123",
  },
];

const facultyCache = new Map();

const resolveFacultyId = async (code) => {
  if (!code) return null;
  if (facultyCache.has(code)) {
    return facultyCache.get(code);
  }

  const [rows] = await pool.execute(
    `SELECT id FROM faculties WHERE faculty_code = ? LIMIT 1`,
    [code]
  );

  if (!rows.length) {
    throw new Error(`Faculty with code ${code} not found`);
  }

  const facultyId = rows[0].id;
  facultyCache.set(code, facultyId);
  return facultyId;
};

const ensureDemoUsers = async () => {
  for (const user of demoUsers) {
    const facultyId = await resolveFacultyId(user.facultyCode);
    const passwordHash = await bcrypt.hash(user.password, 10);
    const normalizedEmail = user.email.toLowerCase();

    let existing = null;

    const [byIdRows] = await pool.execute(
      `SELECT id, user_id, email, password_hash FROM users WHERE user_id = ? LIMIT 1`,
      [user.userId]
    );

    if (byIdRows.length) {
      existing = byIdRows[0];
    } else {
      const [byEmailRows] = await pool.execute(
        `SELECT id, user_id, email, password_hash FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1`,
        [normalizedEmail]
      );

      if (byEmailRows.length) {
        existing = byEmailRows[0];
      }
    }

    if (!existing) {
      await pool.execute(
        `INSERT INTO users
           (user_id, first_name, last_name, email, password_hash, role, faculty_id, is_approved)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.userId,
          user.firstName,
          user.lastName,
          normalizedEmail,
          passwordHash,
          user.role,
          facultyId,
          user.approved ? 1 : 0,
        ]
      );
      continue;
    }

    let updateQuery = `UPDATE users
           SET first_name = ?, last_name = ?, email = ?, user_id = ?, role = ?, faculty_id = ?, is_approved = ?
         WHERE id = ?`;
    const updateParams = [
      user.firstName,
      user.lastName,
      normalizedEmail,
      user.userId,
      user.role,
      facultyId,
      user.approved ? 1 : 0,
      existing.id,
    ];

    let needsPasswordUpdate = true;
    if (existing.password_hash && existing.password_hash.startsWith("$2")) {
      needsPasswordUpdate = !(await bcrypt.compare(
        user.password,
        existing.password_hash
      ));
    }

    if (needsPasswordUpdate) {
      updateQuery = `UPDATE users
           SET password_hash = ?, first_name = ?, last_name = ?, email = ?, user_id = ?, role = ?, faculty_id = ?, is_approved = ?
         WHERE id = ?`;
      updateParams.unshift(passwordHash);
    }

    await pool.execute(updateQuery, updateParams);
  }
};

export const ensureDemoData = async () => {
  if ((process.env.SKIP_DEMO_SEED || "").toLowerCase() === "true") {
    return;
  }

  await ensureDemoUsers();
};

import { Router } from "express";
import pool from "../db/pool.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = Router();

// Middleware to check admin role
const checkAdmin = [authenticate, authorize("admin")];

// ============================================================================
// FACULTIES MANAGEMENT
// ============================================================================

// Get all faculties
router.get("/faculties", checkAdmin, async (req, res, next) => {
  try {
    const [faculties] = await pool.execute(`
      SELECT id,
             faculty_code AS code,
             faculty_name AS name,
             description,
             created_at AS createdAt,
             updated_at AS updatedAt
      FROM faculties
      ORDER BY faculty_name
    `);

    res.json(faculties);
  } catch (error) {
    next(error);
  }
});

// Create new faculty
router.post("/faculties", checkAdmin, async (req, res, next) => {
  try {
    const { code, name, description } = req.body;

    if (!code || !name) {
      const err = new Error("Faculty code and name are required");
      err.status = 400;
      throw err;
    }

    const [result] = await pool.execute(
      `INSERT INTO faculties (faculty_code, faculty_name, description)
       VALUES (?, ?, ?)`,
      [code.toUpperCase(), name, description || null]
    );

    res.status(201).json({
      id: result.insertId,
      code: code.toUpperCase(),
      name,
      description,
      message: "Faculty created successfully",
    });
  } catch (error) {
    next(error);
  }
});

// Update faculty
router.put("/faculties/:id", checkAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, name, description } = req.body;

    if (!code || !name) {
      const err = new Error("Faculty code and name are required");
      err.status = 400;
      throw err;
    }

    await pool.execute(
      `UPDATE faculties 
       SET faculty_code = ?, faculty_name = ?, description = ?
       WHERE id = ?`,
      [code.toUpperCase(), name, description || null, id]
    );

    res.json({
      id: parseInt(id),
      code: code.toUpperCase(),
      name,
      description,
      message: "Faculty updated successfully",
    });
  } catch (error) {
    next(error);
  }
});

// Delete faculty
router.delete("/faculties/:id", checkAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    await pool.execute(`DELETE FROM faculties WHERE id = ?`, [id]);

    res.json({ message: "Faculty deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// PROGRAMS MANAGEMENT
// ============================================================================

// Get all programs
router.get("/programs", checkAdmin, async (req, res, next) => {
  try {
    const [programs] = await pool.execute(`
      SELECT p.id,
             p.program_code AS code,
             p.program_name AS name,
             p.level,
             p.duration_years AS durationYears,
             p.faculty_id AS facultyId,
             f.faculty_name AS facultyName,
             p.created_at AS createdAt
      FROM programs p
      LEFT JOIN faculties f ON f.id = p.faculty_id
      ORDER BY p.program_name
    `);

    res.json(programs);
  } catch (error) {
    next(error);
  }
});

// Create program
router.post("/programs", checkAdmin, async (req, res, next) => {
  try {
    const { code, name, level, durationYears, facultyId } = req.body;

    if (!code || !name || !facultyId) {
      const err = new Error("Program code, name, and faculty are required");
      err.status = 400;
      throw err;
    }

    const [result] = await pool.execute(
      `INSERT INTO programs (program_code, program_name, level, duration_years, faculty_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        code.toUpperCase(),
        name,
        level || null,
        durationYears || null,
        facultyId,
      ]
    );

    res.status(201).json({
      id: result.insertId,
      code: code.toUpperCase(),
      name,
      level,
      durationYears,
      facultyId,
      message: "Program created successfully",
    });
  } catch (error) {
    next(error);
  }
});

// Update program
router.put("/programs/:id", checkAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, name, level, durationYears, facultyId } = req.body;

    if (!code || !name || !facultyId) {
      const err = new Error("Program code, name, and faculty are required");
      err.status = 400;
      throw err;
    }

    await pool.execute(
      `UPDATE programs 
       SET program_code = ?, program_name = ?, level = ?, duration_years = ?, faculty_id = ?
       WHERE id = ?`,
      [
        code.toUpperCase(),
        name,
        level || null,
        durationYears || null,
        facultyId,
        id,
      ]
    );

    res.json({
      id: parseInt(id),
      code: code.toUpperCase(),
      name,
      level,
      durationYears,
      facultyId,
      message: "Program updated successfully",
    });
  } catch (error) {
    next(error);
  }
});

// Delete program
router.delete("/programs/:id", checkAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    await pool.execute(`DELETE FROM programs WHERE id = ?`, [id]);

    res.json({ message: "Program deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// COURSES MANAGEMENT
// ============================================================================

// Get all courses
router.get("/courses", checkAdmin, async (req, res, next) => {
  try {
    const [courses] = await pool.execute(`
      SELECT c.id,
             c.course_code AS code,
             c.course_name AS name,
             c.description AS description,
             c.faculty_id AS facultyId,
             f.faculty_name AS facultyName,
             c.created_at AS createdAt
      FROM courses c
      LEFT JOIN faculties f ON f.id = c.faculty_id
      ORDER BY c.course_name
    `);

    res.json(courses);
  } catch (error) {
    next(error);
  }
});

// Create course
router.post("/courses", checkAdmin, async (req, res, next) => {
  try {
    const { code, name, description, facultyId } = req.body;

    if (!code || !name || !facultyId) {
      const err = new Error("Course code, name, and faculty are required");
      err.status = 400;
      throw err;
    }

    const [result] = await pool.execute(
      `INSERT INTO courses (course_code, course_name, description, faculty_id)
       VALUES (?, ?, ?, ?)`,
      [code.toUpperCase(), name, description || null, facultyId]
    );

    res.status(201).json({
      id: result.insertId,
      code: code.toUpperCase(),
      name,
      description,
      facultyId,
      message: "Course created successfully",
    });
  } catch (error) {
    next(error);
  }
});

// Update course
router.put("/courses/:id", checkAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, name, description, facultyId } = req.body;

    if (!code || !name || !facultyId) {
      const err = new Error("Course code, name, and faculty are required");
      err.status = 400;
      throw err;
    }

    await pool.execute(
      `UPDATE courses 
       SET course_code = ?, course_name = ?, description = ?, faculty_id = ?
       WHERE id = ?`,
      [code.toUpperCase(), name, description || null, facultyId, id]
    );

    res.json({
      id: parseInt(id),
      code: code.toUpperCase(),
      name,
      description,
      facultyId,
      message: "Course updated successfully",
    });
  } catch (error) {
    next(error);
  }
});

// Delete course
router.delete("/courses/:id", checkAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    await pool.execute(`DELETE FROM courses WHERE id = ?`, [id]);

    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// USERS MANAGEMENT
// ============================================================================

// Get all users
router.get("/users", checkAdmin, async (req, res, next) => {
  try {
    const [users] = await pool.execute(`
      SELECT u.id,
             u.user_id AS userId,
             CONCAT(u.first_name, ' ', u.last_name) AS fullName,
             u.first_name AS firstName,
             u.last_name AS lastName,
             u.email,
             u.role,
             u.is_approved AS isApproved,
             u.faculty_id AS facultyId,
             f.faculty_name AS facultyName,
             u.created_at AS createdAt
      FROM users u
      LEFT JOIN faculties f ON f.id = u.faculty_id
      ORDER BY u.created_at DESC
    `);

    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Get pending user approvals
router.get("/users/pending-approvals", checkAdmin, async (req, res, next) => {
  try {
    const [pendingUsers] = await pool.execute(`
      SELECT u.id,
             u.user_id AS userId,
             CONCAT(u.first_name, ' ', u.last_name) AS fullName,
             u.first_name AS firstName,
             u.last_name AS lastName,
             u.email,
             u.role,
             u.is_approved AS isApproved,
             u.faculty_id AS facultyId,
             f.faculty_name AS facultyName,
             u.created_at AS createdAt
      FROM users u
      LEFT JOIN faculties f ON f.id = u.faculty_id
      WHERE u.is_approved = FALSE AND u.role IN ('lecturer', 'principal_lecturer', 'program_leader')
      ORDER BY u.created_at ASC
    `);

    res.json(pendingUsers);
  } catch (error) {
    next(error);
  }
});

// Approve user
router.post("/users/:id/approve", checkAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      `UPDATE users SET is_approved = TRUE WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }

    res.json({ message: "User approved successfully" });
  } catch (error) {
    next(error);
  }
});

// Reject/delete user
router.post("/users/:id/reject", checkAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    await pool.execute(`DELETE FROM users WHERE id = ?`, [id]);

    res.json({ message: "User rejected and deleted" });
  } catch (error) {
    next(error);
  }
});

// Update user role
router.put("/users/:id/role", checkAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = [
      "student",
      "lecturer",
      "principal_lecturer",
      "program_leader",
      "admin",
    ];

    if (!validRoles.includes(role)) {
      const err = new Error("Invalid role");
      err.status = 400;
      throw err;
    }

    await pool.execute(`UPDATE users SET role = ? WHERE id = ?`, [role, id]);

    res.json({ message: "User role updated successfully", role });
  } catch (error) {
    next(error);
  }
});

// Update user faculty
router.put("/users/:id/faculty", checkAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { facultyId } = req.body;

    await pool.execute(`UPDATE users SET faculty_id = ? WHERE id = ?`, [
      facultyId || null,
      id,
    ]);

    res.json({ message: "User faculty updated successfully" });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// REGISTRATION CODES MANAGEMENT
// ============================================================================

// Get all registration codes
router.get("/registration-codes", checkAdmin, async (req, res, next) => {
  try {
    const [codes] = await pool.execute(`
      SELECT rc.id,
             rc.code,
             rc.role,
             rc.is_active AS isActive,
             rc.expires_at AS expiresAt,
             rc.faculty_id AS facultyId,
             f.faculty_name AS facultyName,
             rc.created_at AS createdAt
      FROM registration_codes rc
      LEFT JOIN faculties f ON f.id = rc.faculty_id
      ORDER BY rc.created_at DESC
    `);

    res.json(codes);
  } catch (error) {
    next(error);
  }
});

// Generate registration code
router.post("/registration-codes", checkAdmin, async (req, res, next) => {
  try {
    const { role, facultyId, expiresAt } = req.body;

    const validRoles = ["lecturer", "principal_lecturer", "program_leader"];

    if (!role || !validRoles.includes(role)) {
      const err = new Error("Valid role is required");
      err.status = 400;
      throw err;
    }

    // Generate unique code: ROLE-TIMESTAMP-RANDOM
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `${role.substring(0, 3).toUpperCase()}-${timestamp}-${random}`;

    const [result] = await pool.execute(
      `INSERT INTO registration_codes (code, role, faculty_id, expires_at, is_active)
       VALUES (?, ?, ?, ?, TRUE)`,
      [code, role, facultyId || null, expiresAt || null]
    );

    res.status(201).json({
      id: result.insertId,
      code,
      role,
      isActive: true,
      expiresAt,
      message: "Registration code created successfully",
    });
  } catch (error) {
    next(error);
  }
});

// Deactivate registration code
router.post(
  "/registration-codes/:id/deactivate",
  checkAdmin,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      await pool.execute(
        `UPDATE registration_codes SET is_active = FALSE WHERE id = ?`,
        [id]
      );

      res.json({ message: "Registration code deactivated successfully" });
    } catch (error) {
      next(error);
    }
  }
);

// Delete registration code
router.delete("/registration-codes/:id", checkAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    await pool.execute(`DELETE FROM registration_codes WHERE id = ?`, [id]);

    res.json({ message: "Registration code deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// CLASSES MANAGEMENT
// ============================================================================

// Get all classes with course and lecturer details
router.get("/classes", checkAdmin, async (req, res, next) => {
  try {
    const { courseId, programId, semester, academicYear } = req.query;

    let query = `
      SELECT cl.id,
             cl.class_code AS code,
             cl.course_id AS courseId,
             c.course_code AS courseCode,
             c.course_name AS courseName,
             cl.lecturer_id AS lecturerId,
             CONCAT(u.first_name, ' ', u.last_name) AS lecturerName,
             cl.academic_year AS academicYear,
             cl.semester,
             cl.scheduled_time AS scheduledTime,
             cl.venue,
             cl.mode_of_delivery AS modeOfDelivery,
             cl.created_at AS createdAt
      FROM classes cl
      INNER JOIN courses c ON c.id = cl.course_id
      LEFT JOIN users u ON u.id = cl.lecturer_id
      WHERE 1=1
    `;

    const params = [];

    if (courseId) {
      query += ` AND cl.course_id = ?`;
      params.push(courseId);
    }

    if (semester) {
      query += ` AND cl.semester = ?`;
      params.push(semester);
    }

    if (academicYear) {
      query += ` AND cl.academic_year = ?`;
      params.push(academicYear);
    }

    if (programId) {
      query += ` AND c.program_id = ?`;
      params.push(programId);
    }

    query += ` ORDER BY c.course_name, cl.scheduled_time`;

    const [classes] = await pool.execute(query, params);

    res.json(classes);
  } catch (error) {
    next(error);
  }
});

// Create a new class
router.post("/classes", checkAdmin, async (req, res, next) => {
  try {
    const {
      code,
      courseId,
      lecturerId,
      academicYear,
      semester,
      scheduledTime,
      venue,
      modeOfDelivery,
    } = req.body;

    if (!code || !courseId || !academicYear || !semester) {
      const err = new Error(
        "Class code, course, academic year, and semester are required"
      );
      err.status = 400;
      throw err;
    }

    const [result] = await pool.execute(
      `INSERT INTO classes (class_code, course_id, lecturer_id, academic_year, semester, scheduled_time, venue, mode_of_delivery)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code.toUpperCase(),
        courseId,
        lecturerId || null,
        academicYear,
        semester,
        scheduledTime || null,
        venue || null,
        modeOfDelivery || "On Campus",
      ]
    );

    res.status(201).json({
      id: result.insertId,
      code: code.toUpperCase(),
      courseId,
      lecturerId,
      academicYear,
      semester,
      message: "Class created successfully",
    });
  } catch (error) {
    next(error);
  }
});

// Update a class
router.put("/classes/:id", checkAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      code,
      courseId,
      lecturerId,
      academicYear,
      semester,
      scheduledTime,
      venue,
      modeOfDelivery,
    } = req.body;

    if (!code || !courseId || !academicYear || !semester) {
      const err = new Error(
        "Class code, course, academic year, and semester are required"
      );
      err.status = 400;
      throw err;
    }

    await pool.execute(
      `UPDATE classes 
       SET class_code = ?, course_id = ?, lecturer_id = ?, academic_year = ?, 
           semester = ?, scheduled_time = ?, venue = ?, mode_of_delivery = ?
       WHERE id = ?`,
      [
        code.toUpperCase(),
        courseId,
        lecturerId || null,
        academicYear,
        semester,
        scheduledTime || null,
        venue || null,
        modeOfDelivery || "On Campus",
        id,
      ]
    );

    res.json({
      id: parseInt(id),
      code: code.toUpperCase(),
      courseId,
      lecturerId,
      message: "Class updated successfully",
    });
  } catch (error) {
    next(error);
  }
});

// Assign lecturer to a class
router.put(
  "/classes/:id/assign-lecturer",
  checkAdmin,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { lecturerId } = req.body;

      if (!lecturerId) {
        const err = new Error("Lecturer ID is required");
        err.status = 400;
        throw err;
      }

      // Verify the user is a lecturer
      const [lecturer] = await pool.execute(
        `SELECT id, role, CONCAT(first_name, ' ', last_name) AS fullName 
       FROM users 
       WHERE id = ? AND role IN ('lecturer', 'principal_lecturer')`,
        [lecturerId]
      );

      if (lecturer.length === 0) {
        const err = new Error("Invalid lecturer ID or user is not a lecturer");
        err.status = 400;
        throw err;
      }

      await pool.execute(`UPDATE classes SET lecturer_id = ? WHERE id = ?`, [
        lecturerId,
        id,
      ]);

      res.json({
        id: parseInt(id),
        lecturerId,
        lecturerName: lecturer[0].fullName,
        message: "Lecturer assigned to class successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

// Remove lecturer from a class
router.put(
  "/classes/:id/remove-lecturer",
  checkAdmin,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      await pool.execute(`UPDATE classes SET lecturer_id = NULL WHERE id = ?`, [
        id,
      ]);

      res.json({
        id: parseInt(id),
        message: "Lecturer removed from class successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete a class
router.delete("/classes/:id", checkAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    await pool.execute(`DELETE FROM classes WHERE id = ?`, [id]);

    res.json({ message: "Class deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// Get lecturers available for assignment
router.get("/lecturers", checkAdmin, async (req, res, next) => {
  try {
    const [lecturers] = await pool.execute(`
      SELECT u.id,
             u.user_id AS userId,
             CONCAT(u.first_name, ' ', u.last_name) AS fullName,
             u.email,
             u.role,
             f.faculty_name AS facultyName
      FROM users u
      LEFT JOIN faculties f ON f.id = u.faculty_id
      WHERE u.role IN ('lecturer', 'principal_lecturer')
        AND u.is_approved = TRUE
      ORDER BY u.first_name, u.last_name
    `);

    res.json(lecturers);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SYSTEM STATISTICS
// ============================================================================

// Get system overview/statistics
router.get("/statistics", checkAdmin, async (req, res, next) => {
  try {
    // Total users by role
    const [userStats] = await pool.execute(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `);

    // Total faculties
    const [facultyStats] = await pool.execute(`
      SELECT COUNT(*) as total FROM faculties
    `);

    // Total programs
    const [programStats] = await pool.execute(`
      SELECT COUNT(*) as total FROM programs
    `);

    // Total courses
    const [courseStats] = await pool.execute(`
      SELECT COUNT(*) as total FROM courses
    `);

    // Total reports submitted
    const [reportStats] = await pool.execute(`
      SELECT COUNT(*) as total FROM reports
    `);

    // Pending user approvals
    const [pendingStats] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM users 
      WHERE is_approved = FALSE AND role != 'student'
    `);

    // Reports by status
    const [reportStatusStats] = await pool.execute(`
      SELECT status, COUNT(*) as count
      FROM reports
      GROUP BY status
    `);

    // Active registration codes
    const [codeStats] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM registration_codes 
      WHERE is_active = TRUE
    `);

    res.json({
      usersByRole: userStats.reduce((acc, row) => {
        acc[row.role] = row.count;
        return acc;
      }, {}),
      totalUsers: userStats.reduce((sum, row) => sum + row.count, 0),
      totalFaculties: facultyStats[0]?.total || 0,
      totalPrograms: programStats[0]?.total || 0,
      totalCourses: courseStats[0]?.total || 0,
      totalReports: reportStats[0]?.total || 0,
      pendingApprovals: pendingStats[0]?.total || 0,
      reportsByStatus: reportStatusStats.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {}),
      activeRegistrationCodes: codeStats[0]?.total || 0,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// LECTURER ASSIGNMENT
// ============================================================================

// Get all lecturers (for assignment dropdown)
router.get("/lecturers", checkAdmin, async (req, res, next) => {
  try {
    const [lecturers] = await pool.execute(`
      SELECT u.id,
             u.user_id AS userId,
             CONCAT(u.first_name, ' ', u.last_name) AS name,
             u.email,
             u.faculty_id AS facultyId,
             f.faculty_name AS facultyName
      FROM users u
      LEFT JOIN faculties f ON f.id = u.faculty_id
      WHERE u.role IN ('lecturer', 'principal_lecturer', 'program_leader')
        AND u.is_approved = TRUE
      ORDER BY u.first_name, u.last_name
    `);

    res.json(lecturers);
  } catch (error) {
    next(error);
  }
});

// Assign lecturer to a class
router.put(
  "/classes/:id/assign-lecturer",
  checkAdmin,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { lecturerId } = req.body;

      if (!lecturerId) {
        const err = new Error("Lecturer ID is required");
        err.status = 400;
        throw err;
      }

      // Verify lecturer exists and has appropriate role
      const [lecturer] = await pool.execute(
        `SELECT id, role FROM users 
       WHERE id = ? AND role IN ('lecturer', 'principal_lecturer', 'program_leader')
       LIMIT 1`,
        [lecturerId]
      );

      if (!lecturer.length) {
        const err = new Error("Invalid lecturer ID");
        err.status = 404;
        throw err;
      }

      // Update class with lecturer
      await pool.execute(`UPDATE classes SET lecturer_id = ? WHERE id = ?`, [
        lecturerId,
        id,
      ]);

      // Get updated class details
      const [updatedClass] = await pool.execute(
        `SELECT cl.id,
              cl.class_code AS code,
              cl.course_id AS courseId,
              c.course_code AS courseCode,
              c.course_name AS courseName,
              cl.lecturer_id AS lecturerId,
              CONCAT(u.first_name, ' ', u.last_name) AS lecturerName,
              cl.academic_year AS academicYear,
              cl.semester,
              cl.scheduled_time AS scheduledTime,
              cl.venue,
              cl.mode_of_delivery AS modeOfDelivery
       FROM classes cl
       INNER JOIN courses c ON c.id = cl.course_id
       LEFT JOIN users u ON u.id = cl.lecturer_id
       WHERE cl.id = ?`,
        [id]
      );

      res.json({
        message: "Lecturer assigned successfully",
        class: updatedClass[0],
      });
    } catch (error) {
      next(error);
    }
  }
);

// Unassign lecturer from a class
router.delete(
  "/classes/:id/assign-lecturer",
  checkAdmin,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      await pool.execute(`UPDATE classes SET lecturer_id = NULL WHERE id = ?`, [
        id,
      ]);

      res.json({
        message: "Lecturer unassigned successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get lecturer assignments (classes assigned to a specific lecturer)
router.get(
  "/lecturer-assignments/:lecturerId",
  checkAdmin,
  async (req, res, next) => {
    try {
      const { lecturerId } = req.params;

      const [assignments] = await pool.execute(
        `SELECT cl.id,
              cl.class_code AS code,
              cl.course_id AS courseId,
              c.course_code AS courseCode,
              c.course_name AS courseName,
              cl.academic_year AS academicYear,
              cl.semester,
              cl.scheduled_time AS scheduledTime,
              cl.venue,
              cl.mode_of_delivery AS modeOfDelivery,
              COUNT(DISTINCT se.student_id) AS enrolledStudents
       FROM classes cl
       INNER JOIN courses c ON c.id = cl.course_id
       LEFT JOIN student_enrollments se ON se.class_id = cl.id AND se.enrollment_status = 'active'
       WHERE cl.lecturer_id = ?
       GROUP BY cl.id
       ORDER BY cl.academic_year DESC, cl.semester DESC, c.course_name`,
        [lecturerId]
      );

      res.json(assignments);
    } catch (error) {
      next(error);
    }
  }
);

export default router;

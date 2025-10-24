import { Router } from "express";
import pool from "../db/pool.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = Router();

// Middleware to check admin or specific role
const checkAdmin = [authenticate, authorize("admin")];
const checkAdminOrPL = [authenticate, authorize("admin", "program_leader")];
const checkAdminOrPRL = [
  authenticate,
  authorize("admin", "principal_lecturer"),
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const logAuditAction = async (
  adminId,
  action,
  entityType,
  entityId,
  oldValues = null,
  newValues = null
) => {
  try {
    await pool.execute(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, old_values, new_values)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        adminId,
        action,
        entityType,
        entityId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
      ]
    );
  } catch (error) {
    console.error("Audit log error:", error);
  }
};

// ============================================================================
// SEARCH & FILTER ENDPOINTS
// ============================================================================

// Search across all entities
router.get("/search", checkAdmin, async (req, res, next) => {
  try {
    const { q, type } = req.query;

    if (!q || q.length < 2) {
      return res.json({ results: [] });
    }

    const searchTerm = `%${q}%`;
    let results = {};

    if (!type || type === "faculties") {
      const [faculties] = await pool.execute(
        `SELECT id, faculty_code AS code, faculty_name AS name 
         FROM faculties 
         WHERE faculty_code LIKE ? OR faculty_name LIKE ?
         LIMIT 10`,
        [searchTerm, searchTerm]
      );
      results.faculties = faculties;
    }

    if (!type || type === "programs") {
      const [programs] = await pool.execute(
        `SELECT p.id, p.program_code AS code, p.program_name AS name, f.faculty_name AS faculty
         FROM programs p
         LEFT JOIN faculties f ON f.id = p.faculty_id
         WHERE p.program_code LIKE ? OR p.program_name LIKE ?
         LIMIT 10`,
        [searchTerm, searchTerm]
      );
      results.programs = programs;
    }

    if (!type || type === "courses") {
      const [courses] = await pool.execute(
        `SELECT c.id, c.course_code AS code, c.course_name AS name, f.faculty_name AS faculty
         FROM courses c
         LEFT JOIN faculties f ON f.id = c.faculty_id
         WHERE c.course_code LIKE ? OR c.course_name LIKE ?
         LIMIT 10`,
        [searchTerm, searchTerm]
      );
      results.courses = courses;
    }

    if (!type || type === "users") {
      const [users] = await pool.execute(
        `SELECT id, user_id AS userId, CONCAT(first_name, ' ', last_name) AS fullName, email, role
         FROM users
         WHERE user_id LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?
         LIMIT 10`,
        [searchTerm, searchTerm, searchTerm, searchTerm]
      );
      results.users = users;
    }

    res.json(results);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// PROGRAMS MANAGEMENT - ENHANCED WITH COURSE OFFERINGS
// ============================================================================

// Get programs with course offerings for specific semester and year
router.get("/programs/:id/offerings", checkAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { academicYear, semester } = req.query;

    const [offerings] = await pool.execute(
      `SELECT co.id, c.id AS courseId, c.course_code AS code, c.course_name AS name,
              co.semester, co.year_level AS yearLevel, co.academic_year AS academicYear
       FROM course_offerings co
       JOIN courses c ON c.id = co.course_id
       WHERE co.program_id = ? 
       ${academicYear ? "AND co.academic_year = ?" : ""}
       ${semester ? "AND co.semester = ?" : ""}
       ORDER BY co.year_level, co.semester, c.course_name`,
      [
        id,
        ...(academicYear ? [academicYear] : []),
        ...(semester ? [semester] : []),
      ]
    );

    res.json(offerings);
  } catch (error) {
    next(error);
  }
});

// Add course to program offering
router.post(
  "/programs/:programId/offerings",
  checkAdmin,
  async (req, res, next) => {
    try {
      const { programId } = req.params;
      const { courseId, academicYear, semester, yearLevel } = req.body;

      if (!courseId || !academicYear || !semester || !yearLevel) {
        const err = new Error(
          "Course, academic year, semester, and year level are required"
        );
        err.status = 400;
        throw err;
      }

      const [result] = await pool.execute(
        `INSERT INTO course_offerings (course_id, program_id, academic_year, semester, year_level)
       VALUES (?, ?, ?, ?, ?)`,
        [courseId, programId, academicYear, semester, yearLevel]
      );

      await logAuditAction(
        req.user.id,
        "CREATE",
        "CourseOffering",
        result.insertId,
        null,
        { courseId, academicYear, semester, yearLevel }
      );

      res.status(201).json({
        id: result.insertId,
        courseId,
        academicYear,
        semester,
        yearLevel,
        message: "Course added to program successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

// Remove course from program offering
router.delete(
  "/programs/:programId/offerings/:offeringId",
  checkAdmin,
  async (req, res, next) => {
    try {
      const { programId, offeringId } = req.params;

      await pool.execute(
        `DELETE FROM course_offerings WHERE id = ? AND program_id = ?`,
        [offeringId, programId]
      );

      await logAuditAction(
        req.user.id,
        "DELETE",
        "CourseOffering",
        offeringId,
        null,
        null
      );

      res.json({ message: "Course offering removed successfully" });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// ANALYTICS ENDPOINTS
// ============================================================================

// Get comprehensive analytics
router.get("/analytics", checkAdmin, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Users by role
    const [usersByRole] = await pool.execute(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `);

    // Program distribution by faculty
    const [programsByFaculty] = await pool.execute(`
      SELECT f.faculty_name, COUNT(p.id) as count
      FROM faculties f
      LEFT JOIN programs p ON p.faculty_id = f.id
      GROUP BY f.id, f.faculty_name
    `);

    // Course enrollment stats
    const [courseStats] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT c.id) as totalCourses,
        COUNT(DISTINCT c.program_id) as programsWithCourses
      FROM courses c
    `);

    // Report submission trends (last 30 days)
    const [reportTrends] = await pool.execute(`
      SELECT 
        DATE(r.created_at) as date,
        COUNT(*) as count,
        SUM(CASE WHEN r.status = 'submitted' THEN 1 ELSE 0 END) as submitted,
        SUM(CASE WHEN r.status = 'draft' THEN 1 ELSE 0 END) as draft
      FROM reports r
      WHERE r.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(r.created_at)
      ORDER BY date DESC
    `);

    // Approval stats
    const [approvalStats] = await pool.execute(`
      SELECT 
        COUNT(CASE WHEN is_approved = TRUE THEN 1 END) as approved,
        COUNT(CASE WHEN is_approved = FALSE THEN 1 END) as pending,
        COUNT(*) as total
      FROM users
      WHERE role IN ('lecturer', 'principal_lecturer', 'program_leader')
    `);

    // System health metrics
    const [healthMetrics] = await pool.execute(`
      SELECT 
        (SELECT COUNT(*) FROM users) as totalUsers,
        (SELECT COUNT(*) FROM reports) as totalReports,
        (SELECT COUNT(DISTINCT faculty_id) FROM programs) as activeFaculties,
        (SELECT COUNT(*) FROM courses) as totalCourses
    `);

    res.json({
      usersByRole: usersByRole.map((r) => ({ role: r.role, count: r.count })),
      programsByFaculty: programsByFaculty.map((r) => ({
        faculty: r.faculty_name,
        count: r.count,
      })),
      courseStats: courseStats[0],
      reportTrends,
      approvalStats: approvalStats[0],
      healthMetrics: healthMetrics[0],
    });
  } catch (error) {
    next(error);
  }
});

// Get export history and audit logs
router.get("/audit-logs", checkAdmin, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, entityType } = req.query;

    let query = `
      SELECT al.id, al.admin_id AS adminId, 
             CONCAT(u.first_name, ' ', u.last_name) AS adminName,
             al.action, al.entity_type AS entityType, al.entity_id AS entityId,
             al.old_values AS oldValues, al.new_values AS newValues,
             al.created_at AS createdAt
      FROM audit_logs al
      JOIN users u ON u.id = al.admin_id
      ${entityType ? "WHERE al.entity_type = ?" : ""}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const params = [...(entityType ? [entityType] : []), limit, offset];
    const [logs] = await pool.execute(query, params);

    res.json(logs);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// EXPORT ENDPOINTS
// ============================================================================

// Log export action
router.post("/exports/log", authenticate, async (req, res, next) => {
  try {
    const { exportType, exportModule, filterCriteria, recordCount } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO export_logs (user_id, export_type, export_module, filter_criteria, record_count)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.id,
        exportType,
        exportModule,
        JSON.stringify(filterCriteria),
        recordCount,
      ]
    );

    res.status(201).json({ id: result.insertId, message: "Export logged" });
  } catch (error) {
    next(error);
  }
});

// Get export history
router.get("/exports/history", checkAdminOrPRL, async (req, res, next) => {
  try {
    const [history] = await pool.execute(`
      SELECT el.id, CONCAT(u.first_name, ' ', u.last_name) AS userName,
             el.export_type AS type, el.export_module AS module,
             el.record_count AS records, el.created_at AS createdAt
      FROM export_logs el
      JOIN users u ON u.id = el.user_id
      ORDER BY el.created_at DESC
      LIMIT 100
    `);

    res.json(history);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// ACADEMIC YEAR & SEMESTER MANAGEMENT
// ============================================================================

// Get active academic years
router.get("/academic-years", authenticate, async (req, res, next) => {
  try {
    const [years] = await pool.execute(`
      SELECT DISTINCT academic_year
      FROM programs
      UNION
      SELECT DISTINCT academic_year FROM classes
      ORDER BY academic_year DESC
    `);

    res.json(years.map((y) => y.academic_year));
  } catch (error) {
    next(error);
  }
});

export default router;

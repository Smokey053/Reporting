import { Router } from "express";
import pool from "../db/pool.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = Router();

const mapClassRow = (row) => ({
  id: row.id,
  classCode: row.classCode,
  academicYear: row.academicYear,
  semester: row.semester,
  venue: row.venue,
  scheduledTime: row.scheduledTime,
  schedule: row.schedule,
  mode: row.mode,
  enrollmentStatus: row.enrollmentStatus,
  enrolledAt: row.enrolledAt,
  course: row.courseId
    ? {
        id: row.courseId,
        name: row.courseName,
        code: row.courseCode,
        facultyId: row.facultyId,
      }
    : null,
  lecturer: row.lecturerId
    ? {
        id: row.lecturerId,
        firstName: row.lecturerFirstName,
        lastName: row.lecturerLastName,
      }
    : null,
});

const mapReportRow = (row) => ({
  id: row.id,
  classId: row.classId,
  courseId: row.courseId,
  facultyId: row.facultyId,
  dateOfLecture: row.dateOfLecture,
  weekOfReporting: row.weekOfReporting,
  actualStudentsPresent: row.actualStudentsPresent,
  totalRegisteredStudents: row.totalRegisteredStudents,
  attendancePercentage: row.attendancePercentage,
  topicTaught: row.topicTaught,
  learningOutcomes: row.learningOutcomes,
  recommendations: row.recommendations,
  summary: row.topicTaught,
  actions: row.recommendations,
  status: row.status,
  createdAt: row.createdAt,
  class: row.classId
    ? {
        id: row.classId,
        code: row.classCode,
        semester: row.classSemester,
      }
    : null,
  course: row.courseId
    ? {
        id: row.courseId,
        name: row.courseName,
        code: row.courseCode,
      }
    : null,
});

router.use(authenticate, authorize("student"));

router.get("/classes", async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.id,
              c.class_code AS classCode,
              c.academic_year AS academicYear,
              c.semester,
              c.venue,
        c.mode_of_delivery AS mode,
              TIME_FORMAT(c.scheduled_time, '%H:%i') AS scheduledTime,
              CASE
                WHEN c.scheduled_time IS NULL AND c.venue IS NULL THEN NULL
                WHEN c.scheduled_time IS NULL THEN CONCAT('Venue ', c.venue)
                WHEN c.venue IS NULL THEN TIME_FORMAT(c.scheduled_time, '%H:%i')
                ELSE CONCAT(TIME_FORMAT(c.scheduled_time, '%H:%i'), ' • ', c.venue)
              END AS schedule,
              co.id AS courseId,
              co.course_name AS courseName,
              co.course_code AS courseCode,
              co.faculty_id AS facultyId,
              c.lecturer_id AS lecturerId,
              ul.first_name AS lecturerFirstName,
              ul.last_name AS lecturerLastName,
              se.enrollment_status AS enrollmentStatus,
              DATE_FORMAT(se.enrolled_at, '%Y-%m-%d') AS enrolledAt
       FROM student_enrollments se
       JOIN classes c ON c.id = se.class_id
       LEFT JOIN courses co ON co.id = c.course_id
       LEFT JOIN users ul ON ul.id = c.lecturer_id
       WHERE se.student_id = ?
         AND se.enrollment_status = 'active'
       ORDER BY c.scheduled_time IS NULL, c.scheduled_time`,
      [req.user.id]
    );

    res.json(rows.map(mapClassRow));
  } catch (error) {
    next(error);
  }
});

router.get("/reports", async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT DISTINCT r.id,
              r.class_id AS classId,
              r.course_id AS courseId,
              r.faculty_id AS facultyId,
              DATE_FORMAT(r.date_of_lecture, '%Y-%m-%d') AS dateOfLecture,
              r.week_of_reporting AS weekOfReporting,
              r.actual_students_present AS actualStudentsPresent,
              r.status,
              r.topic_taught AS topicTaught,
              r.learning_outcomes AS learningOutcomes,
              r.recommendations,
              r.created_at AS createdAt,
              c.class_code AS classCode,
              c.semester AS classSemester,
              co.course_name AS courseName,
              co.course_code AS courseCode,
              totals.total_registered AS totalRegisteredStudents,
              CASE
                WHEN totals.total_registered > 0
                THEN ROUND(r.actual_students_present * 100 / totals.total_registered)
                ELSE NULL
              END AS attendancePercentage
       FROM student_enrollments se
       JOIN reports r ON r.class_id = se.class_id
       LEFT JOIN classes c ON c.id = r.class_id
       LEFT JOIN courses co ON co.id = r.course_id
       LEFT JOIN (
         SELECT class_id, COUNT(*) AS total_registered
         FROM student_enrollments
         WHERE enrollment_status = 'active'
         GROUP BY class_id
       ) AS totals ON totals.class_id = r.class_id
       WHERE se.student_id = ?
         AND se.enrollment_status = 'active'
       ORDER BY r.date_of_lecture DESC`,
      [req.user.id]
    );

    res.json(rows.map(mapReportRow));
  } catch (error) {
    next(error);
  }
});

// Get available classes for enrollment
router.get("/available-classes", async (req, res, next) => {
  try {
    const { facultyId, semester } = req.query;

    let query = `
      SELECT c.id,
             c.class_code AS classCode,
             c.academic_year AS academicYear,
             c.semester,
             c.venue,
             c.mode_of_delivery AS mode,
             TIME_FORMAT(c.scheduled_time, '%H:%i') AS scheduledTime,
             CASE
               WHEN c.scheduled_time IS NULL AND c.venue IS NULL THEN NULL
               WHEN c.scheduled_time IS NULL THEN CONCAT('Venue ', c.venue)
               WHEN c.venue IS NULL THEN TIME_FORMAT(c.scheduled_time, '%H:%i')
               ELSE CONCAT(TIME_FORMAT(c.scheduled_time, '%H:%i'), ' • ', c.venue)
             END AS schedule,
             co.id AS courseId,
             co.course_name AS courseName,
             co.course_code AS courseCode,
             co.faculty_id AS facultyId,
             f.faculty_name AS facultyName,
             c.lecturer_id AS lecturerId,
             CONCAT(ul.first_name, ' ', ul.last_name) AS lecturerName,
             COUNT(se.student_id) AS enrolledCount,
             CASE WHEN ese.student_id IS NOT NULL THEN 1 ELSE 0 END AS isEnrolled
      FROM classes c
      JOIN courses co ON co.id = c.course_id
      LEFT JOIN faculties f ON f.id = co.faculty_id
      LEFT JOIN users ul ON ul.id = c.lecturer_id
      LEFT JOIN student_enrollments se ON se.class_id = c.id AND se.enrollment_status = 'active'
      LEFT JOIN student_enrollments ese ON ese.class_id = c.id AND ese.student_id = ? AND ese.enrollment_status = 'active'
      WHERE 1=1
    `;

    const params = [req.user.id];

    if (facultyId) {
      query += ` AND co.faculty_id = ?`;
      params.push(facultyId);
    }

    if (semester) {
      query += ` AND c.semester = ?`;
      params.push(semester);
    }

    query += `
      GROUP BY c.id
      ORDER BY c.academic_year DESC, c.semester, co.course_name
    `;

    const [rows] = await pool.execute(query, params);

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// Enroll in a class
router.post("/enroll", async (req, res, next) => {
  try {
    const { classId } = req.body;

    if (!classId) {
      return res.status(400).json({ message: "Class ID is required" });
    }

    // Check if class exists
    const [classRows] = await pool.execute(
      `SELECT id FROM classes WHERE id = ? LIMIT 1`,
      [classId]
    );

    if (!classRows.length) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Check if already enrolled
    const [existingEnrollment] = await pool.execute(
      `SELECT id, enrollment_status FROM student_enrollments 
       WHERE student_id = ? AND class_id = ? LIMIT 1`,
      [req.user.id, classId]
    );

    if (existingEnrollment.length) {
      if (existingEnrollment[0].enrollment_status === "active") {
        return res
          .status(400)
          .json({ message: "Already enrolled in this class" });
      } else {
        // Reactivate enrollment
        await pool.execute(
          `UPDATE student_enrollments 
           SET enrollment_status = 'active', enrolled_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [existingEnrollment[0].id]
        );
        return res
          .status(200)
          .json({ message: "Enrollment reactivated successfully" });
      }
    }

    // Create new enrollment
    await pool.execute(
      `INSERT INTO student_enrollments (student_id, class_id, enrollment_status, enrolled_at)
       VALUES (?, ?, 'active', CURRENT_TIMESTAMP)`,
      [req.user.id, classId]
    );

    res.status(201).json({ message: "Successfully enrolled in class" });
  } catch (error) {
    next(error);
  }
});

// Withdraw from a class
router.post("/withdraw", async (req, res, next) => {
  try {
    const { classId } = req.body;

    if (!classId) {
      return res.status(400).json({ message: "Class ID is required" });
    }

    const [result] = await pool.execute(
      `UPDATE student_enrollments 
       SET enrollment_status = 'withdrawn'
       WHERE student_id = ? AND class_id = ? AND enrollment_status = 'active'`,
      [req.user.id, classId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Enrollment not found or already withdrawn" });
    }

    res.json({ message: "Successfully withdrawn from class" });
  } catch (error) {
    next(error);
  }
});

export default router;

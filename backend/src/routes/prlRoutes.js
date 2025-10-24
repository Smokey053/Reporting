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
  course: row.courseId
    ? {
        id: row.courseId,
        name: row.courseName,
        code: row.courseCode,
      }
    : null,
});

const mapMonitoringRow = (row) => ({
  id: row.id,
  reportId: row.reportId,
  findings: row.findings,
  recommendations: row.recommendations,
  status: row.status,
  createdAt: row.createdAt,
  followUpDate: row.followUpDate || null,
  focusArea: row.findings,
  highlights: row.findings,
  actionItems: row.recommendations
    ? row.recommendations.split(/\r?\n/).filter(Boolean)
    : [],
  report: row.reportId
    ? {
        id: row.reportId,
        topicTaught: row.topicTaught,
        dateOfLecture: row.dateOfLecture,
        classCode: row.classCode,
        courseName: row.courseName,
        lecturerName: row.lecturerName,
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
  summary: row.topicTaught,
  learningOutcomes: row.learningOutcomes,
  recommendations: row.recommendations,
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
  lecturer: row.lecturerId
    ? {
        id: row.lecturerId,
        firstName: row.lecturerFirstName,
        lastName: row.lecturerLastName,
      }
    : null,
});

router.use(authenticate, authorize("principal_lecturer"));

router.get("/monitoring", async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT m.id,
              m.report_id AS reportId,
              m.findings,
              m.recommendations,
              m.status,
              m.created_at AS createdAt,
              DATE_FORMAT(r.date_of_lecture, '%Y-%m-%d') AS dateOfLecture,
              r.topic_taught AS topicTaught,
              c.class_code AS classCode,
              co.course_name AS courseName,
              CONCAT(ul.first_name, ' ', ul.last_name) AS lecturerName
       FROM monitoring m
       JOIN reports r ON r.id = m.report_id
       LEFT JOIN classes c ON c.id = r.class_id
       LEFT JOIN courses co ON co.id = r.course_id
       LEFT JOIN users ul ON ul.id = r.lecturer_id
       WHERE r.faculty_id = ?
       ORDER BY m.created_at DESC`,
      [req.user.facultyId]
    );

    res.json(rows.map(mapMonitoringRow));
  } catch (error) {
    next(error);
  }
});

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
              co.course_code AS courseCode
       FROM classes c
       JOIN courses co ON co.id = c.course_id
       WHERE co.faculty_id = ?
       ORDER BY c.academic_year DESC, c.semester DESC`,
      [req.user.facultyId]
    );

    res.json(rows.map(mapClassRow));
  } catch (error) {
    next(error);
  }
});

router.get("/reports", async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.id,
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
              ul.first_name AS lecturerFirstName,
              ul.last_name AS lecturerLastName,
              totals.total_registered AS totalRegisteredStudents,
              CASE
                WHEN totals.total_registered > 0
                THEN ROUND(r.actual_students_present * 100 / totals.total_registered)
                ELSE NULL
              END AS attendancePercentage
       FROM reports r
       LEFT JOIN classes c ON c.id = r.class_id
       LEFT JOIN courses co ON co.id = r.course_id
       LEFT JOIN users ul ON ul.id = r.lecturer_id
       LEFT JOIN (
         SELECT class_id, COUNT(*) AS total_registered
         FROM student_enrollments
         WHERE enrollment_status = 'active'
         GROUP BY class_id
       ) AS totals ON totals.class_id = r.class_id
       WHERE r.faculty_id = ?
       ORDER BY r.date_of_lecture DESC`,
      [req.user.facultyId]
    );

    res.json(rows.map(mapReportRow));
  } catch (error) {
    next(error);
  }
});

router.post("/monitoring", async (req, res, next) => {
  try {
    const {
      reportId,
      findings,
      recommendations,
      status = "pending",
    } = req.body;

    if (!reportId || !findings) {
      return res.status(400).json({ message: "Report and findings required" });
    }

    const [reportRows] = await pool.execute(
      `SELECT id, faculty_id AS facultyId FROM reports WHERE id = ? LIMIT 1`,
      [reportId]
    );

    if (!reportRows.length) {
      return res.status(404).json({ message: "Report not found" });
    }

    const report = reportRows[0];
    if (report.facultyId !== req.user.facultyId) {
      return res.status(403).json({ message: "Report outside your faculty" });
    }

    const [result] = await pool.execute(
      `INSERT INTO monitoring (report_id, findings, recommendations, status)
       VALUES (?, ?, ?, ?)`,
      [reportId, findings, recommendations || null, status]
    );

    const insertedId = result.insertId;

    const [rows] = await pool.execute(
      `SELECT m.id,
              m.report_id AS reportId,
              m.findings,
              m.recommendations,
              m.status,
              m.created_at AS createdAt,
              DATE_FORMAT(r.date_of_lecture, '%Y-%m-%d') AS dateOfLecture,
              r.topic_taught AS topicTaught,
              c.class_code AS classCode,
              co.course_name AS courseName,
              CONCAT(ul.first_name, ' ', ul.last_name) AS lecturerName
       FROM monitoring m
       JOIN reports r ON r.id = m.report_id
       LEFT JOIN classes c ON c.id = r.class_id
       LEFT JOIN courses co ON co.id = r.course_id
       LEFT JOIN users ul ON ul.id = r.lecturer_id
       WHERE m.id = ?
       LIMIT 1`,
      [insertedId]
    );

    const inserted = rows[0] ? mapMonitoringRow(rows[0]) : { id: insertedId };

    res.status(201).json(inserted);
  } catch (error) {
    next(error);
  }
});

router.get("/ratings", async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT ra.id,
              ra.rating,
              ra.comments,
              ra.created_at AS createdAt,
              ra.report_id AS reportId,
              DATE_FORMAT(r.date_of_lecture, '%Y-%m-%d') AS dateOfLecture,
              co.course_name AS courseName,
              us.first_name AS studentFirstName,
              us.last_name AS studentLastName
       FROM ratings ra
       JOIN reports r ON r.id = ra.report_id
       LEFT JOIN courses co ON co.id = r.course_id
       LEFT JOIN users us ON us.id = ra.student_id
       WHERE r.faculty_id = ?
       ORDER BY ra.created_at DESC`,
      [req.user.facultyId]
    );

    const ratings = rows.map((row) => ({
      id: row.id,
      rating: row.rating,
      comments: row.comments,
      createdAt: row.createdAt,
      studentName: row.studentFirstName
        ? `${row.studentFirstName} ${row.studentLastName}`
        : null,
      report: {
        id: row.reportId,
        courseName: row.courseName,
        dateOfLecture: row.dateOfLecture,
      },
    }));

    res.json(ratings);
  } catch (error) {
    next(error);
  }
});

export default router;

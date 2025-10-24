import { Router } from "express";
import pool from "../db/pool.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = Router();

const mapProgramRow = (row) => ({
  id: row.id,
  facultyId: row.facultyId,
  name: row.name,
  code: row.code,
  level: row.level,
  durationYears: row.durationYears,
  description: row.description,
});

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

router.use(authenticate, authorize("program_leader"));

router.get("/programs", async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.id,
              p.faculty_id AS facultyId,
              p.program_name AS name,
              p.program_code AS code,
              p.level,
              p.duration_years AS durationYears,
              p.description
       FROM programs p
       WHERE p.faculty_id = ?
       ORDER BY p.program_name`,
      [req.user.facultyId]
    );

    res.json(rows.map(mapProgramRow));
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
              co.course_code AS courseCode,
              c.lecturer_id AS lecturerId,
              ul.first_name AS lecturerFirstName,
              ul.last_name AS lecturerLastName
       FROM classes c
       JOIN courses co ON co.id = c.course_id
       LEFT JOIN users ul ON ul.id = c.lecturer_id
       WHERE co.faculty_id = ?
       ORDER BY c.scheduled_time IS NULL, c.scheduled_time`,
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
              u.first_name AS lecturerFirstName,
              u.last_name AS lecturerLastName,
              totals.total_registered AS totalRegisteredStudents,
              CASE
                WHEN totals.total_registered > 0
                THEN ROUND(r.actual_students_present * 100 / totals.total_registered)
                ELSE NULL
              END AS attendancePercentage
       FROM reports r
       LEFT JOIN classes c ON c.id = r.class_id
       LEFT JOIN courses co ON co.id = r.course_id
       LEFT JOIN users u ON u.id = r.lecturer_id
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

export default router;

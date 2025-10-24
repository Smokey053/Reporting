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
  totalRegisteredStudents: row.totalRegisteredStudents,
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
  status: row.status,
  topicTaught: row.topicTaught,
  learningOutcomes: row.learningOutcomes,
  recommendations: row.recommendations,
  summary: row.topicTaught,
  actions: row.recommendations,
  createdAt: row.createdAt,
  course: row.courseId
    ? {
        id: row.courseId,
        name: row.courseName,
        code: row.courseCode,
      }
    : null,
  class: row.classId
    ? {
        id: row.classId,
        code: row.classCode,
        semester: row.classSemester,
      }
    : null,
});

const getWeekOfYear = (isoDate) => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const diff = (date.getTime() - start.getTime()) / 86400000;
  return Math.max(1, Math.ceil((diff + start.getUTCDay() + 1) / 7));
};

router.use(
  authenticate,
  authorize("lecturer", "principal_lecturer", "program_leader")
);

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
              ul.last_name AS lecturerLastName,
              totals.total_registered AS totalRegisteredStudents
       FROM classes c
       LEFT JOIN courses co ON co.id = c.course_id
       LEFT JOIN users ul ON ul.id = c.lecturer_id
       LEFT JOIN (
         SELECT class_id, COUNT(*) AS total_registered
         FROM student_enrollments
         WHERE enrollment_status = 'active'
         GROUP BY class_id
       ) AS totals ON totals.class_id = c.id
       WHERE c.lecturer_id = ?
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
              totals.total_registered AS totalRegisteredStudents,
              CASE
                WHEN totals.total_registered > 0
                THEN ROUND(r.actual_students_present * 100 / totals.total_registered)
                ELSE NULL
              END AS attendancePercentage
       FROM reports r
       LEFT JOIN classes c ON c.id = r.class_id
       LEFT JOIN courses co ON co.id = r.course_id
       LEFT JOIN (
         SELECT class_id, COUNT(*) AS total_registered
         FROM student_enrollments
         WHERE enrollment_status = 'active'
         GROUP BY class_id
       ) AS totals ON totals.class_id = r.class_id
       WHERE r.lecturer_id = ?
       ORDER BY r.date_of_lecture DESC`,
      [req.user.id]
    );

    res.json(rows.map(mapReportRow));
  } catch (error) {
    next(error);
  }
});

router.post("/reports", async (req, res, next) => {
  try {
    const {
      classId,
      dateOfLecture,
      studentsPresent,
      topicTaught,
      learningOutcomes,
      recommendations,
      status = "submitted",
    } = req.body;

    if (!classId || !dateOfLecture || !topicTaught || !learningOutcomes) {
      return res
        .status(400)
        .json({ message: "Missing required report fields" });
    }

    const studentCount = Number(studentsPresent ?? 0);

    const [classRows] = await pool.execute(
      `SELECT c.id,
              c.course_id AS courseId,
              c.venue,
              c.scheduled_time AS scheduledTime,
              co.faculty_id AS facultyId
       FROM classes c
       JOIN courses co ON co.id = c.course_id
       WHERE c.id = ? AND c.lecturer_id = ?
       LIMIT 1`,
      [classId, req.user.id]
    );

    if (!classRows.length) {
      return res.status(404).json({ message: "Class not found" });
    }

    const classInfo = classRows[0];

    const weekOfReporting = getWeekOfYear(dateOfLecture);

    const scheduledLectureTime = classInfo.scheduledTime || "09:00:00";
    const venue = classInfo.venue || "TBC";

    const [result] = await pool.execute(
      `INSERT INTO reports
         (faculty_id, class_id, week_of_reporting, date_of_lecture, course_id,
          lecturer_id, actual_students_present, venue, scheduled_lecture_time,
          topic_taught, learning_outcomes, recommendations, status)
       VALUES
         (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        classInfo.facultyId,
        classInfo.id,
        weekOfReporting,
        dateOfLecture,
        classInfo.courseId,
        req.user.id,
        studentCount,
        venue,
        scheduledLectureTime,
        topicTaught,
        learningOutcomes,
        recommendations || null,
        status,
      ]
    );

    const insertedId = result.insertId;

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
              totals.total_registered AS totalRegisteredStudents,
              CASE
                WHEN totals.total_registered > 0
                THEN ROUND(r.actual_students_present * 100 / totals.total_registered)
                ELSE NULL
              END AS attendancePercentage
       FROM reports r
       LEFT JOIN classes c ON c.id = r.class_id
       LEFT JOIN courses co ON co.id = r.course_id
       LEFT JOIN (
         SELECT class_id, COUNT(*) AS total_registered
         FROM student_enrollments
         WHERE enrollment_status = 'active'
         GROUP BY class_id
       ) AS totals ON totals.class_id = r.class_id
       WHERE r.id = ?
       LIMIT 1`,
      [insertedId]
    );

    const inserted = rows[0] ? mapReportRow(rows[0]) : { id: insertedId };

    res.status(201).json(inserted);
  } catch (error) {
    next(error);
  }
});

export default router;

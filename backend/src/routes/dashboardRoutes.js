import { Router } from "express";
import pool from "../db/pool.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = Router();

const announcements = [];

const mapClassRow = (row) => ({
  id: row.id,
  classCode: row.classCode,
  academicYear: row.academicYear,
  semester: row.semester,
  venue: row.venue,
  scheduledTime: row.scheduledTime,
  schedule: row.schedule,
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

const mapReportRow = (row) => {
  if (!row) return null;
  return {
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
    lecturer: row.lecturerId
      ? {
          id: row.lecturerId,
          firstName: row.lecturerFirstName,
          lastName: row.lecturerLastName,
        }
      : null,
  };
};

const average = (values) => {
  const filtered = values.filter(
    (value) => value !== null && value !== undefined
  );
  if (!filtered.length) return 0;
  const total = filtered.reduce((sum, value) => sum + Number(value), 0);
  return Math.round(total / filtered.length);
};

const getBaseMetrics = async (facultyId) => {
  const reportCountQuery = facultyId
    ? `SELECT COUNT(*) AS total FROM reports WHERE faculty_id = ?`
    : `SELECT COUNT(*) AS total FROM reports`;

  const latestReportQuery = `
    SELECT r.id,
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
           ul.id AS lecturerId,
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
    ${facultyId ? "WHERE r.faculty_id = ?" : ""}
    ORDER BY r.date_of_lecture DESC
    LIMIT 1`;

  const classesThisWeekQuery = `
    SELECT COUNT(*) AS total
    FROM reports r
    WHERE YEARWEEK(r.date_of_lecture, 1) = YEARWEEK(CURDATE(), 1)
    ${facultyId ? "AND r.faculty_id = ?" : ""}`;

  const [reportCountRows] = await pool.execute(
    reportCountQuery,
    facultyId ? [facultyId] : []
  );

  const totalReports = Number(reportCountRows[0]?.total ?? 0);

  const [latestRows] = await pool.execute(
    latestReportQuery,
    facultyId ? [facultyId] : []
  );

  const [classesThisWeekRows] = await pool.execute(
    classesThisWeekQuery,
    facultyId ? [facultyId] : []
  );

  const classesThisWeek = Number(classesThisWeekRows[0]?.total ?? 0);

  return {
    reportsTotal: totalReports,
    latestReport: mapReportRow(latestRows[0]),
    announcements,
    classesThisWeek,
  };
};

const getLecturerDashboard = async (userId) => {
  const [classRows] = await pool.execute(
    `SELECT c.id,
            c.class_code AS classCode,
            c.academic_year AS academicYear,
            c.semester,
            c.venue,
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
     LEFT JOIN courses co ON co.id = c.course_id
     LEFT JOIN users ul ON ul.id = c.lecturer_id
     WHERE c.lecturer_id = ?
     ORDER BY c.scheduled_time IS NULL, c.scheduled_time`,
    [userId]
  );

  const [reportRows] = await pool.execute(
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
            ul.id AS lecturerId,
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
     WHERE r.lecturer_id = ?
     ORDER BY r.date_of_lecture DESC`,
    [userId]
  );

  const reports = reportRows.map(mapReportRow);
  const classes = classRows.map(mapClassRow);

  const avgAttendance = average(
    reports.map((report) => report.attendancePercentage)
  );

  const submittedThisMonth = reports.filter((report) => {
    if (!report.dateOfLecture) return false;
    const date = new Date(`${report.dateOfLecture}T00:00:00Z`);
    const now = new Date();
    return (
      date.getUTCFullYear() === now.getUTCFullYear() &&
      date.getUTCMonth() === now.getUTCMonth()
    );
  }).length;

  const upcomingClasses = classes.slice(0, 3);

  return {
    reports,
    classes,
    stats: {
      avgAttendance,
      submittedThisMonth,
      upcomingClasses,
    },
  };
};

const getPrincipalLecturerDashboard = async (facultyId) => {
  const [monitoringRows] = await pool.execute(
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
    [facultyId]
  );

  const monitoring = monitoringRows.map((row) => ({
    id: row.id,
    findings: row.findings,
    recommendations: row.recommendations,
    status: row.status,
    createdAt: row.createdAt,
    report: {
      id: row.reportId,
      topicTaught: row.topicTaught,
      dateOfLecture: row.dateOfLecture,
      classCode: row.classCode,
      courseName: row.courseName,
      lecturerName: row.lecturerName,
    },
  }));

  const [ratingRows] = await pool.execute(
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
    [facultyId]
  );

  const ratings = ratingRows.map((row) => ({
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

  const outstandingFollowUps = monitoring.filter(
    (item) => item.status && item.status !== "satisfactory"
  ).length;

  const avgRating = average(ratings.map((rating) => rating.rating));

  return {
    monitoring,
    ratings,
    stats: {
      outstandingFollowUps,
      avgRating,
    },
  };
};

const getProgramLeaderDashboard = async (facultyId) => {
  const [programRows] = await pool.execute(
    `SELECT id,
            program_code AS programCode,
            program_name AS programName,
            level,
            duration_years AS durationYears
     FROM programs
     WHERE faculty_id = ?
     ORDER BY program_name`,
    [facultyId]
  );

  const [classRows] = await pool.execute(
    `SELECT c.id,
            c.class_code AS classCode,
            c.academic_year AS academicYear,
            c.semester,
            c.venue,
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
     ORDER BY c.academic_year DESC, c.semester DESC`,
    [facultyId]
  );

  const [reportRows] = await pool.execute(
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
            ul.id AS lecturerId,
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
    [facultyId]
  );

  const programs = programRows.map((row) => ({
    id: row.id,
    programCode: row.programCode,
    programName: row.programName,
    level: row.level,
    durationYears: row.durationYears,
  }));

  const classes = classRows.map(mapClassRow);
  const reports = reportRows.map(mapReportRow);

  const activeLecturers = new Set(
    classes
      .map((cls) => cls.lecturer?.id)
      .filter((value) => value !== null && value !== undefined)
  ).size;

  return {
    programs,
    classes,
    reports,
    stats: {
      activeLecturers,
      reportsSubmitted: reports.length,
      nextEvents: announcements.slice(0, 2),
    },
  };
};

const getStudentDashboard = async (userId) => {
  const [classRows] = await pool.execute(
    `SELECT c.id,
            c.class_code AS classCode,
            c.academic_year AS academicYear,
            c.semester,
            c.venue,
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
            ul.id AS lecturerId,
            ul.first_name AS lecturerFirstName,
            ul.last_name AS lecturerLastName
     FROM student_enrollments se
     JOIN classes c ON c.id = se.class_id
     JOIN courses co ON co.id = c.course_id
     LEFT JOIN users ul ON ul.id = c.lecturer_id
     WHERE se.student_id = ?
       AND se.enrollment_status = 'active'
     ORDER BY c.semester`,
    [userId]
  );

  const [reportRows] = await pool.execute(
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
     FROM reports r
     JOIN student_enrollments se ON se.class_id = r.class_id
     LEFT JOIN classes c ON c.id = r.class_id
     LEFT JOIN courses co ON co.id = r.course_id
     LEFT JOIN (
       SELECT class_id, COUNT(*) AS total_registered
       FROM student_enrollments
       WHERE enrollment_status = 'active'
       GROUP BY class_id
     ) AS totals ON totals.class_id = r.class_id
     WHERE se.student_id = ?
     ORDER BY r.date_of_lecture DESC`,
    [userId]
  );

  const classes = classRows.map(mapClassRow);
  const reports = reportRows.map(mapReportRow);

  const avgAttendance = average(
    reports.map((report) => report.attendancePercentage)
  );

  return {
    classes,
    reports,
    stats: {
      classesCount: classes.length,
      avgAttendance,
      trendingCourses: classes.slice(0, 3),
    },
  };
};

router.get("/", authenticate, async (req, res, next) => {
  try {
    const { role, id, facultyId } = req.user;
    const base = await getBaseMetrics(facultyId);
    let response = { ...base, role };

    if (role === "lecturer") {
      response = { ...response, ...(await getLecturerDashboard(id)) };
    } else if (role === "principal_lecturer") {
      response = {
        ...response,
        ...(await getPrincipalLecturerDashboard(facultyId)),
      };
    } else if (role === "program_leader") {
      response = {
        ...response,
        ...(await getProgramLeaderDashboard(facultyId)),
      };
    } else if (role === "student") {
      response = { ...response, ...(await getStudentDashboard(id)) };
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;

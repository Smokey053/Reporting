import pool from "../db/pool.js";
import XLSX from "xlsx";
import PDFDocument from "pdfkit";

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

/**
 * Check if user has permission to export specific data
 */
export const checkExportPermission = async (
  userId,
  exportType,
  facultyId = null
) => {
  try {
    const [user] = await pool.execute(
      `SELECT role, faculty_id FROM users WHERE id = ?`,
      [userId]
    );

    if (!user.length) return false;

    const userRole = user[0].role;
    const userFacultyId = user[0].faculty_id;

    // Admin can export everything
    if (userRole === "admin") return true;

    // Program leader can export their faculty
    if (userRole === "program_leader") {
      return facultyId === null || facultyId === userFacultyId;
    }

    // PRL can export their faculty
    if (userRole === "principal_lecturer") {
      return facultyId === null || facultyId === userFacultyId;
    }

    // Lecturer can export their own reports only
    if (userRole === "lecturer") {
      return exportType === "own_reports";
    }

    return false;
  } catch (error) {
    console.error("Permission check error:", error);
    return false;
  }
};

/**
 * Get reports data for export
 */
export const getReportsForExport = async (filters = {}) => {
  try {
    let query = `
      SELECT r.id,
             r.class_id AS classId,
             r.course_id AS courseId,
             r.faculty_id AS facultyId,
             DATE_FORMAT(r.date_of_lecture, '%Y-%m-%d') AS dateOfLecture,
             r.week_of_reporting AS weekOfReporting,
             r.actual_students_present AS studentsPresent,
             totals.total_registered AS totalStudents,
             CASE
               WHEN totals.total_registered > 0
               THEN ROUND(r.actual_students_present * 100 / totals.total_registered)
               ELSE NULL
             END AS attendancePercentage,
             r.status,
             r.topic_taught AS topic,
             r.learning_outcomes AS outcomes,
             r.recommendations,
             r.created_at AS createdAt,
             c.class_code AS classCode,
             co.course_name AS courseName,
             f.faculty_name AS facultyName,
             CONCAT(u.first_name, ' ', u.last_name) AS lecturerName
      FROM reports r
      LEFT JOIN classes c ON c.id = r.class_id
      LEFT JOIN courses co ON co.id = r.course_id
      LEFT JOIN faculties f ON f.id = r.faculty_id
      LEFT JOIN users u ON u.id = r.lecturer_id
      LEFT JOIN (
        SELECT class_id, COUNT(*) AS total_registered
        FROM student_enrollments
        WHERE enrollment_status = 'active'
        GROUP BY class_id
      ) AS totals ON totals.class_id = r.class_id
      WHERE 1=1
    `;

    const params = [];

    if (filters.facultyId) {
      query += ` AND r.faculty_id = ?`;
      params.push(filters.facultyId);
    }

    if (filters.startDate) {
      query += ` AND DATE(r.created_at) >= ?`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND DATE(r.created_at) <= ?`;
      params.push(filters.endDate);
    }

    if (filters.status) {
      query += ` AND r.status = ?`;
      params.push(filters.status);
    }

    if (filters.lecturerId) {
      query += ` AND r.lecturer_id = ?`;
      params.push(filters.lecturerId);
    }

    query += ` ORDER BY r.created_at DESC`;

    const [reports] = await pool.execute(query, params);
    return reports;
  } catch (error) {
    console.error("Export query error:", error);
    throw error;
  }
};

/**
 * Get users data for export
 */
export const getUsersForExport = async (filters = {}) => {
  try {
    let query = `
      SELECT u.id,
             u.user_id AS userId,
             u.first_name AS firstName,
             u.last_name AS lastName,
             u.email,
             u.role,
             u.is_approved AS approved,
             f.faculty_name AS faculty,
             DATE_FORMAT(u.created_at, '%Y-%m-%d') AS registeredDate
      FROM users u
      LEFT JOIN faculties f ON f.id = u.faculty_id
      WHERE 1=1
    `;

    const params = [];

    if (filters.role) {
      query += ` AND u.role = ?`;
      params.push(filters.role);
    }

    if (filters.facultyId) {
      query += ` AND u.faculty_id = ?`;
      params.push(filters.facultyId);
    }

    if (filters.approved !== undefined) {
      query += ` AND u.is_approved = ?`;
      params.push(filters.approved ? 1 : 0);
    }

    query += ` ORDER BY u.created_at DESC`;

    const [users] = await pool.execute(query, params);
    return users;
  } catch (error) {
    console.error("Export query error:", error);
    throw error;
  }
};

/**
 * Get programs and courses data for export
 */
export const getProgramsForExport = async (filters = {}) => {
  try {
    let query = `
      SELECT p.id,
             p.program_code AS code,
             p.program_name AS name,
             p.level,
             p.duration_years AS years,
             p.academic_year AS academicYear,
             f.faculty_name AS faculty,
             COUNT(c.id) AS courseCount
      FROM programs p
      LEFT JOIN faculties f ON f.id = p.faculty_id
      LEFT JOIN courses c ON c.program_id = p.id
      WHERE 1=1
    `;

    const params = [];

    if (filters.facultyId) {
      query += ` AND p.faculty_id = ?`;
      params.push(filters.facultyId);
    }

    if (filters.academicYear) {
      query += ` AND p.academic_year = ?`;
      params.push(filters.academicYear);
    }

    query += ` GROUP BY p.id ORDER BY p.program_name`;

    const [programs] = await pool.execute(query, params);
    return programs;
  } catch (error) {
    console.error("Export query error:", error);
    throw error;
  }
};

/**
 * Format data for Excel/CSV/PDF export
 */
export const formatForExport = (data, type) => {
  if (type === "csv") {
    return convertToCSV(data);
  } else if (type === "xlsx") {
    return convertToXLSX(data);
  } else if (type === "pdf") {
    return data; // PDF generation is done in route handler
  }
  return data;
};

/**
 * Convert JSON to CSV
 */
const convertToCSV = (data) => {
  if (!data || data.length === 0) return "";

  const keys = Object.keys(data[0]);
  const csv = [
    keys.join(","),
    ...data.map((row) =>
      keys
        .map((key) => {
          const value = row[key];
          if (value === null || value === undefined) return "";
          if (typeof value === "string" && value.includes(",")) {
            return `"${value}"`;
          }
          return value;
        })
        .join(",")
    ),
  ];

  return csv.join("\n");
};

/**
 * Convert JSON to XLSX (Excel)
 */
const convertToXLSX = (data) => {
  if (!data || data.length === 0) {
    // Return empty workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([]);
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  }

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto-size columns
  const range = XLSX.utils.decode_range(ws["!ref"]);
  const colWidths = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    let maxWidth = 10;
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellAddress];
      if (cell && cell.v) {
        const cellValue = String(cell.v);
        maxWidth = Math.max(maxWidth, cellValue.length);
      }
    }
    colWidths.push({ wch: Math.min(maxWidth + 2, 50) });
  }
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Data");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
};

/**
 * Generate PDF from data
 */
export const generatePDF = (data, title, filters = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
        layout: "landscape",
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Title
      doc.fontSize(18).font("Helvetica-Bold").text(title, { align: "center" });
      doc.moveDown();

      // Filters info
      if (Object.keys(filters).length > 0) {
        doc.fontSize(10).font("Helvetica");
        doc.text("Applied Filters:", { continued: false });
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            doc.text(`  ${key}: ${value}`, { indent: 20 });
          }
        });
        doc.moveDown();
      }

      // Data table
      if (!data || data.length === 0) {
        doc.fontSize(12).text("No data available", { align: "center" });
      } else {
        const keys = Object.keys(data[0]);
        const colWidth = (doc.page.width - 100) / keys.length;

        // Header row
        doc.fontSize(9).font("Helvetica-Bold");
        let x = 50;
        keys.forEach((key) => {
          doc.text(key, x, doc.y, { width: colWidth, align: "left" });
          x += colWidth;
        });
        doc.moveDown(0.5);

        // Draw header line
        doc
          .moveTo(50, doc.y)
          .lineTo(doc.page.width - 50, doc.y)
          .stroke();
        doc.moveDown(0.5);

        // Data rows
        doc.fontSize(8).font("Helvetica");
        let rowCount = 0;
        const maxRowsPerPage = 20;

        data.forEach((row, index) => {
          if (rowCount >= maxRowsPerPage) {
            doc.addPage();
            rowCount = 0;
          }

          x = 50;
          const startY = doc.y;

          keys.forEach((key) => {
            const value = row[key] ?? "";
            doc.text(String(value).substring(0, 50), x, startY, {
              width: colWidth,
              align: "left",
            });
            x += colWidth;
          });

          doc.moveDown(0.8);
          rowCount++;
        });
      }

      // Footer
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(8)
          .text(
            `Page ${i + 1} of ${
              pages.count
            } | Generated on ${new Date().toLocaleDateString()}`,
            50,
            doc.page.height - 50,
            { align: "center" }
          );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate PDF metadata
 */
export const generatePDFMetadata = (title, filters) => {
  return {
    title,
    subject: `LUCT Reporting System - ${title}`,
    author: "LUCT",
    keywords: "report, export",
    creator: "LUCT Reporting System",
    createdDate: new Date(),
    modifiedDate: new Date(),
  };
};

import { Router } from "express";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import {
  checkExportPermission,
  getReportsForExport,
  getUsersForExport,
  getProgramsForExport,
  formatForExport,
  generatePDF,
} from "../utils/exportUtils.js";
import pool from "../db/pool.js";

const router = Router();

// Middleware for export permissions
const checkExportAuth = [authenticate];

/**
 * Export Reports as CSV/JSON/XLSX/PDF
 */
router.post("/export/reports", checkExportAuth, async (req, res, next) => {
  try {
    const { format = "csv", filters = {}, scope } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check permissions
    if (scope === "all" && userRole !== "admin") {
      const err = new Error("Only admins can export all reports");
      err.status = 403;
      throw err;
    }

    // Apply scope-based filters
    if (scope === "own") {
      filters.lecturerId = userId;
    } else if (
      userRole === "program_leader" ||
      userRole === "principal_lecturer"
    ) {
      filters.facultyId = req.user.facultyId;
    }

    // Get reports
    const reports = await getReportsForExport(filters);

    if (format === "csv") {
      const csv = formatForExport(reports, "csv");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="reports-${Date.now()}.csv"`
      );
      res.send(csv);
    } else if (format === "xlsx") {
      const xlsx = formatForExport(reports, "xlsx");
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="reports-${Date.now()}.xlsx"`
      );
      res.send(xlsx);
    } else if (format === "pdf") {
      const pdf = await generatePDF(reports, "LUCT Reports Export", filters);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="reports-${Date.now()}.pdf"`
      );
      res.send(pdf);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="reports-${Date.now()}.json"`
      );
      res.json(reports);
    }

    // Log export
    await pool.execute(
      `INSERT INTO export_logs (user_id, export_type, export_module, filter_criteria, record_count)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        format.toUpperCase(),
        "Reports",
        JSON.stringify(filters),
        reports.length,
      ]
    );
  } catch (error) {
    next(error);
  }
});

/**
 * Export Users as CSV/JSON/XLSX/PDF
 */
router.post(
  "/export/users",
  [authenticate, authorize("admin")],
  async (req, res, next) => {
    try {
      const { format = "csv", filters = {} } = req.body;
      const userId = req.user.id;

      // Get users
      const users = await getUsersForExport(filters);

      if (format === "csv") {
        const csv = formatForExport(users, "csv");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="users-${Date.now()}.csv"`
        );
        res.send(csv);
      } else if (format === "xlsx") {
        const xlsx = formatForExport(users, "xlsx");
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="users-${Date.now()}.xlsx"`
        );
        res.send(xlsx);
      } else if (format === "pdf") {
        const pdf = await generatePDF(users, "LUCT Users Export", filters);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="users-${Date.now()}.pdf"`
        );
        res.send(pdf);
      } else {
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="users-${Date.now()}.json"`
        );
        res.json(users);
      }

      // Log export
      await pool.execute(
        `INSERT INTO export_logs (user_id, export_type, export_module, filter_criteria, record_count)
       VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          format.toUpperCase(),
          "Users",
          JSON.stringify(filters),
          users.length,
        ]
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Export Programs as CSV/JSON/XLSX/PDF
 */
router.post(
  "/export/programs",
  [authenticate, authorize("admin", "program_leader")],
  async (req, res, next) => {
    try {
      const { format = "csv", filters = {} } = req.body;
      const userId = req.user.id;

      // PL can only export their faculty
      if (req.user.role === "program_leader") {
        filters.facultyId = req.user.facultyId;
      }

      // Get programs
      const programs = await getProgramsForExport(filters);

      if (format === "csv") {
        const csv = formatForExport(programs, "csv");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="programs-${Date.now()}.csv"`
        );
        res.send(csv);
      } else if (format === "xlsx") {
        const xlsx = formatForExport(programs, "xlsx");
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="programs-${Date.now()}.xlsx"`
        );
        res.send(xlsx);
      } else if (format === "pdf") {
        const pdf = await generatePDF(
          programs,
          "LUCT Programs Export",
          filters
        );
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="programs-${Date.now()}.pdf"`
        );
        res.send(pdf);
      } else {
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="programs-${Date.now()}.json"`
        );
        res.json(programs);
      }

      // Log export
      await pool.execute(
        `INSERT INTO export_logs (user_id, export_type, export_module, filter_criteria, record_count)
       VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          format.toUpperCase(),
          "Programs",
          JSON.stringify(filters),
          programs.length,
        ]
      );
    } catch (error) {
      next(error);
    }
  }
);

export default router;

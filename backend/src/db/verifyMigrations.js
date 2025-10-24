import pool from "./pool.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function verifyMigrations() {
  try {
    console.log("Verifying database migrations...\n");

    // Check if new tables exist
    const tables = [
      "course_offerings",
      "export_logs",
      "analytics_snapshots",
      "audit_logs",
    ];

    console.log("📊 Checking for new tables:");
    for (const table of tables) {
      const [result] = await pool.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = ? AND TABLE_SCHEMA = DATABASE()`,
        [table]
      );
      if (result.length > 0) {
        console.log(`  ✅ ${table} - EXISTS`);
      } else {
        console.log(`  ❌ ${table} - NOT FOUND`);
      }
    }

    console.log("\n📝 Checking for new columns:");

    // Check programs table
    const [programsColumns] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'programs' AND COLUMN_NAME = 'academic_year'`
    );
    console.log(
      `  ${programsColumns.length > 0 ? "✅" : "❌"} programs.academic_year`
    );

    // Check courses table
    const [coursesColumns] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'courses' AND COLUMN_NAME = 'academic_year'`
    );
    console.log(
      `  ${coursesColumns.length > 0 ? "✅" : "❌"} courses.academic_year`
    );

    // Check classes table
    const [classesColumns] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'classes' AND COLUMN_NAME = 'academic_year'`
    );
    console.log(
      `  ${classesColumns.length > 0 ? "✅" : "❌"} classes.academic_year`
    );

    console.log("\n✅ Migration verification complete!");
  } catch (error) {
    console.error("❌ Verification error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyMigrations();

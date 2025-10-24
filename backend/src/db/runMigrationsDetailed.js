import pool from "./pool.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function runMigrationsWithDetails() {
  try {
    console.log("Starting detailed database migrations...\n");

    const migrationsPath = path.join(__dirname, "./migrations.sql");
    const migrations = fs.readFileSync(migrationsPath, "utf8");

    // Split by GO or ; and execute each statement
    const statements = migrations
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`Found ${statements.length} migration statements\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length > 0) {
        const preview = statement.substring(0, 70).replace(/\n/g, " ");
        console.log(`[${i + 1}/${statements.length}] ${preview}...`);
        try {
          const [result] = await pool.execute(statement);
          console.log("    ✅ Success\n");
        } catch (error) {
          // Ignore "column already exists" errors
          if (error.message && error.message.includes("Duplicate column")) {
            console.log("    ⚠️  Column already exists (skipped)\n");
          } else {
            console.log(`    ❌ Error: ${error.message}\n`);
            // Continue with next migration
          }
        }
      }
    }

    console.log("✅ All migrations attempted successfully!");
  } catch (error) {
    console.error("❌ Migration error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrationsWithDetails();

import pool from "./pool.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function runMigrationsClean() {
  try {
    console.log("Starting database migrations...\n");

    const migrationsPath = path.join(__dirname, "./migrations.sql");
    const fileContent = fs.readFileSync(migrationsPath, "utf8");

    // Split by semicolon - handles multi-line statements
    const rawStatements = fileContent.split(";");

    // Filter and clean statements
    const statements = [];
    for (const stmt of rawStatements) {
      const cleaned = stmt
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim();

      if (cleaned.length > 5) {
        // Only keep substantial statements
        statements.push(cleaned);
      }
    }

    console.log(`Found ${statements.length} migration statements\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement
        .substring(0, 60)
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ");

      console.log(`[${i + 1}/${statements.length}] ${preview}...`);

      try {
        await pool.execute(statement);
        console.log("  ✅ Success");
        successCount++;
      } catch (error) {
        if (error.message && error.message.includes("Duplicate column")) {
          console.log("  ⚠️  Column already exists (skipped)");
          skipCount++;
        } else {
          console.log(`  ❌ ${error.message.substring(0, 80)}`);
          errorCount++;
        }
      }
    }

    console.log(
      `\n📊 Results: ${successCount} success, ${skipCount} skipped, ${errorCount} errors`
    );
    console.log("✅ Migrations complete!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrationsClean();

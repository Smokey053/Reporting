import pool from "./pool.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function runMigrations() {
  try {
    console.log("🚀 Starting database migrations...\n");

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

    console.log(`📋 Found ${statements.length} migration statements\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement
        .substring(0, 60)
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ");

      process.stdout.write(`[${i + 1}/${statements.length}] ${preview}... `);

      try {
        await pool.execute(statement);
        console.log("✅");
        successCount++;
      } catch (error) {
        if (error.message && error.message.includes("Duplicate column")) {
          console.log("⚠️");
          skipCount++;
        } else {
          console.log("❌");
          console.log(`      Error: ${error.message.substring(0, 100)}`);
          errorCount++;
        }
      }
    }

    console.log(
      `\n✅ Migrations Complete!\n` +
        `   Success: ${successCount} | Skipped: ${skipCount} | Errors: ${errorCount}`
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();

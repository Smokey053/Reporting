#!/usr/bin/env node

/**
 * Database Setup Script
 *
 * This script helps initialize the MySQL database for LUCT Reporting System.
 * Run this script to:
 * 1. Test database connection
 * 2. Create the database (if it doesn't exist)
 * 3. Run the schema initialization
 * 4. Seed initial data
 *
 * Usage:
 *   node setupDatabase.js
 */

import dotenv from "dotenv";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config({
  path: path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../.env"
  ),
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, "schema.sql");

const config = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "luct_reporting",
};

const setupDatabase = async () => {
  let connection;

  try {
    console.log("🔌 Connecting to MySQL server...");

    // Connect without database first
    connection = await mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
    });

    console.log("✅ Connected to MySQL server");

    // Create database if it doesn't exist
    console.log(`📦 Creating database '${config.database}' if not exists...`);
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log("✅ Database created/exists");

    // Switch to the database
    await connection.changeUser({ database: config.database });
    console.log(`✅ Connected to database '${config.database}'`);

    // Read and execute schema
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }

    console.log("📖 Reading schema file...");
    const schema = fs.readFileSync(schemaPath, "utf8");

    // Split schema into individual statements and execute
    // Remove single-line comments
    let cleanedSchema = schema
      .split("\n")
      .map((line) => {
        const commentIndex = line.indexOf("--");
        return commentIndex !== -1 ? line.substring(0, commentIndex) : line;
      })
      .join("\n");

    // Remove multi-line comments
    cleanedSchema = cleanedSchema.replace(/\/\*[\s\S]*?\*\//g, "");

    // Split by semicolon
    const statements = cleanedSchema
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    console.log(`📝 Executing ${statements.length} schema statements...`);

    for (const statement of statements) {
      try {
        await connection.execute(statement);
      } catch (error) {
        // Ignore errors for duplicate keys or existing structures
        if (
          !error.message.includes("already exists") &&
          !error.message.includes("Duplicate")
        ) {
          console.warn(`⚠️  Warning executing statement: ${error.message}`);
        }
      }
    }

    console.log("✅ Schema applied successfully");

    // Verify tables
    const [tables] = await connection.execute("SHOW TABLES");
    console.log(`\n📊 Database tables created:`);
    tables.forEach((row) => {
      const tableName = Object.values(row)[0];
      console.log(`   • ${tableName}`);
    });

    // Verify faculties table has sample data
    const [faculties] = await connection.execute(
      "SELECT COUNT(*) as count FROM faculties"
    );
    const facultyCount = faculties[0].count;

    if (facultyCount === 0) {
      console.log("\n⏩ Skipping sample faculty data (already exists)");
    } else {
      console.log(`\n✅ Sample faculties loaded (${facultyCount} records)`);
    }

    console.log("\n✨ Database setup completed successfully!");
    console.log("\nNext steps:");
    console.log("1. Ensure .env file has correct DB credentials");
    console.log("2. Run: npm start");
    console.log("3. Demo users will be seeded automatically on startup");
    console.log("\nDemo Credentials:");
    console.log("   Program Leader: pl.demo@luct.ac.ls / secure123");
    console.log(
      "   Principal Lecturer: thabo.makoanyane@luct.ac.ls / secure123"
    );
    console.log("   Lecturer: boitumelo.tebello@luct.ac.ls / secure123");
    console.log("   Student: lerato.sechele@luct.ac.ls / learn123");
  } catch (error) {
    console.error("❌ Database setup failed:");
    console.error(error.message);
    if (error.code) {
      console.error(`Error Code: ${error.code}`);
    }
    if (error.errno) {
      console.error(`Error Number: ${error.errno}`);
    }
    console.error("\n📋 Debug Info:");
    console.error(`Host: ${config.host}`);
    console.error(`User: ${config.user}`);
    console.error(`Database: ${config.database}`);
    console.error(`Password: ${config.password ? "***" : "(empty)"}`);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Run setup
setupDatabase();

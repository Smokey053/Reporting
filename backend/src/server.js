import "./config/env.js";
import app from "./app.js";
import pool from "./db/pool.js";
import { ensureDemoData } from "./db/ensureDemoData.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Database connection established");
    await ensureDemoData();
  } catch (error) {
    console.error("Failed to connect to the database", error);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
  });
  
  app.get('/', (req, res) => {
    res.send('Backend is running!');
  });
  
};

startServer();


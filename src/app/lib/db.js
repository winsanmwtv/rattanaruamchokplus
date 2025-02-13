import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10, // Prevent exhausting connections
    queueLimit: 0
});

export const promisePool = pool.promise();

// Test database connection
promisePool.query("SELECT 1")
    .then(() => console.log("Database connected successfully"))
    .catch(err => console.error("Database connection error:", err));

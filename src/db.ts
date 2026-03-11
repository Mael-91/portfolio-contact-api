import mysql from "mysql2/promise";
import { env } from "./env";

console.log("DB CONFIG USED:", {
  host: env.dbHost,
  port: env.dbPort,
  database: env.dbName,
  user: env.dbUser,
});

export const db = mysql.createPool({
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPass,
  database: env.dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
});



import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

export const env = {
  port: Number(process.env.PORT || 4000),
  mailHost: process.env.MAIL_HOST || "",
  mailPort: Number(process.env.MAIL_PORT || 587),
  mailSecure: String(process.env.MAIL_SECURE) === "true",
  mailUser: process.env.MAIL_USER || "",
  mailPass: process.env.MAIL_PASS || "",
  mailFrom: process.env.MAIL_FROM || "",
  mailTo: process.env.MAIL_TO || "",
  corsOrigin: process.env.CORS_ORIGIN || ""
};
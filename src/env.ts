import dotenv from "dotenv";
import path from "path";

const envFile =
  process.env.NODE_ENV === "development"
    ? ".env.development"
    : ".env";

dotenv.config({
  path: path.resolve(process.cwd(), envFile),
});

export const env = {
  nodeEnv: process.env.NODE_ENV || "production",

  port: Number(process.env.PORT || 4000),

  mailHost: process.env.MAIL_HOST || "",
  mailPort: Number(process.env.MAIL_PORT || 587),
  mailSecure: String(process.env.MAIL_SECURE) === "true",
  mailUser: process.env.MAIL_USER || "",
  mailPass: process.env.MAIL_PASS || "",
  mailFrom: process.env.MAIL_FROM || "",
  mailTo: process.env.MAIL_TO || "",

  corsOrigin: process.env.CORS_ORIGIN || "",

  dbHost: process.env.DB_HOST || "127.0.0.1",
  dbPort: Number(process.env.DB_PORT || 3306),
  dbName: process.env.DB_NAME || "portfolio",
  dbUser: process.env.DB_USER || "",
  dbPass: process.env.DB_PASS || "",

  ipHashKey: process.env.IP_HASH_KEY || "",

  privacyPolicyVersion: process.env.PRIVACY_POLICY_VERSION || "",
  privacyPolicyLastUpdatedAt:
    process.env.PRIVACY_POLICY_LAST_UPDATED_AT || "",

  contactRetentionMonths: Number(
    process.env.CONTACT_RETENTION_MONTHS || 12
  ),
};
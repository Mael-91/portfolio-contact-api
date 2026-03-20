import crypto from "node:crypto";
import { ResultSetHeader } from "mysql2";
import { db } from "./db";
import { env } from "./env";
import { ContactInput } from "./validators";
import { buildEmailSnapshot } from "./mail";
import { getPublishedLegalDocumentByType } from "./legal-documents-storage";

function addMonths(date: Date, months: number): Date {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

function toMysqlDateTime(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function hashIp(ip?: string | null): string | null {
  if (!ip || !env.ipHashKey) {
    return null;
  }

  return crypto.createHmac("sha256", env.ipHashKey).update(ip).digest("hex");
}

function resolveLegalBasis(data: ContactInput): string {
  if (data.request_type === "pro") {
    return "precontractual_steps";
  }

  return "legitimate_interest";
}

function resolvePurpose(data: ContactInput): string {
  if (data.request_type === "pro") {
    return "Gestion des demandes de devis et de prestation";
  }

  return "Gestion des demandes envoyées via le formulaire de contact";
}

export async function saveContactSubmission(params: {
  data: ContactInput;
  ip?: string | null;
  userAgent?: string | null;
  refererUrl?: string | null;
}) {
  const { data, ip, userAgent, refererUrl } = params;

  const email = buildEmailSnapshot(data);
  const legalBasis = resolveLegalBasis(data);
  const retentionUntil = toMysqlDateTime(
    addMonths(new Date(), env.contactRetentionMonths)
  );

  const firstName = "first_name" in data ? data.first_name ?? null : null;
  const lastName = "last_name" in data ? data.last_name ?? null : null;
  const company = "company" in data ? data.company ?? null : null;
  const phone = "phone" in data ? data.phone ?? null : null;
  const allowPhoneContact =
    "allow_phone_contact" in data ? (data.allow_phone_contact ? 1 : 0) : 0;

  const privacyDocument = await getPublishedLegalDocumentByType("privacy_content");

  if (!privacyDocument) {
    throw new Error("No published privacy policy found");
  }

  const [result] = await db.execute<ResultSetHeader>(
    `
      INSERT INTO contact_submissions (
        request_type,
        first_name,
        last_name,
        company,
        email,
        phone,
        message_text,
        allow_phone_contact,
        consent_privacy,
        email_subject,
        email_text,
        form_payload,
        email_snapshot,
        processing_context,
        legal_basis,
        processing_purpose,
        privacy_policy_accepted_at,
        privacy_policy_document_id,
        privacy_notice_presented,
        ip_hash,
        user_agent,
        referer_url,
        status,
        mail_status,
        mail_error,
        mail_sent_at,
        mail_attempts,
        retention_until
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        CURRENT_TIMESTAMP, ?, ?,
        ?, ?, ?,
        'new', 'pending', NULL, NULL, 0, ?
      )
    `,
    [
      data.request_type,
      firstName,
      lastName,
      company,
      data.email,
      phone,
      data.message,
      allowPhoneContact,
      data.consent_privacy ? 1 : 0,
      email.subject,
      email.text,
      JSON.stringify(data),
      JSON.stringify(email),
      JSON.stringify({
        source: "portfolio-contact-api",
        api_version: "1.0.0",
      }),
      legalBasis,
      resolvePurpose(data),
      privacyDocument.id,
      1,
      hashIp(ip),
      userAgent?.slice(0, 255) ?? null,
      refererUrl?.slice(0, 500) ?? null,
      retentionUntil,
    ]
  );

  return result.insertId;
}

export async function markContactMailSent(submissionId: number) {
  await db.execute(
    `
      UPDATE contact_submissions
      SET
        mail_status = 'sent',
        mail_error = NULL,
        mail_sent_at = ?,
        mail_attempts = mail_attempts + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [toMysqlDateTime(new Date()), submissionId]
  );
}

export async function markContactMailFailed(params: {
  submissionId: number;
  error: unknown;
}) {
  const { submissionId, error } = params;
  const errorMessage = error instanceof Error ? error.message : String(error);

  await db.execute(
    `
      UPDATE contact_submissions
      SET
        mail_status = 'failed',
        mail_error = ?,
        mail_attempts = mail_attempts + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [errorMessage.slice(0, 5000), submissionId]
  );
}
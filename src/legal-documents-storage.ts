import { db } from "./db";

export async function getPublishedLegalDocumentByType(type: string) {
  const [rows]: any = await db.query(
    `
    SELECT id, version_label
    FROM legal_documents
    WHERE document_type = ?
      AND status = 'published'
      AND is_current = 1
    LIMIT 1
    `,
    [type]
  );

  return rows.length ? rows[0] : null;
}
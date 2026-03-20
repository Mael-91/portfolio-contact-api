import { db } from "./db";

export type PublicLegalDocument = {
  id: number;
  document_type: string;
  version_label: string;
  content_html: string;
  content_text: string | null;
  published_at: Date | null;
};

export async function getPublishedLegalDocumentByType(
  type: string
): Promise<PublicLegalDocument | null> {
  const [rows]: any = await db.query(
    `
    SELECT
      id,
      document_type,
      version_label,
      content_html,
      content_text,
      published_at
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
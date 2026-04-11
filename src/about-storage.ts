import { db } from "./db";

export type PublicAboutSection = {
  imageUrl: string | null;
  imageAlt: string | null;
  textHtml: string | null;
};

type AboutRow = {
  image_url: string | null;
  image_alt: string | null;
  text_html: string | null;
};

export async function getPublicAboutSection(): Promise<PublicAboutSection | null> {
  const [rows] = await db.query(
    `
    SELECT
      image_url,
      image_alt,
      text_html
    FROM about_content
    LIMIT 1
    `
  );

  const typedRows = rows as AboutRow[];

  if (!typedRows.length) {
    return null;
  }

  const row = typedRows[0];

  return {
    imageUrl: row.image_url,
    imageAlt: row.image_alt,
    textHtml: row.text_html,
  };
}
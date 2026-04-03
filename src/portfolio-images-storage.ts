import { db } from "./db";

export type PortfolioImage = {
  id: number;
  fileUrl: string;
  caption: string | null;
  altText: string | null;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
};

export async function getActivePortfolioImages(): Promise<PortfolioImage[]> {
  const [rows]: any = await db.query(
    `
    SELECT
      id,
      file_url,
      caption,
      alt_text,
      description,
      display_order,
      is_active
    FROM portfolio_images
    WHERE is_active = 1
    ORDER BY display_order ASC
    `
  );

  return rows.map((row: any) => ({
    id: row.id,
    fileUrl: row.file_url,
    caption: row.caption,
    altText: row.alt_text,
    description: row.description,
    displayOrder: row.display_order,
    isActive: !!row.is_active,
  }));
}
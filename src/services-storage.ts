import { db } from "./db";

type ServiceType = "pro" | "private";

type ServiceSectionRow = {
  id: number;
  service_type: ServiceType;
  intro_enabled: number;
  intro_html: string | null;
};

type ServiceCardRow = {
  id: number;
  section_id: number;
  service_type: ServiceType;
  card_index: number;
  title: string;
  body_enabled: number;
  body_html: string | null;
  bullets_enabled: number;
  price_enabled: number;
  price_label: string | null;
};

type ServiceBulletRow = {
  card_id: number;
  bullet_index: number;
  content: string;
};

export type PublicServiceCard = {
  id: number;
  title: string;
  bodyEnabled: boolean;
  bodyHtml: string | null;
  bulletsEnabled: boolean;
  bullets: string[];
  priceEnabled: boolean;
  priceLabel: string | null;
};

export type PublicServicesResponse = {
  enabled: boolean
  pro: {
    introEnabled: boolean;
    introHtml: string | null;
    cards: PublicServiceCard[];
  };
  private: {
    introEnabled: boolean;
    introHtml: string | null;
    cards: PublicServiceCard[];
  };
};

async function getBooleanSetting(key: string): Promise<boolean> {
  const [rows]: any = await db.query(
    `
    SELECT value
    FROM app_settings
    WHERE \`key_name\` = ?
    LIMIT 1
    `,
    [key]
  );

  if (!rows.length) {
    return false;
  }

  const value = rows[0].value;

  return value === "true" || value === "1";
}

export async function getPublicServices(): Promise<PublicServicesResponse> {
  const [sectionRows] = await db.query(
    `
    SELECT
      id,
      service_type,
      intro_enabled,
      intro_html
    FROM service_sections
    WHERE service_type IN ('pro', 'private')
    `
  );

  const [cardRows] = await db.query(
    `
    SELECT
      c.id,
      c.section_id,
      s.service_type,
      c.card_index,
      c.title,
      c.body_enabled,
      c.body_html,
      c.bullets_enabled,
      c.price_enabled,
      c.price_label
    FROM service_cards c
    INNER JOIN service_sections s
      ON s.id = c.section_id
    WHERE s.service_type IN ('pro', 'private')
    ORDER BY s.service_type ASC, c.card_index ASC, c.id ASC
    `
  );

  const [bulletRows] = await db.query(
    `
    SELECT
      b.card_id,
      b.bullet_index,
      b.content
    FROM service_card_bullets b
    INNER JOIN service_cards c
      ON c.id = b.card_id
    INNER JOIN service_sections s
      ON s.id = c.section_id
    WHERE s.service_type IN ('pro', 'private')
    ORDER BY b.card_id ASC, b.bullet_index ASC, b.id ASC
    `
  );

  const sections = sectionRows as ServiceSectionRow[];
  const cards = cardRows as ServiceCardRow[];
  const bullets = bulletRows as ServiceBulletRow[];

  const bulletsByCardId = new Map<number, string[]>();

  for (const bullet of bullets) {
    const existing = bulletsByCardId.get(bullet.card_id) ?? [];
    existing.push(bullet.content);
    bulletsByCardId.set(bullet.card_id, existing);
  }

  const servicesEnabled = await getBooleanSetting("services_section_enabled");

  const response: PublicServicesResponse = {
    enabled: servicesEnabled,
    pro: {
      introEnabled: false,
      introHtml: null,
      cards: [],
    },
    private: {
      introEnabled: false,
      introHtml: null,
      cards: [],
    },
  };

  for (const section of sections) {
    response[section.service_type] = {
      ...response[section.service_type],
      introEnabled: !!section.intro_enabled,
      introHtml: section.intro_html,
      cards: response[section.service_type].cards,
    };
  }

  for (const card of cards) {
    response[card.service_type].cards.push({
      id: card.id,
      title: card.title,
      bodyEnabled: !!card.body_enabled,
      bodyHtml: card.body_html,
      bulletsEnabled: !!card.bullets_enabled,
      bullets: bulletsByCardId.get(card.id) ?? [],
      priceEnabled: !!card.price_enabled,
      priceLabel: card.price_label,
    });
  }

  return response;
}
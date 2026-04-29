import { db } from "./db";

type PortfolioSiteSettingsRow = {
  site_title: string | null;
  site_description: string | null;
  site_favicon_url: string | null;
  home_title: string | null;
  home_subtitle: string | null;
  home_background_image_url: string | null;
  gallery_section_title: string | null;
  gallery_section_subtitle: string | null;
  contact_section_title: string | null;
  contact_section_subtitle: string | null;
  contact_option_pro_enabled: number;
  contact_option_private_enabled: number;
  contact_option_info_enabled: number;
  contact_submit_button_label: string | null;
};

async function getPortfolioSiteSettings(): Promise<PortfolioSiteSettingsRow | null> {
  const [rows] = await db.query(
    `
    SELECT
      site_title,
      site_description,
      site_favicon_url,
      home_title,
      home_subtitle,
      home_background_image_url,
      gallery_section_title,
      gallery_section_subtitle,
      contact_section_title,
      contact_section_subtitle,
      contact_option_pro_enabled,
      contact_option_private_enabled,
      contact_option_info_enabled,
      contact_submit_button_label
    FROM portfolio_site_settings
    ORDER BY id ASC
    LIMIT 1
    `
  );

  const typedRows = rows as PortfolioSiteSettingsRow[];

  return typedRows.length ? typedRows[0] : null;
}

function requiredString(value: string | null): string | null {
  if (value === null || value.trim() === "") {
    return null;
  }

  return value;
}

export async function getPortfolioIdentity() {
  try {
    const settings = await getPortfolioSiteSettings();

    if (!settings) return null;

    const siteName = requiredString(settings.site_title);
    const siteDescription = requiredString(settings.site_description);
    const faviconUrl = requiredString(settings.site_favicon_url);

    if (!siteName || !siteDescription || !faviconUrl) return null;

    return {
      siteName,
      siteDescription,
      faviconUrl,
    };
  } catch (error) {
    console.error("Erreur portfolio identity :", error);
    return null;
  }
}

export async function getPortfolioHeroPage() {
  try {
    const settings = await getPortfolioSiteSettings();

    if (!settings) return null;

    const title = requiredString(settings.home_title);
    const subtitle = requiredString(settings.home_subtitle);
    const backgroundImageUrl = requiredString(
      settings.home_background_image_url
    );

    if (!title || !subtitle || !backgroundImageUrl) return null;

    return {
      title,
      subtitle,
      backgroundImageUrl,
    };
  } catch (error) {
    console.error("Erreur portfolio hero-page :", error);
    return null;
  }
}

export async function getPortfolioPortfolioPage() {
  try {
    const settings = await getPortfolioSiteSettings();

    if (!settings) return null;

    const title = requiredString(settings.gallery_section_title);
    const subtitle = requiredString(settings.gallery_section_subtitle);

    if (!title || !subtitle) return null;

    return {
      title,
      subtitle,
    };
  } catch (error) {
    console.error("Erreur portfolio-page :", error);
    return null;
  }
}

export async function getPortfolioContactPage() {
  try {
    const settings = await getPortfolioSiteSettings();

    if (!settings) return null;

    const title = requiredString(settings.contact_section_title);
    const subtitle = requiredString(settings.contact_section_subtitle);
    const submitButtonLabel = requiredString(
      settings.contact_submit_button_label
    );

    if (!title || !subtitle || !submitButtonLabel) return null;

    return {
      title,
      subtitle,
      requestTypes: {
        proEnabled: !!settings.contact_option_pro_enabled,
        privateEnabled: !!settings.contact_option_private_enabled,
        infoEnabled: !!settings.contact_option_info_enabled,
      },
      submitButtonLabel,
    };
  } catch (error) {
    console.error("Erreur contact-page :", error);
    return null;
  }
}
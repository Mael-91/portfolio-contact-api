import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./env";
import { contactSchema } from "./validators";
import { sendContactMail, verifyMailer } from "./mail";
import {
  saveContactSubmission,
  markContactMailSent,
  markContactMailFailed,
} from "./contact-storage";
import { getPublishedLegalDocumentByType } from "./legal-documents-storage";
import { sendContactCreatedEvent } from "./admin-events";
import { getActivePortfolioImages } from "./portfolio-images-storage";
import { getPublicServices } from "./services-storage";
import { getPublicAboutSection } from "./about-storage";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

app.use(
  cors({
    origin: env.corsOrigin,
  })
);

app.use(express.json());

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
});

const allowedLegalDocumentTypes = [
  "privacy_content",
  "legal_notice",
  "terms_private",
  "terms_pro",
] as const;

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/services", async (_req, res) => {
  try {
    const services = await getPublicServices();
    return res.json(services);
  } catch (error) {
    console.error("Erreur services :", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

app.get("/portfolio-images", async (_req, res) => {
  try {
    const images = await getActivePortfolioImages();

    res.json(images);

  } catch (error) {
    console.error("Erreur portfolio images:", error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

app.get("/legal-documents/:type", async (req, res) => {
  try {
    const { type } = req.params;

    if (!allowedLegalDocumentTypes.includes(type as any)) {
      return res.status(400).json({
        success: false,
        message: "Type de document invalide",
      });
    }

    const document = await getPublishedLegalDocumentByType(type);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document introuvable",
      });
    }

    return res.json({
      success: true,
      document: {
        id: document.id,
        documentType: document.document_type,
        versionLabel: document.version_label,
        contentHtml: document.content_html,
        contentText: document.content_text,
        publishedAt: document.published_at,
      },
    });
  } catch (error) {
    console.error("Erreur lecture document légal :", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

app.get("/about", async (_req, res) => {
  try {
    const about = await getPublicAboutSection();

    if (!about) {
      return res.status(404).json({
        success: false,
        message: "Section à propos introuvable",
      });
    }

    return res.json(about);
  } catch (error) {
    console.error("Erreur about :", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

app.post("/contact", contactLimiter, async (req, res) => {
  try {
    const data = contactSchema.parse(req.body);

    const submissionId = await saveContactSubmission({
      data,
      ip: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
      refererUrl: req.get("referer") ?? null,
    });

    sendContactCreatedEvent({
      submissionId,
      requestType: data.request_type,
      email: data.email,
      createdAt: new Date().toISOString(),
    });

    try {
      await sendContactMail(data);
      await markContactMailSent(submissionId);
    } catch (mailError) {
      console.error("Erreur envoi mail :", mailError);
      await markContactMailFailed({
        submissionId,
        error: mailError,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Formulaire enregistré",
      submissionId,
    });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return res.status(400).json({
        success: false,
        errors: error.errors,
      });
    }

    console.error("Erreur contact :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

app.listen(env.port, async () => {
  console.log(`API démarrée sur le port ${env.port}`);

  try {
    await verifyMailer();
    console.log("Connexion SMTP MailPlus OK");
  } catch (error) {
    console.error("Erreur connexion SMTP :", error);
  }
});
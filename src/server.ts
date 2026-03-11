import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./env";
import { contactSchema } from "./validators";
import { sendContactMail, verifyMailer } from "./mail";
import { saveContactSubmission } from "./contact-storage";

const app = express();

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

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
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

    await sendContactMail(data);

    return res.status(201).json({
      success: true,
      message: "Formulaire envoyé",
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
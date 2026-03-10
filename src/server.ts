import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { env } from "./env";
import { contactSchema } from "./validators";
import { sendContactMail, verifyMailer } from "./mail";

const app = express();

/* Sécurité HTTP */
app.use(helmet());

/* CORS : uniquement ton site */
app.use(
  cors({
    origin: env.corsOrigin
  })
);

/* JSON */
app.use(express.json());

/* Protection anti spam */
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10
});

/* Health check */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* Endpoint formulaire */
app.post("/contact", contactLimiter, async (req, res) => {
  try {
    const data = contactSchema.parse(req.body);

    await sendContactMail(data);

    return res.status(201).json({
      success: true,
      message: "Formulaire envoyé"
    });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return res.status(400).json({
        success: false,
        errors: error.errors
      });
    }

    console.error("Erreur contact :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});

/* Lancement serveur */
app.listen(env.port, async () => {
  console.log(`API démarrée sur le port ${env.port}`);

  try {
    await verifyMailer();
    console.log("Connexion SMTP MailPlus OK");
  } catch (error) {
    console.error("Erreur connexion SMTP :", error);
  }
});
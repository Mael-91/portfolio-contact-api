import nodemailer from "nodemailer";
import { env } from "./env";
import { ContactInput } from "./validators";

const transporter = nodemailer.createTransport({
  host: env.mailHost,
  port: env.mailPort,
  secure: env.mailSecure,
  requireTLS: true,
  auth: {
    user: env.mailUser,
    pass: env.mailPass,
  },
});

export async function verifyMailer() {
  await transporter.verify();
  console.log("SMTP MailPlus prêt.");
}

function formatRequestType(type: ContactInput["request_type"]): string {
  switch (type) {
    case "pro":
      return "Professionnel";
    case "part":
      return "Particulier";
    case "info":
      return "Demande d'information";
    default:
      return type;
  }
}

export function buildSubject(data: ContactInput): string {
  return `[Portfolio] Nouvelle demande - ${formatRequestType(data.request_type)}`;
}

export function buildText(data: ContactInput): string {
  const lines: string[] = [];

  lines.push(`Type : ${formatRequestType(data.request_type)}`);
  lines.push("");

  if ("first_name" in data && data.first_name) {
    lines.push(`Prénom : ${data.first_name}`);
  }

  if ("last_name" in data && data.last_name) {
    lines.push(`Nom : ${data.last_name}`);
  }

  if (data.request_type === "pro") {
    lines.push(`Société : ${data.company}`);
    lines.push(`Email : ${data.email}`);

    if (data.phone) {
      lines.push(`Téléphone : ${data.phone}`);
      lines.push(
        `Contact téléphonique autorisé : ${data.allow_phone_contact ? "Oui" : "Non"}`
      );
    }
  }

  if (data.request_type === "part") {
    lines.push(`Email : ${data.email}`);

    if (data.phone) {
      lines.push(`Téléphone : ${data.phone}`);
      lines.push(
        `Contact téléphonique autorisé : ${data.allow_phone_contact ? "Oui" : "Non"}`
      );
    }
  }

  if (data.request_type === "info") {
    lines.push(`Email : ${data.email}`);
  }

  lines.push(`Politique de confidentialité acceptée : ${data.consent_privacy ? "Oui" : "Non"}`);
  lines.push("");
  lines.push("Message :");
  lines.push(data.message);

  return lines.join("\n");
}

export function buildEmailSnapshot(data: ContactInput) {
  const subject = buildSubject(data);
  const text = buildText(data);

  return {
    template_version: "contact-text-v1",
    subject,
    text,
    structured: {
      request_type: data.request_type,
      payload: data,
      consent_privacy: data.consent_privacy,
    },
  };
}

export async function sendContactMail(data: ContactInput) {
  const email = buildEmailSnapshot(data);

  await transporter.sendMail({
    from: env.mailFrom,
    to: env.mailTo,
    subject: email.subject,
    text: email.text,
  });

  return email;
}
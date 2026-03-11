import nodemailer from "nodemailer";
import { env } from "./env";
import { ContactInput } from "./validators";

const transporter = nodemailer.createTransport({
  host: env.mailHost,
  port: env.mailPort,
  secure: env.mailSecure,      // false pour 587 / STARTTLS
  requireTLS: true,            // force TLS sur 587
  auth: {
    user: env.mailUser,
    pass: env.mailPass
  }
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

function buildSubject(data: ContactInput): string {
  return `[Portfolio] Nouvelle demande - ${formatRequestType(data.request_type)}`;
}


function buildText(data: ContactInput): string {
  const lines: string[] = [];

  lines.push(`Type : ${formatRequestType(data.request_type)}`);
  lines.push("");

  if (data.first_name) lines.push(`Prénom : ${data.first_name}`);
  if (data.last_name) lines.push(`Nom : ${data.last_name}`);

  if (data.request_type === "pro") {
    lines.push(`Société : ${data.company}`);
    lines.push(`Email : ${data.email}`);
    if (data.phone) {
      lines.push(`Téléphone : ${data.phone}`);
    }
    lines.push(`Contact téléphonique autorisé : ${data.allow_phone_contact ? "Oui" : "Non"}`);
  }

  if (data.request_type === "part") {
    lines.push(`Email : ${data.email}`);
    if (data.phone) {
      lines.push(`Téléphone : ${data.phone}`);
    }
    lines.push(`Politique de confidentialité acceptée : Oui`);
  }

  if (data.request_type === "info") {
    lines.push(`Email : ${data.email}`);
    lines.push(`Politique de confidentialité acceptée : Oui`);
  }

  lines.push("");
  lines.push("Message :");
  lines.push(data.message);

  return lines.join("\n");
}

export async function sendContactMail(data: ContactInput) {
  await transporter.sendMail({
    from: env.mailFrom,
    to: env.mailTo,
    //replyTo: data.email,
    subject: buildSubject(data),
    text: buildText(data)
  });
}
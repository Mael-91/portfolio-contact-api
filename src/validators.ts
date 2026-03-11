import { z } from "zod";

export const contactSchema = z.discriminatedUnion("request_type", [
  z.object({
    request_type: z.literal("pro"),
    first_name: z.string().trim().max(100).optional().nullable(),
    last_name: z.string().trim().max(100).optional().nullable(),
    company: z.string().trim().min(1, "Société obligatoire").max(150),
    email: z.string().email("Email invalide"),
    phone: z.string().trim().regex(/^[0-9+\s().-]+$/, "Numéro de téléphone invalide").max(30).optional().nullable(),
    message: z.string().trim().min(10, "Message trop court").max(5000),
    allow_phone_contact: z.boolean(),
    consent_privacy: z.literal(true)
  }),
  z.object({
    request_type: z.literal("part"),
    first_name: z.string().trim().min(1, "Prénom obligatoire").max(100),
    last_name: z.string().trim().min(1, "Nom obligatoire").max(100),
    email: z.string().email("Email invalide"),
    phone: z.string().trim().regex(/^[0-9+\s().-]+$/, "Numéro de téléphone invalide").max(30).optional().nullable(),
    message: z.string().trim().min(10, "Message trop court").max(5000),
    allow_phone_contact: z.boolean(),
    consent_privacy: z.literal(true)
  }),
  z.object({
    request_type: z.literal("info"),
    first_name: z.string().trim().min(1, "Prénom obligatoire").max(100),
    last_name: z.string().trim().min(1, "Nom obligatoire").max(100),
    email: z.string().email("Email invalide"),
    message: z.string().trim().min(10, "Message trop court").max(5000),
    consent_privacy: z.literal(true)
  })
]);

export type ContactInput = z.infer<typeof contactSchema>;
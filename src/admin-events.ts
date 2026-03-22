import { env } from "./env";

type ContactCreatedEvent = {
  submissionId: number;
  requestType: string;
  email: string;
  createdAt: string;
};

export async function sendContactCreatedEvent(event: ContactCreatedEvent) {
  if (!env.adminInternalApiUrl || !env.internalEventsSecret) {
    console.warn("Admin API non configurée");
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.adminApiTimeoutMs); 

  try {
    const res = await fetch(
      `${env.adminInternalApiUrl}/internal/events/contact-created`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": env.internalEventsSecret,
        },
        body: JSON.stringify(event),
        signal: controller.signal, 
      }
    );

    if (!res.ok) {
      console.warn("Erreur envoi event admin:", res.status);
    }

  } catch (error: any) {
    if (error.name === "AbortError") {
      console.warn("Timeout appel admin API (2s)");
    } else {
      console.error("Erreur HTTP admin event:", error);
    }
  } finally {
    clearTimeout(timeout);
  }
}
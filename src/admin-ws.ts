import WebSocket from "ws";
import { env } from "./env";

type ContactCreatedEvent = {
  type: "contact.created";
  payload: {
    submissionId: number;
    requestType: string;
    email: string;
    createdAt: string;
  };
};

let socket: WebSocket | null = null;
let isConnecting = false;

function connect(): Promise<WebSocket | null> {
  return new Promise((resolve) => {
    if (!env.adminWsEnabled || !env.adminWsUrl) {
      return resolve(null);
    }

    if (socket && socket.readyState === WebSocket.OPEN) {
      return resolve(socket);
    }

    if (socket && socket.readyState === WebSocket.CONNECTING) {
      return resolve(socket);
    }

    if (isConnecting) {
      return resolve(socket);
    }

    isConnecting = true;

    const ws = new WebSocket(env.adminWsUrl);

    ws.on("open", () => {
      socket = ws;
      isConnecting = false;
      console.log("WebSocket admin connecté");
      resolve(ws);
    });

    ws.on("close", () => {
      if (socket === ws) {
        socket = null;
      }
      isConnecting = false;
      console.warn("WebSocket admin fermé");
    });

    ws.on("error", (error) => {
      console.error("Erreur WebSocket admin :", error);
      if (socket === ws) {
        socket = null;
      }
      isConnecting = false;
      resolve(null);
    });
  });
}

export async function emitContactCreatedEvent(event: ContactCreatedEvent) {
  try {
    const ws = await connect();

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket admin indisponible, événement non envoyé");
      return;
    }

    ws.send(JSON.stringify(event));
  } catch (error) {
    console.error("Échec émission WebSocket admin :", error);
  }
}
import PusherJS from "pusher-js";
import { API_URL } from "./api";

// Pusher configuration - will be initialized with credentials from .env
export const initializePusher = (token) => {
  const pusher = new PusherJS(import.meta.env.VITE_PUSHER_KEY, {
    cluster: import.meta.env.VITE_PUSHER_CLUSTER,
    authEndpoint: `${API_URL}/chat/pusher/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  pusher.connection.bind("connected", () => {
    console.log("✅ Connected to Pusher");
  });

  pusher.connection.bind("disconnected", () => {
    console.log("❌ Disconnected from Pusher");
  });

  pusher.connection.bind("error", (err) => {
    console.error("❌ Pusher connection error:", err);
  });

  return pusher;
};

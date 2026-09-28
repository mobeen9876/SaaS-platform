import Pusher from "pusher";

// Initialize Pusher server instance
export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// Pusher configuration for client
export const pusherConfig = {
  key: process.env.PUSHER_KEY,
  cluster: process.env.PUSHER_CLUSTER,
};

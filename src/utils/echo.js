import Echo from "laravel-echo";
import Pusher from "pusher-js";
Pusher.logToConsole = false; // <-- Disable all Pusher console logs

const echo = new Echo({
  broadcaster: "pusher",
  key: "d82d821103e3e3e641d6", // Your Pusher Key,
  cluster: "ap1", // Your Pusher Cluster
  wsHost: "ws-ap1.pusher.com", // Use Pusher WebSocket host
  wsPort: 443, // Use Pusher Cloud WebSocket Secure Port
  wssPort: 443, // Secure WebSocket Port
  forceTLS: true, // Ensure secure connection
  disableStats: true,
  enabledTransports: ["ws", "wss"], // Force WebSockets only
});

export default echo;

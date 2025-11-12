
import { WebSocketServer } from "ws";
const PORT = 8080;

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws) => {
    ws.on("message", (msg) => {
        for (const client of wss.clients) {
            if (client.readyState === client.OPEN && client !== ws) {
                client.send(msg);
            }
        }
    });
});

console.log(`✅ WebSocket server running on ws://localhost:${PORT}`);

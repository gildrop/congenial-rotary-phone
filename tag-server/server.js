// server.js (no express)
const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("WebSocket server is running.");
});

const wss = new WebSocket.Server({ server });

let players = {};
let nextPlayerId = 1;

wss.on("connection", (ws) => {
  const id = nextPlayerId++;
  players[id] = { x: 100, y: 100 };

  ws.send(JSON.stringify({ type: "init", id, players }));

  ws.on("message", (data) => {
    const msg = JSON.parse(data);
    if (msg.type === "move") {
      players[id] = { x: msg.x, y: msg.y };
      broadcast({ type: "update", id, x: msg.x, y: msg.y });
    }
  });

  ws.on("close", () => {
    delete players[id];
    broadcast({ type: "remove", id });
  });
});

function broadcast(msg) {
  const json = JSON.stringify(msg);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

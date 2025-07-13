// tag-server/server.js
const WebSocket = require("ws");
const server = new WebSocket.Server({ port: process.env.PORT || 8080 });

let players = {};
let next_id = 1;

function broadcast_except(sender, data) {
  const msg = JSON.stringify(data);
  for (const id in players) {
    const p = players[id];
    if (p.socket !== sender && p.socket.readyState === WebSocket.OPEN) {
      p.socket.send(msg);
    }
  }
}

server.on("connection", (ws) => {
  const id = next_id++;
  const x = 100 + Math.floor(Math.random() * 400);
  const y = 200;
  players[id] = { id, x, y, socket: ws };

  ws.send(JSON.stringify({ type: "assign_id", id }));

  ws.send(JSON.stringify({
    type: "player_list",
    players: Object.values(players).filter(p => p.id !== id).map(p => ({
      id: p.id,
      x: p.x,
      y: p.y
    }))
  }));

  broadcast_except(ws, {
    type: "player_joined",
    id,
    x,
    y
  });

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);
    if (data.type === "position" && players[id]) {
      players[id].x = data.x;
      players[id].y = data.y;
      broadcast_except(ws, { type: "position", id, x: data.x, y: data.y });
    }
  });

  ws.on("close", () => {
    delete players[id];
    broadcast_except(ws, { type: "player_left", id });
  });
});

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

  console.log(`Player ${id} connected`);

  // Send this player's ID
  ws.send(JSON.stringify({ type: "assign_id", id }));

  // Send list of existing players
  ws.send(JSON.stringify({
    type: "player_list",
    players: Object.values(players)
      .filter(p => p.id !== id)
      .map(p => ({ id: p.id, x: p.x, y: p.y }))
  }));

  // Notify others that a new player joined
  broadcast_except(ws, {
    type: "player_joined",
    id,
    x,
    y
  });

  ws.on("message", (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch (e) {
      console.warn("Invalid message received:", msg);
      return;
    }

    switch (data.type) {
      case "position":
        if (players[id]) {
          players[id].x = data.x;
          players[id].y = data.y;
          broadcast_except(ws, {
            type: "position",
            id,
            x: data.x,
            y: data.y
          });
        }
        break;

      // Future message types (tagged, action, chat, etc) can be handled here

      default:
        console.warn("Unknown message type:", data.type);
    }
  });

  ws.on("close", () => {
    console.log(`Player ${id} disconnected`);
    delete players[id];
    broadcast_except(ws, { type: "player_left", id });
  });
});

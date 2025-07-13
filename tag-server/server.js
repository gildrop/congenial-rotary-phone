const WebSocket = require("ws");
const server = new WebSocket.Server({ port: process.env.PORT || 8080 });

// Server-side player state
let players = {}; // Maps playerId -> { id, x, y, socket }
let idCounter = 1;

// Helper function to broadcast to all except the sender
function broadcast_except(sender, data) {
  const message = JSON.stringify(data);
  for (const id in players) {
    const player = players[id];
    if (player.socket !== sender && player.socket.readyState === WebSocket.OPEN) {
      player.socket.send(message);
    }
  }
}

server.on("connection", (ws) => {
  const playerId = idCounter++;

  // Give the player a starting position (can be random or fixed)
  const startX = 100 + Math.floor(Math.random() * 400);
  const startY = 200;

  // Store the player
  players[playerId] = {
    id: playerId,
    x: startX,
    y: startY,
    socket: ws
  };

  // Send player their assigned ID
  ws.send(JSON.stringify({
    type: "assign_id",
    id: playerId
  }));

  // Send list of existing players to the new player
  const existing = Object.values(players)
    .filter(p => p.id !== playerId)
    .map(p => ({ id: p.id, x: p.x, y: p.y }));

  ws.send(JSON.stringify({
    type: "player_list",
    players: existing
  }));

  // Notify all other players about the new player
  broadcast_except(ws, {
    type: "player_joined",
    id: playerId,
    x: startX,
    y: startY
  });

  // Handle incoming messages (e.g., movement)
  ws.on("message", (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch (e) {
      console.warn("Invalid JSON:", msg);
      return;
    }

    if (data.type === "position" && players[playerId]) {
      // Update this player's position on the server
      players[playerId].x = data.x;
      players[playerId].y = data.y;

      // Broadcast position update to other players
      broadcast_except(ws, {
        type: "position",
        id: playerId,
        x: data.x,
        y: data.y
      });
    }
  });

  // Clean up on disconnect
  ws.on("close", () => {
    delete players[playerId];

    // Optionally notify others that this player left
    broadcast_except(ws, {
      type: "player_left",
      id: playerId
    });
  });
});

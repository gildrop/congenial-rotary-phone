 
const WebSocket = require('ws');
const server = new WebSocket.Server({ port: process.env.PORT || 8080 });

let players = [];
let idCounter = 1;

server.on('connection', (ws) => {
  const playerId = idCounter++;
  players.push({ id: playerId, socket: ws });

  // Send player ID to the client
  ws.send(JSON.stringify({ type: "assign_id", id: playerId }));

  ws.on('message', (msg) => {
    // Forward message to other player(s)
    players.forEach(p => {
      if (p.socket !== ws && p.socket.readyState === WebSocket.OPEN) {
        p.socket.send(msg);
      }
    });
  });

  ws.on('close', () => {
    players = players.filter(p => p.socket !== ws);
  });
});

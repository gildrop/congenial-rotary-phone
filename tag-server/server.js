 
const WebSocket = require('ws');
const server = new WebSocket.Server({ port: process.env.PORT || 8080 });

let players = [];

server.on('connection', (ws) => {
  console.log("New player connected");

  players.push(ws);

  ws.on('message', (msg) => {
    // Broadcast to all players except sender
    players.forEach(p => {
      if (p !== ws && p.readyState === WebSocket.OPEN) {
        p.send(msg);
      }
    });
  });

  ws.on('close', () => {
    players = players.filter(p => p !== ws);
  });
});

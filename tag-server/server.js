// tag-server/server.js
const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

let players = {};
let nextPlayerId = 1;

server.on('connection', (socket) => {
  const id = nextPlayerId++;
  players[id] = { x: 100, y: 100 };

  socket.send(JSON.stringify({ type: 'init', id, players }));

  socket.on('message', (data) => {
    const msg = JSON.parse(data);

    if (msg.type === 'move') {
      if (players[id]) {
        players[id].x = msg.x;
        players[id].y = msg.y;
        broadcast({ type: 'update', id, x: msg.x, y: msg.y });
      }
    }
  });

  socket.on('close', () => {
    delete players[id];
    broadcast({ type: 'remove', id });
  });
});

function broadcast(msg) {
  const json = JSON.stringify(msg);
  server.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}

console.log('WebSocket server running on ws://localhost:8080');

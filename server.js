const WebSocket = require('ws');
const http = require('http');
const express = require('express');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Map();

wss.on('connection', (ws) => {
  const clientId = Date.now().toString();
  clients.set(clientId, ws);

  // Send the client their ID
  ws.send(JSON.stringify({
    type: 'connect',
    id: clientId
  }));

  // Broadcast to all other clients that a new peer has joined
  clients.forEach((client, id) => {
    if (id !== clientId) {
      client.send(JSON.stringify({
        type: 'peer-joined',
        peerId: clientId
      }));
    }
  });

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    // Forward the message to the specified client
    if (data.to && clients.has(data.to)) {
      clients.get(data.to).send(JSON.stringify({
        ...data,
        from: clientId
      }));
    }
  });

  ws.on('close', () => {
    // Remove the client and notify others
    clients.delete(clientId);
    clients.forEach((client) => {
      client.send(JSON.stringify({
        type: 'peer-left',
        peerId: clientId
      }));
    });
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
}); 
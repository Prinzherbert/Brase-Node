'use strict';

const express = require('express');
const { Server } = require('ws');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
  socket.on('message', message => {
    let mensagem = JSON.parse(message);
    if(mensagem[0] == "array"){
        postItArray = mensagem[1];
        server.broadcast(JSON.stringify(["array", postItArray]), server);
    } else if(mensagem[0] == "connect"){
        server.broadcast(JSON.stringify(["array", postItArray]), server);
    } else {
        server.broadcast(JSON.stringify(mensagem), server);
    }
  });
});

server.broadcast = function(data, sender){
  server.clients.forEach(function(client){
      if (client !== sender) {
          client.send(data)
      }
  });
}

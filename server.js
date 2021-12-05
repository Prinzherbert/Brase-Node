'use strict';

const express = require('express');
const { Server } = require('ws');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
  .use(express.static(__dirname))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });

var postItArray;

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
  ws.on('message', message => {
    let mensagem = JSON.parse(message);
    if(mensagem[0] == "array"){
        postItArray = mensagem[1];
        wss.broadcast(JSON.stringify(["array", postItArray]), server);
    } else if(mensagem[0] == "connect"){
        wss.broadcast(JSON.stringify(["array", postItArray]), server);
    } else {
        wss.broadcast(JSON.stringify(mensagem), server);
    }
  });
});

wss.broadcast = function(data, sender){
  wss.clients.forEach(function(client){
      if (client !== sender) {
          client.send(data)
      }
  });
}

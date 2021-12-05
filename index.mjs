import {WebSocketServer} from 'ws';
import http from 'http';
import { response } from 'express';
const porta = process.env.PORT || '8080';

var htserver = http.createServer(function(request, response) {
    response.writeHead(200);
    response.write('Hello World!');
    response.end();
});
htserver.listen(porta, function() {
});
var server = new WebSocketServer({
    server: htserver,
    autoAcceptConnections: true
});

var postItArray;

server.on('open', open => {
    console.log("Funcionando");
});
server.on('connection', socket => {
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
        server.broadcast("a");
    });
});

server.broadcast = function(data, sender){
    server.clients.forEach(function(client){
        if (client !== sender) {
            client.send(data)
        }
    });
}
import WebSocket, {WebSocketServer} from 'ws';
const server = new WebSocketServer({port: (process.env.PORT || '8080')});
var firstStart = true;
var postItArray;

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
    });
});

server.broadcast = function(data, sender){
    server.clients.forEach(function(client){
        if (client !== sender) {
            client.send(data)
        }
    });
}
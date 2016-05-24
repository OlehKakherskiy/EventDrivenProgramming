global.api = {};
api.fs = require('fs');
api.http = require('http');
api.websocket = require('websocket');
require('../EventEmitter/emitter.js')

//create event emitter
var emitter = global.EventEmitter;

console.dir(emitter);

var index = api.fs.readFileSync('./index.html');

var server = api.http.createServer(function(req, res) {
  res.writeHead(200);
  res.end(index);
});

server.listen(8080, function() {
  console.log('Listen port 8080');
});

var ws = new api.websocket.server({
  httpServer: server,
  autoAcceptConnections: false
});

var clients = [];

ws.on('request', function(req) {
  var connection = req.accept('', req.origin);
  clients.push(connection);
  console.log('Connected ' + connection.remoteAddress);
  connection.on('message', function(message) {
    console.log(message);
    var dataName = message.type + 'Data',
        data = message[dataName];
    console.log('Received: ' + data);
    clients.forEach(function(client) {
      if (connection !== client) {
        client.send(data);
      }
    });
  });
  connection.on('close', function(reasonCode, description) {
    console.log('Disconnected ' + connection.remoteAddress);
  });
});

var subscribeToTableChanges = function(clientConnection){
  emitter.on("cellUpdated",function(data){clientConnection.send(data)});
}
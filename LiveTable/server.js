global.api = {};
api.fs = require('fs');
api.http = require('http');
api.websocket = require('websocket');
require('../EventEmitter/emitter.js');
var emitter = global.EventEmitter;

var index = api.fs.readFileSync('./index.html');

var model = []; //объект вида : имя_поля_таблицы : значение

var letters = ['A', 'B', 'C', 'D', 'E', 'F'];

var rowCount = 5;

for(var j = 0; j < letters.length; j++)
  for(var i = 1; i < rowCount; i++)
    model[letters[j]+i] = 0;

var server = api.http.createServer(function(req, res) {
  res.writeHead(200);
  res.end(index);
});

server.listen(80, function() {
  console.log('Listen port 80');
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
    var dataName = message.type + 'Data',
        data = message[dataName];
    console.log('Received: ' + data);
    addSubscriber(JSON.parse(data));
  });
  connection.on('close', function(reasonCode, description) {
    console.log('Disconnected ' + connection.remoteAddress);
  });
});

var splitterRegex = /\s*([+*\-])\s*/;
var cellRegex = /[A-F][1-5]/;

var addSubscriber = function(data){
  
  console.log(data.value);
  console.log(splitterRegex);
  var parts = data.value.split(splitterRegex);
  var dependencies = [];
  var f = parseFunction(dependencies,parts,splitterRegex);
  console.log("dependencies "+dependencies);
  dependencies.forEach(function(item){
    emitter.on(item,function(){
      evalCellValue(data,f);
    })
  });
  evalCellValue(data,f);
}

var evalCellValue = function(data,func){
  data.formulae = data.value;
  data.value = func(model);
  model[data.cell] = data.value;
  clients.forEach(function(client) {
    console.log("send Data: " +JSON.stringify(data));
    client.send(data);
  });
  emitter.emit(""+data.cell);
}

var parseFunction = function(dependencies, parts){
  parts.forEach(function(item, i, array){
    if(item.search(cellRegex) !== -1){ //текущий элемент - элемент сетки (А1, В2 ...)
      dependencies.push(item);
      array[i] = 'model["'+item+'"]';
    }
  });
  parts.unshift("return ");
  console.log(parts.join(' '));
  return new Function('model',parts.join(' '));
}
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

//for(var j = 0; j < letters.length; j++)
//  for(var i = 1; i < rowCount; i++)
//    model[letters[j]+i] = 
//  {cell:letters[j]+i,formulae:"",value:0};

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
  console.dir(model);
  for(var cellID in model){
    console.log("send cell after connection "+JSON.stringify(model[cellID]));
    connection.send(JSON.stringify(model[cellID]));
  }
  connection.on('message', function(message) {
    var dataName = message.type + 'Data',
        data = JSON.parse(message[dataName]);
    console.log('Received: ' + message[dataName]);
    addSubscriber(data);
  });
  connection.on('close', function(reasonCode, description) {
    console.log('Disconnected ' + connection.remoteAddress);
  });
});

var splitterRegex = /\s*([+*\-\/])\s*/;
var cellRegex = /[A-F][1-5]/;

var addSubscriber = function(data){
  var parts = data.value.split(splitterRegex);
  var dependencies = [];
  var f = parseFunction(dependencies,parts,splitterRegex);
  console.log("function " + JSON.stringify(f));
  dependencies.forEach(function(item){
    emitter.on(item,function(){
      evalCellValue(data,f,dependencies);
    })
  });
  //выполняем функцию расчета значения для ячейки
  evalCellValue(data,f,dependencies);
}

var evalCellValue = function(data,func,dependencies){
  params = [];
  dependencies.forEach(function(cellName){
    params.push(model[cellName] === undefined ? 0 : model[cellName].value);  
  });
  console.dir(params);
  data.value = func.apply(undefined,params);
  model[""+data.cell] = data;
  clients.forEach(function(client) {
    console.log("send Data: " +JSON.stringify(data));
    client.send(JSON.stringify(data));
  });
  emitter.emit(""+data.cell);
}

var parseFunction = function(dependencies, parts){
  parts.forEach(function(item, i, array){
    if(item.search(cellRegex) !== -1){ //текущий элемент - элемент сетки (А1, В2 ...)
      dependencies.push(item);
    }
  });
  parts.unshift("return ");
  
  var paramString = dependencies.length > 0 ? ''+dependencies : '';
  console.log('paramString: '+paramString);
  console.log(parts.join(' '));
  return new Function(paramString,parts.join(' '));
}
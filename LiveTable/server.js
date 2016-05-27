global.api = {};
api.fs = require('fs');
api.http = require('http');
api.websocket = require('websocket');
require('../EventEmitter/emitter.js');
var emitter = global.EventEmitter;

var index = api.fs.readFileSync('./index.html');

var model = []; // dictionaries: cellName, formulae, cellValue

var letters = ['A', 'B', 'C', 'D', 'E', 'F'];

var rowCount = 5;

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

  for(var cellID in model){
    console.log("send cell "+cellID+" after connection "+JSON.stringify(model[cellID]));
    connection.send(JSON.stringify(model[cellID]));
  }
  connection.on('message', function(message) {
    console.log(message);
    var dataName = message.type + 'Data',
        data = JSON.parse(message[dataName]);
    console.log('Received: ' + message[dataName]);
    var dependencies = []; //cells which is current cell dependent on
    var cellFunction = addSubscriber(data, dependencies);

    //выполняем функцию расчета значения для ячейки
    evalCellValue(data,cellFunction,dependencies);
  });
  connection.on('close', function(reasonCode, description) {
    console.log('Disconnected ' + connection.remoteAddress);
  });
});

//use this regex to split formulae string for tokens of cells' ID, constants and operators
var splitterRegex = /\s*([+*\-\/])\s*/;

//use this regex to identify cells' ID from splitted formulae
var cellRegex = /[A-F][1-5]/;

//identify all dependency cells from formulae, parses sent formulae and subscribes 
//dependencies' changes
var addSubscriber = function(data,dependencies){
  var parts = data.value.split(splitterRegex);
  var f = parseFunction(dependencies,parts,splitterRegex);
  dependencies.forEach(function(item){
    emitter.on(item,function(){
      evalCellValue(data,f,dependencies);
    })
  });
  return f;
}

//wrap formulae function with getting actual params from model object
var evalCellValue = function(data,func,dependencies){
  actualParams = []; //actual params are called from model variable (using dependency information)
  dependencies.forEach(function(cellName){
    actualParams.push(model[cellName] === undefined ? 0 : model[cellName].value);  
  });
  console.dir(actualParams);
  data.value = func.apply(undefined, actualParams); //call formulae function to calc cell Value.
  model[""+data.cell] = data; //update cell data 
  //sends data to all connected clients
  clients.forEach(function(client) {
    console.log("send Data: " +JSON.stringify(data));
    client.send(JSON.stringify(data));
  });
  //inits changing in depending cells
  emitter.emit(""+data.cell);
}

//parses all dependencies from formulae and builds formulae function
var parseFunction = function(dependencies, parts){
  parts.forEach(function(item, i, array){
    if(item.search(cellRegex) !== -1){ //current element - (А1, В2 ...)
      dependencies.push(item);
    }
  });
  parts.unshift("return ");
  
  var paramString = dependencies.length > 0 ? ''+dependencies : '';
  console.log('paramString: '+paramString);
  console.log(parts.join(' '));
  return new Function(paramString,parts.join(' '));
}
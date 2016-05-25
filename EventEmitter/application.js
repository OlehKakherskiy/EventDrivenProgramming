'use strict';

global.api = {};
//require('./events.js');
require('./emitter.js');

global.application = global.EventEmitter;
//global.application = api.events.enhancedEventEmitter();

application.on('smth', function(data) {
  console.dir(data);
});

application.on('*', function(name, data) {
  	console.dir([name, data]);
});

application.emit('smth', { a: 5 });
application.emit("*",{age:21},"oleh");
